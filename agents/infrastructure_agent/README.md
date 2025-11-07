# Infrastructure Agent

**Production-ready infrastructure management system for Learn Your Way platform**

## Overview

The Infrastructure Agent provides comprehensive infrastructure management including Docker/Kubernetes orchestration, Prometheus monitoring, auto-scaling, multi-strategy deployments, database backup/restore, and multi-channel alerting.

### Key Features

- **Docker Container Management**: Container lifecycle, scaling, stats monitoring
- **Kubernetes Orchestration**: Optional K8s deployment and scaling support
- **Prometheus Monitoring**: Real-time metrics collection and analysis
- **Auto-scaling**: CPU/memory-based horizontal scaling with cooldown
- **Multi-strategy Deployments**: Rolling, blue/green, canary deployments
- **Database Management**: PostgreSQL, Neo4j, Redis backup/restore
- **Health Monitoring**: Automated endpoint health checks
- **Multi-channel Alerting**: Slack, email, PagerDuty notifications
- **Log Aggregation**: Container log collection and analysis
- **CI/CD Integration**: Webhook support for deployment pipelines

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Infrastructure Agent                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Docker    │  │  Kubernetes  │  │  Prometheus  │           │
│  │   Manager    │  │   Manager    │  │   Monitor    │           │
│  │              │  │              │  │              │           │
│  │ - Containers │  │ - Deployments│  │ - Metrics    │           │
│  │ - Scaling    │  │ - Scaling    │  │ - Queries    │           │
│  │ - Stats      │  │ - Status     │  │ - Collection │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Alert     │  │    Auto      │  │  Deployment  │           │
│  │   Manager    │  │   Scaler     │  │ Orchestrator │           │
│  │              │  │              │  │              │           │
│  │ - Slack      │  │ - Scale up   │  │ - Rolling    │           │
│  │ - Email      │  │ - Scale down │  │ - Blue/Green │           │
│  │ - PagerDuty  │  │ - Cooldown   │  │ - Canary     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐      │
│  │           Database Manager                              │      │
│  │                                                          │      │
│  │  - PostgreSQL backup/restore                            │      │
│  │  - Neo4j backup/restore                                 │      │
│  │  - Redis backup/restore                                 │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
    ┌────────┐           ┌──────────┐          ┌──────────┐
    │ Docker │           │   K8s    │          │  Slack/  │
    │ Socket │           │ Cluster  │          │  Email   │
    └────────┘           └──────────┘          └──────────┘
```

## Installation

### Prerequisites

- Python 3.10+
- Docker Engine
- Docker Compose (optional)
- Kubernetes cluster (optional)
- Prometheus server (optional)
- PostgreSQL, Neo4j, Redis (for backups)

### Setup

```bash
# Clone repository
cd learn-your-way-platform/agents/infrastructure_agent

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Docker socket access (Linux)
sudo usermod -aG docker $USER
```

### Configuration

1. Copy `config.yaml` and customize:

```yaml
agent:
  name: "Infrastructure Agent"
  port: 8019
  host: "0.0.0.0"

docker:
  socket: "/var/run/docker.sock"
  compose_file: "./docker-compose.yml"
  registry: "docker.io/learnyourway"

monitoring:
  prometheus:
    url: "http://prometheus:9090"
  
  metrics:
    - cpu_usage
    - memory_usage
    - disk_usage

auto_scaling:
  enable: true
  min_replicas: 2
  max_replicas: 10
```

2. Set environment variables:

```bash
# Slack webhook
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Email configuration
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASSWORD="your-app-password"

# PagerDuty
export PAGERDUTY_KEY="your-pagerduty-integration-key"

# Database credentials
export POSTGRES_HOST="localhost"
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD="your-password"
export POSTGRES_DB="learnyourway"
```

## Usage

### Starting the Agent

```bash
# Start with default config
python infrastructure_agent.py

# Start with custom config
CONFIG_PATH=/path/to/config.yaml python infrastructure_agent.py

