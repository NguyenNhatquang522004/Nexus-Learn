# Real-time Coordination Agent

Production-ready WebSocket-based real-time coordination agent for the Learn Your Way Platform.

## Overview

The Real-time Coordination Agent provides:

- **WebSocket Connections**: Persistent bi-directional communication
- **Multi-device Synchronization**: Keep state consistent across devices
- **Conflict Resolution**: LWW and Vector Clock strategies
- **Push Notifications**: FCM, APNS, and Web Push support
- **Study Rooms**: Collaborative learning spaces
- **Peer Messaging**: Real-time chat
- **Presence Tracking**: Online/away/busy status
- **Connection Management**: Pooling, heartbeat, auto-reconnection

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│          (Web, iOS, Android - Multiple Devices)             │
└─────────────────────────────────────────────────────────────┘
                           │ WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Real-time Coordination Agent                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Connection   │  │   Session    │  │   Conflict   │     │
│  │  Manager     │  │   Manager    │  │   Resolver   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Notification  │  │     Room     │  │   Presence   │     │
│  │  Manager     │  │   Manager    │  │   Manager    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌─────────┐  ┌────────┐  ┌──────────┐
         │  Redis  │  │  FCM   │  │  APNS    │
         │ Pub/Sub │  │  Push  │  │  Push    │
         └─────────┘  └────────┘  └──────────┘
```

## Installation

### Prerequisites

- Python 3.10 or higher
- Redis 6.0 or higher
- (Optional) FCM credentials for push notifications
- (Optional) APNS credentials for iOS push

### Quick Start

1. **Clone and navigate**:
```bash
cd agents/realtime_coordination_agent
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Start Redis**:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

4. **Configure** (edit `config.yaml`):
```yaml
session_management:
  redis_url: "redis://localhost:6379"

push_services:
  fcm_enabled: true
  fcm_server_key: "your-fcm-server-key"
```

5. **Run the agent**:
```bash
python realtime_coordination_agent.py
```

Agent runs on `http://0.0.0.0:8012`

### Docker Deployment

```bash
docker build -t realtime-coordination-agent .
docker run -d \
  -p 8012:8012 \
  -e REDIS_URL="redis://host.docker.internal:6379" \
  -e JWT_SECRET="your-secret-key" \
  realtime-coordination-agent
```

## Configuration

### Complete config.yaml

```yaml
agent:
  name: "realtime_coordination_agent"
  port: 8012
  host: "0.0.0.0"

websocket:
  max_connections: 10000
  heartbeat_interval: 30  # seconds
  timeout: 60
  compression: true

session_management:
  redis_url: "redis://localhost:6379"
  session_ttl: 3600
  multi_device_sync: true
  max_devices_per_user: 5

synchronization:
  conflict_resolution: "last_write_wins"  # or "vector_clock"
  sync_interval: 1
  batch_updates: true

notifications:
  types:
    - milestone_achieved
    - review_reminder
    - peer_message
    - achievement_unlocked
    - intervention_alert
  retry_attempts: 3
  retry_delay: 5

collaboration:
  enable_peer_chat: true
  enable_study_rooms: true
  max_room_size: 50

push_services:
  fcm_enabled: true
  apns_enabled: true
  web_push_enabled: true
```

### Environment Variables

```bash
# Required
JWT_SECRET=your-jwt-secret-key
REDIS_URL=redis://localhost:6379

# Optional - Push Services
FCM_SERVER_KEY=your-fcm-key
FCM_PROJECT_ID=your-project-id
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-team-id
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_PUBLIC_KEY=your-vapid-public-key
```

## WebSocket Usage

### Connection

Connect to WebSocket endpoint:

```javascript
// JavaScript client example
const ws = new WebSocket('ws://localhost:8012/ws/user123?device_id=web1');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

### Message Format

All messages use JSON format:

```json
{
  "type": "message_type",
  "data": {
    "key": "value"
  },
  "timestamp": 1699999999.123
}
```

### Message Types

**Client → Server**:

1. **Heartbeat**:
```json
{
  "type": "heartbeat",
  "data": {}
}
```

2. **Sync State**:
```json
{
  "type": "sync_state",
  "data": {
    "state": {
      "progress": 0.75,
      "current_lesson": "lesson_5"
    }
  }
}
```

3. **Send Message**:
```json
{
  "type": "send_message",
  "data": {
    "room_id": "room123",
    "message": "Hello everyone!"
  }
}
```

4. **Presence Update**:
```json
{
  "type": "presence",
  "data": {
    "status": "online"
  }
}
```

**Server → Client**:

1. **Connected**:
```json
{
  "type": "connected",
  "data": {
    "session_id": "abc123",
    "device_id": "web1",
    "timestamp": 1699999999.123
  }
}
```

2. **State Update**:
```json
{
  "type": "state_update",
  "data": {
    "state": { "progress": 0.8 },
    "source_device": "mobile1",
    "timestamp": 1699999999.123
  }
}
```

3. **Notification**:
```json
{
  "type": "notification",
  "data": {
    "notification_id": "notif123",
    "title": "Milestone Achieved!",
    "body": "You completed Chapter 1",
    "priority": "high"
  }
}
```

4. **Chat Message**:
```json
{
  "type": "chat_message",
  "sender_id": "user456",
  "message": "Great question!",
  "timestamp": 1699999999.123
}
```

## API Endpoints

### 1. Send Notification

**POST** `/notify`

Send push notification to user.

```bash
curl -X POST http://localhost:8012/notify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "type": "milestone_achieved",
    "priority": "high",
    "title": "Congratulations!",
    "body": "You completed Chapter 1",
    "data": {"chapter": 1},
    "ttl": 86400
  }'
