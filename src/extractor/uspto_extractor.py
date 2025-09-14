from typing import List, Dict, Any
from datetime import datetime
from .base_extractor import BaseExtractor
from ..models import Claim, Source, SourceType

class USPTOExtractor(BaseExtractor):
    def extract(self, content: Dict[str, Any], source: Source) -> List[Claim]:
        claims = []
        patent_number = content.get('patent_number', '')
        title = content.get('title', '')
        inventors = content.get('inventors', [])
        filing_date = content.get('filing_date', '')
        
        for inventor in inventors:
            normalized_name = self.normalize_name(inventor)
            
            claim = Claim(
                claim_text=f"{normalized_name} is inventor of patent {patent_number}",
                claim_type="patent",
                value={
                    "person": normalized_name,
                    "patent_number": patent_number,
                    "title": title,
                    "filing_date": filing_date
                },
                confidence_score=0.88,  # USPTO records are official but may have name variations
                sources=[source],
                supporting_snippets=[f"Patent: {patent_number}", f"Title: {title}", f"Inventors: {', '.join(inventors)}"],
                temporal_context={
                    "filing_date": filing_date,
                    "extracted_at": datetime.now().isoformat()
                }
            )
            claims.append(claim)
            
            claim = Claim(
                claim_text=f"{normalized_name} is an inventor",
                claim_type="role",
                value={
                    "person": normalized_name,
                    "role": "Inventor",
                    "organization": None
                },
                confidence_score=0.95,  # Being listed as inventor is highly reliable
                sources=[source],
                supporting_snippets=[f"Listed as inventor on patent {patent_number}"],
                temporal_context={
                    "filing_date": filing_date,
                    "extracted_at": datetime.now().isoformat()
                }
            )
            claims.append(claim)
        
        return claims
