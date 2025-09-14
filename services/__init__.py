"""
TRA Services Package

This package contains the core service modules for the Talent Resolution Agent:
- ingestion: Data collection and normalization from multiple sources
- extraction: Data extraction and validation using LLMs and rules
- resolution: Entity resolution and contradiction detection
"""

from .ingestion import IngestionAgent
from .extraction import ExtractionAgent
from .resolution import ResolutionAgent

__all__ = ["IngestionAgent", "ExtractionAgent", "ResolutionAgent"]
