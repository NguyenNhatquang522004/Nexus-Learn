# Local AI Agent

Production-ready privacy-first AI agent with complete offline capability using Ollama and LLaMA3.

## Overview

The Local AI Agent provides secure, privacy-compliant AI inference for sensitive educational data. All processing happens locally with no cloud transmission, ensuring student data privacy and compliance with GDPR, COPPA, and FERPA regulations.

### Key Features

- **Complete Offline Operation**: All inference happens locally via Ollama
- **Privacy Compliance**: GDPR, COPPA, FERPA compliant
- **Local LLaMA3 Inference**: No external API calls
- **Model Quantization**: 4-bit/8-bit quantization for efficiency
- **Sensitive Data Handling**: Automatic detection and encryption
- **AES-256 Encryption**: Military-grade encryption for responses
- **Data Anonymization**: PII removal and anonymization
- **Memory Optimization**: GPU/CPU fallback with smart memory management
- **Response Caching**: Offline response caching
- **Zero Data Retention**: No query logging or storage

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Local AI Agent                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Ollama     │  │   Privacy    │  │  Encryption  │      │
│  │   LLaMA3     │  │   Checker    │  │   Manager    │      │
│  │              │  │              │  │              │      │
│  │ Local Models │  │ GDPR/COPPA/  │  │  AES-256     │      │
│  │ 4-bit Quant  │  │    FERPA     │  │  PBKDF2      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Anonymize    │  │   Model      │  │   Cache      │      │
│  │   Engine     │  │   Manager    │  │   Manager    │      │
│  │              │  │              │  │              │      │
│  │ PII Removal  │  │ Memory Opt   │  │ Offline Mode │      │
│  │ Hash IDs     │  │ GPU/CPU      │  │ LRU Eviction │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │              Processing Pipeline                   │      │
│  │                                                     │      │
│  │  Query → Privacy Check → Local Inference →        │      │
│  │  Encrypt (if sensitive) → Cache → Return          │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │            FastAPI Endpoints (localhost)           │      │
│  │                                                     │      │
│  │  /inference, /sensitive-query, /encrypt,          │      │
│  │  /privacy-check, /offline-status, /anonymize,     │      │
│  │  /model-info                                       │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
                   No Cloud Access
                   All Data Local
```

### Privacy Workflow

1. **Query Submission**: User submits query with sensitive data
2. **Sensitive Data Detection**: Automatic detection of PII, learning disabilities, behavioral data
3. **Privacy Compliance Check**: GDPR/COPPA/FERPA validation
4. **Local Inference**: Ollama LLaMA3 inference (no cloud)
5. **Encryption**: AES-256 encryption for sensitive responses
6. **Anonymization**: Optional PII removal
7. **Caching**: Offline response caching
8. **Response Return**: Encrypted or plain response

## Installation

### Prerequisites

- **Python**: 3.9+
- **Ollama**: Latest version
- **RAM**: 8GB+ recommended
- **Storage**: 10GB+ for models
- **GPU**: Optional (NVIDIA recommended for faster inference)

### Step 1: Install Ollama

**Windows**:
```powershell
# Download from https://ollama.ai/download
# Run installer
```

**macOS**:
```bash
brew install ollama
```

**Linux**:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Pull LLaMA3 Model

```bash
# Start Ollama service
ollama serve

# Pull LLaMA3 8B model (4-bit quantized)
ollama pull llama3:8b

# Or 4-bit quantized version explicitly
ollama pull llama3:8b-q4_0
```

### Step 3: Install Python Dependencies

```bash
# Clone repository
git clone <repository>
cd learn-your-way-platform/agents/local_ai_agent

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Configure Agent

```bash
# Edit config.yaml
# Ensure Ollama URL is correct (default: http://localhost:11434)
```

### Step 5: Start Agent

```bash
# Start agent (localhost only)
python local_ai_agent.py
```

### Step 6: Verify

```bash
# Health check
curl http://127.0.0.1:8014/health

# Model info
curl http://127.0.0.1:8014/model-info
```

## Configuration

### Complete config.yaml

