# Security & Compliance Agent

**Production-ready security and compliance system for Learn Your Way platform**

## Overview

The Security & Compliance Agent provides comprehensive security features including JWT authentication, RBAC authorization, encryption, audit logging, and compliance with GDPR, COPPA, and FERPA regulations.

### Key Features

- **JWT Authentication**: Secure token-based authentication with HS256 algorithm
- **RBAC Authorization**: Role-based access control with student/educator/admin roles
- **Rate Limiting**: Per-user and per-endpoint request throttling
- **DDoS Protection**: Connection limits and burst control
- **AES-256-GCM Encryption**: Strong encryption for sensitive data
- **TLS/SSL Support**: Secure transport layer encryption
- **Key Rotation**: Automatic encryption key rotation every 90 days
- **Audit Logging**: Comprehensive security event logging with sensitive field masking
- **GDPR Compliance**: Right to deletion, data portability, 365-day retention
- **COPPA Compliance**: Age verification, parental consent for users under 13
- **FERPA Compliance**: Educational records protection
- **Security Headers**: CSP, HSTS, X-Frame-Options, XSS protection

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Security & Compliance Agent                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Authentication│  │Authorization │  │ Rate Limiter │      │
│  │   Manager    │  │   Manager    │  │   Manager    │      │
│  │              │  │              │  │              │      │
│  │ - JWT tokens │  │ - RBAC perms │  │ - Per-user   │      │
│  │ - Password   │  │ - Roles      │  │ - Per-endpoint│     │
│  │   hashing    │  │ - Resources  │  │ - Burst ctrl │      │
│  │ - Sessions   │  │ - Actions    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Encryption  │  │ Audit Logger │  │  Compliance  │      │
│  │   Manager    │  │   Manager    │  │   Checker    │      │
│  │              │  │              │  │              │      │
│  │ - AES-256-GCM│  │ - Event logs │  │ - GDPR       │      │
│  │ - Key rotate │  │ - Field mask │  │ - COPPA      │      │
│  │ - TLS/SSL    │  │ - Retention  │  │ - FERPA      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            SecurityComplianceAgent (Main)             │  │
│  │                                                        │  │
│  │  - Orchestrates all security components               │  │
│  │  - 9 core functions                                   │  │
│  │  - 9 API endpoints                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
    ┌────────┐           ┌──────────┐          ┌──────────┐
    │ Redis  │           │  Logs    │          │  Other   │
    │ Cache  │           │  Storage │          │  Agents  │
    └────────┘           └──────────┘          └──────────┘
```

## Installation

### Prerequisites

- Python 3.10+
- Redis 6.0+
- OpenSSL (for TLS/SSL)

### Setup

```bash
# Clone repository
cd learn-your-way-platform/agents/security_compliance_agent

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up Redis (if not already running)
# Option 1: Docker
docker run -d -p 6379:6379 redis:latest

# Option 2: Local installation
# macOS: brew install redis && brew services start redis
# Ubuntu: sudo apt install redis-server && sudo systemctl start redis
# Windows: Download from https://redis.io/download
```

### Configuration

1. Copy `config.yaml` and customize settings:

```yaml
agent:
  name: "Security & Compliance Agent"
  version: "1.0.0"
  port: 8017
  host: "localhost"

authentication:
  jwt:
    secret_key: "your-secret-key-change-in-production"
    algorithm: "HS256"
    access_token_expire_minutes: 30
    refresh_token_expire_days: 7
```

2. Set environment variables:

```bash
# JWT secret (required for production)
export JWT_SECRET="your-very-secure-secret-key-here"

# Master encryption key (required for production)
export MASTER_ENCRYPTION_KEY="your-32-byte-hex-key-here"

# Redis URL (optional, defaults to localhost)
export REDIS_URL="redis://localhost:6379/0"

# Config path (optional, defaults to ./config.yaml)
export CONFIG_PATH="/path/to/config.yaml"
```

## Usage

### Starting the Agent

```bash
# Start with default config
python security_compliance_agent.py

# Start with custom config
CONFIG_PATH=/path/to/config.yaml python security_compliance_agent.py

# Start with custom port
uvicorn security_compliance_agent:app --host 0.0.0.0 --port 8017
```

### API Endpoints

#### 1. **POST /auth/login** - User Login

Authenticate user and receive access/refresh tokens.

**Request:**
```json
{
  "username": "student1",
  "password": "password123"
}
```

**Response:**
```json
{
  "user_id": "user_abc123",
  "username": "student1",
  "role": "student",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8017/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "student1", "password": "password123"}'
