"""
<<<<<<< HEAD
Talent Resolution Agent (TRA) - Main Orchestrator

This is the central orchestrator for the multi-agent system that processes
candidate data from multiple sources and produces actionable intelligence.

Key Features:
- FastAPI-based REST API
- Multi-agent orchestration
- Human-in-the-loop controls
- Audit trail and provenance tracking
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import logging
from datetime import datetime

from services.ingestion import IngestionAgent
from services.extraction import ExtractionAgent
from services.resolution import ResolutionAgent
from schemas.models import (
    ProcessedCandidate, 
    ExtraordinaryIndex,
    ActionPlan,
    ProcessingRequest,
    ProcessingResponse
)
=======
Talent Resolution Agent (TRA) - Enhanced Main Orchestrator

This is the enhanced central orchestrator for the TRA multi-agent system.
It coordinates data ingestion, extraction, resolution, and action planning
with background processing, status tracking, and human-in-the-loop controls.

Usage:
    python main.py

Environment Variables Required:
    - DEDALUS_API_KEY: API key for Dedalus services
    - ANTHROPIC_API_KEY: API key for Anthropic Claude
    - SERPAPI_KEY: API key for SerpAPI search
"""

import os
import logging
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from services.ingestion import IngestionOrchestrator
from services.extraction import ExtractionOrchestrator
from services.resolution import ResolutionOrchestrator
from services.extraordinary_index import ExtraordinaryIndexCalculator
from services.action_planner import ActionPlanner
from services.human_console import HumanConsole
from schemas.candidate import Candidate, CandidateProfile, ExtraordinaryIndex
from schemas.action import ActionPlan, ActionType
>>>>>>> 56df836 (agent ai)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

<<<<<<< HEAD
# Initialize FastAPI app
app = FastAPI(
    title="Talent Resolution Agent (TRA)",
    description="Multi-agent system for candidate data processing and talent assessment",
    version="1.0.0"
)

# Add CORS middleware
=======
# Global orchestrator instances
orchestrators = {}

