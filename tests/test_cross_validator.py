import unittest
from datetime import datetime

from src.cross_validator.validator import CrossValidator
from src.models.data_models import Claim, Source, SourceType

class TestCrossValidator(unittest.TestCase):
    def setUp(self):
        self.validator = CrossValidator()
    
    def create_test_claim(self, claim_text: str, claim_type: str, value: dict, confidence: float, source_type: SourceType):
        source = Source(
            url="https://example.com/test",
            source_type=source_type,
            title="Test Source",
            extraction_timestamp=datetime.now(),
            credibility_score=0.9
        )
        
        return Claim(
            claim_text=claim_text,
            claim_type=claim_type,
            value=value,
            confidence_score=confidence,
            sources=[source],
            supporting_snippets=["Test snippet"]
        )
    
    def test_confidence_score_calculation(self):
        claims = [
            self.create_test_claim(
                "Jane Doe is a scientist",
                "role",
                {"person": "Jane Doe", "role": "scientist"},
                0.8,
                SourceType.NATURE
            )
        ]
        
        confidence = self.validator.calculate_confidence_score(claims)
        self.assertGreater(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)
    
    def test_group_similar_claims(self):
        claims = [
            self.create_test_claim(
                "Jane Doe has 52 patents",
                "patent_count",
                {"person": "Jane Doe", "count": 52},
                0.9,
                SourceType.IBM
            ),
            self.create_test_claim(
                "Jane Doe has 48 patents",
                "patent_count",
                {"person": "Jane Doe", "count": 48},
                0.8,
                SourceType.USPTO
            )
        ]
        
        grouped = self.validator.group_similar_claims(claims)
        self.assertEqual(len(grouped), 1)
        self.assertIn("jane doe:patent_count", grouped)
        self.assertEqual(len(grouped["jane doe:patent_count"]), 2)
    
    def test_detect_contradictions(self):
        claims = [
            self.create_test_claim(
                "Jane Doe has 52 patents",
                "patent_count",
                {"person": "Jane Doe", "count": 52},
                0.9,
                SourceType.IBM
            ),
            self.create_test_claim(
                "Jane Doe has 48 patents",
                "patent_count",
                {"person": "Jane Doe", "count": 48},
                0.8,
                SourceType.USPTO
            )
        ]
        
        contradictions = self.validator.detect_contradictions(claims)
        self.assertEqual(len(contradictions), 1)
        
        primary_claim, contradictory_claims = contradictions[0]
        self.assertEqual(primary_claim.confidence_score, 0.9)  # Higher confidence claim should be primary
        self.assertEqual(len(contradictory_claims), 1)
    
    def test_validate_claims_with_multiple_sources(self):
        claims = [
            self.create_test_claim(
                "Jane Doe is a scientist",
                "role",
                {"person": "Jane Doe", "role": "scientist"},
                0.8,
                SourceType.NATURE
            ),
            self.create_test_claim(
                "Jane Doe is a scientist",
                "role",
                {"person": "Jane Doe", "role": "scientist"},
                0.9,
                SourceType.IBM
            )
        ]
        
        validated = self.validator.validate_claims(claims)
        self.assertEqual(len(validated), 1)  # Should merge similar claims
        
        validated_claim = validated[0]
        self.assertEqual(len(validated_claim.sources), 2)  # Should combine sources

if __name__ == '__main__':
    unittest.main()