```

#### 2. **POST /auth/refresh** - Refresh Access Token

Get new access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8017/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

#### 3. **POST /auth/logout** - Logout User

Invalidate access token and refresh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8017/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4. **POST /verify** - Verify Token

Verify JWT token validity.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "valid": true,
  "payload": {
    "user_id": "user_abc123",
    "role": "student",
    "type": "access",
    "iat": "2024-01-01T12:00:00",
    "exp": "2024-01-01T12:30:00",
    "jti": "token_id_123"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8017/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN"}'
```

#### 5. **POST /encrypt** - Encrypt Data

Encrypt sensitive data with AES-256-GCM.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "data": "Sensitive student information",
  "key_id": "key_20240101"
}
```

**Response:**
```json
{
  "encrypted_data": "a2V5XzIwMjQwMTAxfGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWY="
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8017/encrypt \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": "Sensitive information"}'
```

#### 6. **POST /decrypt** - Decrypt Data

Decrypt previously encrypted data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "encrypted_data": "a2V5XzIwMjQwMTAxfGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWY=",
  "key_id": "key_20240101"
}
```

**Response:**
```json
{
  "data": "Sensitive student information"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8017/decrypt \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"encrypted_data": "YOUR_ENCRYPTED_DATA"}'
```

#### 7. **POST /check-permission** - Check RBAC Permission

Check if user has permission for action on resource.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "user_id": "user_abc123",
  "resource": "courses",
  "action": "write"
}
```

**Response:**
```json
{
  "allowed": false,
  "user_id": "user_abc123",
  "resource": "courses",
  "action": "write"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8017/check-permission \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "resource": "courses", "action": "read"}'
```

#### 8. **GET /audit-log** - Get Audit Logs

Retrieve security audit logs (admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `user_id` (optional): Filter by user ID
- `event_type` (optional): Filter by event type (login, logout, etc.)
- `start_date` (optional): Start date (ISO format)
- `end_date` (optional): End date (ISO format)
- `limit` (optional): Max results (default: 100, max: 1000)

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2024-01-01T12:00:00",
      "event_type": "login",
      "user_id": "user_abc123",
      "username": "student1",
      "success": true
    }
  ],
  "count": 1
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8017/audit-log?user_id=user123&limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 9. **POST /compliance-check** - Check Compliance

Check data compliance with regulations.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "data": {
    "consent": true,
    "privacy_policy_accepted": true,
    "personal_data": ["name", "email"]
  },
  "regulation": "gdpr",
  "user_age": 15
}
```

**Response:**
```json
{
  "compliant": true,
  "regulation": "GDPR",
  "issues": [],
  "data_retention_days": 365,
  "rights": {
    "right_to_deletion": true,
    "data_portability": true
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8017/compliance-check \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": {"consent": true}, "regulation": "gdpr"}'
```

## Core Functions

### 1. `authenticate(username: str, password: str)`

Authenticate user and return tokens.

```python
result = await agent.authenticate("student1", "password123")
print(f"Access token: {result['access_token']}")
```

### 2. `generate_token(user_id: str, role: str)`

Generate JWT access token.

```python
token = agent.generate_token("user123", "student")
```

### 3. `verify_token(token: str)`

Verify JWT token validity.

```python
payload = await agent.verify_token(token)
print(f"User ID: {payload['user_id']}")
```

### 4. `check_permission(user_id: str, role: str, resource: str, action: str)`

Check RBAC permission.

```python
allowed = agent.check_permission("user123", "student", "courses", "read")
if allowed:
    print("Access granted")
```

### 5. `encrypt_data(data: bytes, key_id: Optional[str])`

Encrypt data with AES-256-GCM.

```python
data = b"Sensitive information"
encrypted = agent.encrypt_data(data)
```

### 6. `decrypt_data(encrypted: bytes, key_id: Optional[str])`

Decrypt encrypted data.

```python
decrypted = agent.decrypt_data(encrypted)
print(decrypted.decode('utf-8'))
```

### 7. `rate_limit_check(user_id: str, endpoint: str)`

Check if request is within rate limit.

```python
allowed = await agent.rate_limit_check("user123", "/api/courses")
if not allowed:
    raise HTTPException(status_code=429, detail="Too many requests")
```

### 8. `audit_log(event: Dict[str, Any])`

Log security event.

```python
await agent.audit_log({
    "event_type": "data_access",
    "user_id": "user123",
    "resource": "student_records",
    "success": True
})
```

### 9. `check_compliance(data: Dict[str, Any], regulation: Regulation, user_age: Optional[int])`

Check regulatory compliance.