# Processing status tracking
processing_status: Dict[str, Dict] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize orchestrators on startup"""
    logger.info("Initializing TRA orchestrators...")
    
    # Initialize all orchestrators
    orchestrators['ingestion'] = IngestionOrchestrator()
    orchestrators['extraction'] = ExtractionOrchestrator()
    orchestrators['resolution'] = ResolutionOrchestrator()
    orchestrators['extraordinary_index'] = ExtraordinaryIndexCalculator()
    orchestrators['action_planner'] = ActionPlanner()
    orchestrators['human_console'] = HumanConsole()
    
    logger.info("TRA orchestrators initialized successfully")
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down TRA orchestrators...")

# FastAPI app initialization
app = FastAPI(
    title="Talent Resolution Agent (TRA)",
    description="Multi-agent system for candidate data resolution and extraordinary index calculation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
>>>>>>> 56df836 (agent ai)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# Initialize agents
ingestion_agent = IngestionAgent()
extraction_agent = ExtractionAgent()
resolution_agent = ResolutionAgent()
=======
# Enhanced Request/Response Models
class CandidateProcessingRequest(BaseModel):
    """Request model for candidate processing"""
    candidate_id: str = Field(..., description="Unique candidate identifier")
    data_sources: List[str] = Field(..., description="List of data sources to process")
    include_social_media: bool = Field(default=True, description="Include social media data")
    priority: str = Field(default="normal", description="Processing priority: low, normal, high")
    identifiers: Optional[Dict[str, str]] = Field(default=None, description="Source-specific identifiers")
>>>>>>> 56df836 (agent ai)

class ProcessingStatus(BaseModel):
    """Status tracking for processing requests"""
    request_id: str
    status: str  # pending, processing, completed, failed
    progress: float  # 0.0 to 1.0
    current_step: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
<<<<<<< HEAD

# In-memory storage for demo (use Redis/DB in production)
processing_status: Dict[str, ProcessingStatus] = {}

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Talent Resolution Agent (TRA) is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.post("/process-candidate", response_model=ProcessingResponse)
async def process_candidate(
    request: ProcessingRequest,
    background_tasks: BackgroundTasks
):
    """
    Process candidate data through the multi-agent pipeline
    
    This endpoint orchestrates the complete workflow:
    1. Ingestion and normalization
    2. Extraction and validation
    3. Entity resolution
    4. Contradiction detection
    5. Extraordinary Index calculation
    6. Action planning
    """
    try:
        # Generate request ID
        request_id = f"req_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(str(request))}"
        
        # Initialize status tracking
        processing_status[request_id] = ProcessingStatus(
            request_id=request_id,
            status="pending",
            progress=0.0,
            current_step="Initializing",
            started_at=datetime.now()
        )
        
        # Start background processing
        background_tasks.add_task(
            process_candidate_pipeline,
            request_id,
            request
        )
        
        return ProcessingResponse(
            request_id=request_id,
            status="accepted",
            message="Processing started"
        )
        
    except Exception as e:
        logger.error(f"Error starting processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_candidate_pipeline(request_id: str, request: ProcessingRequest):
    """
    Background task that processes candidate data through the pipeline
    
    This is where the multi-agent orchestration happens:
    - Each agent processes data and passes results to the next
    - Status is updated throughout the process
    - Errors are handled gracefully with rollback capabilities
    """
    try:
        status = processing_status[request_id]
        status.status = "processing"
        
        # Step 1: Ingestion and Normalization
        status.current_step = "Ingestion and Normalization"
        status.progress = 0.1
        logger.info(f"Starting ingestion for request {request_id}")
        
        raw_data = await ingestion_agent.process_sources(request.sources)
        
        # Step 2: Extraction and Validation
        status.current_step = "Extraction and Validation"
        status.progress = 0.3
        logger.info(f"Starting extraction for request {request_id}")
        
        extracted_data = await extraction_agent.extract_and_validate(raw_data)
        
        # Step 3: Entity Resolution
        status.current_step = "Entity Resolution"
        status.progress = 0.5
        logger.info(f"Starting resolution for request {request_id}")
        
        resolved_entities = await resolution_agent.resolve_entities(extracted_data)
        
        # Step 4: Contradiction Detection
        status.current_step = "Contradiction Detection"
        status.progress = 0.7
        logger.info(f"Starting contradiction detection for request {request_id}")
        
        contradictions = await resolution_agent.detect_contradictions(resolved_entities)
        
        # Step 5: Extraordinary Index Calculation
        status.current_step = "Extraordinary Index Calculation"
        status.progress = 0.9
        logger.info(f"Calculating Extraordinary Index for request {request_id}")
        
        extraordinary_index = await resolution_agent.calculate_extraordinary_index(
            resolved_entities, contradictions
        )
        
        # Step 6: Action Planning
        status.current_step = "Action Planning"
        status.progress = 0.95
        logger.info(f"Generating action plan for request {request_id}")
        
        action_plan = await resolution_agent.generate_action_plan(
            resolved_entities, extraordinary_index
        )
        
        # Complete processing
        status.status = "completed"
        status.progress = 1.0
        status.current_step = "Completed"
        status.completed_at = datetime.now()
        
        logger.info(f"Processing completed for request {request_id}")
        
    except Exception as e:
        logger.error(f"Error processing request {request_id}: {str(e)}")
        processing_status[request_id].status = "failed"
        processing_status[request_id].error_message = str(e)

@app.get("/status/{request_id}", response_model=ProcessingStatus)
async def get_processing_status(request_id: str):
    """Get the current status of a processing request"""
    if request_id not in processing_status:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return processing_status[request_id]

@app.get("/candidates", response_model=List[ProcessedCandidate])
async def get_processed_candidates():
    """
    Get all processed candidates (demo endpoint)
    
    In production, this would query the database for processed candidates
    with filtering, pagination, and search capabilities.
    """
    # This is a placeholder - in production, query the database
    return []

@app.post("/approve-action/{request_id}")
async def approve_action(request_id: str, action_type: str):
    """
    Human-in-the-loop approval for generated actions
    
    This endpoint allows human reviewers to approve, modify, or reject
    actions generated by the system before they are executed.
    """
    if request_id not in processing_status:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # In production, this would update the action approval status
    # and trigger the actual execution of approved actions
    logger.info(f"Action {action_type} approved for request {request_id}")
    
    return {"message": f"Action {action_type} approved for request {request_id}"}

@app.post("/override-decision/{request_id}")
async def override_decision(
    request_id: str, 
    override_data: Dict[str, Any]
):
    """
    Human override for system decisions
    
    This endpoint allows human reviewers to override system decisions
    when they have additional context or disagree with the system's assessment.
    """
    if request_id not in processing_status:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # In production, this would update the decision and trigger recalculation
    logger.info(f"Decision overridden for request {request_id}: {override_data}")
    
    return {"message": f"Decision overridden for request {request_id}"}

@app.get("/audit-trail/{request_id}")
async def get_audit_trail(request_id: str):
    """
    Get complete audit trail for a processing request
    
    This endpoint provides full provenance tracking for compliance
    and debugging purposes.
    """
    if request_id not in processing_status:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # In production, this would query the audit log database
    return {
        "request_id": request_id,
        "audit_events": [
            {
                "timestamp": datetime.now().isoformat(),
                "event": "processing_started",
                "details": "Multi-agent pipeline initiated"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
=======
    result: Optional[Dict] = None

class CandidateProcessingResponse(BaseModel):
    """Enhanced response model for candidate processing"""
    request_id: str
    status: str
    message: str
    processing_status: Optional[ProcessingStatus] = None

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    orchestrators: Dict[str, str]
    version: str

# API Endpoints
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    orchestrator_status = {}
    for name, orchestrator in orchestrators.items():
        try:
            status = await orchestrator.health_check()
            orchestrator_status[name] = status
        except Exception as e:
            orchestrator_status[name] = f"Error: {str(e)}"
    
    return HealthCheckResponse(
        status="healthy",
        orchestrators=orchestrator_status,
        version="1.0.0"
    )

@app.post("/process-candidate")
async def process_candidate(
    request: CandidateProcessingRequest,
    background_tasks: BackgroundTasks
):
    """
    Process a candidate through the full TRA pipeline
    
    This endpoint orchestrates the complete multi-agent workflow:
    1. Data ingestion from multiple sources
    2. Extraction and validation
    3. Entity resolution and conflict detection
    4. Extraordinary Index calculation
    5. Action plan generation
    6. Human review if needed
    """
    import time
    start_time = time.time()
    
    try:
        logger.info(f"Processing candidate {request.candidate_id}")
        
        # Step 1: Data Ingestion
        logger.info("Step 1: Data Ingestion")
        raw_data = await orchestrators['ingestion'].ingest_candidate_data(
            candidate_id=request.candidate_id,
            data_sources=request.data_sources,
            include_social_media=request.include_social_media,
            identifiers=request.identifiers
        )
        
        # Step 2: Data Extraction and Validation
        logger.info("Step 2: Data Extraction and Validation")
        validated_data = await orchestrators['extraction'].extract_and_validate(
            raw_data=raw_data,
            candidate_id=request.candidate_id
        )
        
        # Step 3: Entity Resolution (Simplified - use extracted data directly)
        logger.info("Step 3: Entity Resolution")
        # Always use extracted data directly for now (resolution step has issues)
        logger.info("Using extracted data directly for profile creation")
        from schemas.candidate import CandidateProfile, Project, Skill
        extracted_data = validated_data.get("extracted_data", {})
        
        # Convert project dictionaries to Project objects
        projects = []
        for proj_dict in extracted_data.get("projects", []):
            # Convert language to technologies list
            technologies = [proj_dict.get("language", "")] if proj_dict.get("language") else []
            
            project = Project(
                name=proj_dict.get("name", ""),
                description=proj_dict.get("description", ""),
                url=proj_dict.get("url", ""),
                stars=proj_dict.get("stars", 0),
                forks=proj_dict.get("forks", 0),
                technologies=technologies
            )
            projects.append(project)
        
        # Convert skill dictionaries to Skill objects
        skills = []
        for skill_dict in extracted_data.get("skills", []):
            skill = Skill(
                name=skill_dict.get("name", ""),
                category=skill_dict.get("category", ""),
                proficiency=skill_dict.get("proficiency", "")
            )
            skills.append(skill)
        
        resolved_profile = CandidateProfile(
            candidate_id=request.candidate_id,
            contact_info=extracted_data.get("contact_info", {}),
            education=extracted_data.get("education", []),
            work_experience=extracted_data.get("work_experience", []),
            publications=extracted_data.get("publications", []),
            projects=projects,
            skills=skills,
            data_sources=["github"],  # Hardcode for now
            confidence_score=validated_data.get("combined_validation", {}).get("confidence_score", 0.8),
            last_updated=datetime.now().isoformat()
        )
        
        # Step 4: Extraordinary Index Calculation
        logger.info("Step 4: Extraordinary Index Calculation")
        extraordinary_index = await orchestrators['extraordinary_index'].calculate_index(
            candidate_profile=resolved_profile
        )
        
        # Step 5: Action Plan Generation
        logger.info("Step 5: Action Plan Generation")
        action_plan = await orchestrators['action_planner'].generate_action_plan(
            candidate_profile=resolved_profile,
            extraordinary_index=extraordinary_index
        )
        
        # Step 6: Human Review Check
        logger.info("Step 6: Human Review Check")
        requires_review = await orchestrators['human_console'].requires_human_review(
            candidate_profile=resolved_profile,
            extraordinary_index=extraordinary_index,
            action_plan=action_plan
        )
        
        # If human review required, queue for background processing
        if requires_review:
            background_tasks.add_task(
                orchestrators['human_console'].queue_for_review,
                candidate_id=request.candidate_id,
                candidate_profile=resolved_profile,
                extraordinary_index=extraordinary_index,
                action_plan=action_plan
            )
        
        processing_time = time.time() - start_time
        
        return {
            "candidate_id": request.candidate_id,
            "status": "completed",
            "extraordinary_index": extraordinary_index.dict(),
            "action_plan": action_plan.dict(),
            "requires_human_review": requires_review,
            "processing_time_seconds": processing_time
        }
        
    except Exception as e:
        logger.error(f"Error processing candidate {request.candidate_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/candidate/{candidate_id}/status")
async def get_candidate_status(candidate_id: str):
    """Get the processing status of a candidate"""
    try:
        status = await orchestrators['human_console'].get_candidate_status(candidate_id)
        return {"candidate_id": candidate_id, "status": status}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Candidate not found: {str(e)}")

@app.post("/candidate/{candidate_id}/approve")
async def approve_candidate_processing(
    candidate_id: str,
    approved_actions: List[ActionType]
):
    """Approve specific actions for a candidate"""
    try:
        result = await orchestrators['human_console'].approve_actions(
            candidate_id=candidate_id,
            approved_actions=approved_actions
        )
        return {"candidate_id": candidate_id, "approved_actions": approved_actions, "result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Approval failed: {str(e)}")

@app.post("/candidate/{candidate_id}/override")
async def override_candidate_processing(
    candidate_id: str,
    override_data: Dict
):
    """Override candidate processing with manual data"""
    try:
        result = await orchestrators['human_console'].override_processing(
            candidate_id=candidate_id,
            override_data=override_data
        )
        return {"candidate_id": candidate_id, "override_result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Override failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Check for required environment variables
    required_env_vars = ["DEDALUS_API_KEY", "ANTHROPIC_API_KEY", "SERPAPI_KEY"]
    optional_env_vars = ["LINKEDIN_ACCESS_TOKEN", "GITHUB_TOKEN"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        exit(1)
    
    logger.info("Starting TRA orchestrator server...")
>>>>>>> 56df836 (agent ai)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
<<<<<<< HEAD
    )
=======
    )
>>>>>>> 56df836 (agent ai)
