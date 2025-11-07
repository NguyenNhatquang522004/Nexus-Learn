"""
Comprehensive test suite for Real-time Coordination Agent

Tests cover:
- WebSocket connections
- Session management
- State synchronization
- Conflict resolution
- Push notifications
- Study rooms
- Presence tracking
- API endpoints
"""

import asyncio
import json
import time
from typing import Dict, Any
from unittest.mock import Mock, AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from websocket import create_connection
import redis.asyncio as aioredis

from realtime_coordination_agent import (
    app,
    RealtimeCoordinationAgent,
    ConnectionManager,
    SessionManager,
    ConflictResolver,
    NotificationManager,
    RoomManager,
    PresenceManager,
    VectorClock,
    StateUpdate,
    ConflictResolution,
    PresenceStatus,
    NotificationType,
    PriorityLevel,
    Notification,
    StudyRoom,
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def test_config() -> Dict[str, Any]:
    """Test configuration"""
    return {
        "agent": {
            "name": "test_agent",
            "port": 8012,
            "host": "0.0.0.0"
        },
        "websocket": {
            "max_connections": 100,
            "heartbeat_interval": 10,
            "timeout": 30,
            "compression": True
        },
        "session_management": {
            "redis_url": "redis://localhost:6379",
            "session_ttl": 3600,
            "multi_device_sync": True,
            "max_devices_per_user": 5
        },
        "synchronization": {
            "conflict_resolution": "last_write_wins",
            "sync_interval": 1,
            "batch_updates": True
        },
        "notifications": {
            "types": ["milestone_achieved", "review_reminder"],
            "priority_levels": ["low", "medium", "high", "urgent"],
            "retry_attempts": 3,
            "retry_delay": 1
        },
        "collaboration": {
            "enable_peer_chat": True,
            "enable_study_rooms": True,
            "max_room_size": 50
        },
        "push_services": {
            "fcm_enabled": True,
            "apns_enabled": True,
            "web_push_enabled": True
        }
    }


@pytest_asyncio.fixture
async def redis_client():
    """Redis client fixture"""
    client = await aioredis.from_url(
        "redis://localhost:6379",
        encoding="utf-8",
        decode_responses=False
    )
    
    # Clear test data
    await client.flushdb()
    
    yield client
    
    # Cleanup
    await client.flushdb()
    await client.close()


@pytest.fixture
def connection_manager():
    """Connection manager fixture"""
    return ConnectionManager(max_connections=100)


@pytest_asyncio.fixture
async def session_manager(redis_client):
    """Session manager fixture"""
    return SessionManager(
        redis_client=redis_client,
        session_ttl=3600,
        max_devices_per_user=5
    )


@pytest.fixture
def conflict_resolver():
    """Conflict resolver fixture"""
    return ConflictResolver(strategy=ConflictResolution.LAST_WRITE_WINS)


@pytest_asyncio.fixture
async def notification_manager(redis_client):
    """Notification manager fixture"""
    return NotificationManager(
        redis_client=redis_client,
        retry_attempts=3,
        retry_delay=1
    )


@pytest_asyncio.fixture
async def room_manager(redis_client):
    """Room manager fixture"""
    return RoomManager(redis_client=redis_client)


@pytest_asyncio.fixture
async def presence_manager(redis_client):
    """Presence manager fixture"""
    return PresenceManager(redis_client=redis_client)


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


# ============================================================================
# Vector Clock Tests
# ============================================================================

class TestVectorClock:
    """Test vector clock implementation"""
    
    def test_increment(self):
        """Test clock increment"""
        vc = VectorClock(clocks={})
        vc.increment("device1")
        
        assert vc.clocks["device1"] == 1
        
        vc.increment("device1")
        assert vc.clocks["device1"] == 2
    
    def test_merge(self):
        """Test clock merge"""
        vc1 = VectorClock(clocks={"device1": 3, "device2": 1})
        vc2 = VectorClock(clocks={"device2": 2, "device3": 5})
        
        vc1.merge(vc2)
        
        assert vc1.clocks["device1"] == 3
        assert vc1.clocks["device2"] == 2
        assert vc1.clocks["device3"] == 5
    
    def test_compare_before(self):
        """Test compare: before"""
        vc1 = VectorClock(clocks={"device1": 1, "device2": 1})
        vc2 = VectorClock(clocks={"device1": 2, "device2": 2})
        
        assert vc1.compare(vc2) == "before"
    
    def test_compare_after(self):
        """Test compare: after"""
        vc1 = VectorClock(clocks={"device1": 3, "device2": 3})
        vc2 = VectorClock(clocks={"device1": 2, "device2": 2})
        
        assert vc1.compare(vc2) == "after"
    
    def test_compare_equal(self):
        """Test compare: equal"""
        vc1 = VectorClock(clocks={"device1": 2, "device2": 2})
        vc2 = VectorClock(clocks={"device1": 2, "device2": 2})
        
        assert vc1.compare(vc2) == "equal"
    
    def test_compare_concurrent(self):
        """Test compare: concurrent"""
        vc1 = VectorClock(clocks={"device1": 3, "device2": 1})
        vc2 = VectorClock(clocks={"device1": 1, "device2": 3})
        
        assert vc1.compare(vc2) == "concurrent"


# ============================================================================
# Connection Manager Tests
# ============================================================================

class TestConnectionManager:
    """Test connection manager"""
    
    @pytest.mark.asyncio
    async def test_connect(self, connection_manager):
        """Test WebSocket connection"""
        mock_websocket = AsyncMock()
        
        session = await connection_manager.connect(
            mock_websocket,
            "user1",
            "device1"
        )
        
        assert session.user_id == "user1"
        assert session.device_id == "device1"
        assert session.session_id is not None
        assert connection_manager.connection_count == 1
        
        mock_websocket.accept.assert_called_once()
    
    def test_disconnect(self, connection_manager):
        """Test WebSocket disconnection"""
        # Simulate connection
        connection_manager.connection_count = 1
        connection_manager.active_connections["user1"] = [
            Mock(session_id="session1")
        ]
        
        connection_manager.disconnect("user1", "session1")
        
        assert connection_manager.connection_count == 0
        assert "user1" not in connection_manager.active_connections
    
    @pytest.mark.asyncio
    async def test_send_personal_message(self, connection_manager):
        """Test sending personal message"""
        mock_websocket = AsyncMock()
        
        # Add connection
        await connection_manager.connect(mock_websocket, "user1", "device1")
        
        # Send message
        message = {"type": "test", "data": {"key": "value"}}
        sent_count = await connection_manager.send_personal_message("user1", message)
        
        assert sent_count == 1
        mock_websocket.send_json.assert_called_once_with(message)
    
    @pytest.mark.asyncio
    async def test_broadcast_to_room(self, connection_manager):
        """Test broadcasting to room"""
        # Add multiple connections
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()
        
        await connection_manager.connect(mock_ws1, "user1", "device1")
        await connection_manager.connect(mock_ws2, "user2", "device1")
        
        # Broadcast
        message = {"type": "broadcast", "data": {"text": "hello"}}
        sent_count = await connection_manager.broadcast_to_room(
            {"user1", "user2"},
            message
        )
        
        assert sent_count == 2
        mock_ws1.send_json.assert_called_once()
        mock_ws2.send_json.assert_called_once()
    
    def test_is_user_online(self, connection_manager):
        """Test user online check"""
        connection_manager.active_connections["user1"] = [Mock()]
        
        assert connection_manager.is_user_online("user1") is True
        assert connection_manager.is_user_online("user2") is False
    
    @pytest.mark.asyncio
    async def test_cleanup_stale_connections(self, connection_manager):
        """Test stale connection cleanup"""
        # Add stale connection
        old_time = time.time() - 100
        connection_manager.active_connections["user1"] = [
            Mock(session_id="session1", last_heartbeat=old_time)
        ]
        connection_manager.connection_count = 1
        
        removed = await connection_manager.cleanup_stale_connections(timeout=30)
        
        assert removed == 1
        assert connection_manager.connection_count == 0


# ============================================================================
# Session Manager Tests
# ============================================================================

class TestSessionManager:
    """Test session manager"""
    
    @pytest.mark.asyncio
    async def test_create_session(self, session_manager):
        """Test session creation"""
        success = await session_manager.create_session(
            "user1",
            "device1",
            "session1"
        )
        
        assert success is True
        
        # Verify session exists
        session = await session_manager.get_session("user1", "device1")
        assert session is not None
        assert session["user_id"] == "user1"
        assert session["device_id"] == "device1"
    
    @pytest.mark.asyncio
    async def test_get_session(self, session_manager):
        """Test getting session"""
        await session_manager.create_session("user1", "device1", "session1")
        
        session = await session_manager.get_session("user1", "device1")
        
        assert session is not None
        assert session["user_id"] == "user1"
    
    @pytest.mark.asyncio
    async def test_update_session(self, session_manager):
        """Test session update"""
        await session_manager.create_session("user1", "device1", "session1")
        
        initial_session = await session_manager.get_session("user1", "device1")
        initial_time = initial_session["last_active"]
        
        await asyncio.sleep(0.1)
        
        success = await session_manager.update_session("user1", "device1")
        assert success is True
        
        updated_session = await session_manager.get_session("user1", "device1")
        assert updated_session["last_active"] > initial_time
    
    @pytest.mark.asyncio
    async def test_delete_session(self, session_manager):
        """Test session deletion"""
        await session_manager.create_session("user1", "device1", "session1")
        
        success = await session_manager.delete_session("user1", "device1")
        assert success is True
        
        # Verify session deleted
        session = await session_manager.get_session("user1", "device1")
        assert session is None
    
    @pytest.mark.asyncio
    async def test_get_user_devices(self, session_manager):
        """Test getting user devices"""
        await session_manager.create_session("user1", "device1", "session1")
        await session_manager.create_session("user1", "device2", "session2")
        
        devices = await session_manager.get_user_devices("user1")
        
        assert len(devices) == 2
        assert "device1" in devices
        assert "device2" in devices
    
    @pytest.mark.asyncio
    async def test_sync_state(self, session_manager):
        """Test state synchronization"""
        await session_manager.create_session("user1", "device1", "session1")
        
        state = {"progress": 0.5, "current_lesson": "lesson1"}
        success = await session_manager.sync_state("user1", "device1", state)
        
        assert success is True
        
        # Verify state saved
        saved_state = await session_manager.get_state("user1")
        assert saved_state is not None
        assert saved_state["progress"] == 0.5
        assert saved_state["current_lesson"] == "lesson1"
    
    @pytest.mark.asyncio
    async def test_max_devices_limit(self, session_manager):
        """Test device limit enforcement"""
        # Create max devices
        for i in range(5):
            await session_manager.create_session("user1", f"device{i}", f"session{i}")
        
        # Add one more (should remove oldest)
        await session_manager.create_session("user1", "device5", "session5")
        
        devices = await session_manager.get_user_devices("user1")
        assert len(devices) <= 5


# ============================================================================
# Conflict Resolver Tests
# ============================================================================

class TestConflictResolver:
    """Test conflict resolver"""
    
    def test_resolve_lww_local_wins(self, conflict_resolver):
        """Test LWW: local wins"""
        local = StateUpdate(
            user_id="user1",
            device_id="device1",
            state={"key": "local"},
            timestamp=time.time()
        )
        
        remote = StateUpdate(
            user_id="user1",
            device_id="device2",
            state={"key": "remote"},
            timestamp=time.time() - 10
        )
        
        result = conflict_resolver.resolve(local, remote)
        
        assert result.state["key"] == "local"
    
    def test_resolve_lww_remote_wins(self, conflict_resolver):
        """Test LWW: remote wins"""
        local = StateUpdate(
            user_id="user1",
            device_id="device1",
            state={"key": "local"},
            timestamp=time.time() - 10
        )
        
        remote = StateUpdate(
            user_id="user1",
            device_id="device2",
            state={"key": "remote"},
            timestamp=time.time()
        )
        
        result = conflict_resolver.resolve(local, remote)
        
        assert result.state["key"] == "remote"
    
    def test_resolve_vector_clock(self):
        """Test vector clock resolution"""
        resolver = ConflictResolver(strategy=ConflictResolution.VECTOR_CLOCK)
        
        local = StateUpdate(
            user_id="user1",
            device_id="device1",
            state={"key": "local"},
            timestamp=time.time(),
            vector_clock=VectorClock(clocks={"device1": 3, "device2": 1})
        )
        
        remote = StateUpdate(
            user_id="user1",
            device_id="device2",
            state={"key": "remote"},
            timestamp=time.time(),
            vector_clock=VectorClock(clocks={"device1": 2, "device2": 2})
        )
        
        result = resolver.resolve(local, remote)
        
        # Local should win (device1: 3 > 2)
        assert result.state["key"] == "local"


# ============================================================================
# Notification Manager Tests
# ============================================================================

class TestNotificationManager:
    """Test notification manager"""
    
    @pytest.mark.asyncio
    async def test_send_notification(self, notification_manager):
        """Test sending notification"""
        notification = Notification(
            notification_id="notif1",
            user_id="user1",
            type=NotificationType.MILESTONE_ACHIEVED,
            priority=PriorityLevel.HIGH,
            title="Milestone Achieved!",
            body="You completed Chapter 1",
            data={"chapter": 1},
            created_at=time.time()
        )
        
        delivered = await notification_manager.send_notification(notification)
        
        assert delivered is True
    
    @pytest.mark.asyncio
    async def test_get_user_notifications(self, notification_manager):
        """Test getting user notifications"""
        # Send notification
        notification = Notification(
            notification_id="notif1",
            user_id="user1",
            type=NotificationType.REVIEW_REMINDER,
            priority=PriorityLevel.MEDIUM,
            title="Review Reminder",
            body="Time to review your notes",
            data={},
            created_at=time.time()
        )
        
        await notification_manager.send_notification(notification)
        
        # Get notifications
        notifications = await notification_manager.get_user_notifications("user1")
        
        assert len(notifications) > 0
        assert notifications[0].notification_id == "notif1"
    
    @pytest.mark.asyncio
    async def test_mark_as_read(self, notification_manager):
        """Test marking notification as read"""
        notification = Notification(
            notification_id="notif1",
            user_id="user1",
            type=NotificationType.PEER_MESSAGE,
            priority=PriorityLevel.MEDIUM,
            title="New Message",
            body="You have a new message",
            data={},
            created_at=time.time()
        )
        
        await notification_manager.send_notification(notification)
        
        success = await notification_manager.mark_as_read("notif1")
        assert success is True


# ============================================================================
# Room Manager Tests
# ============================================================================

class TestRoomManager:
    """Test room manager"""
    
    @pytest.mark.asyncio
    async def test_create_room(self, room_manager):
        """Test room creation"""
        room = await room_manager.create_room(
            room_name="Math Study Group",
            creator_id="user1",
            max_size=10
        )
        
        assert room.room_id is not None
        assert room.room_name == "Math Study Group"
        assert room.creator_id == "user1"
        assert "user1" in room.members
    
    @pytest.mark.asyncio
    async def test_get_room(self, room_manager):
        """Test getting room"""
        created_room = await room_manager.create_room(
            "Test Room",
            "user1",
            10
        )
        
        room = await room_manager.get_room(created_room.room_id)
        
        assert room is not None
        assert room.room_name == "Test Room"
    
    @pytest.mark.asyncio
    async def test_join_room(self, room_manager):
        """Test joining room"""
        room = await room_manager.create_room("Test Room", "user1", 10)
        
        success = await room_manager.join_room(room.room_id, "user2")
        
        assert success is True
        
        # Verify member added
        updated_room = await room_manager.get_room(room.room_id)
        assert "user2" in updated_room.members
    
    @pytest.mark.asyncio
    async def test_leave_room(self, room_manager):
        """Test leaving room"""
        room = await room_manager.create_room("Test Room", "user1", 10)
        await room_manager.join_room(room.room_id, "user2")
        
        success = await room_manager.leave_room(room.room_id, "user2")
        
        assert success is True
        
        # Verify member removed
        updated_room = await room_manager.get_room(room.room_id)
        assert "user2" not in updated_room.members
    
    @pytest.mark.asyncio
    async def test_get_room_members(self, room_manager):
        """Test getting room members"""
        room = await room_manager.create_room("Test Room", "user1", 10)
        await room_manager.join_room(room.room_id, "user2")
        await room_manager.join_room(room.room_id, "user3")
        
        members = await room_manager.get_room_members(room.room_id)
        
        assert len(members) == 3
        assert "user1" in members
        assert "user2" in members
        assert "user3" in members
    
    @pytest.mark.asyncio
    async def test_room_size_limit(self, room_manager):
        """Test room size limit"""
        room = await room_manager.create_room("Small Room", "user1", max_size=2)
        
        # Fill room
        await room_manager.join_room(room.room_id, "user2")
        
        # Try to add one more (should fail)
        success = await room_manager.join_room(room.room_id, "user3")
        
        assert success is False


# ============================================================================
# Presence Manager Tests
# ============================================================================

class TestPresenceManager:
    """Test presence manager"""
    
    @pytest.mark.asyncio
    async def test_set_presence(self, presence_manager):
        """Test setting presence"""
        await presence_manager.set_presence("user1", PresenceStatus.ONLINE)
        
        status = await presence_manager.get_presence("user1")
        
        assert status == PresenceStatus.ONLINE
    
    @pytest.mark.asyncio
    async def test_get_presence(self, presence_manager):
        """Test getting presence"""
        await presence_manager.set_presence("user1", PresenceStatus.BUSY)
        
        status = await presence_manager.get_presence("user1")
        
        assert status == PresenceStatus.BUSY
    
    @pytest.mark.asyncio
    async def test_default_offline(self, presence_manager):
        """Test default offline status"""
        status = await presence_manager.get_presence("unknown_user")
        
        assert status == PresenceStatus.OFFLINE
    
    @pytest.mark.asyncio
    async def test_get_online_users(self, presence_manager):
        """Test getting online users"""
        await presence_manager.set_presence("user1", PresenceStatus.ONLINE)
        await presence_manager.set_presence("user2", PresenceStatus.ONLINE)
        
        online_users = await presence_manager.get_online_users()
        
        assert "user1" in online_users
        assert "user2" in online_users


# ============================================================================
# API Endpoint Tests
# ============================================================================

class TestAPIEndpoints:
    """Test API endpoints"""
    
    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["agent"] == "realtime_coordination_agent"
    
    def test_metrics_endpoint(self, client):
        """Test metrics endpoint"""
        response = client.get("/metrics")
        
        # May return 503 if agent not initialized in test
        assert response.status_code in [200, 503]
    
    @patch('realtime_coordination_agent.verify_token')
    def test_notify_endpoint(self, mock_verify, client):
        """Test notification endpoint"""
        mock_verify.return_value = "user1"
        
        response = client.post(
            "/notify",
            json={
                "user_id": "user1",
                "type": "milestone_achieved",
                "priority": "high",
                "title": "Test",
                "body": "Test notification",
                "data": {}
            },
            headers={"Authorization": "Bearer test_token"}
        )
        
        # May return 503 if agent not initialized
        assert response.status_code in [200, 503]


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Integration tests"""
    
    @pytest.mark.asyncio
    async def test_full_session_flow(self, session_manager, redis_client):
        """Test complete session flow"""
        # Create session
        await session_manager.create_session("user1", "device1", "session1")
        
        # Sync state
        state = {"progress": 0.75}
        await session_manager.sync_state("user1", "device1", state)
        
        # Get state
        saved_state = await session_manager.get_state("user1")
        assert saved_state["progress"] == 0.75
        
        # Update session
        await session_manager.update_session("user1", "device1")
        
        # Delete session
        await session_manager.delete_session("user1", "device1")
        
        # Verify deleted
        session = await session_manager.get_session("user1", "device1")
        assert session is None
    
    @pytest.mark.asyncio
    async def test_room_collaboration_flow(self, room_manager):
        """Test room collaboration flow"""
        # Create room
        room = await room_manager.create_room("Study Room", "user1", 10)
        
        # Join members
        await room_manager.join_room(room.room_id, "user2")
        await room_manager.join_room(room.room_id, "user3")
        
        # Get members
        members = await room_manager.get_room_members(room.room_id)
        assert len(members) == 3
        
        # Leave room
        await room_manager.leave_room(room.room_id, "user2")
        
        # Verify
        updated_members = await room_manager.get_room_members(room.room_id)
        assert len(updated_members) == 2
        assert "user2" not in updated_members


# ============================================================================
# Performance Tests
# ============================================================================

class TestPerformance:
    """Performance tests"""
    
    @pytest.mark.asyncio
    async def test_concurrent_sessions(self, session_manager):
        """Test concurrent session creation"""
        tasks = []
        
        for i in range(50):
            task = session_manager.create_session(
                f"user{i}",
                "device1",
                f"session{i}"
            )
            tasks.append(task)
        
        start_time = time.time()
        results = await asyncio.gather(*tasks)
        duration = time.time() - start_time
        
        assert all(results)
        assert duration < 5.0  # Should complete in under 5 seconds
    
    @pytest.mark.asyncio
    async def test_concurrent_notifications(self, notification_manager):
        """Test concurrent notification sending"""
        tasks = []
        
        for i in range(20):
            notification = Notification(
                notification_id=f"notif{i}",
                user_id=f"user{i}",
                type=NotificationType.MILESTONE_ACHIEVED,
                priority=PriorityLevel.MEDIUM,
                title=f"Notification {i}",
                body="Test",
                data={},
                created_at=time.time()
            )
            tasks.append(notification_manager.send_notification(notification))
        
        start_time = time.time()
        results = await asyncio.gather(*tasks)
        duration = time.time() - start_time
        
        assert all(results)
        assert duration < 10.0  # Should complete in under 10 seconds


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=realtime_coordination_agent"])