```python
from security_compliance_agent import Regulation

result = agent.check_compliance(
    data={"consent": True, "parental_consent": True},
    regulation=Regulation.COPPA,
    user_age=12
)

if not result["compliant"]:
    print(f"Compliance issues: {result['issues']}")
```

## Authentication & Authorization

### JWT Token Flow

```
1. User Login
   ↓
2. Verify Credentials
   ↓
3. Generate Access Token (30 min expiry)
   ↓
4. Generate Refresh Token (7 day expiry)
   ↓
5. Store Refresh Token in Redis
   ↓
6. Return Tokens to Client
```

### Token Structure

**Access Token Payload:**
```json
{
  "user_id": "user_abc123",
  "role": "student",
  "type": "access",
  "iat": 1704110400,
  "exp": 1704112200,
  "jti": "unique_token_id"
}
```

### RBAC Roles and Permissions

**Student Role:**
- `read:own_profile` - View own profile
- `read:courses` - View available courses
- `read:learning_paths` - View learning paths
- `read:own_progress` - View own progress
- `write:own_progress` - Update own progress
- `read:ai_tutor` - Use AI tutor
- `write:ai_tutor` - Interact with AI tutor

**Educator Role:**
- All student permissions
- `write:courses` - Create/edit courses
- `write:learning_paths` - Create/edit learning paths
- `read:student_progress` - View student progress
- `write:grading` - Grade assignments
- `read:analytics` - View analytics

**Admin Role:**
- `*` - All permissions

### Permission Checking

```python
# Check if educator can write courses
allowed = agent.check_permission(
    user_id="educator123",
    role="educator",
    resource="courses",
    action="write"
)

# Check if student can delete courses (should fail)
allowed = agent.check_permission(
    user_id="student123",
    role="student",
    resource="courses",
    action="delete"
)
```

## Encryption

### AES-256-GCM Encryption

The agent uses AES-256-GCM (Galois/Counter Mode) for authenticated encryption:

- **Algorithm**: AES-256-GCM
- **Key Size**: 256 bits (32 bytes)
- **Nonce Size**: 96 bits (12 bytes)
- **Authentication**: Built-in AEAD

**Encryption Process:**

```
1. Generate random 12-byte nonce
   ↓
2. Create AESGCM cipher with 256-bit key
   ↓
3. Encrypt plaintext with nonce
   ↓
4. Combine key_id | nonce | ciphertext
   ↓
5. Return encrypted blob
```

### Key Rotation

Encryption keys are automatically rotated every 90 days:

```python
# Manual key rotation
agent.encryption_manager.rotate_keys()

# Keys are stored by date: key_20240101
# Old keys are retained for decryption
```

### TLS/SSL Configuration

```yaml
encryption:
  tls:
    enable: true
    cert_file: "/path/to/cert.pem"
    key_file: "/path/to/key.pem"
    ca_file: "/path/to/ca.pem"
```

## Compliance

### GDPR Compliance

**Requirements:**
- User consent for data processing
- Right to deletion (erasure)
- Data portability
- 365-day data retention
- Privacy policy acknowledgment

**Compliance Check:**

```python
result = agent.check_compliance(
    data={
        "consent": True,
        "privacy_policy_accepted": True,
        "personal_data": ["name", "email", "age"]
    },
    regulation=Regulation.GDPR
)

if result["compliant"]:
    print("GDPR compliant")
else:
    print(f"Issues: {result['issues']}")
```

**GDPR Rights Implementation:**

```python
# Right to deletion
async def delete_user_data(user_id: str):
    # Delete all user data
    # Remove from databases
    # Log deletion event
    await agent.audit_log({
        "event_type": "gdpr_deletion",
        "user_id": user_id
    })

# Data portability
async def export_user_data(user_id: str):
    # Export all user data in JSON format
    # Return downloadable file
    pass
```

### COPPA Compliance

**Requirements:**
- Minimum age: 13 years
- Age verification
- Parental consent for users under 13
- Age-appropriate content

**Compliance Check:**

```python
# User over 13 (compliant)
result = agent.check_compliance(
    data={"content_rating": "child_safe"},
    regulation=Regulation.COPPA,
    user_age=15
)

# User under 13 without consent (non-compliant)
result = agent.check_compliance(
    data={"parental_consent": False},
    regulation=Regulation.COPPA,
    user_age=10
)

# User under 13 with consent (compliant)
result = agent.check_compliance(
    data={"parental_consent": True, "content_rating": "child_safe"},
    regulation=Regulation.COPPA,
    user_age=10
)
```

### FERPA Compliance

**Requirements:**
- Educational records protection
- Restricted access to student records
- Written authorization for disclosure
- Student consent (18+ years)
- Parental access (under 18)