# Start with uvicorn
uvicorn infrastructure_agent:app --host 0.0.0.0 --port 8019
```

### API Endpoints

#### 1. **GET /metrics** - Get System Metrics

Collect current system metrics.

**Response:**
```json
{
  "timestamp": "2024-01-01T12:00:00",
  "cpu_usage": 65.5,
  "memory_usage": 72.3,
  "disk_usage": 45.8,
  "network_io": {
    "rx_bytes": 1000000,
    "tx_bytes": 500000
  },
  "request_rate": 150.5,
  "error_rate": 0.02,
  "latency_p99": 250.0
}
```

**cURL Example:**
```bash
curl http://localhost:8019/metrics
```

#### 2. **GET /health/{service}** - Check Service Health

Check health of specific service.

**Response:**
```json
{
  "service": "orchestration",
  "healthy": true,
  "status_code": 200,
  "response_time_ms": 45.2,
  "message": "Service is healthy"
}
```

**cURL Example:**
```bash
curl http://localhost:8019/health/orchestration
```

#### 3. **POST /scale** - Scale Service

Scale service to specified replicas.

**Request:**
```json
{
  "service": "orchestration",
  "replicas": 5
}
```

**Response:**
```json
{
  "success": true,
  "service": "orchestration",
  "replicas": 5,
  "message": "Service scaled to 5 replicas"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8019/scale \
  -H "Content-Type: application/json" \
  -d '{"service": "orchestration", "replicas": 5}'
```

#### 4. **POST /deploy** - Deploy Service

Deploy service with specified strategy.

**Request:**
```json
{
  "service": "orchestration",
  "version": "v2.0.0",
  "strategy": "blue_green",
  "image": "learnyourway/orchestration"
}
```

**Response:**
```json
{
  "success": true,
  "service": "orchestration",
  "version": "v2.0.0",
  "strategy": "blue_green",
  "message": "Deployment started for orchestration:v2.0.0"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8019/deploy \
  -H "Content-Type: application/json" \
  -d '{"service": "orchestration", "version": "v2.0.0", "strategy": "blue_green"}'
```

#### 5. **POST /rollback** - Rollback Deployment

Rollback to previous version.

**Request:**
```json
{
  "service": "orchestration",
  "version": "v2.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "service": "orchestration",
  "version": "v1.9.0",
  "message": "Rollback completed for orchestration"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8019/rollback \
  -H "Content-Type: application/json" \
  -d '{"service": "orchestration", "version": "v2.0.0"}'
```

#### 6. **POST /backup** - Backup Database

Create database backup.

**Request:**
```json
{
  "database": "postgresql",
  "output_path": "/backups/postgresql_backup.sql"
}
```

**Response:**
```json
{
  "success": true,
  "database": "postgresql",
  "backup_file": "/backups/postgresql_20240101_120000.sql",
  "message": "Backup created: /backups/postgresql_20240101_120000.sql"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8019/backup \
  -H "Content-Type: application/json" \
  -d '{"database": "postgresql"}'
```

#### 7. **POST /restore** - Restore Database

Restore database from backup.

**Request:**
```json
{
  "database": "postgresql",
  "backup_file": "/backups/postgresql_20240101_120000.sql"
}
```

**Response:**
```json
{
  "success": true,
  "database": "postgresql",
  "backup_file": "/backups/postgresql_20240101_120000.sql",
  "message": "Database restored from /backups/postgresql_20240101_120000.sql"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8019/restore \
  -H "Content-Type: application/json" \
  -d '{"database": "postgresql", "backup_file": "/backups/postgresql_20240101_120000.sql"}'
```

#### 8. **GET /logs/{service}** - Get Service Logs

Retrieve container logs.

**Response:**
```json
{
  "service": "orchestration",
  "lines": [
    "2024-01-01T12:00:00Z INFO Starting service",
    "2024-01-01T12:00:01Z INFO Service ready"
  ],
  "timestamp": "2024-01-01T12:00:00"
}
```

**cURL Example:**
```bash
curl http://localhost:8019/logs/orchestration?lines=100
```

## Core Functions

### 1. `monitor_metrics() -> dict`

Collect system metrics from Prometheus and system.

```python
metrics = await agent.monitor_metrics()
print(f"CPU: {metrics['cpu_usage']}%")
print(f"Memory: {metrics['memory_usage']}%")
```

### 2. `check_health(service: str) -> bool`

Check service health.

```python
healthy = await agent.check_health("orchestration")
if healthy:
    print("Service is running")
```

### 3. `scale_service(service: str, replicas: int) -> bool`

Scale service.

```python
success = await agent.scale_service("orchestration", 5)
```

### 4. `deploy_service(service: str, version: str, strategy: str, image: str) -> bool`

Deploy service.

```python
success = await agent.deploy_service(
    "orchestration",
    "v2.0.0",
    "blue_green",
    "learnyourway/orchestration"
)
```

### 5. `rollback_deployment(service: str, version: str) -> bool`

Rollback deployment.

```python
success = await agent.rollback_deployment("orchestration", "v2.0.0")
```

### 6. `backup_database(database: str, output_path: str) -> str`

Backup database.

```python
backup_file = await agent.backup_database("postgresql")
print(f"Backup created: {backup_file}")
```

### 7. `restore_database(database: str, backup_file: str) -> bool`

Restore database.

```python
success = await agent.restore_database("postgresql", "/backups/backup.sql")
```

### 8. `send_alert(alert: dict, channel: str) -> bool`

Send alert.

```python
alert = {
    "title": "High CPU Usage",
    "service": "orchestration",
    "severity": "warning",
    "message": "CPU usage is 85%"
}
await agent.send_alert(alert, "slack")
```

## Deployment Strategies

### Rolling Deployment

Gradual update with zero downtime.

```yaml
deployment:
  strategy: "rolling"
  rolling:
    max_surge: 1
    max_unavailable: 0
    batch_size: 1
    batch_delay_seconds: 30
```

**Usage:**
```bash
curl -X POST http://localhost:8019/deploy \
  -d '{"service": "orchestration", "version": "v2.0", "strategy": "rolling"}'
```

### Blue/Green Deployment

Deploy to new environment, switch traffic after health check.

```yaml
deployment:
  strategy: "blue_green"
  blue_green:
    health_check_timeout: 60
    rollback_on_failure: true
```

**Workflow:**
1. Deploy green environment
2. Health check (60s timeout)
3. Switch traffic if healthy
4. Remove blue environment

**Usage:**
```bash
curl -X POST http://localhost:8019/deploy \
  -d '{"service": "orchestration", "version": "v2.0", "strategy": "blue_green"}'
```

### Canary Deployment

Route small percentage of traffic to new version.

```yaml
deployment:
  strategy: "canary"
  canary:
    traffic_split: 10
    duration_minutes: 15
    auto_promote: true
```

**Workflow:**
1. Deploy canary with 10% traffic
2. Monitor for 15 minutes
3. Auto-promote if healthy
4. Rollback if issues detected

**Usage:**
```bash
curl -X POST http://localhost:8019/deploy \
  -d '{"service": "orchestration", "version": "v2.0", "strategy": "canary"}'
```

## Auto-scaling

### Configuration

```yaml
auto_scaling:
  enable: true
  min_replicas: 2
  max_replicas: 10
  
  scale_up:
    cpu_threshold: 70
    cooldown_seconds: 300
  
  scale_down:
    cpu_threshold: 30
    cooldown_seconds: 600
```

### Scaling Rules

**Scale Up:**
- CPU > 70% for 5 minutes
- Add 1 replica (max 10)
- Cooldown: 5 minutes

**Scale Down:**
- CPU < 30% for 10 minutes
- Remove 1 replica (min 2)
- Cooldown: 10 minutes

### Manual Scaling

```bash
# Scale to 5 replicas
curl -X POST http://localhost:8019/scale \
  -d '{"service": "orchestration", "replicas": 5}'
```

## Monitoring

### Prometheus Integration

Configure Prometheus scraping:

```yaml
scrape_configs:
  - job_name: 'infrastructure-agent'
    static_configs:
      - targets: ['infrastructure-agent:8019']
```

### Metrics Collected

- **cpu_usage**: CPU utilization percentage
- **memory_usage**: Memory utilization percentage
- **disk_usage**: Disk space usage percentage
- **network_io**: Network bytes sent/received
- **request_rate**: Requests per second
- **error_rate**: Error rate percentage
- **latency_p99**: 99th percentile latency

### Dashboard

View metrics:
```bash
curl http://localhost:8019/metrics
```

## Alerting

### Alert Rules

```yaml
alerting:
  rules:
    - metric: "cpu_usage"
      threshold: 80
      duration: "5m"
      action: "scale_up"
    
    - metric: "error_rate"
      threshold: 0.05
      duration: "1m"
      action: "alert"
```

### Slack Alerts

Configure Slack webhook:

```bash
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK"
```

**Alert Example:**
```
🚨 Infrastructure Alert
Service: orchestration
Metric: cpu_usage
Value: 85%
Threshold: 80%
Message: CPU usage exceeds threshold
```

### Email Alerts

Configure SMTP:

```bash
export SMTP_SERVER="smtp.gmail.com"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASSWORD="your-password"
```

### PagerDuty

Configure PagerDuty:

```bash
export PAGERDUTY_KEY="your-integration-key"
```

## Database Management

### PostgreSQL Backup

```bash
curl -X POST http://localhost:8019/backup \
  -d '{"database": "postgresql"}'
```

**Manual Backup:**
```bash
pg_dump -h localhost -U postgres -d learnyourway -f backup.sql
```

### Neo4j Backup

```bash
curl -X POST http://localhost:8019/backup \
  -d '{"database": "neo4j"}'
```

**Manual Backup:**
```bash
neo4j-admin dump --database=neo4j --to=backup.dump
```

### Redis Backup

```bash
curl -X POST http://localhost:8019/backup \
  -d '{"database": "redis"}'
```

**Manual Backup:**
```bash
redis-cli BGSAVE
```

### Restore Operations

```bash
# Restore PostgreSQL
curl -X POST http://localhost:8019/restore \
  -d '{"database": "postgresql", "backup_file": "/backups/backup.sql"}'

# Restore Neo4j
curl -X POST http://localhost:8019/restore \
  -d '{"database": "neo4j", "backup_file": "/backups/backup.dump"}'

# Restore Redis
curl -X POST http://localhost:8019/restore \
  -d '{"database": "redis", "backup_file": "/backups/backup.rdb"}'
```

## Health Checks

### Configuration

```yaml
health_checks:
  interval_seconds: 30
  timeout_seconds: 5
  endpoints:
    - name: "orchestration"
      url: "http://orchestration:8000/health"
    
    - name: "knowledge-graph"
      url: "http://knowledge-graph:8010/health"
```

### Check Service Health

```bash
curl http://localhost:8019/health/orchestration
```

## CI/CD Integration

### GitHub Actions

**.github/workflows/deploy.yml:**
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy service
      run: |
        curl -X POST http://infrastructure-agent:8019/deploy \
          -d '{"service": "orchestration", "version": "${{ github.sha }}", "strategy": "blue_green"}'
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Deploy') {
            steps {
                sh '''
                    curl -X POST http://infrastructure-agent:8019/deploy \
                      -d '{"service": "orchestration", "version": "${GIT_COMMIT}", "strategy": "rolling"}'
                '''
            }
        }
    }
}
```

## Testing

### Run Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=infrastructure_agent --cov-report=html

# Run specific test
pytest tests/test_infrastructure_agent.py::TestDockerManager -v
```

### Test Coverage

Target: 85%+ coverage

**Test Categories:**
- DockerManager (4 tests)
- PrometheusMonitor (2 tests)
- AlertManager (3 tests)
- AutoScaler (3 tests)
- DeploymentOrchestrator (4 tests)
- DatabaseManager (4 tests)
- InfrastructureAgent (8 tests)

## Production Deployment

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    docker.io \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY infrastructure_agent.py .
COPY config.yaml .

EXPOSE 8019

CMD ["uvicorn", "infrastructure_agent:app", "--host", "0.0.0.0", "--port", "8019"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  infrastructure-agent:
    build: .
    ports:
      - "8019:8019"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./backups:/backups
    environment:
      - SLACK_WEBHOOK=${SLACK_WEBHOOK}
      - POSTGRES_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - prometheus
```

## Troubleshooting

### Docker Connection Issues

```
Error: Cannot connect to Docker daemon
```

**Solution:**
```bash
# Check Docker service
sudo systemctl status docker

# Start Docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### High CPU Alert

```
Alert: CPU usage 85% exceeds threshold 80%
```

**Actions:**
1. Check metrics: `curl http://localhost:8019/metrics`
2. Review logs: `curl http://localhost:8019/logs/orchestration`
3. Scale up: Auto-scaling will trigger, or manual scale
4. Investigate high-usage containers

### Deployment Failure

```
Error: Blue/green deployment failed
```

**Solution:**
```bash
# Check health
curl http://localhost:8019/health/orchestration

# Review logs
curl http://localhost:8019/logs/orchestration-green

# Rollback
curl -X POST http://localhost:8019/rollback \
  -d '{"service": "orchestration", "version": "v2.0"}'
```

## Best Practices

### Monitoring
- Set appropriate alert thresholds
- Monitor regularly
- Review alert history
- Test alert channels

### Scaling
- Configure proper min/max replicas
- Set cooldown periods
- Monitor scale events
- Test auto-scaling

### Deployments
- Use blue/green for critical services
- Test in staging first
- Monitor post-deployment
- Keep rollback plan ready

### Backups
- Automate daily backups
- Test restore procedures
- Keep multiple backup copies
- Monitor backup success

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: https://github.com/learn-your-way/platform
- Documentation: https://docs.learnyourway.com
- Email: ops@learnyourway.com

## Version History

### 1.0.0 (Current)
- Initial release
- Docker container management
- Kubernetes orchestration (optional)
- Prometheus monitoring
- Auto-scaling with cooldown
- Multi-strategy deployments (rolling, blue/green, canary)
- Database backup/restore (PostgreSQL, Neo4j, Redis)
- Health monitoring
- Multi-channel alerting (Slack, email, PagerDuty)
- Log aggregation
- CI/CD integration
- 8 core functions
- 8 API endpoints
- Comprehensive testing (85%+ coverage)
