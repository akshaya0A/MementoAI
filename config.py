"""
TRA Configuration

This module contains configuration settings for the Talent Resolution Agent system.
"""

import os
from typing import Dict, Any
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    app_name: str = "Talent Resolution Agent (TRA)"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database Settings
    database_url: str = "postgresql://user:password@localhost:5432/tra_db"
    pgvector_extension: bool = True
    
    # LLM Settings
    openai_api_key: str = ""
    openai_model: str = "gpt-4"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-sonnet"
    
    # Processing Settings
    max_concurrent_sources: int = 10
    processing_timeout: int = 300  # 5 minutes
    retry_attempts: int = 3
    retry_delay: int = 5  # seconds
    
    # Validation Settings
    min_confidence_score: float = 0.6
    max_contradictions: int = 5
    fuzzy_match_threshold: float = 0.8
    
    # Extraordinary Index Settings
    innovation_weight: float = 0.25
    adoption_weight: float = 0.20
    influence_weight: float = 0.25
    velocity_weight: float = 0.15
    selectivity_weight: float = 0.15
    
    # Audit Settings
    audit_enabled: bool = True
    audit_retention_days: int = 365
    log_level: str = "INFO"
    
    # Security Settings
    enable_cors: bool = True
    cors_origins: list = ["*"]
    api_key_required: bool = False
    api_key_header: str = "X-API-Key"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Global settings instance
settings = Settings()

# Source-specific configurations
SOURCE_CONFIGS: Dict[str, Dict[str, Any]] = {
    "github": {
        "api_base_url": "https://api.github.com",
        "rate_limit": 5000,
        "timeout": 30,
        "required_fields": ["login", "name"],
        "optional_fields": ["email", "bio", "location", "company"]
    },
    "arxiv": {
        "api_base_url": "http://export.arxiv.org/api/query",
        "rate_limit": 1000,
        "timeout": 30,
        "required_fields": ["title", "authors"],
        "optional_fields": ["abstract", "categories", "published"]
    },
    "patent": {
        "api_base_url": "https://api.patentsview.org",
        "rate_limit": 1000,
        "timeout": 30,
        "required_fields": ["patent_number", "title"],
        "optional_fields": ["inventors", "assignee", "abstract"]
    },
    "linkedin": {
        "api_base_url": "https://api.linkedin.com/v2",
        "rate_limit": 1000,
        "timeout": 30,
        "required_fields": ["firstName", "lastName"],
        "optional_fields": ["headline", "summary", "location"]
    }
}

# Validation schemas for different source types
VALIDATION_SCHEMAS: Dict[str, Dict[str, Any]] = {
    "github": {
        "version": "1.0",
        "required": ["username", "name"],
        "properties": {
            "username": {"type": "string", "pattern": r"^[a-zA-Z0-9-]+$"},
            "name": {"type": "string", "minLength": 2, "maxLength": 100},
            "email": {"type": "string", "format": "email"},
            "bio": {"type": "string", "maxLength": 500},
            "location": {"type": "string", "maxLength": 100},
            "company": {"type": "string", "maxLength": 100},
            "public_repos": {"type": "integer", "minimum": 0},
            "followers": {"type": "integer", "minimum": 0},
            "following": {"type": "integer", "minimum": 0}
        }
    },
    "arxiv": {
        "version": "1.0",
        "required": ["title", "authors"],
        "properties": {
            "title": {"type": "string", "minLength": 10, "maxLength": 500},
            "authors": {"type": "array", "minItems": 1, "maxItems": 50},
            "abstract": {"type": "string", "maxLength": 5000},
            "categories": {"type": "array", "maxItems": 10},
            "published": {"type": "string", "format": "date-time"},
            "updated": {"type": "string", "format": "date-time"},
            "doi": {"type": "string", "pattern": r"^10\.\d+/.*$"},
            "citation_count": {"type": "integer", "minimum": 0}
        }
    }
}

# PII detection patterns
PII_PATTERNS: Dict[str, str] = {
    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "phone": r'(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',
    "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
    "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
    "address": r'\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b',
    "ip_address": r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
    "mac_address": r'\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b'
}

# Extraordinary Index calculation weights
EXTRAORDINARY_INDEX_WEIGHTS: Dict[str, float] = {
    "innovation": settings.innovation_weight,
    "adoption": settings.adoption_weight,
    "influence": settings.influence_weight,
    "velocity": settings.velocity_weight,
    "selectivity": settings.selectivity_weight
}

# Action generation templates
ACTION_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "crm_upsert": {
        "description": "Update CRM with resolved candidate data",
        "required_fields": ["email", "name", "extraordinary_index"],
        "optional_fields": ["phone", "location", "company", "title"]
    },
    "outreach_draft": {
        "description": "Generate personalized outreach message",
        "required_fields": ["candidate_name", "key_achievements"],
        "optional_fields": ["personalization_points", "company", "location"]
    },
    "evidence_packet": {
        "description": "Compile evidence packet for visa applications",
        "required_fields": ["candidate_id", "extraordinary_index"],
        "optional_fields": ["supporting_documents", "achievements", "references"]
    }
}

# Logging configuration
LOGGING_CONFIG: Dict[str, Any] = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S"
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": settings.log_level,
            "formatter": "default",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "INFO",
            "formatter": "detailed",
            "filename": "tra.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        }
    },
    "loggers": {
        "tra": {
            "level": settings.log_level,
            "handlers": ["console", "file"],
            "propagate": False
        }
    },
    "root": {
        "level": "WARNING",
        "handlers": ["console"]
    }
}
