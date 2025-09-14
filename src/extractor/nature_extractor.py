from typing import List, Dict, Any
from datetime import datetime
from .base_extractor import BaseExtractor
from ..models import Claim, Source, SourceType

class NatureExtractor(BaseExtractor):
    def extract(self, content: Dict[str, Any], source: Source) -> List[Claim]:
        claims = []
        title = content.get('title', '')
        authors = content.get('authors', [])
        abstract = content.get('abstract', '')
        journal = content.get('journal', 'Nature')
        
        for author in authors:
            normalized_name = self.normalize_name(author)
            
            claim = Claim(
                claim_text=f"{normalized_name} published '{title}' in {journal}",
                claim_type="publication",
                value={
                    "person": normalized_name,
                    "title": title,
                    "journal": journal,
                    "publication_date": content.get('publication_date'),
                    "doi": content.get('doi')
                },
                confidence_score=0.98,  # Nature publications are highly credible
                sources=[source],
                supporting_snippets=[f"Title: {title}", f"Authors: {', '.join(authors)}", f"Abstract: {abstract[:200]}..."],
                temporal_context={
                    "publication_date": content.get('publication_date'),
                    "extracted_at": datetime.now().isoformat()
                }
            )
            claims.append(claim)
            
            if abstract:
                roles = self.extract_roles(abstract, normalized_name)
                for role_info in roles:
                    claim = Claim(
                        claim_text=f"{normalized_name} is {role_info['role']}",
                        claim_type="role",
                        value={
                            "person": normalized_name,
                            "role": role_info['role'],
                            "organization": role_info.get('organization')
                        },
                        confidence_score=0.85,  # Roles extracted from abstracts are fairly reliable
                        sources=[source],
                        supporting_snippets=[role_info['context']],
                        temporal_context={
                            "publication_date": content.get('publication_date'),
                            "extracted_at": datetime.now().isoformat()
                        }
                    )
                    claims.append(claim)
        
        return claims
