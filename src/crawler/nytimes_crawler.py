from typing import List, Dict, Any, Optional
import re
from urllib.parse import urljoin, quote
from .base_crawler import BaseCrawler
from ..models import SourceType
import logging

logger = logging.getLogger(__name__)

class NYTimesCrawler(BaseCrawler):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.base_url = "https://www.nytimes.com"
        self.search_url = "https://www.nytimes.com/search"
        
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        search_params = {
            'query': query,
            'sort': 'best'
        }
        
        response = self._make_request(self.search_url, params=search_params)
        if not response:
            return []
        
        soup = self._parse_html(response.text)
        results = []
        
        article_links = soup.find_all('a', href=re.compile(r'/\d{4}/\d{2}/\d{2}/'))
        
        for link in article_links[:max_results]:
            href = link.get('href')
            if href:
                full_url = urljoin(self.base_url, href)
                title_elem = link.find('h4') or link.find('h3') or link
                title = title_elem.get_text(strip=True) if title_elem else "No title"
                
                results.append({
                    'url': full_url,
                    'title': title,
                    'source_type': SourceType.NYTIMES
                })
        
        return results
    
    def extract_content(self, url: str) -> Optional[Dict[str, Any]]:
        response = self._make_request(url)
        if not response:
            return None
        
        soup = self._parse_html(response.text)
        
        title = ""
        title_elem = soup.find('h1')
        if title_elem:
            title = title_elem.get_text(strip=True)
        
        content_sections = soup.find_all(['p', 'div'], class_=re.compile(r'story|article|content'))
        content_text = ""
        for section in content_sections:
            content_text += section.get_text(strip=True) + " "
        
        byline = ""
        byline_elem = soup.find(['span', 'div'], class_=re.compile(r'byline|author'))
        if byline_elem:
            byline = byline_elem.get_text(strip=True)
        
        date_elem = soup.find('time') or soup.find(['span', 'div'], class_=re.compile(r'date|time'))
        pub_date = ""
        if date_elem:
            pub_date = date_elem.get('datetime') or date_elem.get_text(strip=True)
        
        return {
            'title': title,
            'content': content_text.strip(),
            'byline': byline,
            'publication_date': pub_date,
            'raw_html': response.text
        }
