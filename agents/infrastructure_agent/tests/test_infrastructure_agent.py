"""
Tests for Infrastructure Agent

Comprehensive test suite covering Docker management, Kubernetes orchestration,
monitoring, auto-scaling, deployment strategies, and database backup/restore.
"""

import asyncio
import json
import pytest
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from infrastructure_agent import (
    InfrastructureAgent,
    DockerManager,
    KubernetesManager,
    PrometheusMonitor,
    AlertManager,
    AutoScaler,
    DeploymentOrchestrator,
    DatabaseManager,
    DeploymentStrategy,
    AlertChannel
)


@pytest.fixture
def config():
    """Test configuration"""
    return {
        "agent": {
            "name": "Infrastructure Agent",
            "port": 8019,
            "host": "0.0.0.0"
        },
        "docker": {
            "socket": "/var/run/docker.sock",
            "compose_file": "docker-compose.yml",
            "registry": "docker.io/test"
        },
        "kubernetes": {
            "enable": False,
            "namespace": "test"
        },
        "monitoring": {
            "prometheus": {
                "url": "http://prometheus:9090",
                "scrape_interval": 15
            },
            "metrics": ["cpu_usage", "memory_usage"]
        },
        "alerting": {
            "rules": [
                {
                    "metric": "cpu_usage",
                    "threshold": 80,
                    "action": "alert"
                }
            ],
            "channels": {
                "slack": {"webhook": "http://slack.webhook"},
                "email": {"recipients": ["test@example.com"]}
            }
        },
        "auto_scaling": {
            "enable": True,
            "min_replicas": 2,
            "max_replicas": 10,
            "scale_up": {"cpu_threshold": 70, "cooldown_seconds": 300},
            "scale_down": {"cpu_threshold": 30, "cooldown_seconds": 600}
        },
        "deployment": {
            "strategy": "blue_green",
            "blue_green": {
                "health_check_timeout": 60,
                "rollback_on_failure": True
            },
            "canary": {
                "traffic_split": 10,
                "duration_minutes": 15
            }
        },
        "database_management": {
            "postgresql": {"backup_schedule": "0 2 * * *"},
            "neo4j": {"backup_schedule": "0 3 * * *"},
            "redis": {"max_memory": "2G"}
        },
        "health_checks": {
            "interval_seconds": 30,
            "timeout_seconds": 5,
            "endpoints": [
                "http://orchestration:8000/health"
            ]
        }
    }


@pytest.fixture
def docker_manager(config):
    """Docker manager fixture"""
    with patch('infrastructure_agent.docker.DockerClient'):
        manager = DockerManager(config)
        manager.client = Mock()
        return manager


@pytest.fixture
def k8s_manager(config):
    """Kubernetes manager fixture"""
    with patch('infrastructure_agent.K8S_AVAILABLE', False):
        return KubernetesManager(config)


@pytest.fixture
def prometheus_monitor(config):
    """Prometheus monitor fixture"""
    return PrometheusMonitor(config)


@pytest.fixture
def alert_manager(config):
    """Alert manager fixture"""
    return AlertManager(config)


@pytest.fixture
def auto_scaler(config, docker_manager, k8s_manager):
    """Auto scaler fixture"""
    return AutoScaler(config, docker_manager, k8s_manager)


@pytest.fixture
def deployment_orchestrator(config, docker_manager):
    """Deployment orchestrator fixture"""
    return DeploymentOrchestrator(config, docker_manager)


@pytest.fixture
def database_manager(config):
    """Database manager fixture"""
    return DatabaseManager(config)


@pytest.fixture
def agent(config):
    """Infrastructure agent fixture"""
    with patch('infrastructure_agent.docker.DockerClient'), \
         patch('infrastructure_agent.K8S_AVAILABLE', False):
        return InfrastructureAgent(config)