```yaml
agent:
  name: "local_ai_agent"
  version: "1.0.0"
  port: 8014
  host: "127.0.0.1"  # localhost only for security

models:
  ollama:
    base_url: "http://localhost:11434"
    model: "llama3:8b"
    temperature: 0.7
    context_length: 4096
  
  quantization:
    enable: true
    bits: 4  # 4-bit or 8-bit
    gpu_memory_fraction: 0.8

privacy:
  compliance:
    - GDPR
    - COPPA
    - FERPA
  
  sensitive_data_types:
    - student_personal_info
    - learning_difficulties
    - behavioral_data
    - family_information
  
  encryption:
    enable: true
    algorithm: "AES-256"
    key_rotation_days: 90

offline_mode:
  enable: true
  cache_responses: true
  cache_ttl: 86400  # 24 hours
  fallback_behavior: "cached_only"

data_retention:
  log_queries: false
  store_sensitive_data: false
  auto_delete_after_days: 0

resource_management:
  max_concurrent_requests: 4
  gpu_memory_limit_gb: 8
  cpu_fallback: true
```

### Configuration Options

#### Models
- `ollama.base_url`: Ollama API URL (default: http://localhost:11434)
- `ollama.model`: Model name (llama3:8b recommended)
- `ollama.temperature`: Sampling temperature (0.0-2.0)
- `quantization.bits`: Quantization bits (4 or 8)

#### Privacy
- `compliance`: Privacy standards to enforce
- `sensitive_data_types`: Types of sensitive data to detect
- `encryption.algorithm`: Encryption algorithm (AES-256)
- `encryption.key_rotation_days`: Key rotation period

#### Offline Mode
- `enable`: Enable offline operation
- `cache_responses`: Cache inference responses
- `cache_ttl`: Cache time-to-live (seconds)
- `fallback_behavior`: Behavior when offline (cached_only, error)

#### Data Retention
- `log_queries`: Whether to log queries (false recommended)
- `store_sensitive_data`: Whether to store sensitive data (false)
- `auto_delete_after_days`: Auto-delete period (0 = immediate)

## API Usage

### Base URL
```
http://127.0.0.1:8014
```

### 1. Local Inference

**POST /inference**

Perform local inference without sensitive data handling.

**Request**:
```bash
curl -X POST http://127.0.0.1:8014/inference \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain photosynthesis",
    "user_id": "teacher_001",
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

**Response**:
```json
{
  "response": "Photosynthesis is the process...",
  "model": "llama3:8b",
  "inference_time": 1.23,
  "cached": false,
  "timestamp": 1234567890.0
}
```

### 2. Sensitive Query Processing

**POST /sensitive-query**

Process queries with sensitive student data.

**Request**:
```bash
curl -X POST http://127.0.0.1:8014/sensitive-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Student has ADHD and requires IEP accommodations",
    "user_id": "teacher_001",
    "data_types": ["learning_difficulties"],
    "consent_provided": true
  }'
```

**Response**:
```json
{
  "success": true,
  "response": null,
  "encrypted_response": {
    "encrypted_data": "a1b2c3...",
    "iv": "d4e5f6...",
    "salt": "g7h8i9...",
    "algorithm": "AES-256",
    "timestamp": 1234567890.0
  },
  "sensitive_data_detected": ["learning_difficulties"],
  "compliance_check": {
    "compliant": true,
    "standards_met": ["GDPR", "COPPA", "FERPA"]
  },
  "inference_time": 1.45,
  "model": "llama3:8b"
}
```

### 3. Encrypt Response

**POST /encrypt**

Encrypt arbitrary data.

**Request**:
```bash
curl -X POST http://127.0.0.1:8014/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Sensitive student information",
    "user_key": "teacher_secure_key_123"
  }'
```

**Response**:
```json
{
  "encrypted_data": "x9y8z7...",
  "iv": "a1b2c3...",
  "salt": "d4e5f6...",
  "algorithm": "AES-256",
  "timestamp": 1234567890.0
}
```

### 4. Privacy Compliance Check

**POST /privacy-check**

Check if data meets privacy compliance standards.

**Request**:
```bash
curl -X POST http://127.0.0.1:8014/privacy-check \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "query": "Student email: john@example.com",
      "consent_provided": true,
      "age": 10,
      "parental_consent": true,
      "legitimate_educational_interest": true
    },
    "standards": ["GDPR", "COPPA", "FERPA"]
  }'
```

**Response**:
```json
{
  "compliant": true,
  "standards_met": ["GDPR", "COPPA", "FERPA"],
  "violations": [],
  "sensitive_data_found": ["student_personal_info"],
  "recommendations": ["Encrypt sensitive data before transmission"]
}
```

### 5. Offline Status

**GET /offline-status**

Get offline mode status.

**Request**:
```bash
curl http://127.0.0.1:8014/offline-status
```

**Response**:
```json
{
  "offline_mode_enabled": true,
  "cache_enabled": true,
  "cache_size": 42,
  "fallback_behavior": "cached_only"
}
```

### 6. Anonymize Data

**POST /anonymize**

Anonymize sensitive data.

**Request**:
```bash
curl -X POST http://127.0.0.1:8014/anonymize \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "student_name": "John Doe",
      "email": "john@example.com",
      "ssn": "123-45-6789",
      "phone": "555-1234"
    },
    "fields_to_anonymize": ["student_name", "email", "ssn", "phone"]
  }'
