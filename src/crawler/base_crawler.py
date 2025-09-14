from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup
import time
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

logger = logging.getLogger(__name__)

class BaseCrawler(ABC):
    def __init__(self, rate_limit: float = 1.0, max_retries: int = 3):
        self.rate_limit = rate_limit
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def _setup_selenium_driver(self) -> webdriver.Chrome:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        return webdriver.Chrome(options=chrome_options)
    
    def _make_request(self, url: str, params: Optional[Dict] = None) -> Optional[requests.Response]:
        for attempt in range(self.max_retries):
            try:
                time.sleep(self.rate_limit)
                response = self.session.get(url, params=params, timeout=30)
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    logger.error(f"All retry attempts failed for URL: {url}")
                    return None
                time.sleep(2 ** attempt)
        return None
    
    def _parse_html(self, html_content: str) -> BeautifulSoup:
        return BeautifulSoup(html_content, 'html.parser')
    
    @abstractmethod
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        pass
    
    @abstractmethod
    def extract_content(self, url: str) -> Optional[Dict[str, Any]]:
        pass
    
    def crawl(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        logger.info(f"Starting crawl for query: {query}")
        search_results = self.search(query, max_results)
        
        detailed_results = []
        for result in search_results:
            if 'url' in result:
                content = self.extract_content(result['url'])
                if content:
                    result.update(content)
                    detailed_results.append(result)
        
        logger.info(f"Crawl completed. Found {len(detailed_results)} detailed results.")
        return detailed_results
