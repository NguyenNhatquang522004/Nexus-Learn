# Database Management Agent

**Production-ready PostgreSQL management system with connection pooling, transactions, migrations, and automated backups**

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Usage](#api-usage)
- [Connection Pooling](#connection-pooling)
- [Transaction Management](#transaction-management)
- [Migrations](#migrations)
- [Backup and Restore](#backup-and-restore)
- [Query Optimization](#query-optimization)
- [Index Management](#index-management)
- [Monitoring](#monitoring)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

---

## Overview

The Database Management Agent provides enterprise-grade PostgreSQL database management for the Learn Your Way Platform. It handles connection pooling, transaction management, schema migrations, automated backups, query optimization, and comprehensive monitoring.

### Key Capabilities

- **Connection pooling**: Multi-tier pool with health checks and load balancing
- **Transaction management**: ACID compliance with retry logic
- **Schema migrations**: Alembic-powered version control
- **Automated backups**: Scheduled backups with retention policies
- **Query optimization**: EXPLAIN ANALYZE with suggestions
- **Index management**: Automatic index suggestions and maintenance
- **Query caching**: Redis-backed caching for read queries
- **Monitoring**: Real-time statistics and health checks

### Use Cases

- **User data**: Store and query user profiles, sessions, progress
- **Content management**: Manage courses, assessments, files
- **Analytics**: Store and aggregate learning analytics
- **Real-time data**: Session management with connection pooling
- **Migrations**: Version-controlled schema evolution
- **Disaster recovery**: Automated backups and point-in-time recovery

---

## Features

### Core Functionality

✅ **Connection pooling** with min/max sizes and health checks  
✅ **Transaction management** with ACID guarantees and retry logic  
✅ **Schema migrations** with Alembic integration  
✅ **Automated backups** with pg_dump and retention policies  
✅ **Query optimization** with EXPLAIN ANALYZE  
✅ **Index management** with suggestions and rebuilding  
✅ **Query caching** with Redis for SELECT queries  
✅ **Slow query logging** with configurable thresholds  
✅ **Read replica support** for load balancing  
✅ **RESTful API** with 8 endpoints  
✅ **100% production-ready** with comprehensive error handling

---

## Architecture

### System Design

```
┌────────────────────────────────────────────────────────────────┐
│                   Database Management Agent                     │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │  API Layer   │         │  Statistics  │                     │
│  │  (FastAPI)   │         │   Tracking   │                     │
│  └──────┬───────┘         └──────────────┘                     │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────┐               │
│  │     DatabaseManagementAgent                 │               │
│  │  - Query execution                          │               │
│  │  - Transaction coordination                 │               │
│  │  - Cache management                         │               │
│  └──────┬──────────────────────────────────────┘               │
│         │                                                        │
│    ┌────┴─────┬──────────┬──────────┬──────────┐              │
│    │          │          │          │          │               │
│    ▼          ▼          ▼          ▼          ▼               │
│  ┌────┐   ┌────┐    ┌────┐    ┌────┐    ┌────┐               │
│  │Pool│   │Migr│    │Back│    │Optim│   │Index│              │
│  │Mgr │   │ation│   │up  │    │izer │   │ Mgr │              │
│  └─┬──┘   └────┘    └────┘    └────┘    └────┘               │
│    │                                                             │
│    ├─► Primary (Write) Pool                                    │
│    │    ├─ Connection 1                                        │
│    │    ├─ Connection 2                                        │
│    │    └─ ... (min: 10, max: 50)                             │
│    │                                                             │
│    └─► Read Replica Pools (Optional)                          │
│         ├─ Replica 1 Pool                                      │
│         └─ Replica 2 Pool                                      │
│                                                                  │
│  ┌──────────────────────────────────────┐                     │
│  │       Query Cache (Redis)            │                     │
│  │  - SELECT query results              │                     │
│  │  - TTL-based expiration              │                     │
│  │  - Automatic invalidation            │                     │
│  └──────────────────────────────────────┘                     │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   PostgreSQL   │
                  │    Database    │
                  └────────────────┘

Query Flow:
1. API receives request
2. Check query cache (if SELECT)
3. Get connection from pool
4. Execute with transaction (if needed)
5. Cache result (if SELECT)
6. Return response

Transaction Flow:
1. Acquire connection
2. Set isolation level
3. BEGIN transaction
4. Execute queries
5. COMMIT or ROLLBACK
6. Retry on failure (max 3 times)
```

### Component Responsibilities

- **ConnectionPoolManager**: Manages connection pools, health checks, load balancing
- **QueryCacheManager**: Redis-backed caching for SELECT queries
- **MigrationManager**: Alembic integration for schema migrations
- **BackupManager**: pg_dump/pg_restore for backups and recovery
- **QueryOptimizer**: EXPLAIN ANALYZE and optimization suggestions
- **IndexManager**: Index analysis, suggestions, and maintenance

---

## Installation

### Prerequisites

- Python 3.10+
- PostgreSQL 12+
- Redis 6.0+ (for query caching)
- pg_dump/pg_restore utilities
- Network access to PostgreSQL server

### Quick Start

1. **Install PostgreSQL**:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql@14

# Start service
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
```

2. **Create database**:

```bash
sudo -u postgres createdb learn_your_way
sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE learn_your_way TO appuser;"
```

3. **Install Redis** (for caching):

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start service
sudo systemctl start redis  # Linux
brew services start redis  # macOS
```

4. **Install dependencies**:

```bash
pip install -r requirements.txt
```

5. **Configure agent**:

Edit `config.yaml`:

```yaml
postgresql:
  host: "localhost"
  port: 5432
  database: "learn_your_way"
  user: "appuser"
  password: "${POSTGRES_PASSWORD}"  # Set in environment
```

6. **Set environment variables**:

```bash
export POSTGRES_PASSWORD="your_password"
```

7. **Run agent**:

```bash
python database_management_agent.py
```

Agent starts on `http://localhost:8016`

### Docker Deployment

```bash
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: learn_your_way
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  db-agent:
    build: .
    ports:
      - "8016:8016"
    depends_on:
      - postgres
      - redis
    environment:
      - POSTGRES_PASSWORD=your_password
      - CONFIG_PATH=/app/config.yaml

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

---

## Configuration

### Complete Configuration Reference

See `config.yaml` for full configuration options:

#### PostgreSQL Connection

```yaml
postgresql:
  host: "localhost"
  port: 5432
  database: "learn_your_way"
  user: "postgres"
  password: "${POSTGRES_PASSWORD}"
  
  connection_pool:
    min_size: 10      # Minimum connections
    max_size: 50      # Maximum connections
    timeout: 30       # Connection timeout (seconds)
  
  query_timeout: 30   # Query timeout (seconds)
```

#### Read Replicas (Optional)

```yaml
postgresql:
  read_replicas:
    - host: "replica1.example.com"
      port: 5432
      database: "learn_your_way"
      user: "postgres"
      password: "${POSTGRES_PASSWORD}"
```

#### Migrations

```yaml
migrations:
  directory: "./migrations"
  auto_migrate: true              # Run migrations on startup
  backup_before_migrate: true     # Backup before migration
```

#### Transactions

```yaml
transactions:
  isolation_level: "read_committed"  # Isolation level
  max_retries: 3                     # Retry attempts
  retry_delay: 1                     # Delay between retries
```

#### Query Optimization

```yaml
optimization:
  enable_query_cache: true
  prepared_statements: true
  slow_query_log: true
  slow_query_threshold_ms: 1000  # Log queries > 1 second
```

#### Backups

```yaml
backup:
  enable: true
  schedule: "0 2 * * *"      # 2 AM daily (cron format)
  retention_days: 30         # Keep backups for 30 days
  location: "./backups"      # Backup directory
```

#### Caching

```yaml
caching:
  enable: true
  redis_url: "redis://localhost:6379/0"
  query_cache_ttl: 300  # Cache for 5 minutes
```

---

## API Usage

### API Endpoints

#### 1. Execute Query

**POST** `/query`

Execute SQL query with optional caching and transaction.

**Request**:

```json
{
  "sql": "SELECT * FROM users WHERE id = $1",
  "params": [123],
  "transaction": false,
  "use_cache": true
}
```

**Example**:

```bash
curl -X POST http://localhost:8016/query \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM users WHERE id = $1",
    "params": [123],
    "use_cache": true
  }'
```

**Response**:

```json
{
  "success": true,
  "rows": [
    {"id": 123, "name": "Alice", "email": "alice@example.com"}
  ],
  "row_count": 1,
  "execution_time_ms": 2.5,
  "query_type": "select",
  "from_cache": false
}
```

#### 2. Execute Transaction

**POST** `/transaction`

Execute multiple queries in ACID transaction.

**Request**:

```json
{
  "queries": [
    {
      "sql": "INSERT INTO users (name, email) VALUES ($1, $2)",
      "params": ["Alice", "alice@example.com"]
    },
    {
      "sql": "INSERT INTO sessions (user_id, token) VALUES ($1, $2)",
      "params": [123, "abc123"]
    }
  ],
  "isolation_level": "read_committed"
}
```

**Example**:

```bash
curl -X POST http://localhost:8016/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "queries": [
      {
        "sql": "INSERT INTO users (name) VALUES ($1)",
        "params": ["Alice"]
      },
      {
        "sql": "UPDATE stats SET count = count + 1"
      }
    ]
  }'
```

**Response**:

```json
{
  "success": true,
  "queries_executed": 2
}
```

#### 3. Run Migration

**POST** `/migrate`

Run database migration.

**Request**:

```json
{
  "direction": "upgrade",
  "target": "head"
}
```

**Example**:

```bash
curl -X POST http://localhost:8016/migrate \
  -H "Content-Type: application/json" \
  -d '{"direction": "upgrade", "target": "head"}'
```

**Response**:

```json
{
  "success": true,
  "migration_file": "auto",
  "version": "head",
  "execution_time": 1.5
}
```

#### 4. Create Backup

**POST** `/backup`

Create database backup.

**Request**:

```json
{
  "backup_name": "daily_backup",
  "compress": true
}
```

**Example**:

```bash
curl -X POST http://localhost:8016/backup \
  -H "Content-Type: application/json" \
  -d '{"compress": true}'
```

**Response**:

```json
{
  "success": true,
  "backup_file": "/backups/backup_20231201_020000.sql.gz",
  "size_mb": 125.5,
  "duration": 45.2
}
```

#### 5. Restore Database

**POST** `/restore`

Restore database from backup.

**Request**:

```json
{
  "backup_file": "/backups/backup_20231201_020000.sql.gz",
  "drop_existing": false
}
```

**Example**:

```bash
curl -X POST http://localhost:8016/restore \
  -H "Content-Type: application/json" \
  -d '{
    "backup_file": "/backups/backup_20231201_020000.sql.gz",
    "drop_existing": false
  }'
```

**Response**:

```json
{
  "success": true,
  "backup_file": "/backups/backup_20231201_020000.sql.gz"
}
```

#### 6. Get Health Status

**GET** `/health`

Check database and connection pool health.

**Example**:

```bash
curl http://localhost:8016/health
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T15:30:00",
  "connection_pool": {
    "healthy": true,
    "pool_stats": {
      "total": 10,
      "idle": 7,
      "active": 3,
      "max": 50
    },
    "read_replicas": 2
  },
  "statistics": {
    "queries_executed": 15234,
    "transactions_executed": 456,
    "cache_hits": 8901,
    "cache_misses": 2345,
    "slow_queries": 12,
    "errors": 3
  }
}
```

#### 7. Get Table Schema

**GET** `/schema/{table}`

Get table schema information.

**Example**:

```bash
curl http://localhost:8016/schema/users
```

**Response**:

```json
{
  "table": "users",
  "columns": [
    {
      "column_name": "id",
      "data_type": "integer",
      "is_nullable": "NO",
      "column_default": "nextval('users_id_seq'::regclass)"
    },
    {
      "column_name": "name",
      "data_type": "character varying",
      "is_nullable": "NO",
      "column_default": null
    },
    {
      "column_name": "email",
      "data_type": "character varying",
      "is_nullable": "NO",
      "column_default": null
    }
  ]
}
```

#### 8. Optimize Query

**POST** `/optimize`

Analyze and optimize SQL query.

**Request**:

```json
{
  "sql": "SELECT * FROM users WHERE email = 'alice@example.com'",
  "analyze": true
}
```

**Example**:

```bash
curl -X POST http://localhost:8016/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM users WHERE email = '\''alice@example.com'\''",
    "analyze": true
  }'
```

**Response**:

```json
{
  "execution_time_ms": 125.3,
  "planning_time_ms": 5.2,
  "total_time_ms": 130.5,
  "plan": {...},
  "suggestions": [
    "Consider adding index on users(email)",
    "Sequential scan detected: verify appropriate indexes exist"
  ],
  "is_slow": false
}
```

#### 9. Manage Indexes

**POST** `/indexes`

Analyze, suggest, or rebuild table indexes.

**Request**:

```json
{
  "table": "users",
  "action": "suggest"
}
```

**Example - Analyze**:

```bash
curl -X POST http://localhost:8016/indexes \
  -H "Content-Type: application/json" \
  -d '{"table": "users", "action": "analyze"}'
```

**Example - Suggest**:

```bash
curl -X POST http://localhost:8016/indexes \
  -H "Content-Type: application/json" \
  -d '{"table": "users", "action": "suggest"}'
```

**Example - Rebuild**:

```bash
curl -X POST http://localhost:8016/indexes \
  -H "Content-Type: application/json" \
  -d '{"table": "users", "action": "rebuild"}'
```

**Response (suggest)**:

```json
{
  "suggestions": [
    {
      "table": "users",
      "column": "email",
      "type": "btree",
      "reason": "Frequently filtered column (varchar)"
    },
    {
      "table": "users",
      "column": "created_at",
      "type": "btree",
      "reason": "Frequently filtered column (timestamp)"
    }
  ]
}
```

---

## Connection Pooling

### Pool Configuration

```yaml
connection_pool:
  min_size: 10   # Always maintain 10 connections
  max_size: 50   # Allow up to 50 connections
  timeout: 30    # 30 second timeout for acquiring connection
```

### Pool Behavior

- **Minimum connections**: Always kept alive
- **Maximum connections**: Upper limit
- **Health checks**: Pre-ping before using connection
- **Automatic recovery**: Reconnect on connection failure
- **Load balancing**: Round-robin across read replicas

### Monitoring Pool Health

```python
# Check pool statistics
health = await agent.get_health_status()
print(f"Active: {health['connection_pool']['pool_stats']['active']}")
print(f"Idle: {health['connection_pool']['pool_stats']['idle']}")
```

---

## Transaction Management

### ACID Guarantees

All transactions provide:
- **Atomicity**: All or nothing execution
- **Consistency**: Database constraints maintained
- **Isolation**: Configurable isolation levels
- **Durability**: Committed changes persist

### Isolation Levels

```python
# Read Committed (default)
await agent.execute_transaction(queries, IsolationLevel.READ_COMMITTED)

# Repeatable Read
await agent.execute_transaction(queries, IsolationLevel.REPEATABLE_READ)

# Serializable (strictest)
await agent.execute_transaction(queries, IsolationLevel.SERIALIZABLE)
```

### Retry Logic

Automatic retry on transient failures:
- **Max retries**: 3 (configurable)
- **Retry delay**: 1 second (configurable)
- **Exponential backoff**: Optional

---

## Migrations

### Alembic Integration

Database schema migrations with version control.

#### Create Migration

```bash
# Auto-generate migration from models
alembic revision --autogenerate -m "Add users table"

# Create empty migration
alembic revision -m "Custom migration"
```

#### Run Migrations

```bash
# Via API
curl -X POST http://localhost:8016/migrate \
  -H "Content-Type: application/json" \
  -d '{"direction": "upgrade", "target": "head"}'

# Via CLI
alembic upgrade head
```

#### Rollback

```bash
# Rollback one version
curl -X POST http://localhost:8016/migrate \
  -H "Content-Type: application/json" \
  -d '{"direction": "downgrade", "target": "-1"}'
```

---

## Backup and Restore

### Automated Backups

Scheduled backups via cron:

```yaml
backup:
  schedule: "0 2 * * *"  # 2 AM daily
  retention_days: 30
```

### Manual Backup

```bash
curl -X POST http://localhost:8016/backup \
  -H "Content-Type: application/json" \
  -d '{"backup_name": "manual_backup", "compress": true}'
```

### Restore

```bash
curl -X POST http://localhost:8016/restore \
  -H "Content-Type: application/json" \
  -d '{
    "backup_file": "/backups/backup_20231201_020000.sql.gz",
    "drop_existing": false
  }'
```

### Backup Best Practices

1. **Test restores regularly**
2. **Store backups off-site** (S3, GCS)
3. **Monitor backup success**
4. **Verify backup integrity**
5. **Document restore procedures**

---

## Query Optimization

### EXPLAIN ANALYZE

```bash
curl -X POST http://localhost:8016/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM users WHERE email = '\''alice@example.com'\''",
    "analyze": true
  }'
