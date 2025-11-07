"""
Unit tests for Orchestration Agent
"""

import asyncio
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from orchestration_agent import (
    OrchestrationAgent,
    TaskRequest,
    TaskStatus,
    CircuitBreaker,
    CircuitBreakerState,
    PriorityQueue,
    RateLimiter,
    app,
)


@pytest.fixture
def config_path():
    """Fixture for config path"""
    return Path(__file__).parent.parent / "config.yaml"


@pytest.fixture
def orchestrator(config_path):
    """Fixture for orchestrator instance"""
    return OrchestrationAgent(str(config_path))


@pytest.fixture
def client():
    """Fixture for test client"""
    return TestClient(app)


class TestCircuitBreaker:
    """Test circuit breaker functionality"""

    def test_initial_state(self):
        """Test circuit breaker initial state"""
        cb = CircuitBreaker(threshold=3, timeout=60)
        assert cb.state == CircuitBreakerState.CLOSED
        assert cb.failure_count == 0
        assert cb.can_execute() is True

    def test_record_failure(self):
        """Test recording failures"""
        cb = CircuitBreaker(threshold=3, timeout=60)
        
        cb.record_failure()
        assert cb.failure_count == 1
        assert cb.state == CircuitBreakerState.CLOSED
        
        cb.record_failure()
        cb.record_failure()
        assert cb.failure_count == 3
        assert cb.state == CircuitBreakerState.OPEN
        assert cb.can_execute() is False

    def test_record_success_half_open(self):
        """Test recording success in half-open state"""
        cb = CircuitBreaker(threshold=3, timeout=0)
        
        # Trigger open state
        for _ in range(3):
            cb.record_failure()
        
        assert cb.state == CircuitBreakerState.OPEN
        
        # Wait for timeout
        import time
        time.sleep(0.1)
        
        # Should transition to half-open
        assert cb.can_execute() is True
        assert cb.state == CircuitBreakerState.HALF_OPEN
        
        # Success should close circuit
        cb.record_success()
        assert cb.state == CircuitBreakerState.CLOSED
        assert cb.failure_count == 0

    def test_state_value(self):
        """Test numeric state values"""
        cb = CircuitBreaker(threshold=3, timeout=60)
        
        assert cb.get_state_value() == 0  # CLOSED
        
        for _ in range(3):
            cb.record_failure()
        
        assert cb.get_state_value() == 2  # OPEN


class TestPriorityQueue:
    """Test priority queue functionality"""

    @pytest.mark.asyncio
    async def test_enqueue_dequeue(self):
        """Test basic enqueue and dequeue"""
        pq = PriorityQueue(max_size=100)
        
        await pq.enqueue("task1", 3, {"data": "test1"})
        await pq.enqueue("task2", 5, {"data": "test2"})
        await pq.enqueue("task3", 1, {"data": "test3"})
        
        # Should dequeue highest priority first
        task = await pq.dequeue()
        assert task["task_id"] == "task2"  # priority 5
        
        task = await pq.dequeue()
        assert task["task_id"] == "task1"  # priority 3
        
        task = await pq.dequeue()
        assert task["task_id"] == "task3"  # priority 1

    @pytest.mark.asyncio
    async def test_queue_size_limit(self):
        """Test queue size limit"""
        pq = PriorityQueue(max_size=2)
        
        await pq.enqueue("task1", 3, {"data": "test1"})
        await pq.enqueue("task2", 3, {"data": "test2"})
        
        # Third enqueue should raise exception
        with pytest.raises(Exception):
            await pq.enqueue("task3", 3, {"data": "test3"})

    @pytest.mark.asyncio
    async def test_remove_task(self):
        """Test removing task from queue"""
        pq = PriorityQueue(max_size=100)
        
        await pq.enqueue("task1", 3, {"data": "test1"})
        await pq.enqueue("task2", 3, {"data": "test2"})
        
        # Remove task1
        removed = await pq.remove("task1")
        assert removed is True
        
        # Next dequeue should return task2
        task = await pq.dequeue()
        assert task["task_id"] == "task2"

    @pytest.mark.asyncio
    async def test_get_size(self):
        """Test getting queue size"""
        pq = PriorityQueue(max_size=100)
        
        assert pq.get_size() == 0
        
        await pq.enqueue("task1", 3, {"data": "test1"})
        await pq.enqueue("task2", 5, {"data": "test2"})
        
        assert pq.get_size() == 2


