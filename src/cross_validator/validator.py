from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
import logging
from datetime import datetime
from ..models import Claim, Source, SourceType

logger = logging.getLogger(__name__)

class CrossValidator:
    def __init__(self, min_sources: int = 2, confidence_threshold: float = 0.7):
        self.min_sources = min_sources
        self.confidence_threshold = confidence_threshold
        
        self.source_credibility = {
            SourceType.NATURE: 0.98,
            SourceType.IBM: 0.9,
            SourceType.USPTO: 0.88,
            SourceType.NYTIMES: 0.85,
            SourceType.ARXIV: 0.8
        }
    
    def calculate_confidence_score(self, claims: List[Claim]) -> float:
        if not claims:
            return 0.0
        
        source_authority = max(self.source_credibility.get(claim.sources[0].source_type, 0.5) for claim in claims)
        independent_corroboration = len(set(claim.sources[0].source_type for claim in claims)) / len(SourceType)
        extraction_confidence = sum(claim.confidence_score for claim in claims) / len(claims)
        
        recency_scores = []
        for claim in claims:
            if claim.temporal_context and 'publication_date' in claim.temporal_context:
                try:
                    pub_date = datetime.fromisoformat(claim.temporal_context['publication_date'].replace('Z', '+00:00'))
                    days_old = (datetime.now() - pub_date).days
                    recency_score = max(0.1, 1.0 - (days_old / 365.0))  # Decay over a year
                    recency_scores.append(recency_score)
                except:
                    recency_scores.append(0.5)  # Default if date parsing fails
            else:
                recency_scores.append(0.5)
        
        recency = sum(recency_scores) / len(recency_scores) if recency_scores else 0.5
        
        confidence = (
            source_authority * 0.4 +
            independent_corroboration * 0.3 +
            extraction_confidence * 0.2 +
            recency * 0.1
        )
        
        return min(1.0, confidence)
    
    def group_similar_claims(self, claims: List[Claim]) -> Dict[str, List[Claim]]:
        grouped = defaultdict(list)
        
        for claim in claims:
            if isinstance(claim.value, dict) and 'person' in claim.value:
                person = claim.value['person'].lower().strip()
                claim_type = claim.claim_type
                
                if claim_type == "patent_count":
                    key = f"{person}:patent_count"
                elif claim_type == "role":
                    role = claim.value.get('role', '').lower().strip()
                    org = claim.value.get('organization', '').lower().strip()
                    key = f"{person}:role:{role}:{org}"
                elif claim_type == "publication":
                    title = claim.value.get('title', '').lower().strip()
                    key = f"{person}:publication:{title}"
                elif claim_type == "patent":
                    patent_num = claim.value.get('patent_number', '').strip()
                    key = f"{person}:patent:{patent_num}"
                else:
                    key = f"{person}:{claim_type}"
                
                grouped[key].append(claim)
        
        return dict(grouped)
    
    def detect_contradictions(self, claims: List[Claim]) -> List[Tuple[Claim, List[Claim]]]:
        contradictions = []
        
        grouped = self.group_similar_claims(claims)
        
        for key, claim_group in grouped.items():
            if len(claim_group) < 2:
                continue
            
            if "patent_count" in key:
                counts = set()
                for claim in claim_group:
                    if isinstance(claim.value, dict) and 'count' in claim.value:
                        counts.add(claim.value['count'])
                
                if len(counts) > 1:
                    primary_claim = max(claim_group, key=lambda c: c.confidence_score)
                    contradictory = [c for c in claim_group if c != primary_claim]
                    contradictions.append((primary_claim, contradictory))
            
            elif "role" in key:
                roles = set()
                for claim in claim_group:
                    if isinstance(claim.value, dict) and 'role' in claim.value:
                        role = claim.value['role']
                        org = claim.value.get('organization', '')
                        roles.add((role, org))
                
                if len(roles) > 1:
                    primary_claim = max(claim_group, key=lambda c: c.confidence_score)
                    contradictory = [c for c in claim_group if c != primary_claim]
                    contradictions.append((primary_claim, contradictory))
        
        return contradictions
    
    def resolve_contradictions(self, primary_claim: Claim, contradictory_claims: List[Claim]) -> Claim:
        all_sources = primary_claim.sources.copy()
        all_snippets = primary_claim.supporting_snippets.copy()
        
        for claim in contradictory_claims:
            all_sources.extend(claim.sources)
            all_snippets.extend(claim.supporting_snippets)
        
        primary_claim.contradictory_claims = contradictory_claims
        primary_claim.sources = all_sources
        primary_claim.supporting_snippets = all_snippets
        
        all_claims = [primary_claim] + contradictory_claims
        primary_claim.confidence_score = self.calculate_confidence_score(all_claims)
        
        if isinstance(primary_claim.value, dict):
            if 'notes' not in primary_claim.value:
                primary_claim.value['notes'] = []
            
            contradiction_note = f"Sources disagree; {len(contradictory_claims)} contradictory claims found. See evidence for details."
            primary_claim.value['notes'].append(contradiction_note)
        
        return primary_claim
    
    def validate_claims(self, claims: List[Claim]) -> List[Claim]:
        logger.info(f"Starting cross-validation of {len(claims)} claims")
        
        grouped_claims = self.group_similar_claims(claims)
        validated_claims = []
        
        for key, claim_group in grouped_claims.items():
            if len(claim_group) >= self.min_sources:
                primary_claim = max(claim_group, key=lambda c: c.confidence_score)
                
                all_sources = []
                all_snippets = []
                for claim in claim_group:
                    all_sources.extend(claim.sources)
                    all_snippets.extend(claim.supporting_snippets)
                
                primary_claim.sources = all_sources
                primary_claim.supporting_snippets = all_snippets
                primary_claim.confidence_score = self.calculate_confidence_score(claim_group)
                
                validated_claims.append(primary_claim)
            
            elif len(claim_group) == 1:
                claim = claim_group[0]
                source_credibility = self.source_credibility.get(claim.sources[0].source_type, 0.5)
                
                if source_credibility >= 0.9:  # High authority source
                    validated_claims.append(claim)
                else:
                    claim.human_reviewed = False
                    if isinstance(claim.value, dict):
                        if 'notes' not in claim.value:
                            claim.value['notes'] = []
                        claim.value['notes'].append("Single source claim - requires human review")
                    validated_claims.append(claim)
        
        contradictions = self.detect_contradictions(validated_claims)
        for primary_claim, contradictory_claims in contradictions:
            resolved_claim = self.resolve_contradictions(primary_claim, contradictory_claims)
            validated_claims = [c for c in validated_claims if c not in contradictory_claims]
        
        logger.info(f"Cross-validation completed. {len(validated_claims)} validated claims, {len(contradictions)} contradictions resolved")
        
        return validated_claims
