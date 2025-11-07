"""
Comprehensive test suite for Local AI Agent

Tests cover:
- Privacy compliance (GDPR, COPPA, FERPA)
- Encryption/decryption
- Sensitive data detection
- Offline mode
- Model inference
- Anonymization
- Memory management
"""

import asyncio
import time
from typing import Dict, Any
from unittest.mock import Mock, AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

from local_ai_agent import (
    app,
    LocalAIAgent,
    EncryptionManager,
    PrivacyChecker,
    AnonymizationEngine,
    ModelManager,
    ComplianceStandard,
    SensitiveDataType,
    PrivacyConfig,
    ModelConfig,
    OfflineConfig,
    ResourceConfig,
    OfflineFallbackBehavior,
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def test_config() -> Dict[str, Any]:
    """Test configuration"""
    return {
        "agent": {
            "name": "test_agent",
            "port": 8014,
            "host": "127.0.0.1"
        },
        "models": {
            "ollama": {
                "base_url": "http://localhost:11434",
                "model": "llama3:8b",
                "temperature": 0.7,
                "context_length": 4096
            },
            "quantization": {
                "enable": True,
                "bits": 4,
                "gpu_memory_fraction": 0.8
            }
        },
        "privacy": {
            "compliance": ["GDPR", "COPPA", "FERPA"],
            "sensitive_data_types": [
                "student_personal_info",
                "learning_difficulties",
                "behavioral_data",
                "family_information"
            ],
            "encryption": {
                "enable": True,
                "algorithm": "AES-256",
                "key_rotation_days": 90
            }
        },
        "offline_mode": {
            "enable": True,
            "cache_responses": True,
            "cache_ttl": 86400,
            "fallback_behavior": "cached_only"
        },
        "data_retention": {
            "log_queries": False,
            "store_sensitive_data": False,
            "auto_delete_after_days": 0
        },
        "resource_management": {
            "max_concurrent_requests": 4,
            "gpu_memory_limit_gb": 8,
            "cpu_fallback": True
        }
    }


@pytest.fixture
def encryption_manager():
    """Encryption manager fixture"""
    return EncryptionManager(algorithm="AES-256", key_rotation_days=90)


@pytest.fixture
def privacy_config():
    """Privacy config fixture"""
    return PrivacyConfig(
        compliance_standards=[ComplianceStandard.GDPR, ComplianceStandard.COPPA, ComplianceStandard.FERPA],
        sensitive_data_types=[
            SensitiveDataType.STUDENT_PERSONAL_INFO,
            SensitiveDataType.LEARNING_DIFFICULTIES,
            SensitiveDataType.BEHAVIORAL_DATA,
            SensitiveDataType.FAMILY_INFORMATION
        ],
        encryption_enabled=True,
        encryption_algorithm="AES-256",
        key_rotation_days=90
    )


@pytest.fixture
def privacy_checker(privacy_config):
    """Privacy checker fixture"""
    return PrivacyChecker(privacy_config)


@pytest.fixture
def anonymization_engine():
    """Anonymization engine fixture"""
    return AnonymizationEngine()


@pytest.fixture
def model_config():
    """Model config fixture"""
    return ModelConfig(
        base_url="http://localhost:11434",
        model="llama3:8b",
        temperature=0.7,
        context_length=4096,
        quantization_bits=4,
        gpu_memory_fraction=0.8
    )


@pytest.fixture
def resource_config():
    """Resource config fixture"""
    return ResourceConfig(
        max_concurrent_requests=4,
        gpu_memory_limit_gb=8,
        cpu_fallback=True
    )


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


# ============================================================================
# Encryption Manager Tests
# ============================================================================

class TestEncryptionManager:
    """Test encryption manager"""
    
    def test_encrypt_decrypt(self, encryption_manager):
        """Test encryption and decryption"""
        data = "Sensitive student information"
        user_key = "test_user_key_123"
        
        # Encrypt
        encrypted = encryption_manager.encrypt(data, user_key)
        
        assert "encrypted_data" in encrypted
        assert "iv" in encrypted
        assert "salt" in encrypted
        assert encrypted["algorithm"] == "AES-256"
        
        # Decrypt
        decrypted = encryption_manager.decrypt(
            encrypted["encrypted_data"],
            encrypted["iv"],
            encrypted["salt"],
            user_key
        )
        
        assert decrypted == data
    
    def test_different_keys_different_results(self, encryption_manager):
        """Test different keys produce different results"""
        data = "Test data"
        
        encrypted1 = encryption_manager.encrypt(data, "key1")
        encrypted2 = encryption_manager.encrypt(data, "key2")
        
        assert encrypted1["encrypted_data"] != encrypted2["encrypted_data"]
    
    def test_key_rotation(self, encryption_manager):
        """Test key rotation"""
        # Generate some keys
        encryption_manager.generate_key("user1")
        encryption_manager.generate_key("user2")
        
        initial_count = len(encryption_manager.keys)
        
        # Manually expire all keys
        for key_info in encryption_manager.keys.values():
            key_info["expires_at"] = time.time() - 1
        
        # Rotate keys
        rotated = encryption_manager.rotate_keys()
        
        assert rotated == initial_count
        assert len(encryption_manager.keys) == 0


# ============================================================================
# Privacy Checker Tests
# ============================================================================

class TestPrivacyChecker:
    """Test privacy checker"""
    
    def test_detect_student_personal_info(self, privacy_checker):
        """Test detection of student personal info"""
        text = "Student ID: 12345, Email: student@example.com"
        
        detected = privacy_checker.detect_sensitive_data(text)
        
        assert SensitiveDataType.STUDENT_PERSONAL_INFO in detected
    
    def test_detect_learning_difficulties(self, privacy_checker):
        """Test detection of learning difficulties"""
        text = "Student has ADHD and requires IEP accommodations"
        
        detected = privacy_checker.detect_sensitive_data(text)
        
        assert SensitiveDataType.LEARNING_DIFFICULTIES in detected
    
    def test_detect_behavioral_data(self, privacy_checker):
        """Test detection of behavioral data"""
        text = "Student received detention for disciplinary issues"
        
        detected = privacy_checker.detect_sensitive_data(text)
        
        assert SensitiveDataType.BEHAVIORAL_DATA in detected
    
    def test_detect_family_information(self, privacy_checker):
        """Test detection of family information"""
        text = "Parent contact: John Doe, family income: $50,000"
        
        detected = privacy_checker.detect_sensitive_data(text)
        
        assert SensitiveDataType.FAMILY_INFORMATION in detected
    
    def test_gdpr_compliance_with_consent(self, privacy_checker):
        """Test GDPR compliance with consent"""
        data = {
            "consent_provided": True,
            "data_retention_policy": True
        }
        
        result = privacy_checker.check_compliance(data, [ComplianceStandard.GDPR])
        
        assert result.compliant is True
        assert ComplianceStandard.GDPR in result.standards_met
    
    def test_gdpr_compliance_without_consent(self, privacy_checker):
        """Test GDPR compliance without consent"""
        data = {
            "consent_provided": False
        }
        
        result = privacy_checker.check_compliance(data, [ComplianceStandard.GDPR])
        
        assert result.compliant is False
        assert "GDPR: Consent not provided" in result.violations[0]
    
    def test_coppa_compliance_under_13(self, privacy_checker):
        """Test COPPA compliance for users under 13"""
        data = {
            "age": 10,
            "parental_consent": True
        }
        
        result = privacy_checker.check_compliance(data, [ComplianceStandard.COPPA])
        
        assert result.compliant is True
        assert ComplianceStandard.COPPA in result.standards_met
    
    def test_coppa_violation_no_parental_consent(self, privacy_checker):
        """Test COPPA violation without parental consent"""
        data = {
            "age": 10,
            "parental_consent": False
        }
        
        result = privacy_checker.check_compliance(data, [ComplianceStandard.COPPA])
        
        assert result.compliant is False
        assert "COPPA" in result.violations[0]
    
    def test_ferpa_compliance(self, privacy_checker):
        """Test FERPA compliance"""
        data = {
            "legitimate_educational_interest": True
        }
        
        # Add sensitive data
        data["query"] = "Student has learning disability"
        
        result = privacy_checker.check_compliance(data, [ComplianceStandard.FERPA])
        
        # Should detect sensitive data but pass with legitimate interest
        assert len(result.sensitive_data_found) > 0
        assert ComplianceStandard.FERPA in result.standards_met


# ============================================================================
# Anonymization Engine Tests
# ============================================================================

class TestAnonymizationEngine:
    """Test anonymization engine"""
    
    def test_anonymize_name(self, anonymization_engine):
        """Test name anonymization"""
        data = {"student_name": "John Doe"}
        
        anonymized = anonymization_engine.anonymize_data(data)
        
        assert anonymized["student_name"] != "John Doe"
        assert anonymized["student_name"].startswith("Student_")
    
    def test_anonymize_email(self, anonymization_engine):
        """Test email anonymization"""
        data = {"email": "student@example.com"}
        
        anonymized = anonymization_engine.anonymize_data(data)
        
        assert anonymized["email"] != "student@example.com"
        assert "@anonymous.local" in anonymized["email"]
    
    def test_anonymize_ssn(self, anonymization_engine):
        """Test SSN anonymization"""
        data = {"ssn": "123-45-6789"}
        
        anonymized = anonymization_engine.anonymize_data(data)
        
        assert anonymized["ssn"] == "XXX-XX-XXXX"
    
    def test_anonymize_nested_data(self, anonymization_engine):
        """Test nested data anonymization"""
        data = {
            "student": {
                "name": "Jane Smith",
                "email": "jane@example.com",
                "info": {
                    "phone": "555-1234"
                }
            }
        }
        
        anonymized = anonymization_engine.anonymize_data(data)
        
        assert anonymized["student"]["name"] != "Jane Smith"
        assert anonymized["student"]["email"] != "jane@example.com"
        assert anonymized["student"]["info"]["phone"] == "XXX-XXX-XXXX"
    
    def test_consistent_anonymization(self, anonymization_engine):
        """Test consistent anonymization"""
        value = "John Doe"
        
        anon1 = anonymization_engine.anonymize_field(value, "name")
        anon2 = anonymization_engine.anonymize_field(value, "name")
        
        # Same value should get same anonymized result
        assert anon1 == anon2


# ============================================================================
# Model Manager Tests
# ============================================================================

class TestModelManager:
    """Test model manager"""
    
    @pytest.mark.asyncio
    async def test_check_ollama_connection(self, model_config, resource_config):
        """Test Ollama connection check"""
        manager = ModelManager(model_config, resource_config)
        
        with patch.object(manager.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = Mock(status_code=200)
            
            result = await manager.check_ollama_connection()
            
            assert result is True
        
        await manager.close()
    
    @pytest.mark.asyncio
    async def test_inference_result_structure(self, model_config, resource_config):
        """Test inference result structure"""
        manager = ModelManager(model_config, resource_config)
        
        with patch.object(manager.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = Mock(
                status_code=200,
                json=lambda: {"response": "Test response"}
            )
            
            result = await manager.local_inference("Test prompt")
            
            assert result.response == "Test response"
            assert result.model == model_config.model
            assert result.inference_time >= 0
            assert result.encrypted is False
            assert result.cached is False
        
        await manager.close()
    
    def test_memory_usage(self, model_config, resource_config):
        """Test memory usage reporting"""
        manager = ModelManager(model_config, resource_config)
        
        memory = manager.get_memory_usage()
        
        assert "ram_used_gb" in memory
        assert "ram_percent" in memory
        assert "cpu_percent" in memory


# ============================================================================
# Local AI Agent Tests
# ============================================================================

class TestLocalAIAgent:
    """Test local AI agent"""
    
    @pytest.mark.asyncio
    async def test_cache_response(self, tmp_path):
        """Test response caching"""
        # Create temporary config
        config_file = tmp_path / "config.yaml"
        config_file.write_text("""
agent:
  name: "test_agent"
  port: 8014
  host: "127.0.0.1"

models:
  ollama:
    base_url: "http://localhost:11434"
    model: "llama3:8b"
    temperature: 0.7
    context_length: 4096
  quantization:
    enable: true
    bits: 4
    gpu_memory_fraction: 0.8

privacy:
  compliance: ["GDPR", "COPPA", "FERPA"]
  sensitive_data_types: ["student_personal_info"]
  encryption:
    enable: true
    algorithm: "AES-256"
    key_rotation_days: 90

offline_mode:
  enable: true
  cache_responses: true
  cache_ttl: 86400
  fallback_behavior: "cached_only"

data_retention:
  log_queries: false
  store_sensitive_data: false
  auto_delete_after_days: 0

resource_management:
  max_concurrent_requests: 4
  gpu_memory_limit_gb: 8
  cpu_fallback: true
        """)
        
        agent = LocalAIAgent(str(config_file))
        
        # Generate cache key
        cache_key = agent._generate_cache_key("test prompt", "llama3:8b")
        
        # Cache response
        agent._cache_response(cache_key, "test response", "llama3:8b")
        
        # Retrieve from cache
        cached = agent._get_cached_response(cache_key)
        
        assert cached is not None
        assert cached.response == "test response"
        
        await agent.close()
    
    def test_encrypt_response(self, tmp_path):
        """Test response encryption"""
        config_file = tmp_path / "config.yaml"
        config_file.write_text("""
agent:
  name: "test_agent"
  port: 8014
  host: "127.0.0.1"

models:
  ollama:
    base_url: "http://localhost:11434"
    model: "llama3:8b"
    temperature: 0.7
    context_length: 4096
  quantization:
    enable: true
    bits: 4
    gpu_memory_fraction: 0.8

privacy:
  compliance: ["GDPR"]
  sensitive_data_types: ["student_personal_info"]
  encryption:
    enable: true
    algorithm: "AES-256"
    key_rotation_days: 90

offline_mode:
  enable: true
  cache_responses: true
  cache_ttl: 86400
  fallback_behavior: "cached_only"

data_retention:
  log_queries: false
  store_sensitive_data: false
  auto_delete_after_days: 0

resource_management:
  max_concurrent_requests: 4
  gpu_memory_limit_gb: 8
  cpu_fallback: true
        """)
        
        agent = LocalAIAgent(str(config_file))
        
        response = "Sensitive student data"
        user_key = "test_key_123"
        
        encrypted = agent.encrypt_response(response, user_key)
        
        assert "encrypted_data" in encrypted
        assert "iv" in encrypted
        assert "salt" in encrypted
    
    def test_anonymize_data(self, tmp_path):
        """Test data anonymization"""
        config_file = tmp_path / "config.yaml"
        config_file.write_text("""
agent:
  name: "test_agent"
  port: 8014
  host: "127.0.0.1"

models:
  ollama:
    base_url: "http://localhost:11434"
    model: "llama3:8b"
    temperature: 0.7
    context_length: 4096
  quantization:
    enable: true
    bits: 4
    gpu_memory_fraction: 0.8

privacy:
  compliance: ["GDPR"]
  sensitive_data_types: ["student_personal_info"]
  encryption:
    enable: true
    algorithm: "AES-256"
    key_rotation_days: 90

offline_mode:
  enable: true
  cache_responses: true
  cache_ttl: 86400
  fallback_behavior: "cached_only"

data_retention:
  log_queries: false
  store_sensitive_data: false
  auto_delete_after_days: 0

resource_management:
  max_concurrent_requests: 4
  gpu_memory_limit_gb: 8
  cpu_fallback: true
        """)
        
        agent = LocalAIAgent(str(config_file))
        
        data = {
            "student_name": "John Doe",
            "email": "john@example.com"
        }
        
        anonymized = agent.anonymize_data(data)
        
        assert anonymized["student_name"] != "John Doe"
        assert anonymized["email"] != "john@example.com"
    
    def test_offline_status(self, tmp_path):
        """Test offline status"""
        config_file = tmp_path / "config.yaml"
        config_file.write_text("""
agent:
  name: "test_agent"
  port: 8014
  host: "127.0.0.1"

models:
  ollama:
    base_url: "http://localhost:11434"
    model: "llama3:8b"
    temperature: 0.7
    context_length: 4096
  quantization:
    enable: true
    bits: 4
    gpu_memory_fraction: 0.8

privacy:
  compliance: ["GDPR"]
  sensitive_data_types: ["student_personal_info"]
  encryption:
    enable: true
    algorithm: "AES-256"
    key_rotation_days: 90

offline_mode:
  enable: true
  cache_responses: true
  cache_ttl: 86400
  fallback_behavior: "cached_only"

data_retention:
  log_queries: false
  store_sensitive_data: false
  auto_delete_after_days: 0

resource_management:
  max_concurrent_requests: 4
  gpu_memory_limit_gb: 8
  cpu_fallback: true
        """)
        
        agent = LocalAIAgent(str(config_file))
        
        status = agent.get_offline_status()
        
        assert status["offline_mode_enabled"] is True
        assert status["cache_enabled"] is True
        assert "cache_size" in status


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
        assert data["agent"] == "local_ai_agent"


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Integration tests"""
    
    def test_privacy_to_encryption_flow(self, privacy_checker, encryption_manager):
        """Test privacy check to encryption flow"""
        # Check privacy
        data = {
            "query": "Student has learning disability",
            "consent_provided": True,
            "legitimate_educational_interest": True
        }
        
        result = privacy_checker.check_compliance(data)
        
        # If sensitive data found, encrypt
        if result.sensitive_data_found:
            encrypted = encryption_manager.encrypt(
                data["query"],
                "user_key_123"
            )
            
            assert "encrypted_data" in encrypted


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=local_ai_agent"])