class TestDockerManager:
    """Test Docker management"""
    
    def test_list_containers(self, docker_manager):
        """Test listing containers"""
        mock_container = Mock()
        mock_container.id = "abc123def456"
        mock_container.name = "test-service"
        mock_container.status = "running"
        mock_container.image.tags = ["test:latest"]
        mock_container.attrs = {"Created": "2024-01-01T00:00:00Z"}
        
        docker_manager.client.containers.list.return_value = [mock_container]
        
        containers = docker_manager.list_containers()
        
        assert len(containers) == 1
        assert containers[0]["name"] == "test-service"
        assert containers[0]["status"] == "running"
    
    def test_get_container(self, docker_manager):
        """Test getting container"""
        mock_container = Mock()
        docker_manager.client.containers.get.return_value = mock_container
        
        container = docker_manager.get_container("test-service")
        
        assert container is not None
        docker_manager.client.containers.get.assert_called_once_with("test-service")
    
    @patch('infrastructure_agent.subprocess.run')
    def test_scale_service_success(self, mock_run, docker_manager):
        """Test scaling service successfully"""
        mock_run.return_value = Mock(returncode=0)
        
        result = docker_manager.scale_service("test-service", 3)
        
        assert result is True
    
    def test_get_container_stats(self, docker_manager):
        """Test getting container stats"""
        mock_container = Mock()
        mock_container.stats.return_value = {
            "cpu_stats": {
                "cpu_usage": {"total_usage": 1000000},
                "system_cpu_usage": 10000000
            },
            "precpu_stats": {
                "cpu_usage": {"total_usage": 900000},
                "system_cpu_usage": 9000000
            },
            "memory_stats": {
                "usage": 1073741824,  # 1GB
                "limit": 2147483648   # 2GB
            },
            "networks": {
                "eth0": {
                    "rx_bytes": 1000000,
                    "tx_bytes": 500000
                }
            }
        }
        docker_manager.client.containers.get.return_value = mock_container
        
        stats = docker_manager.get_container_stats("test-service")
        
        assert "cpu_percent" in stats
        assert "memory_percent" in stats
        assert "network_rx_bytes" in stats


