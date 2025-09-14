from typing import List, Dict, Any, Optional
import re
from urllib.parse import urljoin, quote
from .base_crawler import BaseCrawler
from ..models import SourceType
import logging

logger = logging.getLogger(__name__)

class USPTOCrawler(BaseCrawler):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.base_url = "https://ppubs.uspto.gov"
        self.search_url = "https://ppubs.uspto.gov/dirsearch-public/searches/searchAdvanced"
        
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        driver = self._setup_selenium_driver()
        results = []
        
        try:
            driver.get("https://ppubs.uspto.gov/dirsearch-public/searches/searchAdvanced")
            
            search_input = driver.find_element(By.NAME, "searchText1")
            search_input.send_keys(query)
            
            search_button = driver.find_element(By.XPATH, "//input[@type='submit' and @value='Search']")
            search_button.click()
            
            driver.implicitly_wait(10)
            
            patent_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/netacgi/nph-Parser')]")
            
            for link in patent_links[:max_results]:
                href = link.get_attribute('href')
                title = link.text.strip()
                
                if href and title:
                    results.append({
                        'url': href,
                        'title': title,
                        'source_type': SourceType.USPTO
                    })
        
        except Exception as e:
            logger.error(f"USPTO search failed: {e}")
        
        finally:
            driver.quit()
        
        return results
    
    def extract_content(self, url: str) -> Optional[Dict[str, Any]]:
        response = self._make_request(url)
        if not response:
            return None
        
        soup = self._parse_html(response.text)
        
        patent_number = ""
        patent_num_elem = soup.find('td', string=re.compile(r'United States Patent'))
        if patent_num_elem:
            patent_number = re.search(r'(\d{1,2},\d{3},\d{3})', patent_num_elem.get_text()).group(1) if re.search(r'(\d{1,2},\d{3},\d{3})', patent_num_elem.get_text()) else ""
        
        title = ""
        title_elem = soup.find('font', size='4')
        if title_elem:
            title = title_elem.get_text(strip=True)
        
        inventors = []
        inventor_section = soup.find('td', string=re.compile(r'Inventor'))
        if inventor_section:
            inventor_text = inventor_section.find_next('td').get_text(strip=True)
            inventors = [name.strip() for name in inventor_text.split(';')]
        
        filing_date = ""
        filing_elem = soup.find('td', string=re.compile(r'Appl. No.:'))
        if filing_elem:
            date_text = filing_elem.find_next('td').get_text(strip=True)
            date_match = re.search(r'(\w+ \d{1,2}, \d{4})', date_text)
            if date_match:
                filing_date = date_match.group(1)
        
        abstract = ""
        abstract_elem = soup.find('p', string=re.compile(r'ABSTRACT'))
        if abstract_elem:
            abstract_text = abstract_elem.find_next('p')
            if abstract_text:
                abstract = abstract_text.get_text(strip=True)
        
        return {
            'patent_number': patent_number,
            'title': title,
            'inventors': inventors,
            'filing_date': filing_date,
            'abstract': abstract,
            'raw_html': response.text
        }
