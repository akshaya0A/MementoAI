from typing import List, Dict, Any
from datetime import datetime
from .base_extractor import BaseExtractor
from ..models import Claim, Source, SourceType

class NYTimesExtractor(BaseExtractor):
    def extract(self, content: Dict[str, Any], source: Source) -> List[Claim]:
        claims = []
        text = content.get('content', '')
        title = content.get('title', '')
        
        full_text = f"{title} {text}"
        
        names = self.extract_names(full_text)
        
        for name in names:
            roles = self.extract_roles(full_text, name)
            for role_info in roles:
                claim = Claim(
                    claim_text=f"{name} is {role_info['role']}",
                    claim_type="role",
                    value={
                        "person": name,
                        "role": role_info['role'],
                        "organization": role_info.get('organization')
                    },
                    confidence_score=0.8,  # NYTimes is generally reliable
                    sources=[source],
                    supporting_snippets=[role_info['context']],
                    temporal_context={
                        "publication_date": content.get('publication_date'),
                        "extracted_at": datetime.now().isoformat()
                    }
                )
                claims.append(claim)
            
            patent_counts = self.extract_patent_counts(full_text)
            for count in patent_counts:
                context_pattern = f"{name}.{{0,200}}{count}.{{0,50}}patents?"
                import re
                if re.search(context_pattern, full_text, re.IGNORECASE | re.DOTALL):
                    claim = Claim(
                        claim_text=f"{name} has {count} patents",
                        claim_type="patent_count",
                        value={
                            "person": name,
                            "count": count
                        },
                        confidence_score=0.7,  # Patent counts in news articles may be approximate
                        sources=[source],
                        supporting_snippets=[full_text[max(0, full_text.lower().find(str(count))-100):full_text.lower().find(str(count))+100]],
                        temporal_context={
                            "publication_date": content.get('publication_date'),
                            "extracted_at": datetime.now().isoformat()
                        }
                    )
                    claims.append(claim)
        
        return claims