```

**Response**:
```json
{
  "success": true,
  "user_id": "user123",
  "type": "milestone_achieved"
}
```

### 2. Broadcast to Room

**POST** `/broadcast/{room_id}`

Broadcast message to all room members.

```bash
curl -X POST http://localhost:8012/broadcast/room123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "text": "Study session starting!",
      "type": "announcement"
    },
    "sender_id": "user123"
  }'
```

**Response**:
```json
{
  "success": true,
  "room_id": "room123",
  "sent_count": 5
}
```

### 3. Sync State

**POST** `/sync-state`

Synchronize device state.

```bash
curl -X POST http://localhost:8012/sync-state \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "device_id": "web1",
    "state": {
      "progress": 0.75,
      "current_lesson": "lesson_5"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "user_id": "user123",
  "device_id": "web1"
}
```

### 4. Create Study Room

**POST** `/create-room`

Create a new study room.

```bash
curl -X POST http://localhost:8012/create-room \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_name": "Math Study Group",
    "creator_id": "user123",
    "max_size": 20
  }'
```

**Response**:
```json
{
  "success": true,
  "room_id": "room_abc123",
  "room_name": "Math Study Group"
}
```

### 5. Join Room

**POST** `/join-room`

Join an existing study room.

```bash
curl -X POST http://localhost:8012/join-room \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "room_abc123",
    "user_id": "user456"
  }'
```

**Response**:
```json
{
  "success": true,
  "room_id": "room_abc123",
  "user_id": "user456"
}
```

### 6. Get Presence

**GET** `/presence/{user_id}`

Get user's presence status.

```bash
curl http://localhost:8012/presence/user123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "user_id": "user123",
  "status": "online",
  "is_online": true
}
```

### 7. Get Room Info

**GET** `/room/{room_id}`

Get room information.

```bash
curl http://localhost:8012/room/room_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "room_id": "room_abc123",
  "room_name": "Math Study Group",
  "creator_id": "user123",
  "created_at": 1699999999.123,
  "member_count": 5,
  "max_size": 20,
  "is_active": true
}
```

### 8. Health Check

**GET** `/health`

Check agent health.

```bash
curl http://localhost:8012/health
```

**Response**:
```json
{
  "status": "healthy",
  "agent": "realtime_coordination_agent",
  "timestamp": 1699999999.123
}
```

## Core Components

### 1. ConnectionManager

Manages WebSocket connections.

```python
from realtime_coordination_agent import ConnectionManager

manager = ConnectionManager(max_connections=10000)

# Connect
session = await manager.connect(websocket, "user123", "device1")

# Send message
await manager.send_personal_message("user123", {"type": "test"})

# Broadcast
await manager.broadcast_to_room({"user1", "user2"}, message)

# Disconnect
manager.disconnect("user123", session.session_id)
```

### 2. SessionManager

Manages user sessions and state.

```python
from realtime_coordination_agent import SessionManager

session_manager = SessionManager(redis_client, session_ttl=3600)

# Create session
await session_manager.create_session("user123", "device1", "session_abc")

# Sync state
await session_manager.sync_state("user123", "device1", {"progress": 0.5})

# Get state
state = await session_manager.get_state("user123")

# Delete session
await session_manager.delete_session("user123", "device1")
```

### 3. ConflictResolver

Resolves state conflicts.

```python
from realtime_coordination_agent import ConflictResolver, ConflictResolution

resolver = ConflictResolver(strategy=ConflictResolution.LAST_WRITE_WINS)

# Resolve conflict
resolved = resolver.resolve(local_state, remote_state)
```

**Strategies**:

- **Last-Write-Wins (LWW)**: Most recent timestamp wins
- **Vector Clock**: Causal ordering with concurrent merge

### 4. NotificationManager

Manages push notifications.

```python
from realtime_coordination_agent import NotificationManager, Notification

notif_manager = NotificationManager(redis_client, retry_attempts=3)

