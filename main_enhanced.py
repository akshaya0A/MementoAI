"""
Talent Resolution Agent (TRA) - Enhanced Main Orchestrator

This is the enhanced central orchestrator for the TRA multi-agent system.
It coordinates data ingestion, extraction, resolution, and action planning
with background processing, status tracking, and human-in-the-loop controls.

Usage:
    python main_enhanced.py

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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global orchestrator instances
orchestrators = {}

# Processing status tracking
processing_status: Dict[str, Dict] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize orchestrators on startup"""
    logger.info("Initializing TRA orchestrators...")
    
    try:
        orchestrators['ingestion'] = IngestionOrchestrator()
        orchestrators['extraction'] = ExtractionOrchestrator()
        orchestrators['resolution'] = ResolutionOrchestrator()
        orchestrators['extraordinary_index'] = ExtraordinaryIndexCalculator()
        orchestrators['action_planner'] = ActionPlanner()
        orchestrators['human_console'] = HumanConsole()
        
        logger.info("All orchestrators initialized successfully")
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize orchestrators: {str(e)}")
        raise
    finally:
        logger.info("Shutting down TRA orchestrators...")

# Initialize FastAPI app
app = FastAPI(
    title="Talent Resolution Agent (TRA)",
    description="Multi-agent system for candidate data processing and talent assessment with concrete scoring",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced Request/Response Models
class CandidateProcessingRequest(BaseModel):
    """Request model for candidate processing"""
    candidate_id: str = Field(..., description="Unique candidate identifier")
    data_sources: List[str] = Field(..., description="List of data sources to process")
    include_social_media: bool = Field(default=True, description="Include social media data")
    priority: str = Field(default="normal", description="Processing priority: low, normal, high")
    identifiers: Optional[Dict[str, str]] = Field(default=None, description="Source-specific identifiers")

class ProcessingStatus(BaseModel):
    """Status tracking for processing requests"""
    request_id: str
    status: str  # pending, processing, completed, failed
    progress: float  # 0.0 to 1.0
    current_step: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
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

# Enhanced endpoints
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Enhanced health check with orchestrator status"""
    try:
        orchestrator_status = {}
        for name, orchestrator in orchestrators.items():
            if hasattr(orchestrator, 'health_check'):
                orchestrator_status[name] = await orchestrator.health_check()
            else:
                orchestrator_status[name] = "healthy"
        
        return HealthCheckResponse(
            status="healthy",
            orchestrators=orchestrator_status,
            version="1.0.0"
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthCheckResponse(
            status="unhealthy",
            orchestrators={},
            version="1.0.0"
        )

@app.post("/process-candidate", response_model=CandidateProcessingResponse)
async def process_candidate(
    request: CandidateProcessingRequest,
    background_tasks: BackgroundTasks
):
    """
    Enhanced candidate processing with background tasks and status tracking
    
    This endpoint orchestrates the complete multi-agent workflow:
    1. Data ingestion from multiple sources
    2. Extraction and validation
    3. Entity resolution and conflict detection
    4. Extraordinary Index calculation (with concrete scoring!)
    5. Action plan generation
    6. Human review if needed
    """
    import time
    start_time = time.time()
    
    try:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Initialize status tracking
        processing_status[request_id] = {
            "request_id": request_id,
            "status": "pending",
            "progress": 0.0,
            "current_step": "Initializing",
            "started_at": datetime.now(),
            "completed_at": None,
            "error_message": None,
            "result": None
        }
        
        logger.info(f"Starting processing for candidate {request.candidate_id} (request_id: {request_id})")
        
        # Start background processing
        background_tasks.add_task(
            process_candidate_pipeline,
            request_id,
            request,
            start_time
        )
        
        return CandidateProcessingResponse(
            request_id=request_id,
            status="accepted",
            message="Processing started in background"
        )
        
    except Exception as e:
        logger.error(f"Error starting processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_candidate_pipeline(
    request_id: str, 
    request: CandidateProcessingRequest,
    start_time: float
):
    """
    Background task that processes candidate data through the enhanced pipeline
    """
    try:
        status = processing_status[request_id]
        status["status"] = "processing"
        
        # Step 1: Data Ingestion
        status["current_step"] = "Data Ingestion"
        status["progress"] = 0.1
        logger.info(f"Step 1: Data Ingestion for request {request_id}")
        
        raw_data = await orchestrators['ingestion'].ingest_candidate_data(
            candidate_id=request.candidate_id,
            data_sources=request.data_sources,
            include_social_media=request.include_social_media,
            identifiers=request.identifiers
        )
        
        # Step 2: Data Extraction
        status["current_step"] = "Data Extraction"
        status["progress"] = 0.3
        logger.info(f"Step 2: Data Extraction for request {request_id}")
        
        extracted_data = await orchestrators['extraction'].extract_and_validate(
            raw_data=raw_data,
            candidate_id=request.candidate_id
        )
        
        # Step 3: Entity Resolution
        status["current_step"] = "Entity Resolution"
        status["progress"] = 0.5
        logger.info(f"Step 3: Entity Resolution for request {request_id}")
        
        resolved_data = await orchestrators['resolution'].resolve_conflicts(
            extracted_data=extracted_data,
            candidate_id=request.candidate_id
        )
        
        # Step 4: Extraordinary Index Calculation (with concrete scoring!)
        status["current_step"] = "Extraordinary Index Calculation"
        status["progress"] = 0.7
        logger.info(f"Step 4: Extraordinary Index Calculation for request {request_id}")
        
        extraordinary_index = await orchestrators['extraordinary_index'].calculate_index(
            candidate_profile=resolved_data['candidate_profile']
        )
        
        # Step 5: Action Planning
        status["current_step"] = "Action Planning"
        status["progress"] = 0.9
        logger.info(f"Step 5: Action Planning for request {request_id}")
        
        action_plan = await orchestrators['action_planner'].generate_action_plan(
            candidate_profile=resolved_data['candidate_profile'],
            extraordinary_index=extraordinary_index
        )
        
        # Complete processing
        processing_time = time.time() - start_time
        status["status"] = "completed"
        status["progress"] = 1.0
        status["current_step"] = "Completed"
        status["completed_at"] = datetime.now()
        status["result"] = {
            "candidate_id": request.candidate_id,
            "status": "completed",
            "extraordinary_index": extraordinary_index.dict(),
            "action_plan": action_plan.dict(),
            "requires_human_review": True,
            "processing_time_seconds": processing_time
        }
        
        logger.info(f"Processing completed for request {request_id} in {processing_time:.2f}s")
        
    except Exception as e:
        logger.error(f"Error processing request {request_id}: {str(e)}")
        processing_status[request_id]["status"] = "failed"
        processing_status[request_id]["error_message"] = str(e)

@app.get("/status/{request_id}", response_model=ProcessingStatus)
async def get_processing_status(request_id: str):
    """Get the current status of a processing request"""
    if request_id not in processing_status:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return ProcessingStatus(**processing_status[request_id])

@app.get("/result/{request_id}")
async def get_processing_result(request_id: str):
    """Get the final result of a completed processing request"""
    if request_id not in processing_status:
        raise HTTPException(status_code=404, detail="Request not found")
    
    status = processing_status[request_id]
    if status["status"] != "completed":
        raise HTTPException(status_code=400, detail="Processing not completed")
    
    return status["result"]

@app.post("/approve-action/{request_id}")
async def approve_action(request_id: str, action_type: str):
    """Human-in-the-loop approval for generated actions"""
    if request_id not in processing_status:
        raise HTTPException(status_code=404, detail="Request not found")
    
    logger.info(f"Action {action_type} approved for request {request_id}")
    return {"message": f"Action {action_type} approved for request {request_id}"}

@app.post("/override-decision/{request_id}")
async def override_decision(request_id: str, override_data: Dict):
    """Human override for system decisions"""
    if request_id not in processing_status:
        raise HTTPException(status_code=404, detail="Request not found")
    
    logger.info(f"Decision overridden for request {request_id}: {override_data}")
    return {"message": f"Decision overridden for request {request_id}"}

# Legacy endpoint for backward compatibility
@app.post("/process-candidate-sync")
async def process_candidate_sync(request: CandidateProcessingRequest):
    """
    Synchronous processing endpoint for backward compatibility
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
        
        # Step 2: Data Extraction
        logger.info("Step 2: Data Extraction")
        extracted_data = await orchestrators['extraction'].extract_and_validate(
            raw_data=raw_data,
            candidate_id=request.candidate_id
        )
        
        # Step 3: Entity Resolution
        logger.info("Step 3: Entity Resolution")
        resolved_data = await orchestrators['resolution'].resolve_conflicts(
            extracted_data=extracted_data,
            candidate_id=request.candidate_id
        )
        
        # Step 4: Extraordinary Index Calculation
        logger.info("Step 4: Extraordinary Index Calculation")
        extraordinary_index = await orchestrators['extraordinary_index'].calculate_index(
            candidate_profile=resolved_data['candidate_profile']
        )
        
        # Step 5: Action Planning
        logger.info("Step 5: Action Planning")
        action_plan = await orchestrators['action_planner'].generate_action_plan(
            candidate_profile=resolved_data['candidate_profile'],
            extraordinary_index=extraordinary_index
        )
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        logger.info(f"Processing completed for candidate {request.candidate_id} in {processing_time:.2f}s")
        
        return {
            "candidate_id": request.candidate_id,
            "status": "completed",
            "extraordinary_index": extraordinary_index.dict(),
            "action_plan": action_plan.dict(),
            "requires_human_review": True,
            "processing_time_seconds": processing_time
        }
        
    except Exception as e:
        logger.error(f"Error processing candidate {request.candidate_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_enhanced:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
