"""
TRA Core Data Models

This module contains Pydantic models for the Talent Resolution Agent system.
These models define the data structures used throughout the multi-agent pipeline.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from enum import Enum

class SourceType(str, Enum):
    """Supported data source types"""
    GITHUB = "github"
    ARXIV = "arxiv"
    PATENT = "patent"
    RESUME = "resume"
    CRM = "crm"
    PDF = "pdf"
    SOCIAL_MEDIA = "social_media"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"

class DataSource(BaseModel):
    """Data source configuration"""
    source_id: str = Field(..., description="Unique identifier for the data source")
    source_type: SourceType = Field(..., description="Type of data source")
    url: Optional[str] = Field(None, description="URL for API-based sources")
    headers: Optional[Dict[str, str]] = Field(None, description="HTTP headers for API requests")
    data: Optional[Dict[str, Any]] = Field(None, description="Direct data for database sources")
    file_content: Optional[str] = Field(None, description="File content for file-based sources")
    filename: Optional[str] = Field(None, description="Filename for file-based sources")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class RawData(BaseModel):
    """Raw data from ingestion layer"""
    source_id: str = Field(..., description="Source identifier")
    source_type: str = Field(..., description="Type of source")
    content: Dict[str, Any] = Field(..., description="Raw content from source")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Ingestion metadata")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score for raw data")

class ValidationMethod(str, Enum):
    """Validation methods"""
    LLM_SCHEMA = "llm_schema"
    REGEX_PATTERN = "regex_pattern"
    UNIT_TEST = "unit_test"
    CROSS_REFERENCE = "cross_reference"

class ValidationResult(BaseModel):
    """Result of data validation"""
    method: ValidationMethod = Field(..., description="Validation method used")
    is_valid: bool = Field(..., description="Whether validation passed")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    extracted_data: Dict[str, Any] = Field(..., description="Extracted data")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Validation metadata")

class ExtractedData(BaseModel):
    """Extracted and validated data"""
    source_id: str = Field(..., description="Source identifier")
    source_type: str = Field(..., description="Type of source")
    extracted_content: Dict[str, Any] = Field(..., description="Extracted content")
    validation_results: List[ValidationResult] = Field(default_factory=list, description="Validation results")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Overall confidence score")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extraction metadata")

class ContradictionType(str, Enum):
    """Types of contradictions"""
    NAME_MISMATCH = "name_mismatch"
    EMAIL_MISMATCH = "email_mismatch"
    SKILL_CONFLICT = "skill_conflict"
    EXPERIENCE_CONFLICT = "experience_conflict"
    LOCATION_CONFLICT = "location_conflict"
    TIMELINE_CONFLICT = "timeline_conflict"

class Contradiction(BaseModel):
    """Detected contradiction in candidate data"""
    contradiction_id: str = Field(..., description="Unique contradiction identifier")
    candidate_id: str = Field(..., description="Candidate identifier")
    contradiction_type: ContradictionType = Field(..., description="Type of contradiction")
    field_name: str = Field(..., description="Field with contradiction")
    source_1_value: str = Field(..., description="Value from first source")
    source_2_value: str = Field(..., description="Value from second source")
    source_1_id: str = Field(..., description="First source identifier")
    source_2_id: str = Field(..., description="Second source identifier")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in contradiction")
    severity: str = Field(..., description="Severity level (low, medium, high)")
    description: str = Field(..., description="Human-readable description")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class ExtraordinaryIndex(BaseModel):
    """Extraordinary Index score for talent assessment"""
    innovation: float = Field(..., ge=0.0, le=1.0, description="Innovation score")
    adoption: float = Field(..., ge=0.0, le=1.0, description="Adoption score")
    influence: float = Field(..., ge=0.0, le=1.0, description="Influence score")
    velocity: float = Field(..., ge=0.0, le=1.0, description="Velocity score")
    selectivity: float = Field(..., ge=0.0, le=1.0, description="Selectivity score")
    overall_score: float = Field(..., ge=0.0, le=1.0, description="Overall Extraordinary Index score")
    
    @validator('overall_score')
    def validate_overall_score(cls, v, values):
        """Validate that overall score is within bounds"""
        if v < 0.0 or v > 1.0:
            raise ValueError('Overall score must be between 0.0 and 1.0')
        return v

class ProcessedCandidate(BaseModel):
    """Processed candidate with resolved identity"""
    candidate_id: str = Field(..., description="Unique candidate identifier")
    resolved_identity: Dict[str, Any] = Field(..., description="Resolved candidate identity")
    source_data: List[ExtractedData] = Field(..., description="Source data used for resolution")
    contradictions: List[Contradiction] = Field(default_factory=list, description="Detected contradictions")
    extraordinary_index: ExtraordinaryIndex = Field(..., description="Extraordinary Index score")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Resolution confidence score")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Processing metadata")

class ActionType(str, Enum):
    """Types of actions that can be generated"""
    CRM_UPSERT = "crm_upsert"
    OUTREACH_DRAFT = "outreach_draft"
    EVIDENCE_PACKET = "evidence_packet"
    INTERVIEW_SCHEDULE = "interview_schedule"
    REFERENCE_CHECK = "reference_check"

class ActionPlan(BaseModel):
    """Action plan for a candidate"""
    candidate_id: str = Field(..., description="Candidate identifier")
    actions: List[Dict[str, Any]] = Field(..., description="List of actions to take")
    priority: str = Field(..., description="Priority level (low, medium, high)")
    estimated_effort: str = Field(..., description="Estimated effort required")
    expected_outcome: str = Field(..., description="Expected outcome")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Action plan metadata")

class ProcessingRequest(BaseModel):
    """Request to process candidate data"""
    sources: List[DataSource] = Field(..., description="Data sources to process")
    processing_options: Optional[Dict[str, Any]] = Field(None, description="Processing options")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Request metadata")

class ProcessingResponse(BaseModel):
    """Response to processing request"""
    request_id: str = Field(..., description="Request identifier")
    status: str = Field(..., description="Processing status")
    message: str = Field(..., description="Status message")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Response metadata")

class ResolutionResult(BaseModel):
    """Result of entity resolution"""
    candidate_id: str = Field(..., description="Resolved candidate identifier")
    source_matches: List[Dict[str, Any]] = Field(..., description="Source matches")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Resolution confidence")
    resolution_method: str = Field(..., description="Resolution method used")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Resolution metadata")

class AuditEvent(BaseModel):
    """Audit event for tracking"""
    event_id: str = Field(..., description="Event identifier")
    timestamp: datetime = Field(..., description="Event timestamp")
    event_type: str = Field(..., description="Type of event")
    candidate_id: Optional[str] = Field(None, description="Related candidate ID")
    source_id: Optional[str] = Field(None, description="Related source ID")
    details: Dict[str, Any] = Field(..., description="Event details")
    user_id: Optional[str] = Field(None, description="User who triggered event")

class FeedbackData(BaseModel):
    """Feedback data for system improvement"""
    feedback_id: str = Field(..., description="Feedback identifier")
    candidate_id: str = Field(..., description="Related candidate ID")
    feedback_type: str = Field(..., description="Type of feedback")
    rating: float = Field(..., ge=0.0, le=1.0, description="Feedback rating")
    comments: Optional[str] = Field(None, description="Feedback comments")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Feedback metadata")

class SystemConfig(BaseModel):
    """System configuration"""
    version: str = Field(..., description="System version")
    config_id: str = Field(..., description="Configuration identifier")
    settings: Dict[str, Any] = Field(..., description="System settings")
    last_updated: datetime = Field(..., description="Last update timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Configuration metadata")

class HealthCheck(BaseModel):
    """System health check response"""
    status: str = Field(..., description="System status")
    timestamp: datetime = Field(..., description="Check timestamp")
    version: str = Field(..., description="System version")
    components: Dict[str, str] = Field(..., description="Component status")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="System metrics")

class ErrorResponse(BaseModel):
    """Error response model"""
    error_code: str = Field(..., description="Error code")
    error_message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")
    request_id: Optional[str] = Field(None, description="Related request ID")
