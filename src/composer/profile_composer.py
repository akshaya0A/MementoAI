from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict
from ..models import Claim, Person, ResearchResult, SourceType

class ProfileComposer:
    def __init__(self):
        pass
    
    def create_timeline(self, claims: List[Claim]) -> List[Dict[str, Any]]:
        timeline_events = []
        
        for claim in claims:
            if claim.temporal_context and 'publication_date' in claim.temporal_context:
                try:
                    date_str = claim.temporal_context['publication_date']
                    if date_str:
                        try:
                            event_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        except:
                            from dateutil import parser
                            event_date = parser.parse(date_str)
                        
                        timeline_events.append({
                            'date': event_date,
                            'event': claim.claim_text,
                            'type': claim.claim_type,
                            'confidence': claim.confidence_score,
                            'sources': [s.url for s in claim.sources]
                        })
                except:
                    continue
        
        timeline_events.sort(key=lambda x: x['date'])
        
        for event in timeline_events:
            event['date'] = event['date'].isoformat()
        
        return timeline_events
    
    def group_claims_by_type(self, claims: List[Claim]) -> Dict[str, List[Claim]]:
        grouped = defaultdict(list)
        for claim in claims:
            grouped[claim.claim_type].append(claim)
        return dict(grouped)
    
    def create_claim_cards(self, claims: List[Claim]) -> List[Dict[str, Any]]:
        claim_cards = []
        
        for claim in claims:
            needs_review = (
                claim.confidence_score < 0.7 or
                len(claim.contradictory_claims) > 0 or
                not claim.human_reviewed
            )
            
            citations = []
            for source in claim.sources:
                citations.append({
                    'url': source.url,
                    'title': source.title,
                    'source_type': source.source_type.value,
                    'credibility_score': source.credibility_score
                })
            
            claim_card = {
                'id': f"claim_{hash(claim.claim_text)}",
                'claim_text': claim.claim_text,
                'claim_type': claim.claim_type,
                'value': claim.value,
                'confidence_score': claim.confidence_score,
                'citations': citations,
                'supporting_snippets': claim.supporting_snippets,
                'contradictory_claims': [
                    {
                        'claim_text': c.claim_text,
                        'confidence_score': c.confidence_score,
                        'sources': [s.url for s in c.sources]
                    } for c in claim.contradictory_claims
                ],
                'needs_human_review': needs_review,
                'human_approved': claim.human_approved,
                'temporal_context': claim.temporal_context,
                'notes': claim.value.get('notes', []) if isinstance(claim.value, dict) else []
            }
            
            claim_cards.append(claim_card)
        
        return claim_cards
    
    def generate_summary(self, person_name: str, claims: List[Claim]) -> str:
        grouped_claims = self.group_claims_by_type(claims)
        
        summary_parts = [f"Profile Summary for {person_name}:"]
        
        if 'role' in grouped_claims:
            roles = []
            for claim in grouped_claims['role']:
                if isinstance(claim.value, dict):
                    role = claim.value.get('role', '')
                    org = claim.value.get('organization', '')
                    if org:
                        roles.append(f"{role} at {org}")
                    else:
                        roles.append(role)
            
            if roles:
                summary_parts.append(f"Roles: {', '.join(set(roles))}")
        
        if 'publication' in grouped_claims:
            pub_count = len(grouped_claims['publication'])
            journals = set()
            for claim in grouped_claims['publication']:
                if isinstance(claim.value, dict):
                    journal = claim.value.get('journal', '')
                    if journal:
                        journals.add(journal)
            
            summary_parts.append(f"Publications: {pub_count} publications")
            if journals:
                summary_parts.append(f"Published in: {', '.join(journals)}")
        
        if 'patent' in grouped_claims:
            patent_count = len(grouped_claims['patent'])
            summary_parts.append(f"Patents: {patent_count} patents as inventor")
        
        if 'patent_count' in grouped_claims:
            patent_count_claim = max(grouped_claims['patent_count'], key=lambda c: c.confidence_score)
            if isinstance(patent_count_claim.value, dict):
                count = patent_count_claim.value.get('count', 0)
                summary_parts.append(f"Patent Count: {count} patents (from press release)")
        
        return "\n".join(summary_parts)
    
    def compose_profile(self, query: str, claims: List[Claim], processing_time: float, sources_searched: List[SourceType]) -> ResearchResult:
        if not claims:
            return ResearchResult(
                query=query,
                person=Person(
                    name=query,
                    canonical_name=query,
                    confidence_score=0.0,
                    last_updated=datetime.now()
                ),
                processing_time=processing_time,
                sources_searched=sources_searched,
                total_claims=0,
                high_confidence_claims=0,
                conflicting_claims=0,
                human_review_required=True
            )
        
        person_name = query
        if claims and isinstance(claims[0].value, dict) and 'person' in claims[0].value:
            person_name = claims[0].value['person']
        
        grouped_claims = self.group_claims_by_type(claims)
        
        person = Person(
            name=person_name,
            canonical_name=person_name,
            all_claims=claims,
            confidence_score=sum(c.confidence_score for c in claims) / len(claims),
            last_updated=datetime.now()
        )
        
        high_confidence_claims = len([c for c in claims if c.confidence_score >= 0.8])
        conflicting_claims = len([c for c in claims if len(c.contradictory_claims) > 0])
        human_review_required = any(
            c.confidence_score < 0.7 or len(c.contradictory_claims) > 0 or not c.human_reviewed
            for c in claims
        )
        
        return ResearchResult(
            query=query,
            person=person,
            processing_time=processing_time,
            sources_searched=sources_searched,
            total_claims=len(claims),
            high_confidence_claims=high_confidence_claims,
            conflicting_claims=conflicting_claims,
            human_review_required=human_review_required
        )
