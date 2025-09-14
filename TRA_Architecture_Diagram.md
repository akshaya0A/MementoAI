# Talent Resolution Agent (TRA) - Architecture Diagram

## Multi-Agent System Workflow

```mermaid
graph TB
    %% Data Sources
    subgraph "Data Sources"
        GH[GitHub]
        AR[ArXiv]
        PT[Patents]
        RS[Resumes]
        CRM[CRM Systems]
        PDF[PDFs]
        SM[Social Media]
    end

    %% Ingestion Layer
    subgraph "Ingestion Layer"
        IA[Ingestion Agent]
        OCR[OCR Processor]
        PII[PII Redactor]
        NORM[Data Normalizer]
    end

    %% Extraction Layer
    subgraph "Extraction & Validation"
        EA[Extraction Agent]
        LLM[LLM Schema Validator]
        REGEX[Regex Validator]
        UNIT[Unit Test Validator]
    end

    %% Resolution Layer
    subgraph "Entity Resolution"
        ER[Resolution Engine]
        PG[pgvector Database]
        FUZZY[Fuzzy Matching]
        ADJ[LLM Adjudicator]
    end

    %% Contradiction Engine
    subgraph "Contradiction Engine"
        CE[Conflict Detector]
        QUANT[Conflict Quantifier]
        CONF[Confidence Scorer]
    end

    %% Extraordinary Index
    subgraph "Extraordinary Index Calculator"
        INN[Innovation Score]
        ADO[Adoption Score]
        INF[Influence Score]
        VEL[Velocity Score]
        SEL[Selectivity Score]
        CALC[Index Calculator]
    end

    %% Action Planning
    subgraph "Action Planner"
        AP[Action Planner]
        CRM_UPSERT[CRM Upsert]
        OUTREACH[Outreach Draft]
        EVIDENCE[Evidence Packet]
    end

    %% Human Interface
    subgraph "Human-in-the-Loop Console"
        CONSOLE[Console Interface]
        PROV[Provenance Tracker]
        APPROVE[Approve/Override]
        ABSTAIN[Uncertainty Handler]
    end

    %% Audit & Feedback
    subgraph "Audit & Feedback"
        AUDIT[Audit Logger]
        FEEDBACK[Feedback Loop]
        CALIB[Calibration Engine]
    end

    %% Data Flow
    GH --> IA
    AR --> IA
    PT --> IA
    RS --> IA
    CRM --> IA
    PDF --> OCR
    SM --> IA
    OCR --> PII
    IA --> PII
    PII --> NORM
    NORM --> EA

    EA --> LLM
    EA --> REGEX
    EA --> UNIT
    LLM --> ER
    REGEX --> ER
    UNIT --> ER

    ER --> PG
    ER --> FUZZY
    ER --> ADJ
    PG --> CE
    FUZZY --> CE
    ADJ --> CE

    CE --> QUANT
    QUANT --> CONF
    CONF --> INN
    CONF --> ADO
    CONF --> INF
    CONF --> VEL
    CONF --> SEL

    INN --> CALC
    ADO --> CALC
    INF --> CALC
    VEL --> CALC
    SEL --> CALC

    CALC --> AP
    AP --> CRM_UPSERT
    AP --> OUTREACH
    AP --> EVIDENCE

    AP --> CONSOLE
    CONSOLE --> PROV
    CONSOLE --> APPROVE
    CONSOLE --> ABSTAIN

    CONSOLE --> AUDIT
    AUDIT --> FEEDBACK
    FEEDBACK --> CALIB
    CALIB --> ER

    %% Styling
    classDef source fill:#e1f5fe
    classDef ingestion fill:#f3e5f5
    classDef extraction fill:#e8f5e8
    classDef resolution fill:#fff3e0
    classDef contradiction fill:#ffebee
    classDef index fill:#f1f8e9
    classDef action fill:#e3f2fd
    classDef human fill:#fce4ec
    classDef audit fill:#f9fbe7

    class GH,AR,PT,RS,CRM,PDF,SM source
    class IA,OCR,PII,NORM ingestion
    class EA,LLM,REGEX,UNIT extraction
    class ER,PG,FUZZY,ADJ resolution
    class CE,QUANT,CONF contradiction
    class INN,ADO,INF,VEL,SEL,CALC index
    class AP,CRM_UPSERT,OUTREACH,EVIDENCE action
    class CONSOLE,PROV,APPROVE,ABSTAIN human
    class AUDIT,FEEDBACK,CALIB audit
```

## Key Components

### 1. **Data Ingestion Layer**
- **Ingestion Agent**: Orchestrates data collection from multiple sources
- **OCR Processor**: Extracts text from PDFs and images
- **PII Redactor**: Removes sensitive information for compliance
- **Data Normalizer**: Standardizes data formats across sources

### 2. **Extraction & Validation**
- **Extraction Agent**: Uses LLMs to extract structured data
- **Schema Validators**: Multiple validation layers (LLM, regex, unit tests)
- **Quality Assurance**: Ensures data integrity before processing

### 3. **Entity Resolution Engine**
- **pgvector Database**: Stores embeddings for similarity matching
- **Fuzzy Matching**: Handles name variations and typos
- **LLM Adjudicator**: Makes final decisions on identity resolution

### 4. **Contradiction Engine**
- **Conflict Detection**: Identifies conflicting information
- **Quantification**: Measures conflict severity
- **Confidence Scoring**: Provides uncertainty metrics

### 5. **Extraordinary Index Calculator**
- **Multi-dimensional Scoring**: Innovation, Adoption, Influence, Velocity, Selectivity
- **Calibrated Metrics**: Objective, comparable talent assessment
- **Weighted Aggregation**: Combines scores into single index

### 6. **Action Planner**
- **CRM Integration**: Updates candidate records
- **Outreach Generation**: Creates personalized messages
- **Evidence Packets**: Compiles supporting documentation

### 7. **Human-in-the-Loop Console**
- **Provenance Tracking**: Complete audit trail
- **Approval Controls**: Human oversight for critical decisions
- **Uncertainty Handling**: Graceful handling of ambiguous cases

### 8. **Audit & Feedback Loop**
- **Continuous Learning**: Improves accuracy over time
- **Calibration**: Adjusts scoring based on outcomes
- **Error Handling**: Robust error recovery and reporting
