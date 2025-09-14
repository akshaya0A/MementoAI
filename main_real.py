"""
TRA Real Analysis - Actually processes person data

This version actually analyzes the person's information instead of returning demo data.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import httpx
import json
import re
from datetime import datetime
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Talent Resolution Agent (TRA)",
    description="Multi-agent system for candidate data processing and talent assessment",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class DataSource(BaseModel):
    source_id: str
    source_type: str
    url: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    file_content: Optional[str] = None
    filename: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ProcessingRequest(BaseModel):
    sources: List[DataSource]
    processing_options: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class ProcessingResponse(BaseModel):
    request_id: str
    status: str
    message: str

class ExtraordinaryIndex(BaseModel):
    innovation: float
    adoption: float
    influence: float
    velocity: float
    selectivity: float
    overall_score: float

class ProcessedCandidate(BaseModel):
    candidate_id: str
    name: str
    email: str
    extraordinary_index: ExtraordinaryIndex
    confidence_score: float
    source_count: int
    contradictions: int
    metadata: Dict[str, Any]

# In-memory storage for processed candidates
processed_candidates: List[ProcessedCandidate] = []

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Talent Resolution Agent (TRA) is running",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "health": "/",
            "process_candidate": "/process-candidate",
            "status": "/status/{request_id}",
            "candidates": "/candidates",
            "docs": "/docs"
        }
    }

@app.post("/process-candidate", response_model=ProcessingResponse)
async def process_candidate(request: ProcessingRequest):
    """
    Actually process candidate data through the multi-agent pipeline
    """
    try:
        # Generate request ID
        request_id = f"req_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(str(request))}"
        
        logger.info(f"Processing candidate data for {len(request.sources)} sources")
        
        # Extract person information from sources
        person_info = await extract_person_info(request.sources)
        
        # Process through multi-agent pipeline
        processed_candidate = await process_through_pipeline(person_info, request_id)
        
        # Store the processed candidate
        processed_candidates.append(processed_candidate)
        
        logger.info(f"Successfully processed candidate: {processed_candidate.name}")
        
        return ProcessingResponse(
            request_id=request_id,
            status="completed",
            message=f"Successfully processed {processed_candidate.name} with {processed_candidate.source_count} sources"
        )
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def extract_person_info(sources: List[DataSource]) -> Dict[str, Any]:
    """Extract person information from all sources"""
    person_info = {
        "name": "Unknown",
        "email": "unknown@example.com",
        "company": "Unknown",
        "title": "Unknown",
        "skills": [],
        "location": "Unknown",
        "github_data": {},
        "resume_data": {},
        "crm_data": {},
        "sources_processed": 0
    }
    
    for source in sources:
        try:
            if source.source_type == "github" and source.url:
                # Try to fetch GitHub data
                github_data = await fetch_github_data(source.url)
                if github_data:
                    person_info["github_data"] = github_data
                    person_info["sources_processed"] += 1
                    
                    # Extract name from GitHub
                    if github_data.get("name") and person_info["name"] == "Unknown":
                        person_info["name"] = github_data["name"]
                    elif github_data.get("login") and person_info["name"] == "Unknown":
                        person_info["name"] = github_data["login"]
                    
                    # Extract other info
                    if github_data.get("email"):
                        person_info["email"] = github_data["email"]
                    if github_data.get("company"):
                        person_info["company"] = github_data["company"]
                    if github_data.get("location"):
                        person_info["location"] = github_data["location"]
                    if github_data.get("bio"):
                        # Extract skills from bio
                        bio = github_data["bio"].lower()
                        skills = extract_skills_from_text(bio)
                        person_info["skills"].extend(skills)
            
            elif source.source_type == "resume" and source.file_content:
                # Process resume data
                resume_data = process_resume_data(source.file_content)
                person_info["resume_data"] = resume_data
                person_info["sources_processed"] += 1
                
                # Extract info from resume
                if resume_data.get("name") and person_info["name"] == "Unknown":
                    person_info["name"] = resume_data["name"]
                if resume_data.get("email"):
                    person_info["email"] = resume_data["email"]
                if resume_data.get("company"):
                    person_info["company"] = resume_data["company"]
                if resume_data.get("title"):
                    person_info["title"] = resume_data["title"]
                if resume_data.get("skills"):
                    person_info["skills"].extend(resume_data["skills"])
                if resume_data.get("location"):
                    person_info["location"] = resume_data["location"]
            
            elif source.source_type == "crm" and source.data:
                # Process CRM data
                person_info["crm_data"] = source.data
                person_info["sources_processed"] += 1
                
                # Extract info from CRM
                if source.data.get("first_name") and source.data.get("last_name"):
                    full_name = f"{source.data['first_name']} {source.data['last_name']}"
                    if person_info["name"] == "Unknown":
                        person_info["name"] = full_name
                if source.data.get("email"):
                    person_info["email"] = source.data["email"]
                if source.data.get("company"):
                    person_info["company"] = source.data["company"]
                if source.data.get("title"):
                    person_info["title"] = source.data["title"]
                if source.data.get("location"):
                    person_info["location"] = source.data["location"]
        
        except Exception as e:
            logger.error(f"Error processing source {source.source_id}: {str(e)}")
    
    # Clean up skills
    person_info["skills"] = list(set(person_info["skills"]))  # Remove duplicates
    
    return person_info

async def fetch_github_data(url: str) -> Optional[Dict[str, Any]]:
    """Fetch data from GitHub API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"GitHub API returned {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"Error fetching GitHub data: {str(e)}")
        return None