**Compliance Check:**

```python
result = agent.check_compliance(
    data={
        "educational_records": {
            "access_restricted": True,
            "student_grades": [85, 90, 88]
        },
        "student_age": 16
    },
    regulation=Regulation.FERPA
)
```

## Audit Logging

### Event Types

- `login` - User login
- `logout` - User logout
- `token_refresh` - Access token refresh
- `permission_check` - RBAC permission check
- `data_encrypted` - Data encryption
- `data_decrypted` - Data decryption
- `compliance_check` - Compliance validation
- `rate_limit_exceeded` - Rate limit violation
- `unauthorized_access` - Unauthorized access attempt

### Sensitive Field Masking

Sensitive fields are automatically masked in logs:

```python
# Original event
event = {
    "event_type": "login",
    "username": "student1",
    "password": "secret123",
    "token": "abc123xyz"
}

# Logged event (masked)
{
    "event_type": "login",
    "username": "student1",
    "password": "***MASKED***",
    "token": "***MASKED***"
}
```

**Masked Fields:**
- `password`
- `token`
- `secret`
- `key`
- `ssn`
- `credit_card`

### Log Retention

- **Redis**: 90 days (configurable)
- **Files**: Permanent (rotate logs manually)
- **Location**: `./logs/audit/audit_YYYYMMDD.log`

### Querying Logs

```python
# Get all logs for user
logs = await agent.audit_logger.get_audit_logs(
    user_id="user123",
    limit=100
)

# Get login events
logs = await agent.audit_logger.get_audit_logs(
    event_type="login",
    start_date="2024-01-01T00:00:00",
    end_date="2024-01-31T23:59:59",
    limit=50
)
```

## Rate Limiting

### Configuration

**Default Limits:**
- 60 requests/minute per user
- 10 burst requests

**Per-Endpoint Limits:**
- `/auth/login`: 5 requests/minute
- `/auth/refresh`: 10 requests/minute
- `/encrypt`: 30 requests/minute
- `/decrypt`: 30 requests/minute
- `/audit-log`: 20 requests/minute
- `/compliance-check`: 30 requests/minute

### Implementation

Rate limits are tracked in Redis with 1-minute sliding windows:

```python
# Check rate limit
allowed = await agent.rate_limit_check("user123", "/api/courses")

if not allowed:
    raise HTTPException(
        status_code=429,
        detail="Too many requests. Please try again later."
    )
```

### Rate Limit Response

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "detail": "Too many requests. Please try again later."
}
```

## Security Headers

The agent automatically adds security headers to all responses:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Testing

### Run Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=security_compliance_agent --cov-report=html

# Run specific test class
pytest tests/test_security_compliance_agent.py::TestAuthenticationManager -v

# Run specific test
pytest tests/test_security_compliance_agent.py::TestAuthenticationManager::test_authenticate_success -v
```

### Test Coverage

Target: 85%+ coverage

**Test Categories:**
- Authentication (8 tests)
- Authorization (6 tests)
- Rate limiting (5 tests)
- Encryption (6 tests)
- Audit logging (4 tests)
- Compliance (6 tests)
- Integration (7 tests)

### Example Test

```python
@pytest.mark.asyncio
async def test_authenticate_success(auth_manager):
    """Test successful authentication"""
    result = await auth_manager.authenticate("student1", "password123")
    
    assert "user_id" in result
    assert "access_token" in result
    assert result["role"] == "student"
```

## Production Deployment

### Environment Setup

```bash
# Generate secure JWT secret (32+ characters)
export JWT_SECRET=$(openssl rand -hex 32)

# Generate master encryption key (32 bytes hex)
export MASTER_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Set production Redis URL
export REDIS_URL="redis://production-redis:6379/0"

# Set config path
export CONFIG_PATH="/etc/security_agent/config.yaml"
```

### Docker Deployment

**Dockerfile:**

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY security_compliance_agent.py .
COPY config.yaml .

EXPOSE 8017

CMD ["uvicorn", "security_compliance_agent:app", "--host", "0.0.0.0", "--port", "8017"]
```

**Build and Run:**

```bash
# Build image
docker build -t security-compliance-agent .

# Run container
docker run -d \
  -p 8017:8017 \
  -e JWT_SECRET="your-secret-key" \
  -e MASTER_ENCRYPTION_KEY="your-encryption-key" \
  -e REDIS_URL="redis://redis:6379/0" \
  --name security-agent \
  security-compliance-agent
```

### Docker Compose

```yaml
version: '3.8'

