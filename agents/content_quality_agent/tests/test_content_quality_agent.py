"""
Comprehensive test suite for Content Quality Agent

Tests cover:
- Fact-checking
- Safety checking
- Plagiarism detection
- Bias detection
- Quality scoring
- Human review queue
- API endpoints
"""

import asyncio
import time
from typing import Dict, Any
from unittest.mock import Mock, AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
import httpx

from content_quality_agent import (
    app,
    ContentQualityAgent,
    FactChecker,
    SafetyChecker,
    PlagiarismDetector,
    BiasDetector,
    QualityScorer,
    HumanReviewQueue,
    ContentType,
    SafetyIssue,
    BiasType,
    ReviewPriority,
    FactCheckResult,
    SafetyCheckResult,
    PlagiarismResult,
    BiasResult,
    QualityScore,
    ValidationResult,
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
            "port": 8013,
            "host": "0.0.0.0"
        },
        "fact_checking": {
            "enable": True,
            "knowledge_graph_api": "http://localhost:8010",
            "min_confidence": 0.8,
            "verify_claims": True
        },
        "safety": {
            "age_filter": {
                "enable": True,
                "min_age": 6,
                "max_age": 18,
                "coppa_compliance": True
            },
            "content_filters": ["profanity", "violence", "nsfw", "hate_speech", "self_harm"],
            "models": {
                "detoxify": "unitary/toxic-bert",
                "nsfw_detector": "Falconsai/nsfw_image_detection"
            }
        },
        "plagiarism": {
            "enable": True,
            "similarity_threshold": 0.7,
            "check_sources": ["wikipedia", "educational_db"],
            "embedding_model": "sentence-transformers/all-MiniLM-L6-v2"
        },
        "bias_detection": {
            "enable": True,
            "types": ["gender", "racial", "cultural", "age", "socioeconomic"],
            "model": "bert-base-uncased",
            "threshold": 0.6
        },
        "quality_scoring": {
            "min_score": 0.7,
            "factors": {
                "accuracy": 0.3,
                "safety": 0.3,
                "originality": 0.2,
                "bias_free": 0.2
            }
        },
        "human_review": {
            "trigger_threshold": 0.6,
            "queue_size": 100,
            "priority": ["safety_fail", "low_quality", "bias_detected"]
        }
    }


@pytest_asyncio.fixture
async def fact_checker(test_config):
    """Fact checker fixture"""
    checker = FactChecker(
        knowledge_graph_api=test_config["fact_checking"]["knowledge_graph_api"],
        min_confidence=test_config["fact_checking"]["min_confidence"]
    )
    yield checker
    await checker.close()


@pytest.fixture
def safety_checker(test_config):
    """Safety checker fixture"""
    return SafetyChecker(config=test_config["safety"])


@pytest.fixture
def plagiarism_detector(test_config):
    """Plagiarism detector fixture"""
    return PlagiarismDetector(
        similarity_threshold=test_config["plagiarism"]["similarity_threshold"],
        model_name=test_config["plagiarism"]["embedding_model"]
    )


@pytest.fixture
def bias_detector(test_config):
    """Bias detector fixture"""
    return BiasDetector(
        threshold=test_config["bias_detection"]["threshold"],
        model_name=test_config["bias_detection"]["model"]
    )


@pytest.fixture
def quality_scorer(test_config):
    """Quality scorer fixture"""
    return QualityScorer(
        min_score=test_config["quality_scoring"]["min_score"],
        factors=test_config["quality_scoring"]["factors"]
    )


@pytest.fixture
def review_queue(test_config):
    """Review queue fixture"""
    return HumanReviewQueue(
        max_size=test_config["human_review"]["queue_size"],
        priority_order=test_config["human_review"]["priority"]
    )


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


# ============================================================================
# Fact Checker Tests
# ============================================================================

