"""
Comprehensive test suite for Caching Agent

Tests cover:
- L1 cache operations
- L2 cache operations
- Multi-tier caching
- Cache strategies (write-through, write-back, write-around)
- Invalidation (TTL, event-based, dependency tracking)
- Compression
- Batch operations
- Performance
"""

import asyncio
import gzip
import pickle
import time
from typing import Dict, Any
from unittest.mock import Mock, AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
import fakeredis.aioredis

from caching_agent import (
    app,
    CachingAgent,
    L1Cache,
    L2Cache,
    CompressionManager,
    InvalidationManager,
    CacheStrategy,
    EventTrigger,
    CacheEntry,
    CacheStats,
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
  port: 8015
  host: "0.0.0.0"

redis:
  host: "localhost"
  port: 6379
  db: 0
  password: null
  max_connections: 50
  socket_timeout: 5

cache_tiers:
  l1:
    type: "memory"
    max_size_mb: 10
    ttl: 60
  
  l2:
    type: "redis"
    ttl: 3600
    eviction_policy: "lru"

strategies:
  default: "write_through"
  
  write_through:
    sync: true
  
  write_back:
    batch_size: 10
    flush_interval: 5

cache_policies:
  personalized_content:
    ttl: 3600
    strategy: "write_through"
    compress: true
  
  model_inference:
    ttl: 86400
    strategy: "write_back"
    compress: false

invalidation:
  methods:
    - ttl
    - event_based
    - dependency_tracking
  
  event_triggers:
    - user_profile_update
    - content_modification

compression:
  enable: true
  algorithm: "gzip"
  threshold_bytes: 1024

monitoring:
  track_hit_rate: true
  track_latency: true
  alert_on_low_hit_rate: 0.6
    """)
    return str(config_file)


@pytest.fixture
def l1_cache():
    """L1 cache fixture"""
    return L1Cache(max_size_mb=10, ttl=60)


@pytest_asyncio.fixture
async def fake_redis():
    """Fake Redis client"""
    client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
    yield client
    await client.close()


@pytest_asyncio.fixture
async def l2_cache(fake_redis):
    """L2 cache fixture"""
    return L2Cache(redis_client=fake_redis, ttl=3600)


@pytest.fixture
def compression_manager():
    """Compression manager fixture"""
    return CompressionManager(enable=True, algorithm="gzip", threshold_bytes=1024)


@pytest.fixture
def invalidation_manager():
    """Invalidation manager fixture"""
    return InvalidationManager()


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


# ============================================================================
# L1 Cache Tests
# ============================================================================

class TestL1Cache:
    """Test L1 cache"""
    
    def test_set_and_get(self, l1_cache):
        """Test basic set and get"""
        l1_cache.set("key1", "value1", ttl=60)
        
        value = l1_cache.get("key1")
        assert value == "value1"
    
    def test_get_miss(self, l1_cache):
        """Test cache miss"""
        value = l1_cache.get("nonexistent")
        assert value is None
    
    def test_expiration(self, l1_cache):
        """Test TTL expiration"""
        l1_cache.set("key1", "value1", ttl=1)
        
        # Should exist initially
        assert l1_cache.get("key1") == "value1"
        
        # Wait for expiration
        time.sleep(1.1)
        
        # Should be expired
        assert l1_cache.get("key1") is None
    
    def test_lru_eviction(self, l1_cache):
        """Test LRU eviction"""
        # Set small max size
        l1_cache.max_size_bytes = 1000
        
        # Add items
        for i in range(10):
            l1_cache.set(f"key{i}", "x" * 200, ttl=60)
        
        # First keys should be evicted
        assert l1_cache.get("key0") is None
        assert l1_cache.get("key9") is not None
    
    def test_delete(self, l1_cache):
        """Test deletion"""
        l1_cache.set("key1", "value1", ttl=60)
        
        success = l1_cache.delete("key1")
        assert success is True
        assert l1_cache.get("key1") is None
    
    def test_pattern_matching(self, l1_cache):
        """Test pattern-based key retrieval"""
        l1_cache.set("user:1:profile", "data1", ttl=60)
        l1_cache.set("user:2:profile", "data2", ttl=60)
        l1_cache.set("content:1", "data3", ttl=60)
        
        keys = l1_cache.get_keys_by_pattern("user:*:profile")
        assert len(keys) == 2
    
    def test_tags(self, l1_cache):
        """Test tag-based retrieval"""
        l1_cache.set("key1", "value1", ttl=60, tags={"tag1", "tag2"})
        l1_cache.set("key2", "value2", ttl=60, tags={"tag1"})
        
        keys = l1_cache.get_keys_by_tag("tag1")
        assert len(keys) == 2
    
    def test_dependencies(self, l1_cache):
        """Test dependency tracking"""
        l1_cache.set("key1", "value1", ttl=60)
        l1_cache.set("key2", "value2", ttl=60, dependencies={"key1"})
        
        dependent_keys = l1_cache.get_dependent_keys("key1")
        assert "cache:" in dependent_keys[0]  # Contains hash prefix


# ============================================================================
# L2 Cache Tests
# ============================================================================

class TestL2Cache:
    """Test L2 cache"""
    
    @pytest.mark.asyncio
    async def test_set_and_get(self, l2_cache):
        """Test basic set and get"""
        await l2_cache.set("key1", "value1", ttl=60)
        
        value = await l2_cache.get("key1")
        assert value == "value1"
    
    @pytest.mark.asyncio
    async def test_get_miss(self, l2_cache):
        """Test cache miss"""
        value = await l2_cache.get("nonexistent")
        assert value is None
    
    @pytest.mark.asyncio
    async def test_delete(self, l2_cache):
        """Test deletion"""
        await l2_cache.set("key1", "value1", ttl=60)
        
        success = await l2_cache.delete("key1")
        assert success is True
        
        value = await l2_cache.get("key1")
        assert value is None
    
    @pytest.mark.asyncio
    async def test_pattern_deletion(self, l2_cache):
        """Test pattern-based deletion"""
        await l2_cache.set("user:1", "data1", ttl=60)
        await l2_cache.set("user:2", "data2", ttl=60)
        await l2_cache.set("content:1", "data3", ttl=60)
        
        count = await l2_cache.delete_pattern("user:*")
        assert count == 2


# ============================================================================
# Compression Tests
# ============================================================================

class TestCompressionManager:
    """Test compression manager"""
    
    def test_compress_small_data(self, compression_manager):
        """Test compression of small data"""
        data = "small data"
        
        compressed, is_compressed = compression_manager.compress(data)
        assert is_compressed is False  # Below threshold
    
    def test_compress_large_data(self, compression_manager):
        """Test compression of large data"""
        data = "x" * 2000
        
        compressed, is_compressed = compression_manager.compress(data)
        assert is_compressed is True
        assert len(compressed) < len(pickle.dumps(data))
    
    def test_decompress(self, compression_manager):
        """Test decompression"""
        data = "x" * 2000
        
        compressed, is_compressed = compression_manager.compress(data)
        decompressed = compression_manager.decompress(compressed, is_compressed)
        
        assert decompressed == data


# ============================================================================
# Invalidation Tests
# ============================================================================

class TestInvalidationManager:
    """Test invalidation manager"""
    
    def test_event_subscription(self, invalidation_manager):
        """Test event-based invalidation"""
        invalidation_manager.register_event_subscription(
            EventTrigger.USER_PROFILE_UPDATE,
            "user:1:profile"
        )
        
        keys = invalidation_manager.get_keys_to_invalidate(
            event=EventTrigger.USER_PROFILE_UPDATE
        )
        
        assert "user:1:profile" in keys
    
    def test_dependency_tracking(self, invalidation_manager):
        """Test dependency-based invalidation"""
        invalidation_manager.register_dependency("derived_key", "source_key")
        
        keys = invalidation_manager.get_keys_to_invalidate(dependency="source_key")
        
        assert "derived_key" in keys
    
    def test_recursive_dependencies(self, invalidation_manager):
        """Test recursive dependency invalidation"""
        invalidation_manager.register_dependency("key2", "key1")
        invalidation_manager.register_dependency("key3", "key2")
        
        keys = invalidation_manager.get_keys_to_invalidate(dependency="key1")
        
        assert "key2" in keys
        assert "key3" in keys


# ============================================================================
# Caching Agent Tests
# ============================================================================

class TestCachingAgent:
    """Test caching agent"""
    
    @pytest.mark.asyncio
    async def test_write_through_strategy(self, test_config):
        """Test write-through strategy"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        # Set with write-through
        await agent.set("key1", "value1", strategy=CacheStrategy.WRITE_THROUGH)
        
        # Should be in both caches
        assert agent.l1_cache.get(agent._generate_cache_key("key1")) is not None
        assert await agent.l2_cache.get(agent._generate_cache_key("key1")) is not None
        
        await agent.close()
    
    @pytest.mark.asyncio
    async def test_write_back_strategy(self, test_config):
        """Test write-back strategy"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        # Set with write-back
        await agent.set("key1", "value1", strategy=CacheStrategy.WRITE_BACK)
        
        # Should be in L1
        assert agent.l1_cache.get(agent._generate_cache_key("key1")) is not None
        
        # Should be buffered, not yet in L2
        assert agent._generate_cache_key("key1") in agent.write_buffer.items
        
        # Flush buffer
        await agent._flush_write_buffer()
        
        # Now should be in L2
        assert await agent.l2_cache.get(agent._generate_cache_key("key1")) is not None
        
        await agent.close()
    
    @pytest.mark.asyncio
    async def test_write_around_strategy(self, test_config):
        """Test write-around strategy"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        # Set with write-around
        await agent.set("key1", "value1", strategy=CacheStrategy.WRITE_AROUND)
        
        # Should only be in L2
        assert await agent.l2_cache.get(agent._generate_cache_key("key1")) is not None
        
        await agent.close()
    
    @pytest.mark.asyncio
    async def test_multi_tier_get(self, test_config):
        """Test multi-tier cache lookup"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        # Set in L2 only
        cache_key = agent._generate_cache_key("key1")
        await agent.l2_cache.set(cache_key, "value1", ttl=60)
        
        # Get should check L1, then L2, then promote to L1
        value = await agent.get("key1")
        assert value == "value1"
        
        # Should now be in L1
        assert agent.l1_cache.get(cache_key) is not None
        
        await agent.close()
    
    @pytest.mark.asyncio
    async def test_batch_operations(self, test_config):
        """Test batch get and set"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        # Batch set
        items = {"key1": "value1", "key2": "value2", "key3": "value3"}
        await agent.batch_set(items, ttl=60)
        
        # Batch get
        results = await agent.batch_get(["key1", "key2", "key3"])
        assert len(results) == 3
        assert results["key1"] == "value1"
        
        await agent.close()
    
    @pytest.mark.asyncio
    async def test_get_or_compute(self, test_config):
        """Test get-or-compute pattern"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        compute_count = 0
        
        def compute_fn():
            nonlocal compute_count
            compute_count += 1
            return "computed_value"
        
        # First call should compute
        value1 = await agent.get_or_compute("key1", compute_fn, ttl=60)
        assert value1 == "computed_value"
        assert compute_count == 1
        
        # Second call should use cache
        value2 = await agent.get_or_compute("key1", compute_fn, ttl=60)
        assert value2 == "computed_value"
        assert compute_count == 1  # Should not compute again
        
        await agent.close()
    
    @pytest.mark.asyncio
    async def test_invalidate_pattern(self, test_config):
        """Test pattern-based invalidation"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        # Set multiple keys
        await agent.set("user:1:profile", "data1")
        await agent.set("user:2:profile", "data2")
        await agent.set("content:1", "data3")
        
        # Invalidate by pattern
        count = await agent.invalidate_pattern("*user:*:profile*")
        
        # User keys should be gone
        assert await agent.get("user:1:profile") is None
        assert await agent.get("user:2:profile") is None
        
        # Content key should remain
        assert await agent.get("content:1") is not None
        
        await agent.close()
    
    @pytest.mark.asyncio
    async def test_statistics(self, test_config):
        """Test cache statistics"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        # Perform operations
        await agent.set("key1", "value1")
        await agent.get("key1")  # Hit
        await agent.get("key2")  # Miss
        
        stats = agent.get_stats()
        
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["sets"] == 1
        assert 0 < stats["hit_rate"] < 1
        
        await agent.close()


# ============================================================================
# API Endpoint Tests
# ============================================================================

class TestAPIEndpoints:
    """Test API endpoints"""
    
    def test_health_endpoint(self, client):
        """Test health check"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


# ============================================================================
# Performance Tests
# ============================================================================

class TestPerformance:
    """Performance tests"""
    
    @pytest.mark.asyncio
    async def test_get_latency(self, test_config):
        """Test get operation latency"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        # Set value
        await agent.set("key1", "value1")
        
        # Measure latency
        start = time.time()
        await agent.get("key1")
        latency = (time.time() - start) * 1000  # ms
        
        assert latency < 5  # Should be < 5ms
        
        await agent.close()
    
    @pytest.mark.asyncio
    async def test_batch_performance(self, test_config):
        """Test batch operation performance"""
        agent = CachingAgent(test_config)
        agent.redis_client = await fakeredis.aioredis.FakeRedis(decode_responses=False)
        agent.l2_cache = L2Cache(agent.redis_client, ttl=3600)
        
        # Batch set 100 items
        items = {f"key{i}": f"value{i}" for i in range(100)}
        
        start = time.time()
        await agent.batch_set(items, ttl=60)
        duration = time.time() - start
        
        assert duration < 1.0  # Should complete in < 1 second
        
        await agent.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=caching_agent"])