services:
  security-agent:
    build: .
    ports:
      - "8017:8017"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - MASTER_ENCRYPTION_KEY=${MASTER_ENCRYPTION_KEY}
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Security Hardening

**1. Use Strong Secrets:**
```bash
# Never use default secrets in production
# Generate cryptographically secure random secrets
JWT_SECRET=$(openssl rand -hex 32)
MASTER_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

**2. Enable TLS/SSL:**
```yaml
encryption:
  tls:
    enable: true
    cert_file: "/path/to/fullchain.pem"
    key_file: "/path/to/privkey.pem"
```

**3. Configure Firewall:**
```bash
# Allow only HTTPS traffic
sudo ufw allow 443/tcp
sudo ufw deny 8017/tcp  # Block direct access
```

**4. Use Reverse Proxy:**

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name security.example.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://localhost:8017;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**5. Rate Limiting at Infrastructure Level:**
```nginx
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

location /auth/login {
    limit_req zone=auth burst=3;
    proxy_pass http://localhost:8017;
}
```

**6. Monitor Audit Logs:**
```bash
# Set up log monitoring and alerting
# Send alerts for suspicious activities
# Regular log analysis for security threats
```

**7. Regular Key Rotation:**
```bash
# Rotate encryption keys every 90 days
# Rotate JWT secret periodically
# Update TLS certificates before expiry
```

## Integration Examples

### FastAPI Integration

```python
from fastapi import FastAPI, Depends, HTTPException
from security_compliance_agent import SecurityComplianceAgent

app = FastAPI()
security_agent = SecurityComplianceAgent("config.yaml")

@app.on_event("startup")
async def startup():
    await security_agent.initialize()

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = await security_agent.verify_token(token)
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    # Check permission
    if not security_agent.check_permission(
        current_user["user_id"],
        current_user["role"],
        "protected_resource",
        "read"
    ):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return {"message": "Access granted"}
```

### Microservices Integration

```python
import httpx

async def call_protected_service(access_token: str):
    """Call another service with authentication"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://other-service/api/data",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        return response.json()
```

## Troubleshooting

### Common Issues

**1. Redis Connection Error:**
```
Error: Redis connection refused
```

**Solution:**
```bash
# Check Redis is running
redis-cli ping

# Start Redis if not running
# Docker: docker start redis
# Linux: sudo systemctl start redis
```

**2. JWT Verification Failed:**
```
Error: Invalid token
```

**Solution:**
```bash
# Ensure JWT_SECRET matches between token generation and verification
# Check token hasn't expired
# Verify token hasn't been blacklisted
```

**3. Rate Limit Not Working:**
```
Warning: Rate limit check always returns True
```

**Solution:**
```bash
# Check Redis connection
# Verify Redis keys are being created:
redis-cli KEYS "ratelimit:*"
```

**4. Encryption Key Not Found:**
```
Error: Encryption key not found: key_20240101
```

**Solution:**
```bash
# Set MASTER_ENCRYPTION_KEY environment variable
export MASTER_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Restart agent
```

**5. Permission Always Denied:**
```
Error: Permission denied for resource
```

**Solution:**
```yaml
# Check RBAC configuration in config.yaml
# Verify role has correct permissions
authorization:
  rbac:
    permissions:
      student:
        - "read:courses"  # Add required permission
```

## Performance Optimization

### Redis Connection Pooling

```yaml
redis:
  max_connections: 50
  socket_timeout: 5
  socket_connect_timeout: 5
```

### Token Caching

Cache verified tokens to reduce database lookups:

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_cached_user_permissions(role: str):
    return security_agent.authz_manager.get_user_permissions(role)
```

### Batch Audit Logging

Buffer audit logs and write in batches:

```python
# Implement buffered logging for high-throughput scenarios
```

## Monitoring and Alerting

### Health Check

```bash
curl http://localhost:8017/health
```

### Metrics to Monitor

- Authentication success/failure rate
- Token generation rate
- Rate limit violations
- Encryption/decryption latency
- Compliance check failures
- Redis connection status
- Audit log write latency

### Prometheus Metrics (Future Enhancement)

```python
# Example metrics
auth_attempts_total
auth_failures_total
tokens_generated_total
rate_limit_exceeded_total
compliance_checks_total
compliance_failures_total
```

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/learn-your-way/platform
- Documentation: https://docs.learnyourway.com
- Email: security@learnyourway.com

## Version History

### 1.0.0 (Current)
- Initial release
- JWT authentication with HS256
- RBAC authorization
- AES-256-GCM encryption
- Rate limiting
- Audit logging
- GDPR/COPPA/FERPA compliance
- 9 core functions
- 9 API endpoints
- Comprehensive testing (85%+ coverage)
