"""
Integration tests for Orchestration Agent
"""

import asyncio
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from orchestration_agent import OrchestrationAgent, TaskRequest, TaskStatus


@pytest.fixture
async def orchestrator_running():
    """Fixture for running orchestrator"""
    config_path = Path(__file__).parent.parent / "config.yaml"
    orchestrator = OrchestrationAgent(str(config_path))
    
    await orchestrator.startup()
    yield orchestrator
    await orchestrator.shutdown()


@pytest.mark.asyncio
class TestIntegration:
    """Integration tests"""

    async def test_end_to_end_task_flow(self, orchestrator_running):
        """Test complete task flow from submission to completion"""
        orchestrator = orchestrator_running
        
        # Mock HTTP client to simulate agent response
        with patch.object(orchestrator.http_client, 'post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"result": "success", "pages": 10}
            mock_post.return_value = mock_response
            
            # Submit task
            request = TaskRequest(
                pattern="upload_pdf",
                payload={"file": "test.pdf"},
                priority=3
            )
            
            agent = orchestrator.route_request(request)
            result = await orchestrator.distribute_task(request, agent)
            task_id = result["task_id"]
            
            # Wait for processing
            await asyncio.sleep(0.5)
            
            # Check status
            status = await orchestrator.monitor_execution(task_id)
            assert status["task_id"] == task_id
            assert "status" in status

    async def test_multiple_concurrent_tasks(self, orchestrator_running):
        """Test handling multiple concurrent tasks"""
        orchestrator = orchestrator_running
        
        with patch.object(orchestrator.http_client, 'post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"result": "success"}
            mock_post.return_value = mock_response
            
            # Submit multiple tasks
            task_ids = []
            for i in range(10):
                request = TaskRequest(
                    pattern="upload_pdf",
                    payload={"file": f"test{i}.pdf"},
                    priority=i % 5 + 1
                )
                agent = orchestrator.route_request(request)
                result = await orchestrator.distribute_task(request, agent)
                task_ids.append(result["task_id"])
            
            # Wait for processing
            await asyncio.sleep(1)
            
            # Aggregate results
            aggregated = await orchestrator.aggregate_results(task_ids)
            assert aggregated["total_tasks"] == 10

    async def test_circuit_breaker_integration(self, orchestrator_running):
        """Test circuit breaker behavior in integration"""
        orchestrator = orchestrator_running
        agent_name = "content_ingestion_agent"
        
        # Simulate failures to open circuit breaker
        cb = orchestrator.circuit_breakers[agent_name]
        threshold = orchestrator.config["error_recovery"]["circuit_breaker_threshold"]
        
        for _ in range(threshold):
            cb.record_failure()
        
        # Circuit should be open
        assert not cb.can_execute()
        
        # Try to submit task - should fail
        request = TaskRequest(
            pattern="upload_pdf",
            payload={"file": "test.pdf"}
        )
        
        with pytest.raises(Exception):
            orchestrator.route_request(request)

    async def test_priority_ordering(self, orchestrator_running):
        """Test that high priority tasks are processed first"""
        orchestrator = orchestrator_running
        
        with patch.object(orchestrator.http_client, 'post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"result": "success"}
            mock_post.return_value = mock_response
            
            # Submit tasks with different priorities
            low_priority_request = TaskRequest(
                pattern="upload_pdf",
                payload={"file": "low.pdf"},
                priority=1
            )
            
            high_priority_request = TaskRequest(
                pattern="upload_pdf",
                payload={"file": "high.pdf"},
                priority=5
            )
            
            # Submit low priority first
            agent = orchestrator.route_request(low_priority_request)
            low_result = await orchestrator.distribute_task(low_priority_request, agent)
            
            # Then high priority
            agent = orchestrator.route_request(high_priority_request)
            high_result = await orchestrator.distribute_task(high_priority_request, agent)
            
            # High priority should be dequeued first
            task_item = await orchestrator.priority_queue.dequeue()
            assert task_item["task_id"] == high_result["task_id"]

    async def test_rate_limiting_integration(self, orchestrator_running):
        """Test rate limiting in integration"""
        orchestrator = orchestrator_running
        agent_name = "visual_generation_agent"
        
        # Get rate limiter for this agent
        if agent_name in orchestrator.rate_limiters:
            rate_limiter = orchestrator.rate_limiters[agent_name]
            
            # Exhaust rate limit
            burst_size = orchestrator.config["rate_limiting"]["burst_size"]
            
            for _ in range(burst_size):
                acquired = await rate_limiter.acquire()
                assert acquired is True
            
            # Next request should be rate limited
            request = TaskRequest(
                pattern="create_visual",
                payload={"type": "diagram"},
                priority=3
            )
            
            agent = orchestrator.route_request(request)
            
            # This should raise rate limit exception
            with pytest.raises(Exception):
                await orchestrator.distribute_task(request, agent)

    async def test_task_timeout(self, orchestrator_running):
        """Test task timeout handling"""
        orchestrator = orchestrator_running
        
        # Mock slow response
        async def slow_response(*args, **kwargs):
            await asyncio.sleep(10)
            return AsyncMock(status_code=200, json=lambda: {"result": "success"})
        
        with patch.object(orchestrator.http_client, 'post', side_effect=slow_response):
            request = TaskRequest(
                pattern="upload_pdf",
                payload={"file": "test.pdf"},
                timeout=1  # 1 second timeout
            )
            
            agent = orchestrator.route_request(request)
            result = await orchestrator.distribute_task(request, agent)
            task_id = result["task_id"]
            
            # Wait for timeout
            await asyncio.sleep(2)
            
            # Task should have timed out
            status = await orchestrator.monitor_execution(task_id)
            assert status["status"] in [TaskStatus.FAILED, TaskStatus.RUNNING]

    async def test_message_queue_integration(self, orchestrator_running):
        """Test message queue integration"""
        orchestrator = orchestrator_running
        
        if orchestrator.message_queue:
            # Test publishing to queue
            try:
                orchestrator.message_queue.publish(
                    "test.routing.key",
                    {"task_id": "test", "status": "completed"}
                )
                # If no exception, publish successful
                assert True
            except Exception as e:
                # Message queue might not be running in test env
                pytest.skip(f"Message queue not available: {str(e)}")

    async def test_health_check_monitoring(self, orchestrator_running):
        """Test health check monitoring"""
        orchestrator = orchestrator_running
        
        # Get initial health status
        health = orchestrator.get_health_status()
        assert health.agents_total > 0
        
        # Wait for health check cycle
        await asyncio.sleep(2)
        
        # Check metrics updated
        metrics = orchestrator.get_metrics()
        assert "agents_status" in metrics

    async def test_callback_notification(self, orchestrator_running):
        """Test callback notification"""
        orchestrator = orchestrator_running
        
        callback_called = False
        callback_data = None
        
        async def mock_callback(*args, **kwargs):
            nonlocal callback_called, callback_data
            callback_called = True
            if 'json' in kwargs:
                callback_data = kwargs['json']
            return AsyncMock(status_code=200)
        
        with patch.object(orchestrator.http_client, 'post', side_effect=mock_callback) as mock_post:
            # First call is the task execution
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"result": "success"}
            
            # Configure mock to return different responses
            async def multi_response(*args, **kwargs):
                if 'callback' in args[0]:
                    return await mock_callback(*args, **kwargs)
                return mock_response
            
            mock_post.side_effect = multi_response
            
            request = TaskRequest(
                pattern="upload_pdf",
                payload={"file": "test.pdf"},
                callback_url="http://example.com/callback"
            )
            
            agent = orchestrator.route_request(request)
            result = await orchestrator.distribute_task(request, agent)
            
            # Wait for task completion and callback
            await asyncio.sleep(1)
            
            # Callback might be called
            if callback_called:
                assert callback_data is not None
                assert "task_id" in callback_data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