```

**Response**:
```json
{
  "anonymized_data": {
    "student_name": "Student_a1b2c3d4",
    "email": "user_e5f6g7h8@anonymous.local",
    "ssn": "XXX-XX-XXXX",
    "phone": "XXX-XXX-XXXX"
  }
}
```

### 7. Model Information

**GET /model-info**

Get model and resource information.

**Request**:
```bash
curl http://127.0.0.1:8014/model-info
```

**Response**:
```json
{
  "model": "llama3:8b",
  "base_url": "http://localhost:11434",
  "temperature": 0.7,
  "context_length": 4096,
  "quantization_bits": 4,
  "model_loaded": true,
  "active_inferences": 0,
  "memory_usage": {
    "ram_used_gb": 3.2,
    "ram_percent": 40.5,
    "gpu_memory": {
      "allocated": 2.1,
      "reserved": 2.5,
      "total": 8.0
    },
    "cpu_percent": 15.3
  }
}
```

## Ollama Setup

### Model Options

**LLaMA3 Variants**:
- `llama3:8b` - 8 billion parameters (recommended)
- `llama3:8b-q4_0` - 4-bit quantized (~4GB RAM)
- `llama3:8b-q8_0` - 8-bit quantized (~8GB RAM)
- `llama3:70b` - 70 billion parameters (requires 40GB+ RAM)

### Quantization

**4-bit Quantization** (Recommended):
- Memory: ~4GB RAM
- Speed: Fast inference
- Quality: Good for most tasks

**8-bit Quantization**:
- Memory: ~8GB RAM
- Speed: Moderate inference
- Quality: Better accuracy

**No Quantization**:
- Memory: 16GB+ RAM
- Speed: Slower inference
- Quality: Best accuracy

### GPU Acceleration

**NVIDIA GPUs** (Recommended):
```bash
# Ollama automatically detects NVIDIA GPUs
# Ensure CUDA drivers installed
```

**AMD GPUs**:
```bash
# Limited support, check Ollama documentation
```

**CPU Only**:
```bash
# Works but slower
# Set cpu_fallback: true in config
```

### Performance Tuning

**config.yaml**:
```yaml
models:
  quantization:
    enable: true
    bits: 4  # Lower for less memory
    gpu_memory_fraction: 0.8  # Adjust GPU usage
  
resource_management:
  max_concurrent_requests: 4  # Lower for less memory
  gpu_memory_limit_gb: 8  # Adjust based on GPU
```

## Privacy Compliance

### GDPR Compliance

**Requirements**:
- ✅ Consent required for data processing
- ✅ Right to erasure (no data retention)
- ✅ Data portability (export capability)
- ✅ Encryption at rest and in transit
- ✅ Data minimization
- ✅ Privacy by design

**Implementation**:
```python
# All queries checked for consent
data = {
    "consent_provided": True,
    "data_retention_policy": True
}

result = agent.check_privacy_compliance(data)
# result.compliant == True if all requirements met
```

### COPPA Compliance

**Requirements**:
- ✅ Parental consent for users under 13
- ✅ Limited data collection
- ✅ No marketing to children
- ✅ Data security

**Implementation**:
```python
# Check age and parental consent
data = {
    "age": 10,
    "parental_consent": True
}

result = agent.check_privacy_compliance(data, [ComplianceStandard.COPPA])
```

### FERPA Compliance

**Requirements**:
- ✅ Legitimate educational interest
- ✅ Student record protection
- ✅ Parent access rights
- ✅ Secure transmission

**Implementation**:
```python
# Verify legitimate interest
data = {
    "legitimate_educational_interest": True,
    "student_records": True
}

result = agent.check_privacy_compliance(data, [ComplianceStandard.FERPA])
```

## Sensitive Data Handling

### Detection

**Automatic Detection**:
- Student personal information (SSN, ID, email, phone)
- Learning difficulties (ADHD, dyslexia, IEP)
- Behavioral data (suspensions, counseling)
- Family information (parent names, income)

**Example**:
```python
text = "Student ID: 12345, has ADHD"
detected = privacy_checker.detect_sensitive_data(text)
# detected = [SensitiveDataType.STUDENT_PERSONAL_INFO, 
#             SensitiveDataType.LEARNING_DIFFICULTIES]
```

### Encryption

**AES-256 Encryption**:
```python
# Encrypt sensitive response
encrypted = agent.encrypt_response(
    response="Sensitive information",
    user_key="secure_key_123"
)