```

### Optimization Suggestions

Agent automatically suggests:
- **Missing indexes**
- **Sequential scan issues**
- **High-cost operations**
- **JOIN optimization opportunities**

### Slow Query Logging

```yaml
optimization:
  slow_query_log: true
  slow_query_threshold_ms: 1000  # Log queries > 1 second
```

---

## Index Management

### Analyze Table

```bash
curl -X POST http://localhost:8016/indexes \
  -H "Content-Type: application/json" \
  -d '{"table": "users", "action": "analyze"}'
```

Updates table statistics for query planner.

### Suggest Indexes

```bash
curl -X POST http://localhost:8016/indexes \
  -H "Content-Type: application/json" \
  -d '{"table": "users", "action": "suggest"}'
```

Returns index suggestions based on column types.

### Rebuild Indexes

```bash
curl -X POST http://localhost:8016/indexes \
  -H "Content-Type: application/json" \
  -d '{"table": "users", "action": "rebuild"}'
```

Rebuilds all indexes for table (REINDEX).

---

## Monitoring

### Key Metrics

- **Queries executed**: Total query count
- **Transactions executed**: Total transaction count
- **Cache hit rate**: Percentage of cached queries
- **Slow queries**: Queries exceeding threshold
- **Error rate**: Failed query percentage
- **Connection pool usage**: Active/idle connections

### Health Checks

```bash
curl http://localhost:8016/health
```

Returns comprehensive health status.

### Prometheus Integration (Optional)

```yaml
monitoring:
  prometheus:
    enable: true
    port: 9090
