# Modular Deep Web Research Agent

A sophisticated, modular AI-powered research agent that performs comprehensive deep web research on individuals using a distributed architecture with specialized crawlers, intelligent extractors, cross-validators, and profile composers.

## 🏗️ Modular Architecture

### **Core Components**

1. **Web Scraper** - Base scraping infrastructure with rate limiting and error handling
2. **Specialized Crawlers** - 5 dedicated crawlers for different data sources
3. **Data Extractor** - AI-powered structured data extraction
4. **Cross Validator** - Conflict resolution and confidence scoring
5. **Profile Composer** - Final report generation with timeline and credibility analysis

### **Data Sources**

| Source | Type | Authority Score | Purpose |
|--------|------|----------------|---------|
| **NYTimes** | News | 0.9 | Media coverage, profiles, interviews |
| **IBM** | Corporate | 0.8 | Press releases, employee profiles, research |
| **Nature** | Academic | 0.98 | Scientific publications, research papers |
| **arXiv** | Academic | 0.85 | Preprints, research papers, citations |
| **USPTO** | Government | 0.88 | Patent records, intellectual property |

## 🔧 Technical Implementation

### **Web Scraping Stack**
- **requests** - HTTP requests with session management
- **BeautifulSoup4** - HTML parsing and content extraction
- **Selenium** - JavaScript-heavy sites and dynamic content
- **Rate Limiting** - Respectful crawling with configurable delays

### **Error Handling & Robustness**
- **Retry Logic** - Automatic retry for failed requests
- **Fallback Mechanisms** - Multiple extraction strategies
- **Anti-Bot Detection** - User-agent rotation and request patterns
- **Timeout Management** - Configurable timeouts for different sources

### **AI Integration**
- **Dedalus Labs** - Advanced AI agent framework
- **GPT-4.1** - Intelligent fact extraction and analysis
- **Semantic Search** - Exa integration for enhanced search capabilities

## 📊 Data Flow

```
Input: Person Name + Additional Info
    ↓
1. Web Scraper (Rate Limiting + Error Handling)
    ↓
2. Specialized Crawlers (5 Sources)
    ├── NYTimes Crawler
    ├── IBM Crawler  
    ├── Nature Crawler
    ├── arXiv Crawler
    └── USPTO Crawler
    ↓
3. Data Extractor (AI-Powered)
    ↓
4. Cross Validator (Conflict Resolution)
    ↓
5. Profile Composer (Final Report)
    ↓
Output: Comprehensive Person Profile
```

## 🚀 Usage

### **Interactive Mode**
```bash
python modular_research_agent.py
```

### **Demo Mode**
```bash
python demo_modular_agent.py
```

### **Example Input**
```
Enter person's full name: Dr. Jane Smith
Enter any additional info: MIT Computer Science, IBM Research Scientist, AI researcher
```

## 📋 Output Structure

### **PersonProfile Object**
```python
PersonProfile(
    name: str,                    # Person's full name
    claims: List[Claim],          # Individual facts with confidence scores
    timeline: List[TimelineEvent], # Chronological events
    credibility_summary: Dict,    # Overall credibility metrics
    contradictions: List[Dict],   # Conflict analysis
    last_updated: str            # Timestamp
)
```

### **Claim Object**
```python
Claim(
    fact: str,                    # "Research Scientist at IBM"
    value: Any,                   # "Research Scientist"
    sources: List[Source],        # Supporting sources
    confidence: float,            # 0.0-1.0 confidence score
    contradiction_note: str,      # Conflict details
    human_review_needed: bool,    # Flag for human review
    temporal_info: str           # "2020-2024"
)
```

## 🔍 Advanced Features

### **Cross-Validation & Conflict Resolution**

#### **Multi-Evidence Aggregation**
- Requires ≥N independent sources for high confidence
- Stores alternatives & provenance (never discards contradictory claims)
- Confidence scoring with tunable formula

#### **Contradiction Detection**
- Identifies conflicting information across sources
- Automated conflict resolution with confidence weighting
- Human-in-the-loop flagging for borderline cases

#### **Temporal Reasoning**
- Handles time-varying facts (employment dates, counts)
- Creates chronological timeline rather than static claims
- Distinguishes "current" vs "historical" information

### **Credibility Scoring System**

#### **Source Authority Mapping**
```python
source_authorities = {
    'nature': 0.98,           # Academic journals
    'science': 0.98,
    'cell': 0.97,
    'uspto': 0.88,            # Government databases
    'nytimes': 0.9,           # News sources
    'reuters': 0.92,
    'press_release': 0.8,     # Corporate communications
    'linkedin': 0.7,          # Social/professional
    'twitter': 0.6
}
```

#### **Confidence Calculation**
```
Final_Confidence = (Source_Authority × Extraction_Confidence) + Cross_Validation_Bonus
```

### **Rate Limiting & Anti-Bot Measures**

#### **Respectful Crawling**
- Configurable delays between requests
- User-agent rotation
- Session management
- Respect for robots.txt

#### **Error Recovery**
- Automatic retry with exponential backoff
- Fallback extraction methods
- Graceful degradation on failures

