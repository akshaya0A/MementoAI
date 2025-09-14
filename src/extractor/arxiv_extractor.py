from typing import List, Dict, Any
from datetime import datetime
from .base_extractor import BaseExtractor
from ..models import Claim, Source, SourceType

class ArxivExtractor(BaseExtractor):
    def extract(self, content: Dict[str, Any], source: Source) -> List[Claim]:
        claims = []
        title = content.get('title', '')
        authors = content.get('authors', [])
        abstract = content.get('abstract', '')
        categories = content.get('categories', [])
        
        for author in authors:
            normalized_name = self.normalize_name(author)
            
            claim = Claim(
                claim_text=f"{normalized_name} published '{title}' on arXiv",
                claim_type="publication",
                value={
                    "person": normalized_name,
                    "title": title,
                    "journal": "arXiv",
                    "publication_date": content.get('publication_date'),
                    "arxiv_id": content.get('arxiv_id'),
                    "categories": categories
                },
                confidence_score=0.85,  # arXiv is reliable but preprints may not be peer-reviewed
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
                        confidence_score=0.75,  # Roles from arXiv abstracts are less certain
                        sources=[source],
                        supporting_snippets=[role_info['context']],
                        temporal_context={
                            "publication_date": content.get('publication_date'),
                            "extracted_at": datetime.now().isoformat()
                        }
                    )
                    claims.append(claim)
        
        return claims
