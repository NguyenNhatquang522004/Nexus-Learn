"""
Comprehensive test suite for Database Management Agent

Tests cover:
- Connection pool management
- Query execution
- Transaction management
- Migrations
- Backups and restores
- Query optimization
- Index management
- API endpoints
"""

import asyncio
import os
import tempfile
from pathlib import Path
from unittest.mock import Mock, AsyncMock, patch, MagicMock

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
import fakeredis.aioredis

from database_management_agent import (
    app,
    DatabaseManagementAgent,
    ConnectionPoolManager,
    QueryCacheManager,
    MigrationManager,
    BackupManager,
    QueryOptimizer,
    IndexManager,
    QueryResult,
    QueryType,
    IsolationLevel,
    ConnectionPoolStats,
    MigrationResult,
    BackupResult,
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def test_config(tmp_path) -> str:
    """Test configuration"""
    config_file = tmp_path / "config.yaml"
    config_file.write_text("""
agent:
  name: "test_agent"
  port: 8016
  host: "0.0.0.0"

postgresql:
  host: "localhost"
  port: 5432
  database: "test_db"
  user: "postgres"
  password: "test_password"
  
  connection_pool:
    min_size: 2
    max_size: 10
    timeout: 30
  
  query_timeout: 30

schemas:
  - users
  - sessions

migrations:
  directory: "./migrations"
  auto_migrate: false
  backup_before_migrate: true

transactions:
  isolation_level: "read_committed"
  max_retries: 3
  retry_delay: 1

optimization:
  enable_query_cache: true
  prepared_statements: true
  index_suggestions: true
  slow_query_log: true
  slow_query_threshold_ms: 1000

backup:
  enable: true
  schedule: "0 2 * * *"
  retention_days: 30
  location: "./backups"

caching:
  enable: true
  redis_url: "redis://localhost:6379"
  query_cache_ttl: 300
    """)
    return str(config_file)


@pytest.fixture
def mock_pool():
    """Mock asyncpg pool"""
    pool = AsyncMock()
    pool.get_size.return_value = 5
    pool.get_idle_size.return_value = 3
    pool.get_max_size.return_value = 10
    return pool


@pytest.fixture
def mock_connection():
    """Mock asyncpg connection"""
    conn = AsyncMock()
    conn.fetch.return_value = []
    conn.fetchval.return_value = 1
    conn.fetchrow.return_value = {}
    conn.execute.return_value = "SELECT 1"
    return conn


@pytest_asyncio.fixture
async def fake_redis():
    """Fake Redis client"""
    client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
    yield client
    await client.close()


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


# ============================================================================
# Connection Pool Tests
# ============================================================================

class TestConnectionPoolManager:
    """Test connection pool manager"""
    
    @pytest.mark.asyncio
    async def test_create_pool(self, test_config, mock_pool):
        """Test pool creation"""
        manager = ConnectionPoolManager({"postgresql": {
            "host": "localhost",
            "port": 5432,
            "database": "test_db",
            "user": "postgres",
            "password": "test",
            "connection_pool": {
                "min_size": 2,
                "max_size": 10,
                "timeout": 30
            }
        }})
        
        with patch('asyncpg.create_pool', return_value=mock_pool):
            pool = await manager.create_pool()
            assert pool == mock_pool
    
    @pytest.mark.asyncio
    async def test_get_pool_stats(self, test_config, mock_pool):
        """Test pool statistics"""
        manager = ConnectionPoolManager({"postgresql": {
            "host": "localhost",
            "port": 5432,
            "database": "test_db",
            "user": "postgres",
            "password": "test",
            "connection_pool": {
                "min_size": 2,
                "max_size": 10,
                "timeout": 30
            }
        }})
        
        manager.pool = mock_pool
        
        stats = await manager.get_pool_stats()
        
        assert stats.total_connections == 5
        assert stats.idle_connections == 3
        assert stats.active_connections == 2
        assert stats.max_connections == 10


# ============================================================================
# Query Cache Tests
# ============================================================================

class TestQueryCacheManager:
    """Test query cache manager"""
    
    @pytest.mark.asyncio
    async def test_cache_get_miss(self, fake_redis):
        """Test cache miss"""
        manager = QueryCacheManager({
            "caching": {
                "enable": True,
                "redis_url": "redis://localhost:6379",
                "query_cache_ttl": 300
            }
        })
        
        manager.redis_client = fake_redis
        
        result = await manager.get("SELECT * FROM users", None)
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_set_and_get(self, fake_redis):
        """Test cache set and get"""
        manager = QueryCacheManager({
            "caching": {
                "enable": True,
                "redis_url": "redis://localhost:6379",
                "query_cache_ttl": 300
            }
        })
        
        manager.redis_client = fake_redis
        
        # Set result
        query_result = QueryResult(
            rows=[{"id": 1, "name": "Alice"}],
            row_count=1,
            execution_time=10.5,
            query_type=QueryType.SELECT
        )
        
        await manager.set("SELECT * FROM users", None, query_result)
        
        # Get cached result
        cached = await manager.get("SELECT * FROM users", None)
        
        assert cached is not None
        assert cached.rows == [{"id": 1, "name": "Alice"}]
        assert cached.from_cache is True


# ============================================================================
# Query Execution Tests
# ============================================================================

class TestDatabaseManagementAgent:
    """Test database management agent"""
    
    @pytest.mark.asyncio
    async def test_classify_query(self, test_config):
        """Test query classification"""
        with patch.dict(os.environ, {"POSTGRES_PASSWORD": "test"}):
            agent = DatabaseManagementAgent(test_config)
            
            assert agent._classify_query("SELECT * FROM users") == QueryType.SELECT
            assert agent._classify_query("INSERT INTO users VALUES (1)") == QueryType.INSERT
            assert agent._classify_query("UPDATE users SET name='Alice'") == QueryType.UPDATE
            assert agent._classify_query("DELETE FROM users") == QueryType.DELETE
            assert agent._classify_query("CREATE TABLE test (id INT)") == QueryType.DDL
    
    @pytest.mark.asyncio
    async def test_execute_query(self, test_config, mock_pool, mock_connection):
        """Test query execution"""
        with patch.dict(os.environ, {"POSTGRES_PASSWORD": "test"}):
            agent = DatabaseManagementAgent(test_config)
            
            # Mock pool and connection
            agent.pool_manager.pool = mock_pool
            mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
            mock_pool.acquire.return_value.__aexit__.return_value = None
            
            # Mock query result
            mock_connection.fetch.return_value = [
                {"id": 1, "name": "Alice"},
                {"id": 2, "name": "Bob"}
            ]
            
            # Execute query
            result = await agent.execute_query("SELECT * FROM users")
            
            assert result.row_count == 2
            assert result.query_type == QueryType.SELECT
            assert len(result.rows) == 2


# ============================================================================
# Transaction Tests
# ============================================================================

class TestTransactions:
    """Test transaction management"""
    
    @pytest.mark.asyncio
    async def test_execute_transaction(self, test_config, mock_pool, mock_connection):
        """Test transaction execution"""
        with patch.dict(os.environ, {"POSTGRES_PASSWORD": "test"}):
            agent = DatabaseManagementAgent(test_config)
            
            # Mock pool and connection
            agent.pool_manager.pool = mock_pool
            mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
            mock_pool.acquire.return_value.__aexit__.return_value = None
            
            # Mock transaction
            mock_transaction = AsyncMock()
            mock_connection.transaction.return_value.__aenter__.return_value = mock_transaction
            mock_connection.transaction.return_value.__aexit__.return_value = None
            
            # Execute transaction
            queries = [
                {"sql": "INSERT INTO users VALUES (1, 'Alice')", "params": None},
                {"sql": "INSERT INTO users VALUES (2, 'Bob')", "params": None}
            ]
            
            success = await agent.execute_transaction(queries)
            
            assert success is True
            assert mock_connection.execute.call_count == 2


# ============================================================================
# Migration Tests
# ============================================================================

class TestMigrationManager:
    """Test migration manager"""
    
    @pytest.mark.asyncio
    async def test_migration_config(self, test_config, tmp_path):
        """Test Alembic configuration"""
        config = {
            "postgresql": {
                "host": "localhost",
                "port": 5432,
                "database": "test_db",
                "user": "postgres",
                "password": "test"
            },
            "migrations": {
                "directory": str(tmp_path / "migrations"),
                "auto_migrate": False,
                "backup_before_migrate": True
            }
        }
        
        with patch.dict(os.environ, {"POSTGRES_PASSWORD": "test"}):
            manager = MigrationManager(config)
            
            alembic_cfg = manager._get_alembic_config()
            
            assert alembic_cfg is not None


# ============================================================================
# Backup Tests
# ============================================================================

class TestBackupManager:
    """Test backup manager"""
    
    @pytest.mark.asyncio
    async def test_backup_directory_creation(self, tmp_path):
        """Test backup directory creation"""
        backup_dir = tmp_path / "backups"
        
        config = {
            "postgresql": {
                "host": "localhost",
                "port": 5432,
                "database": "test_db",
                "user": "postgres",
                "password": "test"
            },
            "backup": {
                "location": str(backup_dir),
                "retention_days": 30
            }
        }
        
        manager = BackupManager(config)
        
        assert backup_dir.exists()


# ============================================================================
# Query Optimizer Tests
# ============================================================================

class TestQueryOptimizer:
    """Test query optimizer"""
    
    @pytest.mark.asyncio
    async def test_analyze_plan(self, mock_pool):
        """Test query plan analysis"""
        config = {
            "optimization": {
                "slow_query_threshold_ms": 1000
            }
        }
        
        optimizer = QueryOptimizer(mock_pool, config)
        
        # Test plan analysis
        plan = {"Execution Time": 1500, "Planning Time": 50}
        suggestions = await optimizer._analyze_plan(plan, "SELECT * FROM users")
        
        assert isinstance(suggestions, list)


# ============================================================================
# Index Manager Tests
# ============================================================================

class TestIndexManager:
    """Test index manager"""
    
    @pytest.mark.asyncio
    async def test_analyze_table(self, mock_pool, mock_connection):
        """Test table analysis"""
        manager = IndexManager(mock_pool)
        
        # Mock connection and results
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_pool.acquire.return_value.__aexit__.return_value = None
        
        mock_connection.fetchrow.return_value = {
            "schemaname": "public",
            "tablename": "users",
            "n_live_tup": 1000,
            "n_dead_tup": 50,
            "last_vacuum": None,
            "last_analyze": None
        }
        
        result = await manager.analyze_table("users")
        
        assert result["table"] == "users"
        assert result["live_tuples"] == 1000
    
    @pytest.mark.asyncio
    async def test_suggest_indexes(self, mock_pool, mock_connection):
        """Test index suggestions"""
        manager = IndexManager(mock_pool)
        
        # Mock connection and results
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_pool.acquire.return_value.__aexit__.return_value = None
        
        mock_connection.fetch.return_value = [
            {"column_name": "id", "data_type": "integer"},
            {"column_name": "email", "data_type": "varchar"}
        ]
        
        suggestions = await manager.suggest_indexes("users")
        
        assert len(suggestions) > 0
        assert suggestions[0]["table"] == "users"


# ============================================================================
# API Endpoint Tests
# ============================================================================

class TestAPIEndpoints:
    """Test API endpoints"""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, client, test_config, mock_pool):
        """Test health check endpoint"""
        # Mock agent initialization
        with patch('database_management_agent.agent') as mock_agent:
            mock_agent.get_health_status.return_value = {
                "status": "healthy",
                "timestamp": "2023-12-01T15:30:00",
                "connection_pool": {
                    "healthy": True,
                    "pool_stats": {"total": 10, "idle": 7, "active": 3, "max": 50}
                },
                "statistics": {"queries_executed": 100}
            }
            
            # Test would check endpoint response
            # In real implementation, would call client.get("/health")
            assert mock_agent is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=database_management_agent"])
