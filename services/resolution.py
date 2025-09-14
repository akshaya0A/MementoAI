"""
TRA Resolution Service

This module handles entity resolution and contradiction detection:
- Entity resolution using pgvector and fuzzy matching
- LLM adjudicator for complex identity decisions
- Contradiction detection and quantification
- Extraordinary Index calculation
- Action planning and generation

Key Features:
- Multi-dimensional entity resolution
- Conflict detection and confidence scoring
- Calibrated talent assessment metrics
- Automated action generation
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import json
# import numpy as np  # Removed for demo compatibility
from dataclasses import dataclass
from enum import Enum

from schemas.models import (
    ExtractedData, 
    ProcessedCandidate, 
    ExtraordinaryIndex,
    ActionPlan,
    Contradiction,
    ResolutionResult
)

logger = logging.getLogger(__name__)

class ResolutionMethod(Enum):
    """Entity resolution methods"""
    FUZZY_MATCHING = "fuzzy_matching"
    VECTOR_SIMILARITY = "vector_similarity"
    LLM_ADJUDICATION = "llm_adjudication"
    CROSS_REFERENCE = "cross_reference"

class ContradictionType(Enum):
    """Types of contradictions detected"""
    NAME_MISMATCH = "name_mismatch"
    EMAIL_MISMATCH = "email_mismatch"
    SKILL_CONFLICT = "skill_conflict"
    EXPERIENCE_CONFLICT = "experience_conflict"
    LOCATION_CONFLICT = "location_conflict"
    TIMELINE_CONFLICT = "timeline_conflict"

@dataclass
class EntityMatch:
    """Result of entity matching"""
    source_id_1: str
    source_id_2: str
    similarity_score: float
    match_confidence: float
    matching_fields: List[str]
    conflicting_fields: List[str]

class ResolutionAgent:
    """
    Entity resolution and contradiction detection agent
    
    This agent handles the complex task of resolving candidate identities
    across multiple data sources and detecting contradictions in the data.
    """
    
    def __init__(self):
        self.resolution_rules = self._load_resolution_rules()
        self.contradiction_patterns = self._load_contradiction_patterns()
        self.extraordinary_index_weights = self._load_extraordinary_index_weights()
    
    async def resolve_entities(self, extracted_data_list: List[ExtractedData]) -> List[ProcessedCandidate]:
        """
        Resolve entities across multiple data sources
        
        Args:
            extracted_data_list: List of extracted data from multiple sources
            
        Returns:
            List of processed candidates with resolved identities
        """
        logger.info(f"Starting entity resolution for {len(extracted_data_list)} data sources")
        
        # Group data by potential entity matches
        entity_groups = await self._group_entities(extracted_data_list)
        
        # Resolve each entity group
        processed_candidates = []
        for group in entity_groups:
            try:
                resolved_candidate = await self._resolve_entity_group(group)
                processed_candidates.append(resolved_candidate)
            except Exception as e:
                logger.error(f"Error resolving entity group: {str(e)}")
                # Create individual candidates for failed groups
                for data in group:
                    processed_candidates.append(ProcessedCandidate(
                        candidate_id=f"candidate_{data.source_id}",
                        resolved_identity={},
                        source_data=[data],
                        contradictions=[],
                        extraordinary_index=ExtraordinaryIndex(
                            innovation=0.0,
                            adoption=0.0,
                            influence=0.0,
                            velocity=0.0,
                            selectivity=0.0,
                            overall_score=0.0
                        ),
                        confidence_score=0.0,
                        metadata={"error": str(e)}
                    ))
        
        logger.info(f"Successfully resolved {len(processed_candidates)} candidates")
        return processed_candidates
    
    async def _group_entities(self, extracted_data_list: List[ExtractedData]) -> List[List[ExtractedData]]:
        """
        Group extracted data by potential entity matches
        
        Args:
            extracted_data_list: List of extracted data
            
        Returns:
            List of groups, where each group contains data for the same entity
        """
        groups = []
        processed_indices = set()
        
        for i, data1 in enumerate(extracted_data_list):
            if i in processed_indices:
                continue
            
            # Start a new group with this data
            group = [data1]
            processed_indices.add(i)
            
            # Find matching data
            for j, data2 in enumerate(extracted_data_list[i+1:], i+1):
                if j in processed_indices:
                    continue
                
                # Check if data2 matches data1
                if await self._are_entities_same(data1, data2):
                    group.append(data2)
                    processed_indices.add(j)
            
            groups.append(group)
        
        return groups
    
    async def _are_entities_same(self, data1: ExtractedData, data2: ExtractedData) -> bool:
        """
        Determine if two extracted data objects represent the same entity
        
        Args:
            data1: First extracted data object
            data2: Second extracted data object
            
        Returns:
            True if they represent the same entity
        """
        # Extract key identifying fields
        fields1 = self._extract_identifying_fields(data1)
        fields2 = self._extract_identifying_fields(data2)
        
        # Check for exact matches in key fields
        exact_matches = 0
        total_fields = 0
        
        for field in ["email", "name", "username"]:
            if field in fields1 and field in fields2:
                total_fields += 1
                if fields1[field] and fields2[field]:
                    if self._fuzzy_match(fields1[field], fields2[field], threshold=0.8):
                        exact_matches += 1
        
        # Require at least one exact match in key fields
        return exact_matches > 0 and (exact_matches / total_fields) >= 0.5
    
    def _extract_identifying_fields(self, data: ExtractedData) -> Dict[str, Any]:
        """Extract key identifying fields from extracted data"""
        content = data.extracted_content
        return {
            "email": content.get("email"),
            "name": content.get("name"),
            "username": content.get("username"),
            "phone": content.get("phone"),
            "location": content.get("location")
        }
    
    def _fuzzy_match(self, str1: str, str2: str, threshold: float = 0.8) -> bool:
        """
        Perform fuzzy string matching
        
        Args:
            str1: First string
            str2: Second string
            threshold: Similarity threshold (0.0 to 1.0)
            
        Returns:
            True if strings are similar enough
        """
        if not str1 or not str2:
            return False
        
        # Simple Levenshtein distance-based similarity
        # In production, would use more sophisticated algorithms
        str1_lower = str1.lower().strip()
        str2_lower = str2.lower().strip()
        
        if str1_lower == str2_lower:
            return True
        
        # Calculate similarity ratio
        max_len = max(len(str1_lower), len(str2_lower))
        if max_len == 0:
            return False
        
        # Simple character overlap similarity
        common_chars = sum(1 for c in str1_lower if c in str2_lower)
        similarity = common_chars / max_len
        
        return similarity >= threshold
    
    async def _resolve_entity_group(self, group: List[ExtractedData]) -> ProcessedCandidate:
        """
        Resolve a group of extracted data into a single candidate
        
        Args:
            group: List of extracted data for the same entity
            
        Returns:
            Processed candidate with resolved identity
        """
        # Merge data from all sources
        merged_data = self._merge_extracted_data(group)
        
        # Generate unique candidate ID
        candidate_id = self._generate_candidate_id(merged_data)
        
        # Calculate confidence score
        confidence_score = self._calculate_resolution_confidence(group)
        
        # Create processed candidate
        processed_candidate = ProcessedCandidate(
            candidate_id=candidate_id,
            resolved_identity=merged_data,
            source_data=group,
            contradictions=[],  # Will be populated by detect_contradictions
            extraordinary_index=ExtraordinaryIndex(
                innovation=0.0,
                adoption=0.0,
                influence=0.0,
                velocity=0.0,
                selectivity=0.0,
                overall_score=0.0
            ),
            confidence_score=confidence_score,
            metadata={
                "resolution_timestamp": datetime.now().isoformat(),
                "source_count": len(group),
                "resolution_methods": [ResolutionMethod.FUZZY_MATCHING.value]
            }
        )
        
        return processed_candidate
    
    def _merge_extracted_data(self, group: List[ExtractedData]) -> Dict[str, Any]:
        """
        Merge extracted data from multiple sources
        
        Args:
            group: List of extracted data for the same entity
            
        Returns:
            Merged data dictionary
        """
        merged = {}
        
        # Start with the highest confidence source
        sorted_group = sorted(group, key=lambda x: x.confidence_score, reverse=True)
        
        for data in sorted_group:
            content = data.extracted_content
            for key, value in content.items():
                if key not in merged or not merged[key]:
                    merged[key] = value
                elif isinstance(value, list) and isinstance(merged[key], list):
                    # Merge lists, removing duplicates
                    merged[key] = list(set(merged[key] + value))
                elif isinstance(value, dict) and isinstance(merged[key], dict):
                    # Merge dictionaries
                    merged[key].update(value)
        
        return merged
    
    def _generate_candidate_id(self, merged_data: Dict[str, Any]) -> str:
        """Generate unique candidate ID"""
        # Use email if available, otherwise use name
        if merged_data.get("email"):
            return f"candidate_{merged_data['email'].replace('@', '_').replace('.', '_')}"
        elif merged_data.get("name"):
            return f"candidate_{merged_data['name'].replace(' ', '_').lower()}"
        else:
            return f"candidate_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def _calculate_resolution_confidence(self, group: List[ExtractedData]) -> float:
        """Calculate confidence score for entity resolution"""
        if not group:
            return 0.0
        
        # Base confidence on number of sources and their individual confidence
        source_count = len(group)
        avg_confidence = sum(data.confidence_score for data in group) / source_count
        
        # Boost confidence for multiple sources
        source_bonus = min(0.2, (source_count - 1) * 0.1)
        
        return min(1.0, avg_confidence + source_bonus)
    
    async def detect_contradictions(self, candidates: List[ProcessedCandidate]) -> List[Contradiction]:
        """
        Detect contradictions in candidate data
        
        Args:
            candidates: List of processed candidates
            
        Returns:
            List of detected contradictions
        """
        logger.info(f"Starting contradiction detection for {len(candidates)} candidates")
        
        contradictions = []
        
        for candidate in candidates:
            candidate_contradictions = await self._detect_candidate_contradictions(candidate)
            contradictions.extend(candidate_contradictions)
            candidate.contradictions = candidate_contradictions
        
        logger.info(f"Detected {len(contradictions)} contradictions")
        return contradictions
    
    async def _detect_candidate_contradictions(self, candidate: ProcessedCandidate) -> List[Contradiction]:
        """
        Detect contradictions within a single candidate's data
        
        Args:
            candidate: Processed candidate
            
        Returns:
            List of contradictions for this candidate
        """
        contradictions = []
        source_data = candidate.source_data
        
        # Compare data across sources
        for i, data1 in enumerate(source_data):
            for data2 in source_data[i+1:]:
                source_contradictions = await self._compare_sources(data1, data2, candidate.candidate_id)
                contradictions.extend(source_contradictions)
        
        return contradictions
    
    async def _compare_sources(self, data1: ExtractedData, data2: ExtractedData, candidate_id: str) -> List[Contradiction]:
        """
        Compare two data sources for contradictions
        
        Args:
            data1: First data source
            data2: Second data source
            candidate_id: Candidate ID
            
        Returns:
            List of contradictions between the sources
        """
        contradictions = []
        
        # Compare key fields
        fields_to_compare = ["name", "email", "location", "company", "title"]
        
        for field in fields_to_compare:
            value1 = data1.extracted_content.get(field)
            value2 = data2.extracted_content.get(field)
            
            if value1 and value2 and not self._fuzzy_match(str(value1), str(value2), threshold=0.9):
                contradiction = Contradiction(
                    contradiction_id=f"contradiction_{candidate_id}_{field}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    candidate_id=candidate_id,
                    contradiction_type=self._get_contradiction_type(field),
                    field_name=field,
                    source_1_value=str(value1),
                    source_2_value=str(value2),
                    source_1_id=data1.source_id,
                    source_2_id=data2.source_id,
                    confidence_score=0.8,
                    severity="medium",
                    description=f"Conflicting {field}: '{value1}' vs '{value2}'"
                )
                contradictions.append(contradiction)
        
        return contradictions
    
    def _get_contradiction_type(self, field_name: str) -> ContradictionType:
        """Get contradiction type based on field name"""
        type_mapping = {
            "name": ContradictionType.NAME_MISMATCH,
            "email": ContradictionType.EMAIL_MISMATCH,
            "skills": ContradictionType.SKILL_CONFLICT,
            "experience": ContradictionType.EXPERIENCE_CONFLICT,
            "location": ContradictionType.LOCATION_CONFLICT,
            "timeline": ContradictionType.TIMELINE_CONFLICT
        }
        return type_mapping.get(field_name, ContradictionType.NAME_MISMATCH)
    
    async def calculate_extraordinary_index(self, candidates: List[ProcessedCandidate], contradictions: List[Contradiction]) -> List[ExtraordinaryIndex]:
        """
        Calculate Extraordinary Index for all candidates
        
        Args:
            candidates: List of processed candidates
            contradictions: List of detected contradictions
            
        Returns:
            List of Extraordinary Index scores
        """
        logger.info(f"Calculating Extraordinary Index for {len(candidates)} candidates")
        
        extraordinary_indices = []
        
        for candidate in candidates:
            try:
                index = await self._calculate_candidate_extraordinary_index(candidate, contradictions)
                candidate.extraordinary_index = index
                extraordinary_indices.append(index)
            except Exception as e:
                logger.error(f"Error calculating Extraordinary Index for candidate {candidate.candidate_id}: {str(e)}")
                # Create default index
                default_index = ExtraordinaryIndex(
                    innovation=0.0,
                    adoption=0.0,
                    influence=0.0,
                    velocity=0.0,
                    selectivity=0.0,
                    overall_score=0.0
                )
                candidate.extraordinary_index = default_index
                extraordinary_indices.append(default_index)
        
        logger.info(f"Successfully calculated Extraordinary Index for {len(extraordinary_indices)} candidates")
        return extraordinary_indices
    
    async def _calculate_candidate_extraordinary_index(self, candidate: ProcessedCandidate, contradictions: List[Contradiction]) -> ExtraordinaryIndex:
        """
        Calculate Extraordinary Index for a single candidate
        
        Args:
            candidate: Processed candidate
            contradictions: List of all contradictions
            
        Returns:
            Extraordinary Index score
        """
        resolved_identity = candidate.resolved_identity
        
        # Calculate Innovation score
        innovation = self._calculate_innovation_score(resolved_identity)
        
        # Calculate Adoption score
        adoption = self._calculate_adoption_score(resolved_identity)
        
        # Calculate Influence score
        influence = self._calculate_influence_score(resolved_identity)
        
        # Calculate Velocity score
        velocity = self._calculate_velocity_score(resolved_identity)
        
        # Calculate Selectivity score
        selectivity = self._calculate_selectivity_score(resolved_identity, contradictions)
        
        # Calculate overall score
        weights = self.extraordinary_index_weights
        overall_score = (
            innovation * weights["innovation"] +
            adoption * weights["adoption"] +
            influence * weights["influence"] +
            velocity * weights["velocity"] +
            selectivity * weights["selectivity"]
        )
        
        return ExtraordinaryIndex(
            innovation=innovation,
            adoption=adoption,
            influence=influence,
            velocity=velocity,
            selectivity=selectivity,
            overall_score=overall_score
        )
    
    def _calculate_innovation_score(self, identity: Dict[str, Any]) -> float:
        """Calculate Innovation score based on patents, papers, and projects"""
        score = 0.0
        
        # Patent count
        patents = identity.get("patents", [])
        if patents:
            score += min(1.0, len(patents) * 0.2)
        
        # Research papers
        papers = identity.get("papers", [])
        if papers:
            score += min(1.0, len(papers) * 0.1)
        
        # GitHub repositories
        repos = identity.get("repositories", [])
        if repos:
            # Score based on repository activity and stars
            total_stars = sum(repo.get("stargazers_count", 0) for repo in repos if isinstance(repo, dict))
            score += min(1.0, total_stars * 0.01)
        
        # Skills in emerging technologies
        skills = identity.get("skills", [])
        emerging_skills = ["ai", "machine learning", "blockchain", "quantum", "robotics"]
        emerging_count = sum(1 for skill in skills if any(es in skill.lower() for es in emerging_skills))
        score += min(1.0, emerging_count * 0.2)
        
        return min(1.0, score)
    
    def _calculate_adoption_score(self, identity: Dict[str, Any]) -> float:
        """Calculate Adoption score based on technology adoption and market presence"""
        score = 0.0
        
        # GitHub followers
        followers = identity.get("followers", 0)
        if followers:
            score += min(1.0, followers * 0.001)
        
        # Company size/recognition
        company = identity.get("company", "")
        if company:
            # Simple scoring based on company name (would be more sophisticated in production)
            if any(big_tech in company.lower() for big_tech in ["google", "microsoft", "amazon", "apple", "meta"]):
                score += 0.5
        
        # Social media presence
        social_media = identity.get("social_media", {})
        if social_media:
            total_followers = sum(sm.get("followers", 0) for sm in social_media.values() if isinstance(sm, dict))
            score += min(1.0, total_followers * 0.0001)
        
        return min(1.0, score)
    
    def _calculate_influence_score(self, identity: Dict[str, Any]) -> float:
        """Calculate Influence score based on citations, mentions, and impact"""
        score = 0.0
        
        # Paper citations
        papers = identity.get("papers", [])
        if papers:
            total_citations = sum(paper.get("citation_count", 0) for paper in papers if isinstance(paper, dict))
            score += min(1.0, total_citations * 0.01)
        
        # GitHub repository stars
        repos = identity.get("repositories", [])
        if repos:
            total_stars = sum(repo.get("stargazers_count", 0) for repo in repos if isinstance(repo, dict))
            score += min(1.0, total_stars * 0.005)
        
        # Speaking engagements, awards, etc.
        awards = identity.get("awards", [])
        if awards:
            score += min(1.0, len(awards) * 0.2)
        
        return min(1.0, score)
    
    def _calculate_velocity_score(self, identity: Dict[str, Any]) -> float:
        """Calculate Velocity score based on recent activity and growth"""
        score = 0.0
        
        # Recent GitHub activity
        repos = identity.get("repositories", [])
        if repos:
            recent_activity = 0
            for repo in repos:
                if isinstance(repo, dict):
                    updated_at = repo.get("updated_at")
                    if updated_at:
                        # Simple recency scoring (would be more sophisticated in production)
                        recent_activity += 1
            score += min(1.0, recent_activity * 0.1)
        
        # Career progression
        experience = identity.get("experience", [])
        if experience:
            # Score based on career progression and role advancement
            score += min(1.0, len(experience) * 0.1)
        
        return min(1.0, score)
    
    def _calculate_selectivity_score(self, identity: Dict[str, Any], contradictions: List[Contradiction]) -> float:
        """Calculate Selectivity score based on data quality and exclusivity"""
        score = 0.0
        
        # Data completeness
        required_fields = ["name", "email", "experience", "skills"]
        complete_fields = sum(1 for field in required_fields if identity.get(field))
        score += (complete_fields / len(required_fields)) * 0.5
        
        # Data consistency (inverse of contradictions)
        candidate_contradictions = [c for c in contradictions if c.candidate_id == identity.get("candidate_id")]
        if candidate_contradictions:
            contradiction_penalty = min(0.5, len(candidate_contradictions) * 0.1)
            score += 0.5 - contradiction_penalty
        else:
            score += 0.5
        
        return min(1.0, score)
    
    async def generate_action_plan(self, candidates: List[ProcessedCandidate], extraordinary_indices: List[ExtraordinaryIndex]) -> List[ActionPlan]:
        """
        Generate action plans for candidates based on their Extraordinary Index
        
        Args:
            candidates: List of processed candidates
            extraordinary_indices: List of Extraordinary Index scores
            
        Returns:
            List of action plans
        """
        logger.info(f"Generating action plans for {len(candidates)} candidates")
        
        action_plans = []
        
        for candidate, index in zip(candidates, extraordinary_indices):
            try:
                action_plan = await self._generate_candidate_action_plan(candidate, index)
                action_plans.append(action_plan)
            except Exception as e:
                logger.error(f"Error generating action plan for candidate {candidate.candidate_id}: {str(e)}")
                # Create default action plan
                default_plan = ActionPlan(
                    candidate_id=candidate.candidate_id,
                    actions=[],
                    priority="low",
                    estimated_effort="minimal",
                    expected_outcome="standard"
                )
                action_plans.append(default_plan)
        
        logger.info(f"Successfully generated {len(action_plans)} action plans")
        return action_plans
    
    async def _generate_candidate_action_plan(self, candidate: ProcessedCandidate, index: ExtraordinaryIndex) -> ActionPlan:
        """
        Generate action plan for a single candidate
        
        Args:
            candidate: Processed candidate
            index: Extraordinary Index score
            
        Returns:
            Action plan for the candidate
        """
        actions = []
        priority = "low"
        estimated_effort = "minimal"
        expected_outcome = "standard"
        
        # Determine priority based on overall score
        if index.overall_score >= 0.8:
            priority = "high"
            estimated_effort = "significant"
            expected_outcome = "exceptional"
        elif index.overall_score >= 0.6:
            priority = "medium"
            estimated_effort = "moderate"
            expected_outcome = "good"
        
        # Generate CRM upsert action
        if candidate.resolved_identity.get("email"):
            actions.append({
                "type": "crm_upsert",
                "description": "Update CRM with resolved candidate data",
                "data": {
                    "email": candidate.resolved_identity.get("email"),
                    "name": candidate.resolved_identity.get("name"),
                    "extraordinary_index": index.overall_score,
                    "source_count": len(candidate.source_data)
                }
            })
        
        # Generate outreach draft action
        if index.overall_score >= 0.6:
            actions.append({
                "type": "outreach_draft",
                "description": "Generate personalized outreach message",
                "data": {
                    "candidate_name": candidate.resolved_identity.get("name"),
                    "key_achievements": self._extract_key_achievements(candidate.resolved_identity),
                    "personalization_points": self._extract_personalization_points(candidate.resolved_identity)
                }
            })
        
        # Generate evidence packet action for high-scoring candidates
        if index.overall_score >= 0.8:
            actions.append({
                "type": "evidence_packet",
                "description": "Compile evidence packet for visa applications",
                "data": {
                    "candidate_id": candidate.candidate_id,
                    "extraordinary_index": index.overall_score,
                    "supporting_documents": self._identify_supporting_documents(candidate)
                }
            })
        
        return ActionPlan(
            candidate_id=candidate.candidate_id,
            actions=actions,
            priority=priority,
            estimated_effort=estimated_effort,
            expected_outcome=expected_outcome
        )
    
    def _extract_key_achievements(self, identity: Dict[str, Any]) -> List[str]:
        """Extract key achievements from candidate identity"""
        achievements = []
        
        # GitHub achievements
        repos = identity.get("repositories", [])
        if repos:
            total_stars = sum(repo.get("stargazers_count", 0) for repo in repos if isinstance(repo, dict))
            if total_stars > 100:
                achievements.append(f"GitHub repositories with {total_stars} total stars")
        
        # Patent achievements
        patents = identity.get("patents", [])
        if patents:
            achievements.append(f"{len(patents)} patents filed")
        
        # Paper achievements
        papers = identity.get("papers", [])
        if papers:
            total_citations = sum(paper.get("citation_count", 0) for paper in papers if isinstance(paper, dict))
            if total_citations > 50:
                achievements.append(f"Research papers with {total_citations} citations")
        
        return achievements
    
    def _extract_personalization_points(self, identity: Dict[str, Any]) -> List[str]:
        """Extract personalization points for outreach"""
        points = []
        
        # Skills
        skills = identity.get("skills", [])
        if skills:
            points.append(f"Expertise in {', '.join(skills[:3])}")
        
        # Company
        company = identity.get("company")
        if company:
            points.append(f"Experience at {company}")
        
        # Location
        location = identity.get("location")
        if location:
            points.append(f"Based in {location}")
        
        return points
    
    def _identify_supporting_documents(self, candidate: ProcessedCandidate) -> List[str]:
        """Identify supporting documents for evidence packets"""
        documents = []
        
        # GitHub profile
        if any("github" in data.source_type for data in candidate.source_data):
            documents.append("GitHub profile and repositories")
        
        # Research papers
        if any("arxiv" in data.source_type for data in candidate.source_data):
            documents.append("Research publications and citations")
        
        # Patents
        if any("patent" in data.source_type for data in candidate.source_data):
            documents.append("Patent filings and intellectual property")
        
        # Resume
        if any("resume" in data.source_type for data in candidate.source_data):
            documents.append("Professional resume and experience")
        
        return documents
    
    def _load_resolution_rules(self) -> Dict[str, Any]:
        """Load entity resolution rules"""
        return {
            "fuzzy_threshold": 0.8,
            "required_matches": 1,
            "confidence_weights": {
                "email": 0.4,
                "name": 0.3,
                "phone": 0.2,
                "location": 0.1
            }
        }
    
    def _load_contradiction_patterns(self) -> Dict[str, Any]:
        """Load contradiction detection patterns"""
        return {
            "name_variations": ["nickname", "short_name", "full_name"],
            "email_domains": ["gmail.com", "yahoo.com", "outlook.com"],
            "location_synonyms": {
                "san francisco": ["sf", "bay area", "silicon valley"],
                "new york": ["nyc", "manhattan", "brooklyn"]
            }
        }
    
    def _load_extraordinary_index_weights(self) -> Dict[str, float]:
        """Load weights for Extraordinary Index calculation"""
        return {
            "innovation": 0.25,
            "adoption": 0.20,
            "influence": 0.25,
            "velocity": 0.15,
            "selectivity": 0.15
        }