class TestRateLimiter:
    """Test rate limiter functionality"""

    @pytest.mark.asyncio
    async def test_token_acquisition(self):
        """Test token acquisition"""
        limiter = RateLimiter(rate=60, burst_size=10)
        
        # Should acquire successfully with initial tokens
        for _ in range(10):
            acquired = await limiter.acquire()
            assert acquired is True
        
        # Next acquisition should fail (no tokens left)
        acquired = await limiter.acquire()
        assert acquired is False

    @pytest.mark.asyncio
    async def test_token_replenishment(self):
        """Test token replenishment over time"""
        limiter = RateLimiter(rate=60, burst_size=5)
        
        # Exhaust tokens
        for _ in range(5):
            await limiter.acquire()
        
        # Wait for replenishment (1 second = 1 token at 60/min)
        await asyncio.sleep(1.1)
        
        # Should be able to acquire again
        acquired = await limiter.acquire()
        assert acquired is True


class TestOrchestrationAgent:
    """Test orchestration agent functionality"""

    def test_load_config(self, orchestrator):
        """Test configuration loading"""
        assert orchestrator.config is not None
        assert "agent" in orchestrator.config
        assert "routing_rules" in orchestrator.config
        assert orchestrator.config["agent"]["name"] == "orchestration_agent"

    def test_routing_rules_loaded(self, orchestrator):
        """Test routing rules are loaded"""
        assert len(orchestrator.routing_rules) > 0
        assert "upload_pdf" in orchestrator.routing_rules
        assert "personalize_content" in orchestrator.routing_rules

    def test_route_request_valid(self, orchestrator):
        """Test routing valid request"""
        request = TaskRequest(
            pattern="upload_pdf",
            payload={"file": "test.pdf"}
        )
        
        agent = orchestrator.route_request(request)
        assert agent == "content_ingestion_agent"

    def test_route_request_invalid_pattern(self, orchestrator):
        """Test routing with invalid pattern"""
        request = TaskRequest(
            pattern="invalid_pattern",
            payload={"data": "test"}
        )
        
        with pytest.raises(Exception):
            orchestrator.route_request(request)

    @pytest.mark.asyncio
    async def test_distribute_task(self, orchestrator):
        """Test task distribution"""
        await orchestrator.startup()
        
        try:
            request = TaskRequest(
                pattern="upload_pdf",
                payload={"file": "test.pdf"},
                priority=3
            )
            
            agent = orchestrator.route_request(request)
            result = await orchestrator.distribute_task(request, agent)
            
            assert "task_id" in result
            assert result["status"] == TaskStatus.QUEUED
            assert result["task_id"] in orchestrator.tasks
            
        finally:
            await orchestrator.shutdown()

    @pytest.mark.asyncio
    async def test_monitor_execution(self, orchestrator):
        """Test execution monitoring"""
        await orchestrator.startup()
        
        try:
            request = TaskRequest(
                pattern="upload_pdf",
                payload={"file": "test.pdf"}
            )
            
            agent = orchestrator.route_request(request)
            result = await orchestrator.distribute_task(request, agent)
            task_id = result["task_id"]
            
            # Monitor task
            status = await orchestrator.monitor_execution(task_id)
            
            assert status["task_id"] == task_id
            assert "status" in status
            assert status["agent"] == agent
            
        finally:
            await orchestrator.shutdown()

    @pytest.mark.asyncio
    async def test_aggregate_results(self, orchestrator):
        """Test result aggregation"""
        await orchestrator.startup()
        
        try:
            task_ids = []
            
            # Create multiple tasks
            for i in range(3):
                request = TaskRequest(
                    pattern="upload_pdf",
                    payload={"file": f"test{i}.pdf"}
                )
                agent = orchestrator.route_request(request)
                result = await orchestrator.distribute_task(request, agent)
                task_ids.append(result["task_id"])
            
            # Aggregate results
            aggregated = await orchestrator.aggregate_results(task_ids)
            
            assert aggregated["total_tasks"] == 3
            assert "results" in aggregated
            assert "errors" in aggregated
            
        finally:
            await orchestrator.shutdown()

    @pytest.mark.asyncio
    async def test_handle_failure(self, orchestrator):
        """Test failure handling"""
        await orchestrator.startup()
        
        try:
            request = TaskRequest(
                pattern="upload_pdf",
                payload={"file": "test.pdf"}
            )
            
            agent = orchestrator.route_request(request)
            result = await orchestrator.distribute_task(request, agent)
            task_id = result["task_id"]
            
            # Simulate failure
            error = Exception("Test error")
            recovery_result = await orchestrator.handle_failure(task_id, error)
            
            assert "task_id" in recovery_result
            assert recovery_result["task_id"] == task_id
            
        finally:
            await orchestrator.shutdown()

    def test_get_health_status(self, orchestrator):
        """Test health status"""
        health = orchestrator.get_health_status()
        
        assert health.status in ["healthy", "degraded"]
        assert health.agents_total > 0
        assert isinstance(health.active_tasks, int)
        assert isinstance(health.queue_size, int)

    def test_get_metrics(self, orchestrator):
        """Test metrics retrieval"""
        metrics = orchestrator.get_metrics()
        
        assert "total_tasks" in metrics
        assert "active_tasks" in metrics
        assert "agents_status" in metrics
        assert "queue_sizes" in metrics


