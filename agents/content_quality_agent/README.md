# Content Quality Agent

Production-ready agent for comprehensive content validation in the Learn Your Way Platform.

## Overview

The Content Quality Agent ensures all educational content meets high standards for accuracy, safety, originality, and inclusivity. It uses multiple AI/ML models and algorithms to validate content before it reaches learners.

### Key Features

- **Fact-Checking**: Verify factual claims against Knowledge Graph API
- **Safety Scanning**: Age-appropriate content filtering with COPPA compliance
- **Plagiarism Detection**: Embedding-based similarity detection
- **Bias Detection**: Multi-type bias identification (gender, racial, cultural, age, socioeconomic)
- **Quality Scoring**: Weighted quality metrics with pass/fail thresholds
- **Human Review Queue**: Priority-based review workflow for flagged content
- **Real-time Validation**: FastAPI endpoints for immediate content checks
- **Batch Processing**: Efficient validation of multiple content items

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Quality Agent                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Fact Checker │  │Safety Checker│  │Plagiarism    │      │
│  │              │  │              │  │Detector      │      │
│  │ Knowledge    │  │ Detoxify     │  │ Sentence     │      │
│  │ Graph API    │  │ Models       │  │ Transformers │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Bias         │  │ Quality      │  │ Human Review │      │
│  │ Detector     │  │ Scorer       │  │ Queue        │      │
│  │              │  │              │  │              │      │
│  │ BERT Models  │  │ Weighted     │  │ Priority     │      │
│  │              │  │ Factors      │  │ System       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │              Validation Pipeline                   │      │
│  │                                                     │      │
│  │  Input → Validate → Score → Queue (if needed)     │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │                  FastAPI Endpoints                 │      │
│  │                                                     │      │
│  │  /validate, /fact-check, /safety-check,           │      │
│  │  /plagiarism-check, /bias-check, /quality-score,  │      │
│  │  /review-queue, /approve/{content_id}             │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Validation Workflow

1. **Content Submission**: Content submitted via API
2. **Fact-Checking**: Claims extracted and verified against Knowledge Graph
3. **Safety Scanning**: Toxicity, profanity, violence, NSFW, hate speech detection
4. **Plagiarism Check**: Similarity comparison with known content
5. **Bias Detection**: Multi-type bias pattern matching
6. **Quality Scoring**: Weighted scoring across all factors
7. **Review Decision**: Auto-approve or queue for human review
8. **Result Return**: Complete validation report returned

## Installation

### Prerequisites

- **Python**: 3.9+
- **Knowledge Graph API**: Running at http://localhost:8010
- **RAM**: 4GB+ (for ML models)
- **Storage**: 2GB+ (for model downloads)

### Quick Start

1. **Clone repository**:
```bash
git clone <repository>
cd learn-your-way-platform/agents/content_quality_agent
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Configure agent**:
```bash
# Edit config.yaml with your settings
nano config.yaml
```

4. **Start agent**:
```bash
python content_quality_agent.py
```

5. **Verify running**:
```bash
curl http://localhost:8013/health
```

### Docker Setup

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY content_quality_agent.py config.yaml ./

# Expose port
EXPOSE 8013

# Run agent
CMD ["python", "content_quality_agent.py"]
```

Build and run:
```bash
docker build -t content-quality-agent .
docker run -p 8013:8013 -v $(pwd)/config.yaml:/app/config.yaml content-quality-agent
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: content-quality-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: content-quality-agent
  template:
    metadata:
      labels:
        app: content-quality-agent
    spec:
      containers:
      - name: agent
        image: content-quality-agent:latest
        ports:
        - containerPort: 8013
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
        volumeMounts:
        - name: config
          mountPath: /app/config.yaml
          subPath: config.yaml
      volumes:
      - name: config
        configMap:
          name: content-quality-config
```

## Configuration

### Complete config.yaml