```

Exposes metrics at `:9090/metrics`.

---

## Testing

### Run Tests

```bash
# All tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=database_management_agent

# Specific test
pytest tests/test_database_management_agent.py::TestConnectionPoolManager -v
```

### Test Coverage

Target: 80%+ code coverage

**Test categories**:
- Unit tests: Connection pool, cache, migrations, backups
- Integration tests: Query execution, transactions
- API tests: All endpoints

---

## Production Deployment

### PostgreSQL Configuration

**postgresql.conf** optimizations:

```conf
# Connections
max_connections = 100
shared_buffers = 256MB

# Query Planner
effective_cache_size = 1GB
random_page_cost = 1.1

# Write Performance
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Autovacuum
autovacuum = on
```

### High Availability

**PostgreSQL Streaming Replication**:

```yaml
postgresql:
  read_replicas:
    - host: "replica1.example.com"
      port: 5432
    - host: "replica2.example.com"
      port: 5432
```

### Monitoring

**pgAdmin** for database monitoring  
**Grafana + Prometheus** for metrics visualization  
**PgBouncer** for connection pooling (optional)

---

## API Reference Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/query` | POST | Execute SQL query |
| `/transaction` | POST | Execute transaction |
| `/migrate` | POST | Run migration |
| `/backup` | POST | Create backup |
| `/restore` | POST | Restore database |
| `/health` | GET | Get health status |
| `/schema/{table}` | GET | Get table schema |
| `/optimize` | POST | Optimize query |
| `/indexes` | POST | Manage indexes |

---

## License

MIT License - Learn Your Way Platform

## Support

For issues or questions:
- GitHub Issues: [repository]/issues
- Email: support@learnyourway.platform
- Docs: https://docs.learnyourway.platform/database-agent

---

**Built with ❤️ for the Learn Your Way Platform**
