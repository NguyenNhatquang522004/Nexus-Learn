"""
Pytest configuration and shared fixtures for orchestration agent tests.
"""

import pytest
import asyncio
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_config():
    """Provide a mock configuration for testing."""
    return {
        "agent": {
            "name": "orchestration_agent",
            "port": 8000,
            "host": "0.0.0.0"
        },
        "routing_rules": [
            {
                "pattern": "upload_pdf",
                "target_agent": "content_ingestion_agent",
                "endpoint": "http://localhost:8001/ingest"
            },
            {
                "pattern": "personalize_content",
                "target_agent": "personalization_agent",
                "endpoint": "http://localhost:8002/generate"
            }
        ],
        "load_balancing": {
            "strategy": "round_robin",
            "health_check_interval": 30
        },
        "error_recovery": {
            "max_retries": 3,
            "retry_delay": 1,
            "backoff_multiplier": 2
        },
        "message_queue": {
            "type": "rabbitmq",
            "host": "localhost",
            "port": 5672
        },
        "monitoring": {
            "enable_metrics": True,
            "metrics_port": 9090
        }
    }


@pytest.fixture
def mock_http_client():
    """Provide a mock HTTP client."""
    mock = AsyncMock()
    mock.post = AsyncMock(return_value=MagicMock(
        status_code=200,
        json=lambda: {"status": "success", "task_id": "test-123"}
    ))
    mock.get = AsyncMock(return_value=MagicMock(
        status_code=200,
        json=lambda: {"status": "completed"}
    ))
    return mock


@pytest.fixture
def sample_request():
    """Provide a sample orchestration request."""
    return {
        "task_type": "upload_pdf",
        "payload": {
            "file_path": "/path/to/file.pdf",
            "user_id": "user123"
        },
        "priority": "high",
        "timeout": 300
    }


@pytest.fixture
def sample_tasks():
    """Provide sample tasks for testing."""
    return [
        {
            "task_id": "task-1",
            "agent": "content_ingestion_agent",
            "status": "completed",
            "result": {"extracted_text": "Sample text"}
        },
        {
            "task_id": "task-2",
            "agent": "personalization_agent",
            "status": "completed",
            "result": {"personalized_content": "Custom content"}
        }
    ]


@pytest.fixture
async def orchestration_agent(mock_config, mock_http_client):
    """Provide an orchestration agent instance for testing."""
    from orchestration_agent import OrchestrationAgent
    
    agent = OrchestrationAgent(mock_config)
    agent.http_client = mock_http_client
    
    yield agent
    
    # Cleanup
    if hasattr(agent, 'shutdown'):
        await agent.shutdown()