```yaml
agent:
  name: "content_quality_agent"
  version: "1.0.0"
  port: 8013
  host: "0.0.0.0"

fact_checking:
  enable: true
  knowledge_graph_api: "http://localhost:8010"
  min_confidence: 0.8
  max_claims: 50
  verify_claims: true
  cache_ttl: 3600

safety:
  age_filter:
    enable: true
    min_age: 6
    max_age: 18
    coppa_compliance: true
  
  content_filters:
    - profanity
    - violence
    - nsfw
    - hate_speech
    - self_harm
  
  models:
    detoxify: "unitary/toxic-bert"
    nsfw_detector: "Falconsai/nsfw_image_detection"
  
  toxicity_thresholds:
    age_6_below: 0.05
    age_6_12: 0.2
    age_13_15: 0.4
    age_16_plus: 0.6

plagiarism:
  enable: true
  similarity_threshold: 0.7
  check_sources:
    - wikipedia
    - educational_db
    - scientific_journals
  embedding_model: "sentence-transformers/all-MiniLM-L6-v2"

bias_detection:
  enable: true
  types:
    - gender
    - racial
    - cultural
    - age
    - socioeconomic
  model: "bert-base-uncased"
  threshold: 0.6
  sensitivity_levels:
    low: 0.7
    medium: 0.6
    high: 0.4

quality_scoring:
  min_score: 0.7
  factors:
    accuracy: 0.3
    safety: 0.3
    originality: 0.2
    bias_free: 0.2
  grade_levels:
    elementary: [1, 5]
    middle_school: [6, 8]
    high_school: [9, 12]

human_review:
  trigger_threshold: 0.6
  queue_size: 100
  priority:
    - safety_fail
    - low_quality
    - bias_detected
    - plagiarism
    - fact_check_fail
  auto_approve_threshold: 0.85

caching:
  enable: true
  ttl: 3600
  max_entries: 1000

batch_processing:
  enable: true
  max_batch_size: 10
  timeout: 60
```

### Configuration Options

#### Fact-Checking
- `enable`: Enable fact-checking (true/false)
- `knowledge_graph_api`: Knowledge Graph API URL
- `min_confidence`: Minimum confidence for verified claims (0.0-1.0)
- `max_claims`: Maximum claims to extract per content

#### Safety
- `age_filter.coppa_compliance`: COPPA compliance for under-13 users
- `content_filters`: Types of unsafe content to detect
- `toxicity_thresholds`: Age-specific toxicity tolerances

#### Plagiarism
- `similarity_threshold`: Minimum similarity to flag as plagiarism (0.0-1.0)
- `check_sources`: Sources to check against
- `embedding_model`: Sentence transformer model

#### Bias Detection
- `types`: Types of bias to detect
- `threshold`: Minimum score to flag as biased (0.0-1.0)
- `sensitivity_levels`: Adjustable sensitivity

#### Quality Scoring
- `min_score`: Minimum score to pass (0.0-1.0)
- `factors`: Weighted factors for overall score

#### Human Review
- `trigger_threshold`: Score below which content requires review
- `priority`: Review priority order

## API Usage

### Base URL
```
http://localhost:8013
```

### 1. Complete Validation

**POST /validate**

Comprehensive validation of content.

**Request**:
```bash
curl -X POST http://localhost:8013/validate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Water is H2O. The water cycle is important.",
    "content_type": "text",
    "target_age": 10,
    "metadata": {
      "author": "teacher_001",
      "subject": "science"
    }
  }'
```

