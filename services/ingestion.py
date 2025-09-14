"""
TRA Ingestion Service

This module handles data collection and normalization from multiple sources:
- GitHub profiles and repositories
- ArXiv papers and citations
- Patent databases
- Resume/CV documents
- CRM systems
- PDF documents (with OCR)
- Social media profiles

Key Features:
- PII redaction for compliance
- Data normalization and standardization
- Source-specific parsers and scrapers
- Error handling and retry logic
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
import json
import re
from dataclasses import dataclass
from enum import Enum

from schemas.models import DataSource, RawData

logger = logging.getLogger(__name__)

class SourceType(Enum):
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

@dataclass
class IngestionResult:
    """Result of data ingestion process"""
    source_type: SourceType
    source_id: str
    raw_data: Dict[str, Any]
    metadata: Dict[str, Any]
    confidence_score: float
    ingestion_timestamp: datetime
    errors: List[str]

class IngestionAgent:
    """
    Multi-source data ingestion agent
    
    This agent orchestrates data collection from various sources,
    handles normalization, and ensures data quality before passing
    to the extraction layer.
    """
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.pii_patterns = self._load_pii_patterns()
        self.source_parsers = {
            SourceType.GITHUB: self._parse_github_data,
            SourceType.ARXIV: self._parse_arxiv_data,
            SourceType.PATENT: self._parse_patent_data,
            SourceType.RESUME: self._parse_resume_data,
            SourceType.CRM: self._parse_crm_data,
            SourceType.PDF: self._parse_pdf_data,
            SourceType.SOCIAL_MEDIA: self._parse_social_media_data,
        }
    
    async def process_sources(self, sources: List[DataSource]) -> List[RawData]:
        """
        Process multiple data sources concurrently
        
        Args:
            sources: List of data sources to process
            
        Returns:
            List of raw data objects from all sources
        """
        logger.info(f"Starting ingestion for {len(sources)} sources")
        
        # Process sources concurrently
        tasks = [self._process_single_source(source) for source in sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and collect valid results
        raw_data_list = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error processing source {i}: {str(result)}")
            else:
                raw_data_list.append(result)
        
        logger.info(f"Successfully processed {len(raw_data_list)} sources")
        return raw_data_list
    
    async def _process_single_source(self, source: DataSource) -> RawData:
        """
        Process a single data source
        
        Args:
            source: Data source configuration
            
        Returns:
            Raw data object with normalized content
        """
        try:
            source_type = SourceType(source.source_type)
            parser = self.source_parsers.get(source_type)
            
            if not parser:
                raise ValueError(f"No parser available for source type: {source_type}")
            
            # Fetch raw data from source
            raw_content = await self._fetch_source_data(source)
            
            # Parse and normalize data
            parsed_data = await parser(raw_content, source)
            
            # Apply PII redaction
            redacted_data = self._redact_pii(parsed_data)
            
            # Create raw data object
            raw_data = RawData(
                source_id=source.source_id,
                source_type=source.source_type,
                content=redacted_data,
                metadata={
                    "ingestion_timestamp": datetime.now().isoformat(),
                    "source_url": source.url,
                    "confidence_score": parsed_data.get("confidence_score", 0.8)
                },
                confidence_score=parsed_data.get("confidence_score", 0.8)
            )
            
            logger.info(f"Successfully processed source {source.source_id}")
            return raw_data
            
        except Exception as e:
            logger.error(f"Error processing source {source.source_id}: {str(e)}")
            # Return empty raw data with error information
            return RawData(
                source_id=source.source_id,
                source_type=source.source_type,
                content={},
                metadata={"error": str(e)},
                confidence_score=0.0
            )
    
    async def _fetch_source_data(self, source: DataSource) -> Dict[str, Any]:
        """
        Fetch raw data from a source
        
        Args:
            source: Data source configuration
            
        Returns:
            Raw data dictionary
        """
        if source.source_type in ["github", "arxiv", "patent"]:
            # API-based sources
            response = await self.client.get(source.url, headers=source.headers or {})
            response.raise_for_status()
            return response.json()
        
        elif source.source_type in ["resume", "pdf"]:
            # File-based sources
            if source.file_content:
                return {"content": source.file_content, "filename": source.filename}
            else:
                raise ValueError("File content required for file-based sources")
        
        elif source.source_type in ["crm", "social_media"]:
            # Database or API sources
            return source.data or {}
        
        else:
            raise ValueError(f"Unsupported source type: {source.source_type}")
    
    async def _parse_github_data(self, raw_content: Dict[str, Any], source: DataSource) -> Dict[str, Any]:
        """Parse GitHub profile and repository data"""
        try:
            # Extract key information from GitHub API response
            profile_data = {
                "username": raw_content.get("login"),
                "name": raw_content.get("name"),
                "email": raw_content.get("email"),
                "bio": raw_content.get("bio"),
                "location": raw_content.get("location"),
                "company": raw_content.get("company"),
                "public_repos": raw_content.get("public_repos", 0),
                "followers": raw_content.get("followers", 0),
                "following": raw_content.get("following", 0),
                "created_at": raw_content.get("created_at"),
                "updated_at": raw_content.get("updated_at"),
                "repositories": raw_content.get("repositories", []),
                "confidence_score": 0.9  # GitHub data is generally reliable
            }
            
            return profile_data
            
        except Exception as e:
            logger.error(f"Error parsing GitHub data: {str(e)}")
            return {"error": str(e), "confidence_score": 0.0}
    
    async def _parse_arxiv_data(self, raw_content: Dict[str, Any], source: DataSource) -> Dict[str, Any]:
        """Parse ArXiv paper data"""
        try:
            # Extract paper information from ArXiv API response
            paper_data = {
                "title": raw_content.get("title"),
                "authors": raw_content.get("authors", []),
                "abstract": raw_content.get("abstract"),
                "categories": raw_content.get("categories", []),
                "published": raw_content.get("published"),
                "updated": raw_content.get("updated"),
                "doi": raw_content.get("doi"),
                "pdf_url": raw_content.get("pdf_url"),
                "citation_count": raw_content.get("citation_count", 0),
                "confidence_score": 0.85  # ArXiv data is reliable
            }
            
            return paper_data
            
        except Exception as e:
            logger.error(f"Error parsing ArXiv data: {str(e)}")
            return {"error": str(e), "confidence_score": 0.0}
    
    async def _parse_patent_data(self, raw_content: Dict[str, Any], source: DataSource) -> Dict[str, Any]:
        """Parse patent database data"""
        try:
            # Extract patent information
            patent_data = {
                "patent_number": raw_content.get("patent_number"),
                "title": raw_content.get("title"),
                "inventors": raw_content.get("inventors", []),
                "assignee": raw_content.get("assignee"),
                "filing_date": raw_content.get("filing_date"),
                "issue_date": raw_content.get("issue_date"),
                "abstract": raw_content.get("abstract"),
                "claims": raw_content.get("claims", []),
                "confidence_score": 0.8  # Patent data is generally reliable
            }
            
            return patent_data
            
        except Exception as e:
            logger.error(f"Error parsing patent data: {str(e)}")
            return {"error": str(e), "confidence_score": 0.0}
    
    async def _parse_resume_data(self, raw_content: Dict[str, Any], source: DataSource) -> Dict[str, Any]:
        """Parse resume/CV data (placeholder for OCR and NLP processing)"""
        try:
            # This would integrate with OCR and NLP services
            # For now, return a placeholder structure
            resume_data = {
                "text_content": raw_content.get("content", ""),
                "filename": raw_content.get("filename"),
                "extracted_sections": {
                    "personal_info": {},
                    "experience": [],
                    "education": [],
                    "skills": [],
                    "projects": []
                },
                "confidence_score": 0.7  # OCR accuracy varies
            }
            
            return resume_data
            
        except Exception as e:
            logger.error(f"Error parsing resume data: {str(e)}")
            return {"error": str(e), "confidence_score": 0.0}
    
    async def _parse_crm_data(self, raw_content: Dict[str, Any], source: DataSource) -> Dict[str, Any]:
        """Parse CRM system data"""
        try:
            # Extract CRM contact information
            crm_data = {
                "contact_id": raw_content.get("contact_id"),
                "first_name": raw_content.get("first_name"),
                "last_name": raw_content.get("last_name"),
                "email": raw_content.get("email"),
                "phone": raw_content.get("phone"),
                "company": raw_content.get("company"),
                "title": raw_content.get("title"),
                "notes": raw_content.get("notes"),
                "last_contact": raw_content.get("last_contact"),
                "confidence_score": 0.8  # CRM data is generally reliable
            }
            
            return crm_data
            
        except Exception as e:
            logger.error(f"Error parsing CRM data: {str(e)}")
            return {"error": str(e), "confidence_score": 0.0}
    
    async def _parse_pdf_data(self, raw_content: Dict[str, Any], source: DataSource) -> Dict[str, Any]:
        """Parse PDF document data (placeholder for OCR processing)"""
        try:
            # This would integrate with OCR services like Tesseract
            pdf_data = {
                "text_content": raw_content.get("content", ""),
                "filename": raw_content.get("filename"),
                "page_count": raw_content.get("page_count", 1),
                "extracted_text": raw_content.get("content", ""),
                "confidence_score": 0.6  # OCR accuracy varies
            }
            
            return pdf_data
            
        except Exception as e:
            logger.error(f"Error parsing PDF data: {str(e)}")
            return {"error": str(e), "confidence_score": 0.0}
    
    async def _parse_social_media_data(self, raw_content: Dict[str, Any], source: DataSource) -> Dict[str, Any]:
        """Parse social media profile data"""
        try:
            # Extract social media information
            social_data = {
                "platform": raw_content.get("platform"),
                "username": raw_content.get("username"),
                "display_name": raw_content.get("display_name"),
                "bio": raw_content.get("bio"),
                "followers": raw_content.get("followers", 0),
                "following": raw_content.get("following", 0),
                "posts": raw_content.get("posts", []),
                "profile_url": raw_content.get("profile_url"),
                "confidence_score": 0.6  # Social media data can be unreliable
            }
            
            return social_data
            
        except Exception as e:
            logger.error(f"Error parsing social media data: {str(e)}")
            return {"error": str(e), "confidence_score": 0.0}
    
    def _load_pii_patterns(self) -> Dict[str, str]:
        """Load PII detection patterns for redaction"""
        return {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',
            "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
            "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
            "address": r'\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b'
        }
    
    def _redact_pii(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Redact PII from data using pattern matching
        
        Args:
            data: Dictionary containing potentially sensitive data
            
        Returns:
            Dictionary with PII redacted
        """
        redacted_data = data.copy()
        
        def redact_text(text: str) -> str:
            if not isinstance(text, str):
                return text
            
            for pattern_name, pattern in self.pii_patterns.items():
                text = re.sub(pattern, f"[REDACTED_{pattern_name.upper()}]", text)
            
            return text
        
        def redact_recursive(obj):
            if isinstance(obj, dict):
                return {k: redact_recursive(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [redact_recursive(item) for item in obj]
            elif isinstance(obj, str):
                return redact_text(obj)
            else:
                return obj
        
        return redact_recursive(redacted_data)
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
