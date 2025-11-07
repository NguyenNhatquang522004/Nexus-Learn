# Testing & QA Agent

**Production-ready testing and quality assurance system for Learn Your Way platform**

## Overview

The Testing & QA Agent provides comprehensive testing capabilities including unit tests, integration tests, E2E tests, performance tests, ML model testing, API contract testing, security scanning, and CI/CD integration.

### Key Features

- **Unit Test Execution**: pytest-based unit testing with parallel execution
- **Integration Test Orchestration**: Test agent interactions and API contracts
- **E2E Test Automation**: Browser automation with Playwright
- **Performance/Load Testing**: Load testing with configurable users and duration
- **ML Model Testing**: Accuracy, precision, recall, F1 score validation
- **API Contract Testing**: Endpoint validation and response time checking
- **Security Scanning**: Vulnerability scanning with safety and bandit
- **Code Coverage**: Coverage.py integration with configurable thresholds
- **CI/CD Integration**: Git hooks, scheduled runs, deployment blocking
- **Test Reporting**: HTML, JSON, JUnit XML reports with dashboard
- **Alert System**: Slack and email notifications for test results

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Testing & QA Agent                           │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │     Unit     │  │ Integration  │  │     E2E      │         │
│  │ Test Runner  │  │ Test Runner  │  │ Test Runner  │         │
│  │              │  │              │  │              │         │
│  │ - pytest     │  │ - API tests  │  │ - Playwright │         │
│  │ - parallel   │  │ - DB tests   │  │ - Selenium   │         │
│  │ - coverage   │  │ - contracts  │  │ - screenshots│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Performance  │  │  ML Model    │  │  Security    │         │
│  │ Test Runner  │  │ Test Runner  │  │  Scanner     │         │
│  │              │  │              │  │              │         │
│  │ - Load test  │  │ - Accuracy   │  │ - safety     │         │
│  │ - Stress     │  │ - F1 score   │  │ - bandit     │         │
│  │ - Latency    │  │ - Metrics    │  │ - CVE check  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           TestingQAAgent (Main Orchestrator)            │   │
│  │                                                          │   │
│  │  - Run all test suites                                  │   │
│  │  - Calculate coverage                                   │   │
│  │  - Generate reports                                     │   │
│  │  - Send alerts                                          │   │
│  │  - CI/CD integration                                    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
    ┌────────┐           ┌──────────┐          ┌──────────┐
    │  Test  │           │  Agents  │          │  Slack/  │
    │   DB   │           │  (APIs)  │          │  Email   │
    └────────┘           └──────────┘          └──────────┘
```

## Installation

### Prerequisites

- Python 3.10+
- Node.js 16+ (for Playwright)
- PostgreSQL (for test database)

### Setup

```bash
# Clone repository
cd learn-your-way-platform/agents/testing_qa_agent

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Set up test database
createdb test_db
```

### Configuration

1. Copy `config.yaml` and customize settings:

```yaml
agent:
  name: "Testing & QA Agent"
  version: "1.0.0"
  port: 8018
  host: "0.0.0.0"

test_suites:
  unit:
    enable: true
    coverage_threshold: 80
    parallel: true
  
  integration:
    enable: true
    test_db: "postgresql://localhost:5432/test_db"
  
  e2e:
    enable: true
    headless: true
    browser: "chromium"
  
  performance:
    enable: true
    load_test_users: 100
    duration_seconds: 300
```

2. Set environment variables:

```bash
# Slack webhook (optional)
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Email configuration (optional)
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASSWORD="your-app-password"
export TEST_ALERT_EMAILS="qa@example.com,dev@example.com"

# Test database (optional)
export TEST_DB_PASSWORD="your-test-db-password"
```

## Usage

### Starting the Agent

```bash
# Start with default config
python testing_qa_agent.py

# Start with custom config
CONFIG_PATH=/path/to/config.yaml python testing_qa_agent.py