**Response**:
```json
{
  "content_id": "abc123...",
  "passed": true,
  "quality_score": {
    "overall_score": 0.87,
    "accuracy_score": 0.9,
    "safety_score": 0.95,
    "originality_score": 0.8,
    "bias_free_score": 0.85,
    "passed": true
  },
  "fact_check": {
    "verified_count": 2,
    "unverified_count": 0,
    "confidence": 0.9,
    "passed": true
  },
  "safety_check": {
    "age_appropriate": true,
    "toxicity_score": 0.05,
    "passed": true
  },
  "plagiarism_check": {
    "similarity_score": 0.3,
    "is_plagiarized": false,
    "passed": true
  },
  "bias_check": {
    "overall_bias_score": 0.1,
    "biases_found": [],
    "passed": true
  },
  "requires_human_review": false,
  "timestamp": 1234567890.0
}
```

### 2. Fact-Checking

**POST /fact-check**

Verify factual claims.

**Request**:
```bash
curl -X POST http://localhost:8013/fact-check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "The Earth orbits the Sun.",
    "claims": ["The Earth orbits the Sun"]
  }'
```

**Response**:
```json
{
  "verified_count": 1,
  "unverified_count": 0,
  "confidence": 0.95,
  "claims": [
    {
      "claim": "The Earth orbits the Sun",
      "verified": true,
      "confidence": 0.95,
      "sources": ["wikipedia", "nasa"]
    }
  ],
  "passed": true
}
```

### 3. Safety Check

**POST /safety-check**

Check content safety.

**Request**:
```bash
curl -X POST http://localhost:8013/safety-check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Educational science content.",
    "target_age": 10
  }'
```

**Response**:
```json
{
  "age_appropriate": true,
  "issues_found": [],
  "toxicity_score": 0.02,
  "profanity_detected": false,
  "violence_detected": false,
  "nsfw_detected": false,
  "hate_speech_detected": false,
  "passed": true,
  "details": {
    "toxicity": 0.02,
    "severe_toxicity": 0.01,
    "obscene": 0.01,
    "threat": 0.01,
    "insult": 0.01,
    "identity_attack": 0.01
  }
}
```

### 4. Plagiarism Check

**POST /plagiarism-check**

Detect plagiarism.

**Request**:
```bash
curl -X POST http://localhost:8013/plagiarism-check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Original educational content about chemistry."
  }'
```

**Response**:
```json
{
  "similarity_score": 0.15,
  "matches": [],
  "sources_checked": 100,
  "is_plagiarized": false,
  "passed": true
}
```

### 5. Bias Detection

**POST /bias-check**

Detect biases.

**Request**:
```bash
curl -X POST http://localhost:8013/bias-check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Students of all backgrounds can excel."
  }'
```

**Response**:
```json
{
  "biases_found": [],
  "bias_scores": {
    "gender": 0.05,
    "racial": 0.03,
    "cultural": 0.02,
    "age": 0.04,
    "socioeconomic": 0.03
  },
  "overall_bias_score": 0.03,
  "passed": true,
  "details": {}
}
```

### 6. Quality Score

**POST /quality-score**

Calculate quality score.

**Request**:
```bash
curl -X POST http://localhost:8013/quality-score \
  -H "Content-Type: application/json" \
  -d '{
    "fact_check": {"confidence": 0.9},
    "safety_check": {"toxicity_score": 0.05},
    "plagiarism_check": {"similarity_score": 0.2},
    "bias_check": {"overall_bias_score": 0.1}
  }'
```

**Response**:
```json
{
  "overall_score": 0.87,
  "accuracy_score": 0.9,
  "safety_score": 0.95,
  "originality_score": 0.8,
  "bias_free_score": 0.9,
  "passed": true,
  "breakdown": {
    "accuracy": {"score": 0.9, "weight": 0.3},
    "safety": {"score": 0.95, "weight": 0.3},
    "originality": {"score": 0.8, "weight": 0.2},
    "bias_free": {"score": 0.9, "weight": 0.2}
  }
}
```

### 7. Review Queue

**GET /review-queue**

Get queue status.

**Request**:
```bash
curl http://localhost:8013/review-queue
```

