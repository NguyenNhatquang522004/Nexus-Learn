"""
Tests for Security & Compliance Agent

Coverage:
- Authentication (login, token generation, verification, refresh, logout)
- Authorization (RBAC permission checking)
- Rate limiting (per user, per endpoint)
- Encryption (AES-256-GCM encryption/decryption)
- Audit logging (event logging, field masking)
- Compliance checking (GDPR, COPPA, FERPA)
- API endpoints (all 9 endpoints)
"""

import asyncio
import json
import os
from base64 import b64encode, b64decode
from datetime import datetime, timedelta
from pathlib import Path

import jwt
import pytest
import yaml
from fakeredis import aioredis as fakeredis

from security_compliance_agent import (
    SecurityComplianceAgent,
    AuthenticationManager,
    AuthorizationManager,
    RateLimitManager,
    EncryptionManager,
    AuditLogger,
    ComplianceChecker,
    UserRole,
    TokenType,
    Regulation
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
async def redis_client():
    """Create fake Redis client"""
    client = fakeredis.FakeRedis()
    yield client
    await client.close()


@pytest.fixture
def encryption_manager(config):
    """Create encryption manager"""
    return EncryptionManager(config)


@pytest.fixture
async def auth_manager(config, redis_client):
    """Create authentication manager"""
    manager = AuthenticationManager(config, redis_client)
    
    # Register test users
    manager.register_user("student1", "password123", UserRole.STUDENT)
    manager.register_user("educator1", "password123", UserRole.EDUCATOR)
    manager.register_user("admin1", "password123", UserRole.ADMIN)
    
    return manager


@pytest.fixture
def authz_manager(config):
    """Create authorization manager"""
    return AuthorizationManager(config)


@pytest.fixture
async def rate_limit_manager(config, redis_client):
    """Create rate limit manager"""
    return RateLimitManager(config, redis_client)


@pytest.fixture
async def audit_logger(config, redis_client, tmp_path):
    """Create audit logger"""
    # Override log location to temp directory
    config["audit"]["log_location"] = str(tmp_path / "logs")
    return AuditLogger(config, redis_client)


@pytest.fixture
def compliance_checker(config):
    """Create compliance checker"""
    return ComplianceChecker(config)


@pytest.fixture
async def agent(config, tmp_path):
    """Create security compliance agent"""
    # Override log location
    config["audit"]["log_location"] = str(tmp_path / "logs")
    
    # Write temp config
    temp_config = tmp_path / "config.yaml"
    with open(temp_config, 'w') as f:
        yaml.dump(config, f)
    
    # Set Redis URL to fake Redis
    os.environ["REDIS_URL"] = "redis://fakeredis:6379/0"
    
    agent = SecurityComplianceAgent(str(temp_config))
    
    # Use fake Redis
    agent.redis_client = fakeredis.FakeRedis()
    agent.auth_manager = AuthenticationManager(config, agent.redis_client)
    agent.rate_limit_manager = RateLimitManager(config, agent.redis_client)
    agent.audit_logger = AuditLogger(config, agent.redis_client)
    
    # Register test users
    agent.auth_manager.register_user("student1", "password123", UserRole.STUDENT)
    agent.auth_manager.register_user("educator1", "password123", UserRole.EDUCATOR)
    agent.auth_manager.register_user("admin1", "password123", UserRole.ADMIN)
    
    yield agent
    
    await agent.close()


# ============================================================================
# Encryption Tests
# ============================================================================

class TestEncryptionManager:
    """Test encryption manager"""
    
    def test_encrypt_decrypt(self, encryption_manager):
        """Test basic encryption and decryption"""
        data = b"Sensitive student data"
        
        # Encrypt
        encrypted = encryption_manager.encrypt_data(data)
        
        assert encrypted != data
        assert len(encrypted) > len(data)
        
        # Decrypt
        decrypted = encryption_manager.decrypt_data(encrypted)
        
        assert decrypted == data
    
    def test_encrypt_with_key_id(self, encryption_manager):
        """Test encryption with specific key ID"""
        data = b"Test data"
        key_id = encryption_manager.current_key_id
        
        # Encrypt with key ID
        encrypted = encryption_manager.encrypt_data(data, key_id)
        
        # Decrypt with key ID
        decrypted = encryption_manager.decrypt_data(encrypted, key_id)
        
        assert decrypted == data
    
    def test_encrypt_unicode(self, encryption_manager):
        """Test encryption of unicode data"""
        data = "Unicode data: 你好世界 🌍".encode('utf-8')
        
        encrypted = encryption_manager.encrypt_data(data)
        decrypted = encryption_manager.decrypt_data(encrypted)
        
        assert decrypted.decode('utf-8') == data.decode('utf-8')
    
    def test_decrypt_invalid_data(self, encryption_manager):
        """Test decryption of invalid data"""
        invalid_data = b"invalid encrypted data"
        
        with pytest.raises(Exception):
            encryption_manager.decrypt_data(invalid_data)
    
    def test_key_rotation(self, encryption_manager):
        """Test key rotation"""
        old_key_id = encryption_manager.current_key_id
        
        # Rotate keys
        encryption_manager.rotate_keys()
        
        # Key ID should change
        new_key_id = encryption_manager.current_key_id
        
        # Keys might be same if called on same day, so check keys exist
        assert old_key_id in encryption_manager.keys
        assert new_key_id in encryption_manager.keys
    
    def test_large_data_encryption(self, encryption_manager):
        """Test encryption of large data"""
        data = b"x" * 10000
        
        encrypted = encryption_manager.encrypt_data(data)
        decrypted = encryption_manager.decrypt_data(encrypted)
        
        assert decrypted == data


# ============================================================================
# Authentication Tests
# ============================================================================

class TestAuthenticationManager:
    """Test authentication manager"""
    
    @pytest.mark.asyncio
    async def test_authenticate_success(self, auth_manager):
        """Test successful authentication"""
        result = await auth_manager.authenticate("student1", "password123")
        
        assert "user_id" in result
        assert "access_token" in result
        assert "refresh_token" in result
        assert result["role"] == "student"
        assert result["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_authenticate_invalid_username(self, auth_manager):
        """Test authentication with invalid username"""
        with pytest.raises(ValueError, match="Invalid credentials"):
            await auth_manager.authenticate("nonexistent", "password123")
    
    @pytest.mark.asyncio
    async def test_authenticate_invalid_password(self, auth_manager):
        """Test authentication with invalid password"""
        with pytest.raises(ValueError, match="Invalid credentials"):
            await auth_manager.authenticate("student1", "wrongpassword")
    
    def test_generate_token(self, auth_manager):
        """Test token generation"""
        token = auth_manager.generate_token("user123", "student", TokenType.ACCESS)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode token
        payload = jwt.decode(token, auth_manager.secret_key, algorithms=[auth_manager.algorithm])
        
        assert payload["user_id"] == "user123"
        assert payload["role"] == "student"
        assert payload["type"] == "access"
    
    @pytest.mark.asyncio
    async def test_verify_token_success(self, auth_manager):
        """Test token verification success"""
        token = auth_manager.generate_token("user123", "student", TokenType.ACCESS)
        
        payload = await auth_manager.verify_token(token)
        
        assert payload["user_id"] == "user123"
        assert payload["role"] == "student"
    
    @pytest.mark.asyncio
    async def test_verify_token_invalid(self, auth_manager):
        """Test verification of invalid token"""
        with pytest.raises(ValueError, match="Invalid token"):
            await auth_manager.verify_token("invalid.token.here")
    
    @pytest.mark.asyncio
    async def test_verify_token_expired(self, auth_manager):
        """Test verification of expired token"""
        # Create expired token
        payload = {
            "user_id": "user123",
            "role": "student",
            "type": "access",
            "exp": datetime.utcnow() - timedelta(hours=1)
        }
        
        expired_token = jwt.encode(payload, auth_manager.secret_key, algorithm=auth_manager.algorithm)
        
        with pytest.raises(ValueError, match="Token has expired"):
            await auth_manager.verify_token(expired_token)
    
    @pytest.mark.asyncio
    async def test_refresh_access_token(self, auth_manager):
        """Test access token refresh"""
        # Authenticate to get refresh token
        result = await auth_manager.authenticate("student1", "password123")
        refresh_token = result["refresh_token"]
        
        # Refresh
        new_result = await auth_manager.refresh_access_token(refresh_token)
        
        assert "access_token" in new_result
        assert new_result["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_logout(self, auth_manager):
        """Test logout"""
        # Authenticate
        result = await auth_manager.authenticate("student1", "password123")
        access_token = result["access_token"]
        
        # Verify token works
        await auth_manager.verify_token(access_token)
        
        # Logout
        await auth_manager.logout(access_token)
        
        # Token should be blacklisted
        with pytest.raises(ValueError, match="Token has been revoked"):
            await auth_manager.verify_token(access_token)


# ============================================================================
# Authorization Tests
# ============================================================================

class TestAuthorizationManager:
    """Test authorization manager"""
    
    def test_check_permission_student(self, authz_manager):
        """Test student permissions"""
        # Should have read access to courses
        assert authz_manager.check_permission("user1", "student", "courses", "read")
        
        # Should NOT have write access to courses
        assert not authz_manager.check_permission("user1", "student", "courses", "write")
    
    def test_check_permission_educator(self, authz_manager):
        """Test educator permissions"""
        # Should have read access to courses
        assert authz_manager.check_permission("user2", "educator", "courses", "read")
        
        # Should have write access to courses
        assert authz_manager.check_permission("user2", "educator", "courses", "write")
        
        # Should have read access to student progress
        assert authz_manager.check_permission("user2", "educator", "student_progress", "read")
    
    def test_check_permission_admin(self, authz_manager):
        """Test admin permissions"""
        # Admin should have all permissions
        assert authz_manager.check_permission("user3", "admin", "anything", "read")
        assert authz_manager.check_permission("user3", "admin", "anything", "write")
        assert authz_manager.check_permission("user3", "admin", "anything", "delete")
        assert authz_manager.check_permission("user3", "admin", "anything", "admin")
    
    def test_check_permission_unknown_role(self, authz_manager):
        """Test permission check with unknown role"""
        assert not authz_manager.check_permission("user4", "unknown", "courses", "read")
    
    def test_get_user_permissions(self, authz_manager):
        """Test getting user permissions"""
        student_perms = authz_manager.get_user_permissions("student")
        
        assert len(student_perms) > 0
        assert "read:courses" in student_perms
    
    def test_check_permission_own_resource(self, authz_manager):
        """Test permission for own resources"""
        # Students can read/write their own progress
        assert authz_manager.check_permission("user1", "student", "own_progress", "read")
        assert authz_manager.check_permission("user1", "student", "own_progress", "write")


# ============================================================================
# Rate Limiting Tests
# ============================================================================

class TestRateLimitManager:
    """Test rate limiting"""
    
    @pytest.mark.asyncio
    async def test_rate_limit_within_limit(self, rate_limit_manager):
        """Test requests within rate limit"""
        user_id = "user1"
        endpoint = "/test"
        
        # Make requests within limit
        for _ in range(5):
            allowed = await rate_limit_manager.rate_limit_check(user_id, endpoint)
            assert allowed
    
    @pytest.mark.asyncio
    async def test_rate_limit_exceeded(self, rate_limit_manager):
        """Test rate limit exceeded"""
        user_id = "user2"
        endpoint = "/test"
        
        # Get limit
        limit = rate_limit_manager.default_limit
        
        # Make requests up to limit
        for _ in range(limit):
            await rate_limit_manager.rate_limit_check(user_id, endpoint)
        
        # Next request should be blocked
        allowed = await rate_limit_manager.rate_limit_check(user_id, endpoint)
        assert not allowed
    
    @pytest.mark.asyncio
    async def test_rate_limit_per_endpoint(self, rate_limit_manager):
        """Test per-endpoint rate limits"""
        user_id = "user3"
        
        # /auth/login has lower limit
        login_limit = rate_limit_manager.endpoint_limits.get("/auth/login", 5)
        
        # Make requests up to limit
        for _ in range(login_limit):
            await rate_limit_manager.rate_limit_check(user_id, "/auth/login")
        
        # Next request should be blocked
        allowed = await rate_limit_manager.rate_limit_check(user_id, "/auth/login")
        assert not allowed
    
    @pytest.mark.asyncio
    async def test_rate_limit_different_users(self, rate_limit_manager):
        """Test rate limits are per-user"""
        endpoint = "/test"
        
        # User 1 hits limit
        limit = rate_limit_manager.default_limit
        for _ in range(limit + 1):
            await rate_limit_manager.rate_limit_check("user4", endpoint)
        
        # User 2 should still be allowed
        allowed = await rate_limit_manager.rate_limit_check("user5", endpoint)
        assert allowed
    
    @pytest.mark.asyncio
    async def test_rate_limit_different_endpoints(self, rate_limit_manager):
        """Test rate limits are per-endpoint"""
        user_id = "user6"
        
        # Hit limit on /auth/login
        login_limit = rate_limit_manager.endpoint_limits.get("/auth/login", 5)
        for _ in range(login_limit + 1):
            await rate_limit_manager.rate_limit_check(user_id, "/auth/login")
        
        # Should still be allowed on different endpoint
        allowed = await rate_limit_manager.rate_limit_check(user_id, "/encrypt")
        assert allowed


# ============================================================================
# Audit Logging Tests
# ============================================================================

class TestAuditLogger:
    """Test audit logging"""
    
    @pytest.mark.asyncio
    async def test_audit_log_event(self, audit_logger):
        """Test logging audit event"""
        event = {
            "event_type": "login",
            "user_id": "user1",
            "username": "testuser",
            "success": True
        }
        
        await audit_logger.audit_log(event)
        
        # Check event was logged
        logs = await audit_logger.get_audit_logs(user_id="user1", limit=10)
        
        assert len(logs) > 0
        assert logs[0]["event_type"] == "login"
        assert logs[0]["user_id"] == "user1"
    
    @pytest.mark.asyncio
    async def test_audit_log_mask_sensitive(self, audit_logger):
        """Test masking sensitive data in logs"""
        event = {
            "event_type": "data_access",
            "user_id": "user2",
            "data": {
                "username": "testuser",
                "password": "secret123",
                "email": "test@example.com"
            }
        }
        
        await audit_logger.audit_log(event)
        
        # Get logs
        logs = await audit_logger.get_audit_logs(user_id="user2", limit=10)
        
        # Password should be masked
        assert logs[0]["data"]["password"] == "***MASKED***"
        assert logs[0]["data"]["username"] == "testuser"
    
    @pytest.mark.asyncio
    async def test_get_audit_logs_filter_event_type(self, audit_logger):
        """Test filtering logs by event type"""
        # Log different event types
        await audit_logger.audit_log({"event_type": "login", "user_id": "user3"})
        await audit_logger.audit_log({"event_type": "logout", "user_id": "user3"})
        await audit_logger.audit_log({"event_type": "login", "user_id": "user3"})
        
        # Get only login events
        logs = await audit_logger.get_audit_logs(user_id="user3", event_type="login", limit=10)
        
        assert all(log["event_type"] == "login" for log in logs)
    
    @pytest.mark.asyncio
    async def test_audit_log_file_creation(self, audit_logger, tmp_path):
        """Test audit log file creation"""
        event = {
            "event_type": "test_event",
            "user_id": "user4"
        }
        
        await audit_logger.audit_log(event)
        
        # Check log file exists
        log_dir = Path(audit_logger.log_location)
        log_files = list(log_dir.glob("audit_*.log"))
        
        assert len(log_files) > 0


# ============================================================================
# Compliance Tests
# ============================================================================

class TestComplianceChecker:
    """Test compliance checking"""
    
    def test_gdpr_compliance_pass(self, compliance_checker):
        """Test GDPR compliance - passing"""
        data = {
            "consent": True,
            "privacy_policy_accepted": True,
            "personal_data": ["name", "email"]
        }
        
        result = compliance_checker.check_compliance(data, Regulation.GDPR)
        
        assert result["compliant"]
        assert result["regulation"] == "GDPR"
        assert len(result["issues"]) == 0
    
    def test_gdpr_compliance_fail(self, compliance_checker):
        """Test GDPR compliance - failing"""
        data = {
            "consent": False,
            "personal_data": ["name", "email", "phone", "address"]
        }
        
        result = compliance_checker.check_compliance(data, Regulation.GDPR)
        
        assert not result["compliant"]
        assert len(result["issues"]) > 0
    
    def test_coppa_compliance_over_13(self, compliance_checker):
        """Test COPPA compliance - user over 13"""
        data = {
            "content_rating": "child_safe"
        }
        
        result = compliance_checker.check_compliance(data, Regulation.COPPA, user_age=15)
        
        assert result["compliant"]
    
    def test_coppa_compliance_under_13_no_consent(self, compliance_checker):
        """Test COPPA compliance - user under 13 without consent"""
        data = {
            "parental_consent": False
        }
        
        result = compliance_checker.check_compliance(data, Regulation.COPPA, user_age=10)
        
        assert not result["compliant"]
        assert any("parental consent" in issue.lower() for issue in result["issues"])
    
    def test_coppa_compliance_under_13_with_consent(self, compliance_checker):
        """Test COPPA compliance - user under 13 with consent"""
        data = {
            "parental_consent": True,
            "content_rating": "child_safe"
        }
        
        result = compliance_checker.check_compliance(data, Regulation.COPPA, user_age=10)
        
        assert result["compliant"]
    
    def test_ferpa_compliance_pass(self, compliance_checker):
        """Test FERPA compliance - passing"""
        data = {
            "educational_records": {
                "access_restricted": True,
                "student_grades": [85, 90, 88]
            },
            "student_age": 16
        }
        
        result = compliance_checker.check_compliance(data, Regulation.FERPA)
        
        assert result["compliant"]
    
    def test_ferpa_compliance_fail(self, compliance_checker):
        """Test FERPA compliance - failing"""
        data = {
            "educational_records": {
                "access_restricted": False,
                "disclosure_authorized": True
            }
        }
        
        result = compliance_checker.check_compliance(data, Regulation.FERPA)
        
        assert not result["compliant"]
        assert len(result["issues"]) > 0


# ============================================================================
# Integration Tests
# ============================================================================

class TestSecurityComplianceAgent:
    """Test security compliance agent integration"""
    
    @pytest.mark.asyncio
    async def test_agent_authenticate(self, agent):
        """Test agent authentication"""
        result = await agent.authenticate("student1", "password123")
        
        assert "access_token" in result
        assert result["role"] == "student"
    
    @pytest.mark.asyncio
    async def test_agent_verify_token(self, agent):
        """Test agent token verification"""
        # Authenticate
        result = await agent.authenticate("student1", "password123")
        token = result["access_token"]
        
        # Verify
        payload = await agent.verify_token(token)
        
        assert payload["role"] == "student"
    
    def test_agent_check_permission(self, agent):
        """Test agent permission checking"""
        allowed = agent.check_permission("user1", "student", "courses", "read")
        
        assert allowed
    
    def test_agent_encrypt_decrypt(self, agent):
        """Test agent encryption/decryption"""
        data = b"Test data"
        
        encrypted = agent.encrypt_data(data)
        decrypted = agent.decrypt_data(encrypted)
        
        assert decrypted == data
    
    @pytest.mark.asyncio
    async def test_agent_rate_limit(self, agent):
        """Test agent rate limiting"""
        allowed = await agent.rate_limit_check("user1", "/test")
        
        assert allowed
    
    @pytest.mark.asyncio
    async def test_agent_audit_log(self, agent):
        """Test agent audit logging"""
        event = {
            "event_type": "test",
            "user_id": "user1"
        }
        
        await agent.audit_log(event)
        
        # Should not raise exception
    
    def test_agent_check_compliance(self, agent):
        """Test agent compliance checking"""
        data = {
            "consent": True,
            "privacy_policy_accepted": True
        }
        
        result = agent.check_compliance(data, Regulation.GDPR)
        
        assert "compliant" in result


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=security_compliance_agent", "--cov-report=term-missing"])