def process_resume_data(content: str) -> Dict[str, Any]:
    """Process resume content to extract information"""
    lines = content.strip().split('\n')
    
    resume_data = {
        "name": "",
        "email": "",
        "company": "",
        "title": "",
        "skills": [],
        "location": ""
    }
    
    # Extract name (usually first line)
    if lines:
        resume_data["name"] = lines[0].strip()
    
    # Extract email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, content)
    if email_match:
        resume_data["email"] = email_match.group()
    
    # Extract skills from content
    skills = extract_skills_from_text(content)
    resume_data["skills"] = skills
    
    # Try to extract other info from lines
    for line in lines:
        line_lower = line.lower()
        if "engineer" in line_lower or "developer" in line_lower or "manager" in line_lower:
            resume_data["title"] = line.strip()
        elif "@" in line and "email" not in line_lower:
            if not resume_data["email"]:
                resume_data["email"] = line.strip()
    
    return resume_data

def extract_skills_from_text(text: str) -> List[str]:
    """Extract skills from text content"""
    common_skills = [
        "python", "javascript", "java", "c++", "c#", "go", "rust", "php", "ruby",
        "machine learning", "ai", "artificial intelligence", "data science",
        "react", "angular", "vue", "node.js", "django", "flask", "spring",
        "sql", "mongodb", "postgresql", "mysql", "redis",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
        "git", "github", "gitlab", "jenkins", "ci/cd",
        "agile", "scrum", "devops", "microservices", "api"
    ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in common_skills:
        if skill in text_lower:
            found_skills.append(skill)
    
    return found_skills

async def process_through_pipeline(person_info: Dict[str, Any], request_id: str) -> ProcessedCandidate:
    """Process person through the multi-agent pipeline"""
    
    # Calculate Extraordinary Index based on actual data
    extraordinary_index = calculate_extraordinary_index(person_info)
    
    # Calculate confidence score
    confidence_score = calculate_confidence_score(person_info)
    
    # Detect contradictions
    contradictions = detect_contradictions(person_info)
    
    # Generate candidate ID
    candidate_id = f"candidate_{hashlib.md5(person_info['name'].encode()).hexdigest()[:8]}"
    
    return ProcessedCandidate(
        candidate_id=candidate_id,
        name=person_info["name"],
        email=person_info["email"],
        extraordinary_index=extraordinary_index,
        confidence_score=confidence_score,
        source_count=person_info["sources_processed"],
        contradictions=contradictions,
        metadata={
            "request_id": request_id,
            "processed_at": datetime.now().isoformat(),
            "github_data": person_info.get("github_data", {}),
            "resume_data": person_info.get("resume_data", {}),
            "crm_data": person_info.get("crm_data", {}),
            "skills": person_info.get("skills", [])
        }
    )

def calculate_extraordinary_index(person_info: Dict[str, Any]) -> ExtraordinaryIndex:
    """Calculate Extraordinary Index based on actual person data"""
    
    # Innovation score based on GitHub activity and skills
    innovation = 0.0
    github_data = person_info.get("github_data", {})
    skills = person_info.get("skills", [])
    
    # GitHub repositories
    if github_data.get("public_repos", 0) > 0:
        innovation += min(0.4, github_data["public_repos"] * 0.02)
    
    # GitHub stars
    if github_data.get("followers", 0) > 0:
        innovation += min(0.3, github_data["followers"] * 0.01)
    
    # Advanced skills
    advanced_skills = ["machine learning", "ai", "artificial intelligence", "data science", "blockchain", "quantum"]
    advanced_count = sum(1 for skill in skills if any(adv in skill.lower() for adv in advanced_skills))
    innovation += min(0.3, advanced_count * 0.1)
    
    innovation = min(1.0, innovation)
    
    # Adoption score based on followers and company
    adoption = 0.0
    if github_data.get("followers", 0) > 0:
        adoption += min(0.5, github_data["followers"] * 0.005)
    
    # Company recognition
    company = person_info.get("company", "").lower()
    if any(big_tech in company for big_tech in ["google", "microsoft", "amazon", "apple", "meta", "netflix", "uber"]):
        adoption += 0.3
    
    adoption = min(1.0, adoption)
    
    # Influence score based on GitHub activity
    influence = 0.0
    if github_data.get("followers", 0) > 0:
        influence += min(0.6, github_data["followers"] * 0.01)
    
    if github_data.get("public_repos", 0) > 0:
        influence += min(0.4, github_data["public_repos"] * 0.05)
    
    influence = min(1.0, influence)
    
    # Velocity score based on recent activity
    velocity = 0.5  # Base score
    if github_data.get("public_repos", 0) > 5:
        velocity += 0.2
    if len(skills) > 5:
        velocity += 0.3
    
    velocity = min(1.0, velocity)
    
    # Selectivity score based on data quality
    selectivity = 0.0
    if person_info["name"] != "Unknown":
        selectivity += 0.2
    if person_info["email"] != "unknown@example.com":
        selectivity += 0.2
    if person_info["company"] != "Unknown":
        selectivity += 0.2
    if person_info["title"] != "Unknown":
        selectivity += 0.2
    if len(skills) > 0:
        selectivity += 0.2
    
    selectivity = min(1.0, selectivity)
    
    # Calculate overall score
    overall_score = (innovation * 0.25 + adoption * 0.20 + influence * 0.25 + velocity * 0.15 + selectivity * 0.15)
    
    return ExtraordinaryIndex(
        innovation=innovation,
        adoption=adoption,
        influence=influence,
        velocity=velocity,
        selectivity=selectivity,
        overall_score=overall_score
    )

def calculate_confidence_score(person_info: Dict[str, Any]) -> float:
    """Calculate confidence score based on data quality"""
    score = 0.0
    
    # Base score for having data
    if person_info["sources_processed"] > 0:
        score += 0.3
    
    # Bonus for multiple sources
    if person_info["sources_processed"] > 1:
        score += 0.2
    
    # Bonus for complete information
    if person_info["name"] != "Unknown":
        score += 0.2
    if person_info["email"] != "unknown@example.com":
        score += 0.1
    if person_info["company"] != "Unknown":
        score += 0.1
    if person_info["title"] != "Unknown":
        score += 0.1
    
    return min(1.0, score)

def detect_contradictions(person_info: Dict[str, Any]) -> int:
    """Detect contradictions in person data"""
    contradictions = 0
    
    # Check for name mismatches
    names = []
    if person_info.get("github_data", {}).get("name"):
        names.append(person_info["github_data"]["name"])
    if person_info.get("resume_data", {}).get("name"):
        names.append(person_info["resume_data"]["name"])
    if person_info.get("crm_data", {}).get("first_name") and person_info.get("crm_data", {}).get("last_name"):
        names.append(f"{person_info['crm_data']['first_name']} {person_info['crm_data']['last_name']}")
    
    if len(set(names)) > 1:
        contradictions += 1
    
    # Check for email mismatches
    emails = []
    if person_info.get("github_data", {}).get("email"):
        emails.append(person_info["github_data"]["email"])
    if person_info.get("resume_data", {}).get("email"):
        emails.append(person_info["resume_data"]["email"])
    if person_info.get("crm_data", {}).get("email"):
        emails.append(person_info["crm_data"]["email"])
    
    if len(set(emails)) > 1:
        contradictions += 1
    
    return contradictions

@app.get("/candidates")
async def get_processed_candidates():
    """Get all processed candidates"""
    return processed_candidates

@app.get("/status/{request_id}")
async def get_processing_status(request_id: str):
    """Get processing status"""
    return {
        "request_id": request_id,
        "status": "completed",
        "progress": 1.0,
        "current_step": "Completed",
        "started_at": datetime.now().isoformat(),
        "completed_at": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Talent Resolution Agent (TRA) - Real Analysis")
    print("=" * 60)
    print("📡 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/")
    print("👥 Process Candidates: POST http://localhost:8000/process-candidate")
    print("=" * 60)
    
    uvicorn.run(
        "main_real:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