**Response**:
```json
{
  "total_items": 5,
  "by_priority": {
    "safety_fail": 2,
    "low_quality": 1,
    "bias_detected": 2
  },
  "next_item": {
    "content_id": "xyz789",
    "priority": "safety_fail",
    "submitted_at": 1234567890.0
  },
  "max_size": 100
}
```

### 8. Approve Content

**POST /approve/{content_id}**

Approve content after review.

**Request**:
```bash
curl -X POST http://localhost:8013/approve/xyz789 \
  -H "Content-Type: application/json" \
  -d '{
    "reviewer_id": "reviewer_001",
    "notes": "Content is appropriate after review."
  }'
```

**Response**:
```json
{
  "success": true,
  "content_id": "xyz789",
  "approved_at": 1234567890.0,
  "approved_by": "reviewer_001"
}
```

## Fact-Checking

### Knowledge Graph Integration

The agent integrates with the Knowledge Graph API to verify factual claims.

**Claim Extraction**:
- Identifies factual sentences using pattern matching
- Extracts claims that can be verified
- Filters out opinions and subjective statements

**Verification Process**:
1. Extract claims from content
2. Send each claim to Knowledge Graph API
3. Receive verification result with confidence score
4. Aggregate results into overall fact-check score

**Example**:
```python
# Claim: "Water is H2O"
# API Request: POST /query
{
  "query": "Water is H2O",
  "verify": true
}

# API Response:
{
  "verified": true,
  "confidence": 0.95,
  "sources": ["wikipedia", "chemistry_db"]
}
```

### Configuration

```yaml
fact_checking:
  knowledge_graph_api: "http://localhost:8010"
  min_confidence: 0.8
  max_claims: 50
  verify_claims: true
```

## Safety Scanning

### COPPA Compliance