# encrypted contains:
# - encrypted_data (hex string)
# - iv (initialization vector)
# - salt (for key derivation)
```

**Decryption**:
```python
# Decrypt response
decrypted = encryption_manager.decrypt(
    encrypted_data=encrypted["encrypted_data"],
    iv=encrypted["iv"],
    salt=encrypted["salt"],
    user_key="secure_key_123"
)
```

### Anonymization

**Automatic PII Removal**:
```python
data = {
    "student_name": "John Doe",
    "email": "john@example.com",
    "ssn": "123-45-6789"
}

anonymized = agent.anonymize_data(data)
# {
#   "student_name": "Student_a1b2c3d4",
#   "email": "user_e5f6g7h8@anonymous.local",
#   "ssn": "XXX-XX-XXXX"
# }
```

## Offline Operation

### Complete Offline Mode

**Enable**:
```yaml
offline_mode:
  enable: true
  cache_responses: true
  cache_ttl: 86400
  fallback_behavior: "cached_only"
```

**Benefits**:
- No internet required
- All data stays local
- Faster responses (cached)
- Complete privacy

### Caching

**Cache Management**:
```python
# Automatic caching on first request
result1 = await agent.local_inference("What is AI?", "user_001")
# cached = False

# Second request returns cached response
result2 = await agent.local_inference("What is AI?", "user_001")
# cached = True, inference_time = 0.0
```

**Cache Expiration**:
- TTL: 24 hours (configurable)
- LRU eviction when full
- Manual clearing available

## Testing

### Run Tests

```bash
# All tests
pytest tests/ -v

# With coverage
pytest tests/ -v --cov=local_ai_agent

# Specific test class
pytest tests/test_local_ai_agent.py::TestPrivacyChecker -v

# Privacy tests only
pytest tests/ -v -k "privacy"
```

### Test Coverage

**Test Classes**:
- `TestEncryptionManager`: 4 tests
- `TestPrivacyChecker`: 9 tests
- `TestAnonymizationEngine`: 5 tests
- `TestModelManager`: 3 tests
- `TestLocalAIAgent`: 4 tests
- `TestAPIEndpoints`: 1 test
- `TestIntegration`: 1 test

**Total**: 27 tests

## Troubleshooting

### Common Issues

**1. Ollama Not Running**
```
Error: Ollama is not running
```
**Solution**: Start Ollama service
```bash
ollama serve
```

**2. Model Not Found**
```
Error: Model llama3:8b not found
```
**Solution**: Pull model
```bash
ollama pull llama3:8b
```

**3. Out of Memory**
```
Error: CUDA out of memory
```
**Solution**: Use lower quantization
```yaml
quantization:
  bits: 4  # Lower from 8 to 4
```

**4. Slow Inference**
```
Inference taking > 10s
```
**Solution**: Enable GPU or use smaller model
```bash
# Check GPU detection
nvidia-smi

# Or use smaller model
ollama pull llama3:8b-q4_0
```

**5. Privacy Check Failing**
```
Error: Privacy compliance check failed
```
**Solution**: Ensure consent provided
```json
{
  "consent_provided": true,
  "parental_consent": true
}
```

## Production Deployment

### Requirements

- **CPU**: 4+ cores
- **RAM**: 16GB+ (8GB minimum with 4-bit quantization)
- **Storage**: 20GB+
- **GPU**: NVIDIA recommended (8GB+ VRAM)

### Security

- **Localhost Only**: Agent binds to 127.0.0.1
- **No External Access**: No internet connection required
- **Encryption**: AES-256 for all sensitive data
- **Zero Logging**: No query logging by default
- **Immediate Deletion**: No data retention

### Monitoring

```bash
# Memory usage
curl http://127.0.0.1:8014/model-info

# Cache status
curl http://127.0.0.1:8014/offline-status

# Health check
curl http://127.0.0.1:8014/health
```

### Scaling

**Not Recommended**:
- Local AI Agent designed for single-instance deployment
- Privacy-first design requires localhost only
- Scaling would compromise offline/local guarantees

**Alternatives**:
- Deploy one instance per machine
- Use for sensitive queries only
- Route non-sensitive queries to cloud agents

## License

MIT License

## Support

For issues and questions:
- GitHub Issues: [link]
- Documentation: [link]
- Email: support@learnyourway.com