# Start with uvicorn
uvicorn testing_qa_agent:app --host 0.0.0.0 --port 8018
```

### API Endpoints

#### 1. **POST /run-tests** - Run Test Suites

Run multiple test suites.

**Request:**
```json
{
  "suites": ["unit", "integration", "e2e", "performance"],
  "modules": ["security_compliance_agent"],
  "parallel": true
}
```

**Response:**
```json
{
  "run_id": "abc123",
  "status": "passed",
  "results": {
    "unit": {
      "status": "passed",
      "passed": 42,
      "failed": 0,
      "coverage": 85.5
    },
    "integration": {
      "status": "passed",
      "passed": 10,
      "failed": 0
    }
  },
  "report": "=== TEST REPORT ===..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8018/run-tests \
  -H "Content-Type: application/json" \
  -d '{"suites": ["unit", "integration"], "modules": ["security_compliance_agent"]}'
```

#### 2. **POST /unit-tests** - Run Unit Tests

Run unit tests for specific module.

**Request:**
```json
{
  "module": "security_compliance_agent",
  "coverage": true
}
```

**Response:**
```json
{
  "suite": "unit",
  "status": "passed",
  "passed": 42,
  "failed": 0,
  "skipped": 0,
  "duration_seconds": 5.2,
  "coverage": 85.5
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8018/unit-tests \
  -H "Content-Type: application/json" \
  -d '{"module": "security_compliance_agent", "coverage": true}'
```

#### 3. **POST /integration-tests** - Run Integration Tests

Run integration tests across agents.

**Request:**
```json
{
  "agents": ["orchestration", "knowledge_graph", "security_compliance"],
  "scenarios": ["api_health_check", "database_connectivity"]
}
```

**Response:**
```json
{
  "suite": "integration",
  "status": "passed",
  "passed": 10,
  "failed": 0,
  "skipped": 0,
  "duration_seconds": 15.3,
  "agents": ["orchestration", "knowledge_graph", "security_compliance"]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8018/integration-tests \
  -H "Content-Type: application/json" \
  -d '{"agents": ["orchestration", "knowledge_graph"]}'
```

#### 4. **POST /e2e-tests** - Run E2E Tests

Run end-to-end tests with browser automation.

**Request:**
```json
{
  "scenarios": ["user_registration", "course_enrollment", "ai_tutor_interaction"],
  "headless": true
}
```

**Response:**
```json
{
  "suite": "e2e",
  "status": "passed",
  "passed": 3,
  "failed": 0,
  "skipped": 0,
  "duration_seconds": 45.8,
  "scenarios": ["user_registration", "course_enrollment", "ai_tutor_interaction"]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8018/e2e-tests \
  -H "Content-Type: application/json" \
  -d '{"scenarios": ["user_registration"], "headless": true}'
```

#### 5. **POST /performance-tests** - Run Performance Tests

Run load/stress tests.

**Request:**
```json
{
  "target_url": "http://localhost:8000/health",
  "users": 100,
  "duration_seconds": 300,
  "spawn_rate": 10
}
```

**Response:**
```json
{
  "suite": "performance",
  "status": "passed",
  "duration_seconds": 300.5,
  "target_url": "http://localhost:8000/health",
  "users": 100,
  "details": {
    "total_requests": 15000,
    "failed_requests": 0,
    "requests_per_second": 50,
    "avg_response_time_ms": 45,
    "p95_response_time_ms": 80,
    "p99_response_time_ms": 120
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8018/performance-tests \
  -H "Content-Type: application/json" \
  -d '{"target_url": "http://localhost:8000/health", "users": 50, "duration_seconds": 60}'
```

#### 6. **POST /ml-model-tests** - Test ML Models

Test machine learning model accuracy.

**Request:**
```json
{
  "model_name": "recommendation_model",
  "dataset": "/data/validation_set",
  "metrics": ["accuracy", "precision", "recall", "f1_score"]
}
```

**Response:**
```json
{
  "suite": "ml_model",
  "status": "passed",
  "duration_seconds": 12.3,
  "model": "recommendation_model",
  "dataset": "/data/validation_set",
  "details": {
    "metrics": {
      "accuracy": 0.92,
      "precision": 0.89,
      "recall": 0.91,
      "f1_score": 0.90
    },
    "thresholds": {
      "accuracy": 0.85,
      "f1_score": 0.80
    },
    "samples_tested": 1000
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8018/ml-model-tests \
  -H "Content-Type: application/json" \
  -d '{"model_name": "recommendation_model", "dataset": "/data/test"}'
```

#### 7. **GET /test-results/{run_id}** - Get Test Results

Retrieve test results by run ID.

**Response:**
```json
{
  "run_id": "abc123",
  "timestamp": "2024-01-01T12:00:00",
  "overall_status": "passed",
  "unit": {
    "status": "passed",
    "passed": 42,
    "failed": 0,
    "coverage": 85.5
  },
  "integration": {
    "status": "passed",
    "passed": 10,
    "failed": 0
  }
}
```

**cURL Example:**
```bash
curl http://localhost:8018/test-results/abc123
```

#### 8. **GET /coverage** - Get Code Coverage

Get code coverage from latest test run.

**Response:**
```json
{
  "coverage": 85.5,
  "run_id": "abc123",
  "timestamp": "2024-01-01T12:00:00"
}
```

**cURL Example:**
```bash
curl http://localhost:8018/coverage
```

## Core Functions

### 1. `run_unit_tests(module: str) -> dict`

Run unit tests for module.

```python
result = agent.run_unit_tests("security_compliance_agent")
print(f"Status: {result['status']}")
print(f"Coverage: {result['coverage']}%")
```

### 2. `run_integration_tests(agents: list) -> dict`

Run integration tests across agents.

```python
result = await agent.run_integration_tests(["orchestration", "knowledge_graph"])
print(f"Passed: {result['passed']}, Failed: {result['failed']}")
```

### 3. `run_e2e_tests(scenarios: list) -> dict`

Run E2E tests.

```python
result = await agent.run_e2e_tests(["user_registration", "course_enrollment"])
print(f"Status: {result['status']}")
```

### 4. `run_performance_tests(load_config: dict) -> dict`

Run performance tests.

```python
result = await agent.run_performance_tests({
    "target_url": "http://localhost:8000/health",
    "users": 100,
    "duration_seconds": 300
})
print(f"Avg latency: {result['details']['avg_response_time_ms']}ms")
```

### 5. `test_ml_model(model_name: str, dataset: str) -> dict`

Test ML model.

```python
result = await agent.test_ml_model("classification_model", "/data/test")
print(f"Accuracy: {result['details']['metrics']['accuracy']}")
```

### 6. `run_api_contract_tests(agent: str) -> dict`

Run API contract tests.

```python
result = await agent.run_api_contract_tests("orchestration")
print(f"Endpoints tested: {result['passed'] + result['failed']}")
```

### 7. `calculate_code_coverage(results: dict) -> float`

Calculate code coverage.

```python
coverage = agent.calculate_code_coverage(test_results)
print(f"Overall coverage: {coverage}%")
```

### 8. `generate_test_report(results: dict) -> str`

Generate test report.

```python
report = agent.generate_test_report(test_results)
print(report)
```

### 9. `send_alert(test_result: dict, channel: str) -> bool`

Send alert.

```python
await agent.send_alert(test_results, "slack")
await agent.send_alert(test_results, "email")
```

## Test Suites

### Unit Tests

Run with pytest:

```bash
# Run all unit tests
pytest tests/

# Run with coverage
pytest tests/ --cov=testing_qa_agent --cov-report=html

# Run in parallel
pytest tests/ -n auto

# Run specific test
pytest tests/test_testing_qa_agent.py::TestUnitTestRunner::test_run_unit_tests_success
```

### Integration Tests

Test agent interactions:

```python
# Test orchestration agent
result = await agent.run_integration_tests(["orchestration"])

# Test multiple agents
result = await agent.run_integration_tests([
    "orchestration",
    "knowledge_graph",
    "security_compliance"
])
```

### E2E Tests

Browser automation tests:

```python
# Run E2E scenarios
result = await agent.run_e2e_tests([
    "user_registration",
    "course_enrollment",
    "ai_tutor_interaction"
])
```

### Performance Tests

Load and stress testing:

```python
# Light load test
result = await agent.run_performance_tests({
    "target_url": "http://localhost:8000/health",
    "users": 10,
    "duration_seconds": 60
})

# Heavy load test
result = await agent.run_performance_tests({
    "target_url": "http://localhost:8000/api/courses",
    "users": 1000,
    "duration_seconds": 600
})
```

## ML Model Testing

### Metrics

- **Accuracy**: Overall correctness
- **Precision**: Positive prediction accuracy
- **Recall**: True positive rate
- **F1 Score**: Harmonic mean of precision and recall

### Example

```python
result = await agent.test_ml_model(
    model_name="recommendation_model",
    dataset="/data/validation_set"
)

metrics = result["details"]["metrics"]
print(f"Accuracy: {metrics['accuracy']:.2%}")
print(f"F1 Score: {metrics['f1_score']:.2%}")

if result["status"] == "passed":
    print("Model meets quality thresholds")
else:
    print("Model failed quality checks")
```

## CI/CD Integration

### Git Hooks

Configure git hooks to run tests automatically:

**pre-push hook:**
```bash
#!/bin/bash
# .git/hooks/pre-push

echo "Running tests before push..."

# Run unit tests
pytest tests/ --cov=. --cov-report=term

if [ $? -ne 0 ]; then
    echo "Tests failed. Push aborted."
    exit 1
fi

echo "All tests passed. Proceeding with push."
```

### GitHub Actions

**.github/workflows/test.yml:**
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        playwright install chromium
    
    - name: Run tests
      run: |
        pytest tests/ --cov=. --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Jenkins Pipeline

**Jenkinsfile:**
```groovy
pipeline {
    agent any
    
    stages {
        stage('Install') {
            steps {
                sh 'pip install -r requirements.txt'
                sh 'playwright install chromium'
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh 'pytest tests/ --cov=. --cov-report=xml'
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'curl -X POST http://localhost:8018/integration-tests -d \'{"agents": ["orchestration"]}\''
            }
        }
        
        stage('Performance Tests') {
            when {
                branch 'main'
            }
            steps {
                sh 'curl -X POST http://localhost:8018/performance-tests -d \'{"target_url": "http://localhost:8000", "users": 100}\''
            }
        }
    }
    
    post {
        always {
            junit 'coverage.xml'
            publishHTML([reportDir: 'htmlcov', reportFiles: 'index.html', reportName: 'Coverage Report'])
        }
    }
}
```

## Reporting

### HTML Reports

Generate HTML reports:

```bash
pytest tests/ --html=report.html --self-contained-html
```

### Coverage Reports

```bash
# Terminal report
pytest tests/ --cov=. --cov-report=term-missing

# HTML report
pytest tests/ --cov=. --cov-report=html

# XML report (for CI/CD)
pytest tests/ --cov=. --cov-report=xml
```

### Dashboard

Access test dashboard at configured URL:

```
http://localhost:3000/qa-dashboard
```

## Alert System

### Slack Notifications

Configure Slack webhook:

```bash
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Notification Example:**
```
🧪 Test Run PASSED
Run ID: abc123
Status: passed
Duration: 120s
Coverage: 85.5%
```

### Email Notifications

Configure SMTP:

```bash
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASSWORD="your-app-password"
export TEST_ALERT_EMAILS="qa@example.com,dev@example.com"
```

## Performance Benchmarks

### Target Metrics

- **Orchestration latency**: < 50ms
- **Graph query latency**: < 100ms
- **Model inference**: < 500ms
- **Cache hit latency**: < 5ms
- **Database query**: < 20ms
- **API endpoint**: < 100ms

### Monitoring

```python
result = await agent.run_performance_tests({
    "target_url": "http://localhost:8000/api/courses",
    "users": 100,
    "duration_seconds": 300
})

# Check if within benchmarks
avg_latency = result["details"]["avg_response_time_ms"]
benchmark = 100

if avg_latency <= benchmark:
    print(f"✓ Within benchmark: {avg_latency}ms <= {benchmark}ms")
else:
    print(f"✗ Exceeds benchmark: {avg_latency}ms > {benchmark}ms")
```

## Security Testing

### Vulnerability Scanning

```bash
# Check dependencies for known vulnerabilities
safety check

# Scan code for security issues
bandit -r . -f json -o security_report.json
```

### Integration

Security tests run automatically:

```python
# Configure in config.yaml
security_testing:
  vulnerability_scan: true
  dependency_check: true
  tools:
    - name: "safety"
      enable: true
    - name: "bandit"
      enable: true
```

## Testing

### Run Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=testing_qa_agent --cov-report=html

# Run specific test class
pytest tests/test_testing_qa_agent.py::TestUnitTestRunner -v
```

### Test Coverage

Target: 85%+ coverage

**Test Categories:**
- UnitTestRunner (3 tests)
- IntegrationTestRunner (3 tests)
- E2ETestRunner (2 tests)
- PerformanceTestRunner (2 tests)
- MLModelTestRunner (2 tests)
- APIContractTestRunner (3 tests)
- CoverageCalculator (2 tests)
- ReportGenerator (1 test)
- AlertSystem (2 tests)
- TestingQAAgent (9 tests)

## Production Deployment

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium --with-deps

COPY testing_qa_agent.py .
COPY config.yaml .

EXPOSE 8018

CMD ["uvicorn", "testing_qa_agent:app", "--host", "0.0.0.0", "--port", "8018"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  testing-qa-agent:
    build: .
    ports:
      - "8018:8018"
    environment:
      - SLACK_WEBHOOK=${SLACK_WEBHOOK}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    volumes:
      - ./test_reports:/app/test_reports
    depends_on:
      - test_db
  
  test_db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=test_db
      - POSTGRES_USER=test_user
      - POSTGRES_PASSWORD=${TEST_DB_PASSWORD}
    ports:
      - "5433:5432"
```

## Troubleshooting

### Common Issues

**1. Tests Not Running:**
```
Error: No tests collected
```

**Solution:**
```bash
# Ensure test files start with test_
# Ensure test functions start with test_
# Check pytest is installed
pip install pytest
```

**2. Coverage Too Low:**
```
Error: Coverage 65% is below threshold 80%
```

**Solution:**
```bash
# Add more tests
# Check uncovered lines
pytest --cov=. --cov-report=term-missing
```

**3. Playwright Browser Not Found:**
```
Error: Browser not installed
```

**Solution:**
```bash
playwright install chromium
```

**4. Performance Test Failing:**
```
Error: Average latency 150ms exceeds target 100ms
```

**Solution:**
- Optimize target endpoint
- Increase target latency threshold
- Check server resources

## Best Practices

### Test Organization

```
tests/
├── unit/
│   ├── test_unit_runner.py
│   ├── test_integration_runner.py
│   └── test_performance_runner.py
├── integration/
│   ├── test_orchestration.py
│   └── test_knowledge_graph.py
├── e2e/
│   ├── test_user_flows.py
│   └── test_admin_flows.py
└── fixtures/
    ├── test_data.json
    └── mock_responses.json
```

### Test Naming

```python
# Good
def test_user_login_with_valid_credentials():
    pass

# Bad
def test1():
    pass
```

### Assertions

```python
# Good - specific assertions
assert result["status"] == "passed"
assert result["coverage"] >= 80.0

# Bad - vague assertions
assert result
assert True
```

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/learn-your-way/platform
- Documentation: https://docs.learnyourway.com
- Email: qa@learnyourway.com

## Version History

### 1.0.0 (Current)
- Initial release
- Unit test execution with pytest
- Integration test orchestration
- E2E test automation with Playwright
- Performance/load testing
- ML model accuracy testing
- API contract testing
- Security vulnerability scanning
- Code coverage reporting (80%+ threshold)
- CI/CD integration
- Test result dashboard
- Slack and email alerts
- 9 core functions
- 8 API endpoints
- Comprehensive testing (85%+ coverage)
