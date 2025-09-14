"""
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

# Initialize agents
ingestion_agent = IngestionAgent()
extraction_agent = ExtractionAgent()
resolution_agent = ResolutionAgent()

class ProcessingStatus(BaseModel):
    """Status tracking for processing requests"""
    request_id: str
    status: str  # pending, processing, completed, failed
    progress: float  # 0.0 to 1.0
    current_step: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

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
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
