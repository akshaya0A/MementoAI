from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SourceType(str, Enum):
    NYTIMES = "nytimes"
    IBM = "ibm"
    NATURE = "nature"
    ARXIV = "arxiv"
    USPTO = "uspto"

class CredibilityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Source(BaseModel):
    url: str
    source_type: SourceType
    title: str
    extraction_timestamp: datetime
    credibility_score: float = Field(ge=0.0, le=1.0)
    raw_content: Optional[str] = None

class Claim(BaseModel):
    claim_text: str
    claim_type: str  # e.g., "role", "patent_count", "publication"
    value: Any
    confidence_score: float = Field(ge=0.0, le=1.0)
    sources: List[Source]
    supporting_snippets: List[str]
    contradictory_claims: List['Claim'] = []
    temporal_context: Optional[Dict[str, Any]] = None
    human_reviewed: bool = False
    human_approved: Optional[bool] = None

class Patent(BaseModel):
    patent_number: Optional[str] = None
    title: Optional[str] = None
    inventor_names: List[str] = []
    filing_date: Optional[datetime] = None
    grant_date: Optional[datetime] = None
    abstract: Optional[str] = None
    source: Source

class Publication(BaseModel):
    title: str
    authors: List[str]
    journal: Optional[str] = None
    publication_date: Optional[datetime] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    source: Source

class PressRelease(BaseModel):
    title: str
    company: str
    date: datetime
    content: str
    mentioned_people: List[str] = []
    mentioned_patents: int = 0
    source: Source

class Person(BaseModel):
    name: str
    canonical_name: str
    roles: List[Claim] = []
    affiliations: List[Claim] = []
    patents: List[Patent] = []
    publications: List[Publication] = []
    press_mentions: List[PressRelease] = []
    all_claims: List[Claim] = []
    confidence_score: float = Field(ge=0.0, le=1.0)
    last_updated: datetime

class ResearchResult(BaseModel):
    query: str
    person: Person
    processing_time: float
    sources_searched: List[SourceType]
    total_claims: int
    high_confidence_claims: int
    conflicting_claims: int
    human_review_required: bool

Claim.model_rebuild()