## 📈 Performance Metrics

### **Credibility Analysis**
- **Total Claims**: Number of facts extracted
- **High Confidence**: Claims with confidence ≥ 0.8
- **Needs Review**: Claims flagged for human review
- **Average Confidence**: Mean confidence across all claims
- **Overall Credibility**: Weighted score considering source authority

### **Source Analysis**
- **Claims per Source**: Distribution across data sources
- **Confidence by Source**: Average confidence per source type
- **High Confidence Claims**: Count of high-confidence claims per source

### **Timeline Analysis**
- **Chronological Events**: Time-ordered fact sequence
- **Temporal Coverage**: Date range of available information
- **Event Density**: Frequency of events over time

## 🛠️ Setup & Installation

### **1. Environment Setup**
```bash
# Create virtual environment
python -m venv modular_research_env

# Activate (Windows)
modular_research_env\Scripts\activate

# Activate (macOS/Linux)
source modular_research_env/bin/activate
```

### **2. Install Dependencies**
```bash
pip install -r requirements.txt
```

### **3. Configure API Keys**
```bash
# Edit .env file
DEDALUS_API_KEY=your_dedalus_key
OPENAI_API_KEY=your_openai_key
EXA_API_KEY=your_exa_key
BRAVE_API_KEY=your_brave_key
```

### **4. Install Chrome Driver (for Selenium)**
- Download ChromeDriver from https://chromedriver.chromium.org/
- Add to system PATH or place in project directory

## 🔧 Customization

### **Adding New Crawlers**
```python
class NewSourceCrawler:
    def __init__(self, scraper: WebScraper):
        self.scraper = scraper
        self.source_type = 'newsource'
        self.authority_score = 0.85
    
    async def search(self, person_name: str) -> List[Source]:
        # Implementation
        pass
```

### **Modifying Authority Scores**
```python
# In WebScraper class
self.source_authorities['new_domain'] = 0.85
```

### **Adjusting Rate Limits**
```python
# In RateLimiter class
self.min_delays = {
    'nytimes': 2.0,
    'ibm': 1.5,
    'nature': 2.0,
    'arxiv': 1.0,
    'uspto': 1.5,
    'newsource': 1.0  # Add new source
}
```

## 🚨 Limitations & Considerations

### **Web Scraping Challenges**
1. **Anti-Bot Measures**: Some sites block automated requests
2. **Rate Limits**: Respectful crawling requires delays
3. **Site Structure Changes**: HTML structure may change over time
4. **JavaScript Requirements**: Some sites require Selenium

### **Data Quality**
1. **Name Variations**: May miss information due to name variations
2. **Temporal Accuracy**: Historical information may be outdated
3. **Language Barriers**: Non-English sources require translation
4. **Privacy Restrictions**: Some information may not be publicly available

### **Performance**
1. **API Rate Limits**: Respects search engine rate limits
2. **Processing Time**: Comprehensive research takes time
3. **Resource Usage**: Selenium requires significant resources

## 🔒 Privacy & Ethics

- **Public Information Only**: Searches only publicly available data
- **Source Attribution**: All claims linked to original sources
- **Transparency**: Clear confidence scores and review flags
- **Respectful Research**: Focus on legitimate professional/academic information
- **Rate Limiting**: Respectful crawling practices

## 📚 Dependencies

- `dedalus-labs`: AI agent framework
- `python-dotenv`: Environment variable management
- `requests`: HTTP requests
- `beautifulsoup4`: HTML parsing
- `selenium`: Web browser automation
- `lxml`: XML/HTML processing
- `html5lib`: HTML5 parsing
- `urllib3`: URL handling
- `asyncio`: Asynchronous operations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request with detailed description

## 📄 License

MIT License - see LICENSE file for details

## 🎯 Example Output

```
🔍 DEEP WEB RESEARCH PROFILE: DR. JANE SMITH
================================================================================

📊 CREDIBILITY SUMMARY:
  Total Claims: 15
  High Confidence: 12
  Needs Review: 3
  Average Confidence: 0.85
  Overall Credibility: 0.82

📋 DETAILED CLAIMS BY SOURCE:

  ARXIV (8 claims):
    1. Research Scientist at IBM
       Value: Research Scientist
       Confidence: 0.88
    2. PhD in Computer Science from MIT
       Value: PhD Computer Science
       Confidence: 0.92

  NATURE (4 claims):
    1. Published in Nature journal
       Value: Nature publication
       Confidence: 0.95

  IBM (3 claims):
    1. IBM Research Scientist
       Value: Research Scientist
       Confidence: 0.90

📅 TIMELINE (5 events):
  2018: PhD in Computer Science from MIT
  2020: Joined IBM Research
  2021: Published in Nature journal
  2022: Awarded IBM Research Excellence Award
  2023: Promoted to Senior Research Scientist

⚠️  CONTRADICTIONS (1):
  • Patent count: Sources disagree: 2 different values found
    IBM press release claims 15; USPTO records show 12
```

This modular architecture provides a robust, scalable foundation for deep web research with comprehensive error handling, conflict resolution, and credibility analysis.