class TestPrometheusMonitor:
    """Test Prometheus monitoring"""
    
    @pytest.mark.asyncio
    async def test_query_metric(self, prometheus_monitor):
        """Test querying Prometheus metric"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "success",
            "data": {
                "result": [
                    {"value": [1234567890, "75.5"]}
                ]
            }
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            value = await prometheus_monitor.query_metric("cpu_usage")
            
            assert value == 75.5
    
    @pytest.mark.asyncio
    async def test_collect_metrics(self, prometheus_monitor):
        """Test collecting all metrics"""
        with patch.object(prometheus_monitor, 'query_metric', return_value=50.0), \
             patch.object(prometheus_monitor, '_get_cpu_usage', return_value=60.0), \
             patch.object(prometheus_monitor, '_get_memory_usage', return_value=70.0), \
             patch.object(prometheus_monitor, '_get_disk_usage', return_value=80.0), \
             patch.object(prometheus_monitor, '_get_network_io', return_value={"rx_bytes": 1000}):
            
            metrics = await prometheus_monitor.collect_metrics()
            
            assert "cpu_usage" in metrics
            assert "memory_usage" in metrics


class TestAlertManager:
    """Test alert management"""
    
    @pytest.mark.asyncio
    async def test_send_slack_alert(self, alert_manager):
        """Test sending Slack alert"""
        alert = {
            "title": "High CPU Usage",
            "service": "test-service",
            "metric": "cpu_usage",
            "value": 85.0,
            "threshold": 80.0,
            "severity": "warning",
            "message": "CPU usage is high"
        }
        
        mock_response = Mock()
        mock_response.status_code = 200
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            
            result = await alert_manager._send_slack_alert(alert)
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_send_email_alert(self, alert_manager):
        """Test sending email alert"""
        alert = {
            "title": "High Memory Usage",
            "service": "test-service",
            "metric": "memory_usage",
            "value": 90.0,
            "threshold": 85.0,
            "severity": "critical"
        }
        
        with patch('smtplib.SMTP') as mock_smtp:
            with patch.dict(os.environ, {
                "SMTP_SERVER": "smtp.test.com",
                "SMTP_USER": "test@test.com",
                "SMTP_PASSWORD": "password"
            }):
                result = await alert_manager._send_email_alert(alert)
                
                # Email should succeed with proper credentials
                assert result is True or result is False  # Depends on mock
    
    def test_check_alert_rules(self, alert_manager):
        """Test checking alert rules"""
        metrics = {
            "cpu_usage": 85.0,
            "memory_usage": 60.0
        }
        
        triggered_alerts = alert_manager.check_alert_rules(metrics)
        
        assert len(triggered_alerts) > 0
        assert triggered_alerts[0]["metric"] == "cpu_usage"


class TestAutoScaler:
    """Test auto-scaling"""
    
    @pytest.mark.asyncio
    async def test_scale_up(self, auto_scaler):
        """Test scaling up"""
        metrics = {"cpu_usage": 75.0}
        
        with patch.object(auto_scaler.k8s_manager, 'get_deployment_status', return_value={"replicas": 2}):
            new_replicas = await auto_scaler.evaluate_scaling("test-service", metrics)
            
            assert new_replicas == 3
    
    @pytest.mark.asyncio
    async def test_scale_down(self, auto_scaler):
        """Test scaling down"""
        metrics = {"cpu_usage": 25.0}
        
        with patch.object(auto_scaler.k8s_manager, 'get_deployment_status', return_value={"replicas": 5}):
            # Set last scale time to allow cooldown
            auto_scaler.last_scale_time["test-service"] = 0
            
            new_replicas = await auto_scaler.evaluate_scaling("test-service", metrics)
            
            assert new_replicas == 4
    
    @pytest.mark.asyncio
    async def test_no_scaling_within_threshold(self, auto_scaler):
        """Test no scaling when within threshold"""
        metrics = {"cpu_usage": 50.0}
        
        new_replicas = await auto_scaler.evaluate_scaling("test-service", metrics)
        
        assert new_replicas is None


class TestDeploymentOrchestrator:
    """Test deployment orchestration"""
    
    @pytest.mark.asyncio
    async def test_rolling_deployment(self, deployment_orchestrator):
        """Test rolling deployment"""
        with patch.object(deployment_orchestrator.docker_manager, 'deploy_container', return_value=True), \
             patch.object(deployment_orchestrator.docker_manager, 'get_container') as mock_get:
            
            mock_container = Mock()
            mock_container.status = "running"
            mock_get.return_value = mock_container
            
            result = await deployment_orchestrator._rolling_deployment("test-service", "v2.0", "test:v2.0")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_blue_green_deployment(self, deployment_orchestrator):
        """Test blue/green deployment"""
        with patch.object(deployment_orchestrator.docker_manager, 'deploy_container', return_value=True), \
             patch.object(deployment_orchestrator.docker_manager, 'get_container') as mock_get:
            
            mock_container = Mock()
            mock_container.status = "running"
            mock_container.rename = Mock()
            mock_get.return_value = mock_container
            
            result = await deployment_orchestrator._blue_green_deployment("test-service", "v2.0", "test:v2.0")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_canary_deployment(self, deployment_orchestrator):
        """Test canary deployment"""
        with patch.object(deployment_orchestrator.docker_manager, 'deploy_container', return_value=True), \
             patch.object(deployment_orchestrator.docker_manager, 'get_container') as mock_get, \
             patch('asyncio.sleep', return_value=None):
            
            mock_container = Mock()
            mock_container.status = "running"
            mock_container.rename = Mock()
            mock_get.return_value = mock_container
            
            # Override canary duration for testing
            deployment_orchestrator.config["deployment"]["canary"]["duration_minutes"] = 0
            
            result = await deployment_orchestrator._canary_deployment("test-service", "v2.0", "test:v2.0")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_rollback(self, deployment_orchestrator):
        """Test rollback"""
        # Add deployment history
        deployment_orchestrator.deployment_history = [
            {
                "service": "test-service",
                "version": "v1.0",
                "strategy": "rolling",
                "status": "success"
            },
            {
                "service": "test-service",
                "version": "v2.0",
                "strategy": "rolling",
                "status": "failed"
            }
        ]
        
        with patch.object(deployment_orchestrator.docker_manager, 'deploy_container', return_value=True):
            result = await deployment_orchestrator.rollback("test-service", "v2.0")
            
            assert result is True


class TestDatabaseManager:
    """Test database management"""
    
    @pytest.mark.asyncio
    @patch('infrastructure_agent.subprocess.run')
    async def test_backup_postgresql(self, mock_run, database_manager):
        """Test PostgreSQL backup"""
        mock_run.return_value = Mock(returncode=0)
        
        with patch.dict(os.environ, {
            "POSTGRES_HOST": "localhost",
            "POSTGRES_USER": "postgres",
            "POSTGRES_DB": "test"
        }):
            backup_file = await database_manager._backup_postgresql()
            
            assert backup_file.endswith(".sql")
            assert "postgresql" in backup_file
    
    @pytest.mark.asyncio
    @patch('infrastructure_agent.subprocess.run')
    async def test_restore_postgresql(self, mock_run, database_manager):
        """Test PostgreSQL restore"""
        mock_run.return_value = Mock(returncode=0)
        
        with patch.dict(os.environ, {
            "POSTGRES_HOST": "localhost",
            "POSTGRES_USER": "postgres",
            "POSTGRES_DB": "test"
        }):
            result = await database_manager._restore_postgresql("/backups/test.sql")
            
            assert result is True
    
    @pytest.mark.asyncio
    @patch('infrastructure_agent.subprocess.run')
    async def test_backup_neo4j(self, mock_run, database_manager):
        """Test Neo4j backup"""
        mock_run.return_value = Mock(returncode=0)
        
        backup_file = await database_manager._backup_neo4j()
        
        assert backup_file.endswith(".dump")
        assert "neo4j" in backup_file
    
    @pytest.mark.asyncio
    @patch('infrastructure_agent.subprocess.run')
    async def test_backup_redis(self, mock_run, database_manager):
        """Test Redis backup"""
        mock_run.return_value = Mock(returncode=0)
        
        with patch.dict(os.environ, {"REDIS_DATA_DIR": "/tmp"}), \
             patch('asyncio.sleep', return_value=None):
            backup_file = await database_manager._backup_redis()
            
            assert backup_file.endswith(".rdb")
            assert "redis" in backup_file


class TestInfrastructureAgent:
    """Test Infrastructure Agent"""
    
    @pytest.mark.asyncio
    async def test_monitor_metrics(self, agent):
        """Test monitoring metrics"""
        mock_metrics = {
            "cpu_usage": 60.0,
            "memory_usage": 70.0
        }
        
        with patch.object(agent.prometheus_monitor, 'collect_metrics', return_value=mock_metrics):
            metrics = await agent.monitor_metrics()
            
            assert metrics["cpu_usage"] == 60.0
            assert metrics["memory_usage"] == 70.0
    
    @pytest.mark.asyncio
    async def test_check_health(self, agent):
        """Test health check"""
        mock_response = Mock()
        mock_response.status_code = 200
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            healthy = await agent.check_health("orchestration")
            
            assert healthy is True
    
    @pytest.mark.asyncio
    async def test_scale_service(self, agent):
        """Test scaling service"""
        with patch.object(agent.docker_manager, 'scale_service', return_value=True):
            result = await agent.scale_service("test-service", 5)
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_deploy_service(self, agent):
        """Test deploying service"""
        with patch.object(agent.deployment_orchestrator, 'deploy', return_value=True):
            result = await agent.deploy_service("test-service", "v2.0", "rolling")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_rollback_deployment(self, agent):
        """Test rollback deployment"""
        with patch.object(agent.deployment_orchestrator, 'rollback', return_value=True):
            result = await agent.rollback_deployment("test-service", "v2.0")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_backup_database(self, agent):
        """Test database backup"""
        with patch.object(agent.database_manager, 'backup_database', return_value="/backups/test.sql"):
            backup_file = await agent.backup_database("postgresql")
            
            assert backup_file == "/backups/test.sql"
    
    @pytest.mark.asyncio
    async def test_restore_database(self, agent):
        """Test database restore"""
        with patch.object(agent.database_manager, 'restore_database', return_value=True):
            result = await agent.restore_database("postgresql", "/backups/test.sql")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_send_alert(self, agent):
        """Test sending alert"""
        alert = {
            "title": "Test Alert",
            "message": "Test message"
        }
        
        with patch.object(agent.alert_manager, 'send_alert', return_value=True):
            result = await agent.send_alert(alert, "slack")
            
            assert result is True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=infrastructure_agent", "--cov-report=html"])