The agent enforces COPPA (Children's Online Privacy Protection Act) compliance for users under 13.

**Age-Specific Thresholds**:
- **Under 6**: Toxicity < 0.05 (extremely strict)
- **6-12**: Toxicity < 0.2 (strict, COPPA compliant)
- **13-15**: Toxicity < 0.4 (moderate)
- **16+**: Toxicity < 0.6 (standard)

### Content Filters

**1. Profanity Detection**:
- Regex pattern matching for common profanity
- Context-aware detection
- Language-specific patterns

**2. Violence Detection**:
- Keyword matching (kill, murder, weapon, attack, etc.)
- Intensity scoring
- Context analysis

**3. NSFW Detection**:
- Adult content keywords
- Image analysis (if applicable)
- Context-aware filtering

**4. Hate Speech Detection**:
- Slur detection
- Discriminatory language
- Targeted harassment

**5. Self-Harm Detection**:
- Self-harm keywords
- Crisis intervention triggers
- Mental health awareness

### Toxicity Models

Uses Detoxify (unitary/toxic-bert) for ML-based toxicity detection:
- Toxicity
- Severe toxicity
- Obscene
- Threat
- Insult
- Identity attack

### Example

```python
# Safe content for age 10
content = "The water cycle is an important natural process."
result = await safety_checker.check_safety(content, target_age=10)
# Result: passed=True, toxicity_score=0.02

# Unsafe content for age 10
content = "This damn stupid content..."
result = await safety_checker.check_safety(content, target_age=10)
# Result: passed=False, profanity_detected=True
```

## Plagiarism Detection

### Embedding-Based Similarity

Uses Sentence-Transformers (all-MiniLM-L6-v2) for semantic similarity:

**Process**:
1. Generate embedding for input content
2. Compare with known content embeddings
3. Calculate cosine similarity
4. Flag if similarity > threshold (0.7)

**Cosine Similarity**:
```
similarity = (A · B) / (||A|| * ||B||)
```

### Known Content Database

Maintains in-memory database of known content:
- Wikipedia articles
- Educational databases
- Scientific journals
- Previous submissions

**Add Content**:
```python
detector.add_content(
    content_id="edu_001",
    content="Water cycle explanation...",
    source="wikipedia"
)
```

### Configuration

```yaml
plagiarism:
  similarity_threshold: 0.7
  check_sources:
    - wikipedia
    - educational_db
  embedding_model: "sentence-transformers/all-MiniLM-L6-v2"
```

## Bias Detection

### Bias Types

**1. Gender Bias**:
- Gender stereotypes
- Gendered language
- Assumptions based on gender

**2. Racial Bias**:
- Racial stereotypes
- Discriminatory language
- Cultural appropriation

**3. Cultural Bias**:
- Cultural stereotypes
- Ethnocentrism
- Generalizations

**4. Age Bias**:
- Age stereotypes
- Ageist language
- Assumptions based on age

**5. Socioeconomic Bias**:
- Class stereotypes
- Economic assumptions
- Privilege blindness

### Pattern Matching

**Keywords**: Predefined lists of biased terms
**Stereotypes**: Common stereotypical phrases
**Context Analysis**: Surrounding context evaluation

### Scoring

```
Bias Score = Σ(pattern_matches * weight) / total_patterns
```

**Thresholds**:
- < 0.4: No significant bias
- 0.4 - 0.6: Moderate bias
- > 0.6: Significant bias (flagged)

### Example

```python
# Biased content
content = "Boys are naturally better at math than girls."
result = await bias_detector.detect_bias(content)
# Result: biases_found=[BiasType.GENDER], passed=False

# Unbiased content
content = "Students of all backgrounds can excel in mathematics."
result = await bias_detector.detect_bias(content)
# Result: biases_found=[], passed=True
```

## Quality Scoring

### Weighted Factors

**Formula**:
```
Overall Score = (accuracy × 0.3) + (safety × 0.3) + (originality × 0.2) + (bias_free × 0.2)
```

### Factor Calculation

**Accuracy Score** (30%):
- Based on fact-checking confidence
- Verified claims / total claims
- Source credibility

**Safety Score** (30%):
- Inverse of toxicity score
- Age appropriateness
- Content filter results

**Originality Score** (20%):
- Inverse of plagiarism similarity
- Unique content indicators
- Creative elements

**Bias-Free Score** (20%):
- Inverse of bias score
- Inclusive language
- Fair representation

### Pass/Fail Threshold

- **Minimum Score**: 0.7 (70%)
- **Auto-Approve**: 0.85 (85%)
- **Below Threshold**: Human review required

### Example

```python
quality_score = scorer.calculate_score(
    fact_check,      # confidence: 0.9
    safety_check,    # toxicity: 0.05
    plagiarism_check, # similarity: 0.2
    bias_check       # bias: 0.1
)
# Result: overall_score=0.87, passed=True
```

## Human Review Queue

### Priority System

**Priority Order** (highest to lowest):
1. **SAFETY_FAIL**: Safety violations
2. **LOW_QUALITY**: Below quality threshold
3. **BIAS_DETECTED**: Bias identified
4. **PLAGIARISM**: Plagiarism detected
5. **FACT_CHECK_FAIL**: Unverified claims

### Queue Management

**Add to Queue**:
```python
queue.add_to_queue(
    content_id="xyz789",
    content="Content text...",
    validation_result=result,
    priority=ReviewPriority.SAFETY_FAIL
)
```

**Get Next Item**:
```python
item = queue.get_next_item()
# Returns highest priority item
```

**Approve Content**:
```python
success = queue.approve_content(
    content_id="xyz789",
    reviewer_id="reviewer_001",
    notes="Approved after review"
)
```

### Queue Status

```python
status = queue.get_queue_status()
# {
#   "total_items": 5,
#   "by_priority": {"safety_fail": 2, "low_quality": 1},
#   "next_item": {...},
#   "max_size": 100
# }
```

### Configuration

```yaml
human_review:
  trigger_threshold: 0.6
  queue_size: 100
  priority:
    - safety_fail
    - low_quality
    - bias_detected
```

## Testing

### Run Tests

```bash
# All tests
pytest tests/ -v

# With coverage
pytest tests/ -v --cov=content_quality_agent

# Specific test class
pytest tests/test_content_quality_agent.py::TestFactChecker -v

# Performance tests
pytest tests/test_content_quality_agent.py::TestPerformance -v
```

### Test Coverage

**Target**: 85%+ code coverage

**Test Classes**:
- `TestFactChecker`: 8 tests
- `TestSafetyChecker`: 10 tests
- `TestPlagiarismDetector`: 6 tests
- `TestBiasDetector`: 8 tests
- `TestQualityScorer`: 5 tests
- `TestHumanReviewQueue`: 7 tests
- `TestAPIEndpoints`: 8 tests
- `TestIntegration`: 3 tests
- `TestPerformance`: 2 tests

**Total**: 57 tests

### Example Test

```python
@pytest.mark.asyncio
async def test_check_safe_content(safety_checker):
    content = "The water cycle is important."
    
    result = await safety_checker.check_safety(content, target_age=10)
    
    assert result.passed is True
    assert result.age_appropriate is True
```

## Performance

### Benchmarks

**Single Content Validation**: ~500ms
- Fact-checking: 150ms
- Safety check: 100ms
- Plagiarism: 150ms
- Bias detection: 100ms

**Batch Processing** (10 items): ~2s
- Parallel processing
- Shared model inference
- Efficient caching

**Concurrent Requests**: 100+ req/s
- Async processing
- Connection pooling
- Model batching

### Optimization

**Caching**:
```yaml
caching:
  enable: true
  ttl: 3600
  max_entries: 1000
```

**Batch Processing**:
```yaml
batch_processing:
  enable: true
  max_batch_size: 10
  timeout: 60
```

**Model Loading**:
- Load models at startup
- Keep in memory for fast inference
- Share models across requests

## Troubleshooting

### Common Issues

**1. Models Not Loading**
```
Error: Cannot load Detoxify model
```
**Solution**: Install transformers and torch
```bash
pip install transformers torch detoxify
```

**2. Knowledge Graph API Unreachable**
```
Error: Connection refused to http://localhost:8010
```
**Solution**: Start Knowledge Graph API
```bash
cd ../knowledge_graph_agent
python knowledge_graph_agent.py
```

**3. High Memory Usage**
```
Memory: 8GB+
```
**Solution**: Reduce model size or use quantization
```yaml
models:
  use_quantization: true
  precision: "int8"
```

**4. Slow Validation**
```
Validation taking > 5s
```
**Solution**: Enable caching and batch processing
```yaml
caching:
  enable: true
batch_processing:
  enable: true
```

**5. COPPA Compliance Issues**
```
Error: Age filtering not working
```
**Solution**: Ensure age is provided and COPPA enabled
```yaml
safety:
  age_filter:
    coppa_compliance: true
```

## Production Deployment

### Requirements

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 10GB+
- **Network**: 1Gbps+

### Environment Variables

```bash
export AGENT_PORT=8013
export KG_API_URL=http://localhost:8010
export LOG_LEVEL=INFO
export CACHE_ENABLED=true
```

### Health Monitoring

```bash
# Health check
curl http://localhost:8013/health

# Metrics (Prometheus)
curl http://localhost:8013/metrics
```

### Scaling

**Horizontal Scaling**:
- Deploy multiple instances
- Load balancer (nginx, HAProxy)
- Shared cache (Redis)

**Vertical Scaling**:
- Increase CPU/RAM
- GPU for faster inference
- SSD for faster I/O

### Security

- **API Authentication**: JWT tokens
- **Rate Limiting**: 100 req/min per user
- **Input Validation**: Sanitize all inputs
- **HTTPS**: TLS 1.3+

## License

MIT License

## Support

For issues and questions:
- GitHub Issues: [link]
- Documentation: [link]
- Email: support@learnyourway.com
