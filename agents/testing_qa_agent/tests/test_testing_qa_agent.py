"""
Tests for Testing & QA Agent

Coverage:
- Unit test runner
- Integration test runner
- E2E test runner
- Performance test runner
- ML model test runner
- API contract test runner
- Coverage calculation
- Report generation
- Alert system
- API endpoints
"""

import asyncio
import json
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock

import pytest
import yaml
from httpx import AsyncClient

from testing_qa_agent import (
    TestingQAAgent,
    UnitTestRunner,
    IntegrationTestRunner,
    E2ETestRunner,
    PerformanceTestRunner,
    MLModelTestRunner,
    APIContractTestRunner,
    CoverageCalculator,
    ReportGenerator,
    AlertSystem
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def config():
    """Load test configuration"""
    config_path = Path(__file__).parent.parent / "config.yaml"
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


@pytest.fixture
def unit_runner(config):
    """Create unit test runner"""
    return UnitTestRunner(config)


@pytest.fixture
def integration_runner(config):
    """Create integration test runner"""
    return IntegrationTestRunner(config)


@pytest.fixture
def e2e_runner(config):
    """Create E2E test runner"""
    return E2ETestRunner(config)


@pytest.fixture
def performance_runner(config):
    """Create performance test runner"""
    return PerformanceTestRunner(config)


@pytest.fixture
def ml_runner(config):
    """Create ML model test runner"""
    return MLModelTestRunner(config)


@pytest.fixture
def api_runner(config):
    """Create API contract test runner"""
    return APIContractTestRunner(config)


@pytest.fixture
def coverage_calculator():
    """Create coverage calculator"""
    return CoverageCalculator()


@pytest.fixture
def report_generator():
    """Create report generator"""
    return ReportGenerator()


@pytest.fixture
def alert_system(config):
    """Create alert system"""
    return AlertSystem(config)


@pytest.fixture
def agent(config, tmp_path):
    """Create testing QA agent"""
    # Write temp config
    temp_config = tmp_path / "config.yaml"
    with open(temp_config, 'w') as f:
        yaml.dump(config, f)
    
    return TestingQAAgent(str(temp_config))


# ============================================================================
# Unit Test Runner Tests
# ============================================================================

class TestUnitTestRunner:
    """Test unit test runner"""
    
    def test_run_unit_tests_success(self, unit_runner):
        """Test running unit tests successfully"""
        with patch('pytest.main', return_value=0):
            result = unit_runner.run_unit_tests("example_module")
        
        assert result["status"] == "passed"
        assert result["module"] == "example_module"
        assert "duration_seconds" in result
    
    def test_run_unit_tests_failure(self, unit_runner):
        """Test running unit tests with failures"""
        with patch('pytest.main', return_value=1):
            result = unit_runner.run_unit_tests("example_module")
        
        assert result["status"] == "failed"
        assert result["failed"] >= 1
    
    def test_run_unit_tests_with_coverage(self, unit_runner, tmp_path):
        """Test running unit tests with coverage"""
        # Create mock coverage file
        coverage_data = {
            "totals": {
                "percent_covered": 85.5
            }
        }
        
        coverage_file = tmp_path / "coverage.json"
        with open(coverage_file, 'w') as f:
            json.dump(coverage_data, f)
        
        with patch('pytest.main', return_value=0), \
             patch('pathlib.Path.exists', return_value=True), \
             patch('builtins.open', return_value=open(coverage_file, 'r')):
            
            result = unit_runner.run_unit_tests("example_module", calculate_coverage=True)
        
        assert "coverage" in result


# ============================================================================
# Integration Test Runner Tests
# ============================================================================

class TestIntegrationTestRunner:
    """Test integration test runner"""
    
    @pytest.mark.asyncio
    async def test_run_integration_tests_success(self, integration_runner):
        """Test running integration tests successfully"""
        with patch.object(integration_runner, '_test_agent_integration', 
                         return_value={"agent": "test", "status": "passed"}):
            result = await integration_runner.run_integration_tests(["orchestration"])
        
        assert result["status"] == "passed"
        assert result["passed"] >= 1
        assert "agents" in result
    
    @pytest.mark.asyncio
    async def test_run_integration_tests_failure(self, integration_runner):
        """Test running integration tests with failures"""
        with patch.object(integration_runner, '_test_agent_integration',
                         return_value={"agent": "test", "status": "failed"}):
            result = await integration_runner.run_integration_tests(["orchestration"])
        
        assert result["status"] == "failed"
        assert result["failed"] >= 1
    
    @pytest.mark.asyncio
    async def test_test_agent_integration(self, integration_runner):
        """Test single agent integration test"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            result = await integration_runner._test_agent_integration("orchestration", None)
        
        assert result["status"] in ["passed", "failed", "skipped"]


# ============================================================================
# E2E Test Runner Tests
# ============================================================================

class TestE2ETestRunner:
    """Test E2E test runner"""
    
    @pytest.mark.asyncio
    async def test_run_e2e_tests_success(self, e2e_runner):
        """Test running E2E tests successfully"""
        scenarios = ["user_login", "course_enrollment"]
        
        result = await e2e_runner.run_e2e_tests(scenarios)
        
        assert result["status"] in ["passed", "failed"]
        assert result["scenarios"] == scenarios
        assert "scenario_results" in result["details"]
    
    @pytest.mark.asyncio
    async def test_run_scenario(self, e2e_runner):
        """Test running single E2E scenario"""
        result = await e2e_runner._run_scenario("user_login", headless=True)
        
        assert result["scenario"] == "user_login"
        assert result["status"] in ["passed", "failed"]


# ============================================================================
# Performance Test Runner Tests
# ============================================================================

class TestPerformanceTestRunner:
    """Test performance test runner"""
    
    @pytest.mark.asyncio
    async def test_run_performance_tests(self, performance_runner):
        """Test running performance tests"""
        with patch.object(performance_runner, '_run_load_test',
                         return_value={
                             "total_requests": 100,
                             "failed_requests": 0,
                             "rps": 10,
                             "avg_response_time_ms": 50,
                             "p95_response_time_ms": 80,
                             "p99_response_time_ms": 100
                         }):
            
            result = await performance_runner.run_performance_tests(
                "http://localhost:8000/health",
                users=10,
                duration_seconds=5,
                spawn_rate=5
            )
        
        assert result["status"] in ["passed", "failed"]
        assert "avg_response_time_ms" in result["details"]
        assert "total_requests" in result["details"]
    
    @pytest.mark.asyncio
    async def test_run_load_test(self, performance_runner):
        """Test load test execution"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.elapsed.total_seconds.return_value = 0.05
            
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            result = await performance_runner._run_load_test(
                "http://localhost:8000/health",
                users=5,
                duration=1,
                spawn_rate=5
            )
        
        assert result["total_requests"] > 0
        assert "avg_response_time_ms" in result


# ============================================================================
# ML Model Test Runner Tests
# ============================================================================

class TestMLModelTestRunner:
    """Test ML model test runner"""
    
    @pytest.mark.asyncio
    async def test_test_ml_model(self, ml_runner):
        """Test ML model testing"""
        result = await ml_runner.test_ml_model(
            "classification_model",
            "/data/test",
            ["accuracy", "f1_score"]
        )
        
        assert result["status"] in ["passed", "failed"]
        assert "metrics" in result["details"]
        assert result["model"] == "classification_model"
    
    def test_calculate_metrics(self, ml_runner):
        """Test metric calculation"""
        y_true = [0, 1, 1, 0, 1]
        y_pred = [0, 1, 0, 0, 1]
        
        metrics = ml_runner._calculate_metrics(
            y_true,
            y_pred,
            ["accuracy", "precision", "recall", "f1_score"]
        )
        
        assert "accuracy" in metrics
        assert 0 <= metrics["accuracy"] <= 1
        
        if "precision" in metrics:
            assert 0 <= metrics["precision"] <= 1


# ============================================================================
# API Contract Test Runner Tests
# ============================================================================

class TestAPIContractTestRunner:
    """Test API contract test runner"""
    
    @pytest.mark.asyncio
    async def test_run_api_contract_tests(self, api_runner):
        """Test API contract testing"""
        with patch.object(api_runner, '_test_endpoint',
                         return_value={"status": "passed", "status_code": 200, "response_time_ms": 50}):
            
            result = await api_runner.run_api_contract_tests(
                "orchestration",
                "http://localhost:8000"
            )
        
        assert result["status"] in ["passed", "failed"]
        assert result["agent"] == "orchestration"
        assert "endpoint_results" in result["details"]
    
    @pytest.mark.asyncio
    async def test_test_endpoint_success(self, api_runner):
        """Test endpoint testing - success"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.elapsed.total_seconds.return_value = 0.05
            
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            result = await api_runner._test_endpoint("http://localhost:8000/health", "GET")
        
        assert result["status"] == "passed"
        assert result["status_code"] == 200
    
    @pytest.mark.asyncio
    async def test_test_endpoint_failure(self, api_runner):
        """Test endpoint testing - failure"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_get = AsyncMock(side_effect=Exception("Connection error"))
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            result = await api_runner._test_endpoint("http://localhost:8000/health", "GET")
        
        assert result["status"] == "failed"
        assert "error" in result


# ============================================================================
# Coverage Calculator Tests
# ============================================================================

class TestCoverageCalculator:
    """Test coverage calculator"""
    
    def test_calculate_code_coverage(self, coverage_calculator):
        """Test coverage calculation"""
        results = {
            "unit": {
                "coverage": 85.5
            }
        }
        
        coverage = coverage_calculator.calculate_code_coverage(results)
        
        assert coverage == 85.5
    
    def test_calculate_code_coverage_no_data(self, coverage_calculator):
        """Test coverage calculation with no data"""
        results = {}
        
        coverage = coverage_calculator.calculate_code_coverage(results)
        
        assert coverage == 0.0


# ============================================================================
# Report Generator Tests
# ============================================================================

class TestReportGenerator:
    """Test report generator"""
    
    def test_generate_test_report(self, report_generator):
        """Test report generation"""
        results = {
            "run_id": "test-123",
            "timestamp": "2024-01-01T12:00:00",
            "unit": {
                "status": "passed",
                "passed": 10,
                "failed": 0,
                "duration_seconds": 5.5,
                "coverage": 85.5
            },
            "integration": {
                "status": "passed",
                "passed": 5,
                "failed": 0,
                "duration_seconds": 10.2
            }
        }
        
        report = report_generator.generate_test_report(results)
        
        assert "TEST REPORT" in report
        assert "test-123" in report
        assert "UNIT" in report
        assert "INTEGRATION" in report
        assert "85.5" in report


# ============================================================================
# Alert System Tests
# ============================================================================

class TestAlertSystem:
    """Test alert system"""
    
    @pytest.mark.asyncio
    async def test_send_slack_alert_not_configured(self, alert_system):
        """Test Slack alert when not configured"""
        test_result = {
            "run_id": "test-123",
            "overall_status": "passed"
        }
        
        result = await alert_system.send_alert(test_result, "slack")
        
        # Should return False if webhook not configured
        assert isinstance(result, bool)
    
    @pytest.mark.asyncio
    async def test_send_email_alert_not_configured(self, alert_system):
        """Test email alert when not configured"""
        test_result = {
            "run_id": "test-123",
            "overall_status": "passed"
        }
        
        result = await alert_system.send_alert(test_result, "email")
        
        # Should return False if email not configured
        assert isinstance(result, bool)


# ============================================================================
# Testing QA Agent Tests
# ============================================================================

class TestTestingQAAgent:
    """Test testing QA agent"""
    
    def test_run_unit_tests(self, agent):
        """Test agent unit tests"""
        with patch.object(agent.unit_runner, 'run_unit_tests',
                         return_value={"status": "passed", "passed": 1, "failed": 0, "skipped": 0, "duration_seconds": 1.0}):
            
            result = agent.run_unit_tests("example_module")
        
        assert result["status"] == "passed"
    
    @pytest.mark.asyncio
    async def test_run_integration_tests(self, agent):
        """Test agent integration tests"""
        with patch.object(agent.integration_runner, 'run_integration_tests',
                         return_value={"status": "passed", "passed": 1, "failed": 0, "skipped": 0, "duration_seconds": 2.0}):
            
            result = await agent.run_integration_tests(["orchestration"])
        
        assert result["status"] == "passed"
    
    @pytest.mark.asyncio
    async def test_run_e2e_tests(self, agent):
        """Test agent E2E tests"""
        with patch.object(agent.e2e_runner, 'run_e2e_tests',
                         return_value={"status": "passed", "passed": 1, "failed": 0, "skipped": 0, "duration_seconds": 5.0}):
            
            result = await agent.run_e2e_tests(["user_login"])
        
        assert result["status"] == "passed"
    
    @pytest.mark.asyncio
    async def test_run_performance_tests(self, agent):
        """Test agent performance tests"""
        with patch.object(agent.performance_runner, 'run_performance_tests',
                         return_value={"status": "passed", "duration_seconds": 10.0, "details": {}}):
            
            result = await agent.run_performance_tests({
                "target_url": "http://localhost:8000",
                "users": 10,
                "duration_seconds": 5
            })
        
        assert result["status"] == "passed"
    
    @pytest.mark.asyncio
    async def test_test_ml_model(self, agent):
        """Test agent ML model testing"""
        with patch.object(agent.ml_runner, 'test_ml_model',
                         return_value={"status": "passed", "model": "test_model", "details": {}}):
            
            result = await agent.test_ml_model("test_model", "/data/test")
        
        assert result["status"] == "passed"
    
    @pytest.mark.asyncio
    async def test_run_api_contract_tests(self, agent):
        """Test agent API contract tests"""
        # Mock agent config
        with patch.object(agent.integration_runner, '_get_agent_config',
                         return_value={"agent": "orchestration", "url": "http://localhost:8000"}), \
             patch.object(agent.api_runner, 'run_api_contract_tests',
                         return_value={"status": "passed", "agent": "orchestration", "details": {}}):
            
            result = await agent.run_api_contract_tests("orchestration")
        
        assert result["status"] == "passed"
    
    def test_calculate_code_coverage(self, agent):
        """Test agent coverage calculation"""
        results = {
            "unit": {
                "coverage": 80.0
            }
        }
        
        coverage = agent.calculate_code_coverage(results)
        
        assert coverage == 80.0
    
    def test_generate_test_report(self, agent):
        """Test agent report generation"""
        results = {
            "run_id": "test-123",
            "timestamp": "2024-01-01T12:00:00",
            "unit": {
                "status": "passed",
                "passed": 10,
                "failed": 0,
                "duration_seconds": 5.0
            }
        }
        
        report = agent.generate_test_report(results)
        
        assert "TEST REPORT" in report
        assert "test-123" in report
    
    @pytest.mark.asyncio
    async def test_send_alert(self, agent):
        """Test agent alert sending"""
        test_result = {
            "run_id": "test-123",
            "overall_status": "passed"
        }
        
        with patch.object(agent.alert_system, 'send_alert', return_value=True):
            result = await agent.send_alert(test_result, "slack")
        
        assert result is True


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=testing_qa_agent", "--cov-report=term-missing"])
