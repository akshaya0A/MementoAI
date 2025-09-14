from typing import List, Dict, Any, Optional
import re
import xml.etree.ElementTree as ET
from urllib.parse import quote
from .base_crawler import BaseCrawler
from ..models import SourceType
import logging

logger = logging.getLogger(__name__)

class ArxivCrawler(BaseCrawler):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.base_url = "http://export.arxiv.org/api/query"
        
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        search_params = {
            'search_query': f'all:{query}',
            'start': 0,
            'max_results': max_results,
            'sortBy': 'relevance',
            'sortOrder': 'descending'
        }
        
        response = self._make_request(self.base_url, params=search_params)
        if not response:
            return []
        
        results = []
        try:
            root = ET.fromstring(response.text)
            
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            entries = root.findall('atom:entry', ns)
            
            for entry in entries:
                title_elem = entry.find('atom:title', ns)
                id_elem = entry.find('atom:id', ns)
                
                if title_elem is not None and id_elem is not None:
                    title = title_elem.text.strip()
                    arxiv_url = id_elem.text.strip()
                    
                    results.append({
                        'url': arxiv_url,
                        'title': title,
                        'source_type': SourceType.ARXIV
                    })
        
        except ET.ParseError as e:
            logger.error(f"Failed to parse arXiv API response: {e}")
        
        return results
    
    def extract_content(self, url: str) -> Optional[Dict[str, Any]]:
        arxiv_id_match = re.search(r'(\d{4}\.\d{4,5})', url)
        if not arxiv_id_match:
            return None
        
        arxiv_id = arxiv_id_match.group(1)
        
        search_params = {
            'id_list': arxiv_id
        }
        
        response = self._make_request(self.base_url, params=search_params)
        if not response:
            return None
        
        try:
            root = ET.fromstring(response.text)
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            entry = root.find('atom:entry', ns)
            
            if entry is None:
                return None
            
            title_elem = entry.find('atom:title', ns)
            title = title_elem.text.strip() if title_elem is not None else ""
            
            authors = []
            author_elems = entry.findall('atom:author', ns)
            for author_elem in author_elems:
                name_elem = author_elem.find('atom:name', ns)
                if name_elem is not None:
                    authors.append(name_elem.text.strip())
            
            summary_elem = entry.find('atom:summary', ns)
            abstract = summary_elem.text.strip() if summary_elem is not None else ""
            
            published_elem = entry.find('atom:published', ns)
            pub_date = published_elem.text.strip() if published_elem is not None else ""
            
            categories = []
            category_elems = entry.findall('atom:category', ns)
            for cat_elem in category_elems:
                term = cat_elem.get('term')
                if term:
                    categories.append(term)
            
            return {
                'title': title,
                'authors': authors,
                'abstract': abstract,
                'publication_date': pub_date,
                'categories': categories,
                'arxiv_id': arxiv_id,
                'raw_xml': response.text
            }
        
        except ET.ParseError as e:
            logger.error(f"Failed to parse arXiv API response: {e}")
            return None