class TestAPI:
    """Test FastAPI endpoints"""

    @patch("orchestration_agent.orchestrator")
    def test_root_endpoint(self, mock_orchestrator, client):
        """Test root endpoint"""
        mock_orchestrator.config = {
            "agent": {"version": "1.0.0"}
        }
        
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Orchestration Agent"

    @patch("orchestration_agent.orchestrator")
    def test_health_endpoint(self, mock_orchestrator, client):
        """Test health check endpoint"""
        from orchestration_agent import HealthResponse
        
        mock_orchestrator.get_health_status.return_value = HealthResponse(
            status="healthy",
            timestamp=datetime.utcnow(),
            version="1.0.0",
            agents_healthy=10,
            agents_total=18,
            active_tasks=5,
            queue_size=10
        )
        
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    @patch("orchestration_agent.orchestrator")
    def test_metrics_endpoint(self, mock_orchestrator, client):
        """Test metrics endpoint"""
        mock_orchestrator.get_metrics.return_value = {
            "total_tasks": 100,
            "active_tasks": 10,
            "agents_status": {},
            "queue_sizes": {}
        }
        
        response = client.get("/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "total_tasks" in data


class TestTaskRequest:
    """Test TaskRequest model validation"""

    def test_valid_task_request(self):
        """Test valid task request"""
        request = TaskRequest(
            pattern="upload_pdf",
            payload={"file": "test.pdf"},
            priority=3
        )
        
        assert request.pattern == "upload_pdf"
        assert request.priority == 3

    def test_invalid_priority(self):
        """Test invalid priority"""
        with pytest.raises(Exception):
            TaskRequest(
                pattern="upload_pdf",
                payload={"file": "test.pdf"},
                priority=10  # Out of range
            )

    def test_empty_pattern(self):
        """Test empty pattern"""
        with pytest.raises(Exception):
            TaskRequest(
                pattern="",
                payload={"file": "test.pdf"}
            )

    def test_default_values(self):
        """Test default values"""
        request = TaskRequest(
            pattern="upload_pdf",
            payload={"file": "test.pdf"}
        )
        
        assert request.priority == 1
        assert request.metadata == {}
        assert request.timeout is None
        assert request.callback_url is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