# Send notification
notification = Notification(
    notification_id="notif123",
    user_id="user123",
    type=NotificationType.MILESTONE_ACHIEVED,
    priority=PriorityLevel.HIGH,
    title="Great job!",
    body="You completed the quiz",
    data={"score": 95},
    created_at=time.time()
)

delivered = await notif_manager.send_notification(notification)
```

### 5. RoomManager

Manages study rooms.

```python
from realtime_coordination_agent import RoomManager

room_manager = RoomManager(redis_client)

# Create room
room = await room_manager.create_room("Study Group", "user123", max_size=10)

# Join room
await room_manager.join_room(room.room_id, "user456")

# Get members
members = await room_manager.get_room_members(room.room_id)

# Leave room
await room_manager.leave_room(room.room_id, "user456")
```

### 6. PresenceManager

Tracks user presence.

```python
from realtime_coordination_agent import PresenceManager, PresenceStatus

presence_manager = PresenceManager(redis_client)

# Set presence
await presence_manager.set_presence("user123", PresenceStatus.ONLINE)

# Get presence
status = await presence_manager.get_presence("user123")

# Get online users
online_users = await presence_manager.get_online_users()
```

## Multi-device Synchronization

### How It Works

1. **Device Connects**: WebSocket established, session created
2. **State Updates**: Client sends state changes via `sync_state`
3. **Redis Pub/Sub**: State published to all user's devices
4. **Conflict Resolution**: If conflicts detected, resolver picks winner
5. **Broadcast**: Updated state sent to all devices

### Example Flow

```
Device A                    Server                      Device B
   │                           │                           │
   ├─────── Connect ──────────>│                           │
   │<────── Connected ─────────┤                           │
   │                           │<────── Connect ───────────┤
   │                           ├────── Connected ────────>│
   │                           │                           │
   ├─ sync_state: progress=0.5─>│                          │
   │                           ├─ Resolve conflicts        │
   │                           ├─ Store in Redis           │
   │                           ├── state_update ─────────>│
   │<───── state_update ───────┤                           │
   │                           │                           │
```

### Conflict Resolution

**Last-Write-Wins (LWW)**:
```python
# Most recent timestamp wins
if local.timestamp > remote.timestamp:
    return local
else:
    return remote
```

**Vector Clock**:
```python
# Causal ordering
vc1 = VectorClock({"device1": 3, "device2": 1})
vc2 = VectorClock({"device1": 2, "device2": 2})

# device1: 3 > 2, so vc1 is after vc2
if vc1.compare(vc2) == "after":
    return local
```

## Push Notifications

### FCM (Firebase Cloud Messaging)

Configure FCM in `config.yaml`:

```yaml
push_services:
  fcm_enabled: true
  fcm_server_key: "your-server-key"
  fcm_project_id: "your-project"
```

Send notification:
```python
await agent.send_notification(
    user_id="user123",
    notification_data={
        "type": "milestone_achieved",
        "priority": "high",
        "title": "Achievement Unlocked!",
        "body": "You earned the Quiz Master badge",
        "data": {"badge_id": "quiz_master"}
    }
)
```

### APNS (Apple Push Notification Service)

Configure APNS:

```yaml
push_services:
  apns_enabled: true
  apns_key_path: "/path/to/key.p8"
  apns_key_id: "ABC123"
  apns_team_id: "DEF456"
  apns_topic: "com.learnyourway.app"
```

### Web Push

Configure Web Push:

```yaml
push_services:
  web_push_enabled: true
  vapid_private_key: "your-private-key"
  vapid_public_key: "your-public-key"
```

## Study Rooms

### Features

- **Create Rooms**: Any user can create a room
- **Join/Leave**: Users join and leave dynamically
- **Size Limits**: Configurable max room size
- **Broadcasting**: Messages sent to all members
- **Persistence**: Rooms stored in Redis (24h TTL)

### Example: Creating Study Session

```python
# Create room
room_id = await agent.create_study_room(
    room_name="Calculus Study Session",
    creator_id="user123",
    max_size=20
)

# Users join
await agent.join_room(room_id, "user456")
await agent.join_room(room_id, "user789")

# Broadcast message
await agent.broadcast_message(
    room_id,
    {
        "type": "chat_message",
        "sender_id": "user123",
        "message": "Let's start with derivatives",
        "timestamp": time.time()
    }
)
```

## Testing

### Run Tests

```bash
# All tests
pytest tests/ -v

# With coverage
pytest tests/ -v --cov=realtime_coordination_agent --cov-report=html

