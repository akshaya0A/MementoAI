from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import re
from datetime import datetime
from ..models import Claim, Source, SourceType

class BaseExtractor(ABC):
    def __init__(self):
        self.name_patterns = [
            r'Dr\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
            r'([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:Ph\.?D\.?|M\.?D\.?|Professor|Director|Scientist)',
            r'([A-Z][a-z]+\s+[A-Z][a-z]+)'
        ]
        
        self.role_patterns = [
            r'(?:is|was|serves as|worked as)\s+(?:a\s+)?([A-Z][a-z\s]+?)(?:\s+at|\s+for|\s+with)',
            r'([A-Z][a-z\s]+?)\s+at\s+([A-Z][a-z\s]+)',
            r'(Professor|Director|Scientist|Researcher|Engineer|Manager)\s+(?:of|at|for)\s+([A-Z][a-z\s]+)'
        ]
        
        self.patent_count_patterns = [
            r'(\d+)\s+patents?',
            r'holds?\s+(\d+)\s+patents?',
            r'inventor\s+of\s+(\d+)\s+patents?',
            r'(\d+)\s+issued\s+patents?'
        ]
    
    def normalize_name(self, name: str) -> str:
        name = re.sub(r'\b(?:Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)\s+', '', name)
        name = re.sub(r'\s+', ' ', name).strip()
        return name
    
    def extract_names(self, text: str) -> List[str]:
        names = []
        for pattern in self.name_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                normalized = self.normalize_name(match)
                if normalized and normalized not in names:
                    names.append(normalized)
        return names
    
    def extract_roles(self, text: str, person_name: str) -> List[Dict[str, Any]]:
        roles = []
        for pattern in self.role_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                context_start = max(0, match.start() - 100)
                context_end = min(len(text), match.end() + 100)
                context = text[context_start:context_end]
                
                if person_name.lower() in context.lower():
                    role_info = {
                        'role': match.group(1).strip(),
                        'organization': match.group(2).strip() if match.lastindex >= 2 else None,
                        'context': context.strip()
                    }
                    roles.append(role_info)
        return roles
    
    def extract_patent_counts(self, text: str) -> List[int]:
        counts = []
        for pattern in self.patent_count_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    count = int(match)
                    if count not in counts:
                        counts.append(count)
                except ValueError:
                    continue
        return counts
    
    def extract_dates(self, text: str) -> List[str]:
        date_patterns = [
            r'\b(\d{4})\b',
            r'\b(\w+\s+\d{1,2},\s+\d{4})\b',
            r'\b(\d{1,2}/\d{1,2}/\d{4})\b'
        ]
        
        dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            dates.extend(matches)
        return dates
    
    @abstractmethod
    def extract(self, content: Dict[str, Any], source: Source) -> List[Claim]:
        pass
