"""
TRA Extraction Service

This module handles data extraction and validation using multiple approaches:
- LLM-powered extraction with JSON schema validation
- Regex pattern matching for structured data
- Unit tests for data quality assurance
- Confidence scoring and error handling

Key Features:
- Multi-layer validation (LLM + regex + unit tests)
- Schema-based extraction for consistency
- Confidence scoring for data quality
- Error handling and retry logic
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import json
import re
from dataclasses import dataclass
from enum import Enum

from schemas.models import RawData, ExtractedData, ValidationResult

logger = logging.getLogger(__name__)

class ValidationMethod(Enum):
    """Validation methods available"""
    LLM_SCHEMA = "llm_schema"
    REGEX_PATTERN = "regex_pattern"
    UNIT_TEST = "unit_test"
    CROSS_REFERENCE = "cross_reference"

@dataclass
class ExtractionResult:
    """Result of data extraction process"""
    extracted_data: Dict[str, Any]
    validation_results: List[ValidationResult]
    confidence_score: float
    extraction_timestamp: datetime
    errors: List[str]

class ExtractionAgent:
    """
    Multi-method data extraction and validation agent
    
    This agent uses multiple validation approaches to ensure data quality:
    - LLM-powered extraction with JSON schema validation
    - Regex pattern matching for structured data
    - Unit tests for data quality assurance
    - Cross-reference validation between sources
    """
    
    def __init__(self):
        self.extraction_schemas = self._load_extraction_schemas()
        self.validation_rules = self._load_validation_rules()
        self.unit_tests = self._load_unit_tests()
    
    async def extract_and_validate(self, raw_data_list: List[RawData]) -> List[ExtractedData]:
        """
        Extract and validate data from raw sources
        
        Args:
            raw_data_list: List of raw data objects from ingestion
            
        Returns:
            List of extracted and validated data objects
        """
        logger.info(f"Starting extraction for {len(raw_data_list)} raw data sources")
        
        # Process each raw data source
        extracted_data_list = []
        for raw_data in raw_data_list:
            try:
                extracted_data = await self._extract_single_source(raw_data)
                extracted_data_list.append(extracted_data)
            except Exception as e:
                logger.error(f"Error extracting from source {raw_data.source_id}: {str(e)}")
                # Create empty extracted data with error information
                extracted_data_list.append(ExtractedData(
                    source_id=raw_data.source_id,
                    source_type=raw_data.source_type,
                    extracted_content={},
                    validation_results=[],
                    confidence_score=0.0,
                    metadata={"error": str(e)}
                ))
        
        logger.info(f"Successfully extracted {len(extracted_data_list)} data sources")
        return extracted_data_list
    
    async def _extract_single_source(self, raw_data: RawData) -> ExtractedData:
        """
        Extract and validate data from a single source
        
        Args:
            raw_data: Raw data object from ingestion
            
        Returns:
            Extracted and validated data object
        """
        try:
            # Get extraction schema for source type
            schema = self.extraction_schemas.get(raw_data.source_type, {})
            
            # Extract data using multiple methods
            extraction_results = []
            
            # Method 1: LLM Schema Extraction
            llm_result = await self._extract_with_llm_schema(raw_data, schema)
            extraction_results.append(llm_result)
            
            # Method 2: Regex Pattern Extraction
            regex_result = await self._extract_with_regex(raw_data, schema)
            extraction_results.append(regex_result)
            
            # Method 3: Unit Test Validation
            unit_test_result = await self._validate_with_unit_tests(raw_data, schema)
            extraction_results.append(unit_test_result)
            
            # Combine results and calculate confidence
            combined_data = self._combine_extraction_results(extraction_results)
            confidence_score = self._calculate_confidence_score(extraction_results)
            
            # Create extracted data object
            extracted_data = ExtractedData(
                source_id=raw_data.source_id,
                source_type=raw_data.source_type,
                extracted_content=combined_data,
                validation_results=extraction_results,
                confidence_score=confidence_score,
                metadata={
                    "extraction_timestamp": datetime.now().isoformat(),
                    "extraction_methods": [result.method for result in extraction_results],
                    "source_confidence": raw_data.confidence_score
                }
            )
            
            logger.info(f"Successfully extracted data from source {raw_data.source_id}")
            return extracted_data
            
        except Exception as e:
            logger.error(f"Error extracting from source {raw_data.source_id}: {str(e)}")
            raise
    
    async def _extract_with_llm_schema(self, raw_data: RawData, schema: Dict[str, Any]) -> ValidationResult:
        """
        Extract data using LLM with JSON schema validation
        
        Args:
            raw_data: Raw data object
            schema: Extraction schema for the source type
            
        Returns:
            Validation result with extracted data
        """
        try:
            # This would integrate with an LLM service (OpenAI, Anthropic, etc.)
            # For now, return a placeholder implementation
            
            # Simulate LLM extraction
            extracted_data = {
                "name": self._extract_name_from_content(raw_data.content),
                "email": self._extract_email_from_content(raw_data.content),
                "skills": self._extract_skills_from_content(raw_data.content),
                "experience": self._extract_experience_from_content(raw_data.content),
                "education": self._extract_education_from_content(raw_data.content)
            }
            
            # Validate against schema
            validation_errors = self._validate_against_schema(extracted_data, schema)
            
            return ValidationResult(
                method=ValidationMethod.LLM_SCHEMA,
                is_valid=len(validation_errors) == 0,
                confidence_score=0.8 if len(validation_errors) == 0 else 0.4,
                extracted_data=extracted_data,
                errors=validation_errors,
                metadata={"schema_version": schema.get("version", "1.0")}
            )
            
        except Exception as e:
            logger.error(f"Error in LLM schema extraction: {str(e)}")
            return ValidationResult(
                method=ValidationMethod.LLM_SCHEMA,
                is_valid=False,
                confidence_score=0.0,
                extracted_data={},
                errors=[str(e)],
                metadata={}
            )
    
    async def _extract_with_regex(self, raw_data: RawData, schema: Dict[str, Any]) -> ValidationResult:
        """
        Extract data using regex pattern matching
        
        Args:
            raw_data: Raw data object
            schema: Extraction schema for the source type
            
        Returns:
            Validation result with extracted data
        """
        try:
            # Get regex patterns from schema
            patterns = schema.get("regex_patterns", {})
            extracted_data = {}
            
            # Extract data using regex patterns
            for field, pattern in patterns.items():
                if isinstance(raw_data.content, dict):
                    content = json.dumps(raw_data.content)
                else:
                    content = str(raw_data.content)
                
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    extracted_data[field] = matches[0] if len(matches) == 1 else matches
            
            # Validate extracted data
            validation_errors = self._validate_against_schema(extracted_data, schema)
            
            return ValidationResult(
                method=ValidationMethod.REGEX_PATTERN,
                is_valid=len(validation_errors) == 0,
                confidence_score=0.7 if len(validation_errors) == 0 else 0.3,
                extracted_data=extracted_data,
                errors=validation_errors,
                metadata={"patterns_used": list(patterns.keys())}
            )
            
        except Exception as e:
            logger.error(f"Error in regex extraction: {str(e)}")
            return ValidationResult(
                method=ValidationMethod.REGEX_PATTERN,
                is_valid=False,
                confidence_score=0.0,
                extracted_data={},
                errors=[str(e)],
                metadata={}
            )
    
    async def _validate_with_unit_tests(self, raw_data: RawData, schema: Dict[str, Any]) -> ValidationResult:
        """
        Validate data using unit tests
        
        Args:
            raw_data: Raw data object
            schema: Extraction schema for the source type
            
        Returns:
            Validation result with test outcomes
        """
        try:
            # Get unit tests from schema
            tests = schema.get("unit_tests", [])
            test_results = []
            errors = []
            
            # Run unit tests
            for test in tests:
                try:
                    result = await self._run_unit_test(test, raw_data.content)
                    test_results.append({
                        "test_name": test.get("name"),
                        "passed": result,
                        "expected": test.get("expected"),
                        "actual": result
                    })
                except Exception as e:
                    errors.append(f"Test {test.get('name')} failed: {str(e)}")
            
            # Calculate overall test score
            passed_tests = sum(1 for result in test_results if result["passed"])
            total_tests = len(test_results)
            test_score = passed_tests / total_tests if total_tests > 0 else 0
            
            return ValidationResult(
                method=ValidationMethod.UNIT_TEST,
                is_valid=test_score >= 0.8,  # 80% pass rate required
                confidence_score=test_score,
                extracted_data={"test_results": test_results},
                errors=errors,
                metadata={"tests_run": total_tests, "tests_passed": passed_tests}
            )
            
        except Exception as e:
            logger.error(f"Error in unit test validation: {str(e)}")
            return ValidationResult(
                method=ValidationMethod.UNIT_TEST,
                is_valid=False,
                confidence_score=0.0,
                extracted_data={},
                errors=[str(e)],
                metadata={}
            )
    
    def _extract_name_from_content(self, content: Dict[str, Any]) -> Optional[str]:
        """Extract name from content using common patterns"""
        # Try different name fields
        name_fields = ["name", "full_name", "display_name", "username"]
        for field in name_fields:
            if field in content and content[field]:
                return content[field]
        return None
    
    def _extract_email_from_content(self, content: Dict[str, Any]) -> Optional[str]:
        """Extract email from content using regex"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
        # Check direct email field
        if "email" in content and content["email"]:
            return content["email"]
        
        # Search in text content
        if isinstance(content, dict):
            content_str = json.dumps(content)
        else:
            content_str = str(content)
        
        matches = re.findall(email_pattern, content_str)
        return matches[0] if matches else None
    
    def _extract_skills_from_content(self, content: Dict[str, Any]) -> List[str]:
        """Extract skills from content"""
        skills = []
        
        # Check direct skills field
        if "skills" in content and isinstance(content["skills"], list):
            skills.extend(content["skills"])
        
        # Check bio/description for skill mentions
        bio_fields = ["bio", "description", "summary", "about"]
        for field in bio_fields:
            if field in content and content[field]:
                # Simple skill extraction (would be more sophisticated in production)
                text = content[field].lower()
                common_skills = ["python", "javascript", "machine learning", "ai", "data science"]
                for skill in common_skills:
                    if skill in text:
                        skills.append(skill)
        
        return list(set(skills))  # Remove duplicates
    
    def _extract_experience_from_content(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract work experience from content"""
        experience = []
        
        # Check direct experience field
        if "experience" in content and isinstance(content["experience"], list):
            experience.extend(content["experience"])
        
        # Check repositories for project experience
        if "repositories" in content and isinstance(content["repositories"], list):
            for repo in content["repositories"]:
                if isinstance(repo, dict):
                    experience.append({
                        "title": repo.get("name", "Project"),
                        "company": "GitHub",
                        "description": repo.get("description", ""),
                        "start_date": repo.get("created_at"),
                        "end_date": repo.get("updated_at")
                    })
        
        return experience
    
    def _extract_education_from_content(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract education from content"""
        education = []
        
        # Check direct education field
        if "education" in content and isinstance(content["education"], list):
            education.extend(content["education"])
        
        # Check for academic papers
        if "authors" in content and isinstance(content["authors"], list):
            # This would be more sophisticated in production
            education.append({
                "institution": "Academic Research",
                "degree": "Research Publications",
                "field": content.get("categories", [""])[0] if content.get("categories") else "Unknown"
            })
        
        return education
    
    def _validate_against_schema(self, data: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
        """Validate data against JSON schema"""
        errors = []
        
        # Check required fields
        required_fields = schema.get("required", [])
        for field in required_fields:
            if field not in data or not data[field]:
                errors.append(f"Required field '{field}' is missing or empty")
        
        # Check field types
        field_types = schema.get("properties", {})
        for field, field_schema in field_types.items():
            if field in data:
                expected_type = field_schema.get("type")
                if expected_type == "string" and not isinstance(data[field], str):
                    errors.append(f"Field '{field}' should be a string")
                elif expected_type == "array" and not isinstance(data[field], list):
                    errors.append(f"Field '{field}' should be an array")
                elif expected_type == "number" and not isinstance(data[field], (int, float)):
                    errors.append(f"Field '{field}' should be a number")
        
        return errors
    
    async def _run_unit_test(self, test: Dict[str, Any], content: Dict[str, Any]) -> bool:
        """Run a single unit test"""
        test_type = test.get("type")
        
        if test_type == "field_exists":
            field = test.get("field")
            return field in content and content[field] is not None
        
        elif test_type == "field_matches_pattern":
            field = test.get("field")
            pattern = test.get("pattern")
            if field in content and content[field]:
                return bool(re.match(pattern, str(content[field])))
            return False
        
        elif test_type == "field_in_range":
            field = test.get("field")
            min_val = test.get("min")
            max_val = test.get("max")
            if field in content and isinstance(content[field], (int, float)):
                return min_val <= content[field] <= max_val
            return False
        
        return False
    
    def _combine_extraction_results(self, results: List[ValidationResult]) -> Dict[str, Any]:
        """Combine results from multiple extraction methods"""
        combined_data = {}
        
        # Start with LLM results (highest priority)
        for result in results:
            if result.method == ValidationMethod.LLM_SCHEMA and result.is_valid:
                combined_data.update(result.extracted_data)
                break
        
        # Add regex results for missing fields
        for result in results:
            if result.method == ValidationMethod.REGEX_PATTERN and result.is_valid:
                for key, value in result.extracted_data.items():
                    if key not in combined_data or not combined_data[key]:
                        combined_data[key] = value
        
        return combined_data
    
    def _calculate_confidence_score(self, results: List[ValidationResult]) -> float:
        """Calculate overall confidence score from validation results"""
        if not results:
            return 0.0
        
        # Weight different methods
        method_weights = {
            ValidationMethod.LLM_SCHEMA: 0.5,
            ValidationMethod.REGEX_PATTERN: 0.3,
            ValidationMethod.UNIT_TEST: 0.2
        }
        
        weighted_score = 0.0
        total_weight = 0.0
        
        for result in results:
            weight = method_weights.get(result.method, 0.1)
            weighted_score += result.confidence_score * weight
            total_weight += weight
        
        return weighted_score / total_weight if total_weight > 0 else 0.0
    
    def _load_extraction_schemas(self) -> Dict[str, Dict[str, Any]]:
        """Load extraction schemas for different source types"""
        return {
            "github": {
                "version": "1.0",
                "required": ["username", "name"],
                "properties": {
                    "username": {"type": "string"},
                    "name": {"type": "string"},
                    "email": {"type": "string"},
                    "bio": {"type": "string"},
                    "skills": {"type": "array"},
                    "experience": {"type": "array"}
                },
                "regex_patterns": {
                    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                    "phone": r'(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}'
                },
                "unit_tests": [
                    {"name": "username_exists", "type": "field_exists", "field": "username"},
                    {"name": "email_format", "type": "field_matches_pattern", "field": "email", "pattern": r'.+@.+\..+'}
                ]
            },
            "arxiv": {
                "version": "1.0",
                "required": ["title", "authors"],
                "properties": {
                    "title": {"type": "string"},
                    "authors": {"type": "array"},
                    "abstract": {"type": "string"},
                    "categories": {"type": "array"}
                },
                "unit_tests": [
                    {"name": "title_exists", "type": "field_exists", "field": "title"},
                    {"name": "authors_not_empty", "type": "field_exists", "field": "authors"}
                ]
            }
        }
    
    def _load_validation_rules(self) -> Dict[str, Any]:
        """Load validation rules for data quality"""
        return {
            "email_validation": {
                "pattern": r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
                "required": True
            },
            "phone_validation": {
                "pattern": r'^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$',
                "required": False
            },
            "name_validation": {
                "min_length": 2,
                "max_length": 100,
                "required": True
            }
        }
    
    def _load_unit_tests(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load unit tests for data validation"""
        return {
            "github": [
                {"name": "username_format", "type": "field_matches_pattern", "field": "username", "pattern": r'^[a-zA-Z0-9-]+$'},
                {"name": "public_repos_count", "type": "field_in_range", "field": "public_repos", "min": 0, "max": 10000}
            ],
            "arxiv": [
                {"name": "title_length", "type": "field_in_range", "field": "title", "min": 10, "max": 500},
                {"name": "authors_count", "type": "field_in_range", "field": "authors", "min": 1, "max": 50}
            ]
        }