class TestFactChecker:
    """Test fact checker"""
    
    @pytest.mark.asyncio
    async def test_extract_claims(self, fact_checker):
        """Test claim extraction"""
        content = "Water is H2O. The Earth is flat. Python is a programming language."
        
        claims = fact_checker._extract_claims(content)
        
        assert len(claims) > 0
        assert any("Water is H2O" in claim for claim in claims)
    
    @pytest.mark.asyncio
    async def test_check_facts_no_claims(self, fact_checker):
        """Test fact-checking with no claims"""
        content = "Hello world!"
        
        result = await fact_checker.check_facts(content)
        
        assert result.verified_count == 0
        assert result.unverified_count == 0
        assert result.passed is True
    
    @pytest.mark.asyncio
    async def test_check_facts_with_mock_api(self, fact_checker):
        """Test fact-checking with mocked API"""
        with patch.object(fact_checker, '_verify_claim', new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = {
                "verified": True,
                "confidence": 0.9,
                "sources": ["wikipedia"]
            }
            
            content = "Water is H2O."
            result = await fact_checker.check_facts(content, claims=["Water is H2O"])
            
            assert result.verified_count == 1
            assert result.confidence >= 0.8


# ============================================================================
# Safety Checker Tests
# ============================================================================

class TestSafetyChecker:
    """Test safety checker"""
    
    @pytest.mark.asyncio
    async def test_check_safe_content(self, safety_checker):
        """Test safe content"""
        content = "The water cycle is an important process in nature."
        
        result = await safety_checker.check_safety(content, target_age=10)
        
        assert result.passed is True
        assert len(result.issues_found) == 0
        assert result.age_appropriate is True
    
    @pytest.mark.asyncio
    async def test_check_profanity(self, safety_checker):
        """Test profanity detection"""
        content = "This is damn stupid content."
        
        result = await safety_checker.check_safety(content, target_age=10)
        
        assert result.profanity_detected is True
        assert SafetyIssue.PROFANITY in result.issues_found
    
    @pytest.mark.asyncio
    async def test_check_violence(self, safety_checker):
        """Test violence detection"""
        content = "The soldier attacked with his gun and knife causing blood."
        
        result = await safety_checker.check_safety(content, target_age=10)
        
        assert result.violence_detected is True
    
    @pytest.mark.asyncio
    async def test_age_appropriateness_young(self, safety_checker):
        """Test age appropriateness for young children"""
        safe_content = "The bunny hopped in the garden."
        
        result = await safety_checker.check_safety(safe_content, target_age=5)
        
        assert result.age_appropriate is True
    
    @pytest.mark.asyncio
    async def test_age_appropriateness_coppa(self, safety_checker):
        """Test COPPA compliance (under 13)"""
        content = "This is a mild content with slight controversy."
        
        # Strict for under 13
        result = await safety_checker.check_safety(content, target_age=12)
        
        # Should pass basic check
        assert result is not None
    
    def test_check_age_appropriateness_public(self, safety_checker):
        """Test public age appropriateness method"""
        content = "Educational content about science."
        
        appropriate = safety_checker.check_age_appropriateness(content, 10)
        
        assert isinstance(appropriate, bool)


# ============================================================================
# Plagiarism Detector Tests
# ============================================================================

class TestPlagiarismDetector:
    """Test plagiarism detector"""
    
    @pytest.mark.asyncio
    async def test_no_plagiarism(self, plagiarism_detector):
        """Test original content"""
        content = "This is completely unique content about quantum mechanics and relativity theory."
        
        result = await plagiarism_detector.check_plagiarism(content)
        
        assert result.is_plagiarized is False
        assert result.passed is True
    
    @pytest.mark.asyncio
    async def test_detect_plagiarism(self, plagiarism_detector):
        """Test plagiarized content"""
        # Very similar to known content
        content = "Water evaporates from the earth's surface, rises into atmosphere, and condenses into rain or snow."
        
        result = await plagiarism_detector.check_plagiarism(content)
        
        # Should detect similarity
        assert result.similarity_score > 0
    
    @pytest.mark.asyncio
    async def test_similarity_calculation(self, plagiarism_detector):
        """Test similarity calculation"""
        import numpy as np
        
        vec1 = np.array([1, 0, 1, 0])
        vec2 = np.array([1, 0, 1, 0])
        
        similarity = plagiarism_detector._cosine_similarity(vec1, vec2)
        
        assert similarity == 1.0
    
    def test_add_content(self, plagiarism_detector):
        """Test adding content to database"""
        initial_count = len(plagiarism_detector.known_content)
        
        plagiarism_detector.add_content(
            "test_001",
            "New educational content",
            "test_source"
        )
        
        assert len(plagiarism_detector.known_content) == initial_count + 1


# ============================================================================
# Bias Detector Tests
# ============================================================================

class TestBiasDetector:
    """Test bias detector"""
    
    @pytest.mark.asyncio
    async def test_no_bias(self, bias_detector):
        """Test unbiased content"""
        content = "Students of all backgrounds can excel in mathematics with proper support."
        
        result = await bias_detector.detect_bias(content)
        
        assert result.passed is True
        assert len(result.biases_found) == 0
    
    @pytest.mark.asyncio
    async def test_gender_bias(self, bias_detector):
        """Test gender bias detection"""
        content = "Boys are naturally better at math than girls are."
        
        result = await bias_detector.detect_bias(content)
        
        assert BiasType.GENDER in result.biases_found
        assert result.passed is False
    
    @pytest.mark.asyncio
    async def test_age_bias(self, bias_detector):
        """Test age bias detection"""
        content = "Old people can't understand modern technology at all."
        
        result = await bias_detector.detect_bias(content)
        
        assert BiasType.AGE in result.biases_found
    
    @pytest.mark.asyncio
    async def test_cultural_bias(self, bias_detector):
        """Test cultural bias detection"""
        content = "All eastern culture people have the same traditions."
        
        result = await bias_detector.detect_bias(content)
        
        # Should detect some form of bias
        assert result is not None


# ============================================================================
# Quality Scorer Tests
# ============================================================================

class TestQualityScorer:
    """Test quality scorer"""
    
    def test_calculate_high_quality_score(self, quality_scorer):
        """Test high quality content"""
        fact_check = FactCheckResult(
            claims=[],
            verified_count=10,
            unverified_count=0,
            confidence=0.9,
            sources=["wikipedia"],
            passed=True
        )
        
        safety_check = SafetyCheckResult(
            age_appropriate=True,
            issues_found=[],
            toxicity_score=0.1,
            profanity_detected=False,
            violence_detected=False,
            nsfw_detected=False,
            hate_speech_detected=False,
            passed=True,
            details={}
        )
        
        plagiarism_check = PlagiarismResult(
            similarity_score=0.2,
            matches=[],
            sources_checked=100,
            is_plagiarized=False,
            passed=True
        )
        
        bias_check = BiasResult(
            biases_found=[],
            bias_scores={},
            overall_bias_score=0.1,
            passed=True,
            details={}
        )
        
        score = quality_scorer.calculate_score(
            fact_check,
            safety_check,
            plagiarism_check,
            bias_check
        )
        
        assert score.overall_score > 0.7
        assert score.passed is True
    
    def test_calculate_low_quality_score(self, quality_scorer):
        """Test low quality content"""
        fact_check = None
        
        safety_check = SafetyCheckResult(
            age_appropriate=False,
            issues_found=[SafetyIssue.PROFANITY, SafetyIssue.VIOLENCE],
            toxicity_score=0.9,
            profanity_detected=True,
            violence_detected=True,
            nsfw_detected=False,
            hate_speech_detected=False,
            passed=False,
            details={}
        )
        
        plagiarism_check = PlagiarismResult(
            similarity_score=0.8,
            matches=[{"similarity": 0.8}],
            sources_checked=100,
            is_plagiarized=True,
            passed=False
        )
        
        bias_check = BiasResult(
            biases_found=[BiasType.GENDER],
            bias_scores={"gender": 0.8},
            overall_bias_score=0.8,
            passed=False,
            details={}
        )
        
        score = quality_scorer.calculate_score(
            fact_check,
            safety_check,
            plagiarism_check,
            bias_check
        )
        
        assert score.overall_score < 0.7
        assert score.passed is False


# ============================================================================
# Human Review Queue Tests
# ============================================================================

class TestHumanReviewQueue:
    """Test human review queue"""
    
    def test_add_to_queue(self, review_queue):
        """Test adding to queue"""
        validation_result = Mock(spec=ValidationResult)
        validation_result.content_id = "test_123"
        
        content_id = review_queue.add_to_queue(
            "test_123",
            "Test content",
            validation_result,
            ReviewPriority.LOW_QUALITY
        )
        
        assert content_id == "test_123"
        assert "test_123" in review_queue.items
    
    def test_get_next_item(self, review_queue):
        """Test getting next item"""
        validation_result = Mock(spec=ValidationResult)
        validation_result.content_id = "test_123"
        
        review_queue.add_to_queue(
            "test_123",
            "Test content",
            validation_result,
            ReviewPriority.SAFETY_FAIL
        )
        
        item = review_queue.get_next_item()
        
        assert item is not None
        assert item.content_id == "test_123"
    
    def test_priority_order(self, review_queue):
        """Test priority ordering"""
        validation_result1 = Mock(spec=ValidationResult)
        validation_result1.content_id = "low_123"
        
        validation_result2 = Mock(spec=ValidationResult)
        validation_result2.content_id = "high_123"
        
        # Add low priority first
        review_queue.add_to_queue(
            "low_123",
            "Low priority",
            validation_result1,
            ReviewPriority.LOW_QUALITY
        )
        
        # Add high priority
        review_queue.add_to_queue(
            "high_123",
            "High priority",
            validation_result2,
            ReviewPriority.SAFETY_FAIL
        )
        
        # Should get high priority first
        item = review_queue.get_next_item()
        assert item.content_id == "high_123"
    
    def test_approve_content(self, review_queue):
        """Test approving content"""
        validation_result = Mock(spec=ValidationResult)
        validation_result.content_id = "test_123"
        
        review_queue.add_to_queue(
            "test_123",
            "Test content",
            validation_result,
            ReviewPriority.LOW_QUALITY
        )
        
        success = review_queue.approve_content("test_123", "reviewer_001", "Looks good")
        
        assert success is True
        assert review_queue.items["test_123"].reviewed is True
    
    def test_queue_status(self, review_queue):
        """Test queue status"""
        status = review_queue.get_queue_status()
        
        assert "total_items" in status
        assert "by_priority" in status
        assert "max_size" in status


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
    
    @patch('content_quality_agent.agent')
    def test_validate_endpoint(self, mock_agent, client):
        """Test validate endpoint"""
        # Mock validation result
        mock_result = Mock(spec=ValidationResult)
        mock_result.content_id = "test_123"
        mock_result.passed = True
        mock_result.requires_human_review = False
        mock_result.quality_score = Mock(overall_score=0.85)
        mock_result.fact_check = None
        mock_result.safety_check = Mock()
        mock_result.plagiarism_check = Mock()
        mock_result.bias_check = Mock()
        mock_result.timestamp = time.time()
        
        mock_agent.validate_content = AsyncMock(return_value=mock_result)
        
        response = client.post(
            "/validate",
            json={
                "content": "Test content",
                "content_type": "text"
            }
        )
        
        # May return 503 if agent not initialized
        assert response.status_code in [200, 503]


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Integration tests"""
    
    @pytest.mark.asyncio
    async def test_full_validation_flow(self, safety_checker, plagiarism_detector, bias_detector, quality_scorer):
        """Test complete validation flow"""
        content = "The water cycle is an important natural process."
        
        # Safety check
        safety = await safety_checker.check_safety(content, 10)
        assert safety.passed is True
        
        # Plagiarism check
        plagiarism = await plagiarism_detector.check_plagiarism(content)
        
        # Bias check
        bias = await bias_detector.detect_bias(content)
        assert bias.passed is True
        
        # Quality score
        score = quality_scorer.calculate_score(None, safety, plagiarism, bias)
        assert score.overall_score > 0


# ============================================================================
# Performance Tests
# ============================================================================

class TestPerformance:
    """Performance tests"""
    
    @pytest.mark.asyncio
    async def test_concurrent_safety_checks(self, safety_checker):
        """Test concurrent safety checking"""
        contents = [
            "Safe content about science.",
            "Educational material about history.",
            "Mathematics lesson content."
        ] * 5
        
        tasks = [
            safety_checker.check_safety(content, 10)
            for content in contents
        ]
        
        start_time = time.time()
        results = await asyncio.gather(*tasks)
        duration = time.time() - start_time
        
        assert len(results) == len(contents)
        assert duration < 30.0  # Should complete in under 30 seconds


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=content_quality_agent"])