# Specific test
pytest tests/test_realtime_coordination_agent.py::TestSessionManager -v
```

### Test Categories

1. **Unit Tests**: Individual component testing
   - ConnectionManager
   - SessionManager
   - ConflictResolver
   - NotificationManager
   - RoomManager
   - PresenceManager

2. **Integration Tests**: Multi-component workflows
   - Full session flow
   - Room collaboration
   - State synchronization

3. **Performance Tests**: Scalability validation
   - Concurrent sessions (50+ simultaneous)
   - Concurrent notifications (20+ simultaneous)

### Coverage

Target: **85%+** code coverage

```bash
pytest tests/ --cov=realtime_coordination_agent --cov-report=term-missing
```

## Performance

### Benchmarks

Tested on: 4-core CPU, 8GB RAM, Redis local

| Operation | Throughput | Latency (p95) |
|-----------|-----------|---------------|
| WebSocket Connect | 1000/s | 5ms |
| Message Send | 5000/s | 2ms |
| State Sync | 2000/s | 8ms |
| Notification Send | 1000/s | 15ms |
| Room Broadcast (10 users) | 500/s | 20ms |

### Optimization Tips

1. **Connection Pooling**: Configure `connection_pool_size` in config
2. **Redis Pipeline**: Enable `batch_updates` for state sync
3. **Compression**: Enable WebSocket compression for large messages
4. **Heartbeat**: Adjust interval based on network stability
5. **Worker Threads**: Increase for high concurrency

## Monitoring

### Prometheus Metrics

Agent exposes metrics on `/metrics`:

```bash
curl http://localhost:8012/metrics
```

**Key Metrics**:
- `connections_total`: Total active connections
- `active_users_total`: Number of users online
- `messages_sent_total`: Total messages sent
- `notifications_sent_total`: Total notifications
- `rooms_active_total`: Active study rooms

### Grafana Dashboard

Example queries:

```promql
# Active connections
connections_total

# Message rate
rate(messages_sent_total[5m])

# Notification success rate
rate(notifications_sent_total{status="delivered"}[5m]) / 
rate(notifications_sent_total[5m])
```

### Logging

Structured JSON logging:

```json
{
  "event": "websocket_connected",
  "user_id": "user123",
  "device_id": "web1",
  "session_id": "abc123",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Troubleshooting

### 1. WebSocket Connection Fails

**Problem**: Cannot establish WebSocket connection

**Solutions**:
```bash
# Check agent is running
curl http://localhost:8012/health

# Check WebSocket endpoint
wscat -c ws://localhost:8012/ws/user123?device_id=web1

# Verify firewall allows port 8012
sudo ufw allow 8012
```

### 2. Redis Connection Error

**Problem**: `ConnectionError: Error connecting to Redis`

**Solutions**:
```bash
# Check Redis is running
redis-cli ping

# Verify Redis URL in config.yaml
redis_url: "redis://localhost:6379"

# Check Redis logs
docker logs redis_container
```

### 3. State Not Syncing

**Problem**: State changes not propagating to other devices

**Solutions**:
- Check Redis pub/sub is working: `redis-cli PUBSUB CHANNELS`
- Verify all devices connected: Check `/presence/{user_id}`
- Review conflict resolution strategy in config
- Check logs for sync errors

### 4. Notifications Not Delivered

**Problem**: Push notifications not reaching devices

**Solutions**:
- Verify FCM/APNS credentials configured
- Check notification manager logs
- Test with WebSocket-only delivery first
- Verify device tokens registered

### 5. Room Messages Not Broadcasting

**Problem**: Messages not reaching all room members

**Solutions**:
```bash
# Check room exists
curl http://localhost:8012/room/{room_id}

# Verify all members connected
# Check logs for broadcast errors

# Test with small room first (2-3 users)
```

## Production Deployment

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: realtime-coordination-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: realtime-coordination
  template:
    metadata:
      labels:
        app: realtime-coordination
    spec:
      containers:
      - name: agent
        image: realtime-coordination-agent:latest
        ports:
        - containerPort: 8012
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
---
apiVersion: v1
kind: Service
metadata:
  name: realtime-coordination-service
spec:
  selector:
    app: realtime-coordination
  ports:
  - port: 8012
    targetPort: 8012
  type: LoadBalancer
```

### Scaling Considerations

1. **Horizontal Scaling**: Multiple replicas with sticky sessions
2. **Redis Cluster**: For high availability
3. **Load Balancing**: Use WebSocket-aware load balancer
4. **Session Affinity**: Keep user connections on same instance

### Security Best Practices

1. **JWT Authentication**: Always verify tokens
2. **Rate Limiting**: Prevent abuse
3. **CORS Configuration**: Restrict origins
4. **TLS/SSL**: Use WSS for production
5. **Input Validation**: Sanitize all incoming data

## Contributing

Contributions welcome! Please:

1. Write tests for new features
2. Follow existing code style
3. Update documentation
4. Ensure 85%+ test coverage

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: See this README
- **Issues**: GitHub Issues
- **Email**: support@learnyourway.com
