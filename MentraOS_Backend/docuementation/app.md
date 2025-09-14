# MementoAI - Extraordinary Recall

Introducing Extraordinary Recall, the world's first AI-native social memory assistant:
Glasses (built on MentraOS) recognize a face or scan a badge.

An AI Recall Agent whispers their name and your last conversation notes.

A Deep Research Agent (powered by Extraordinary.com–style pipelines) builds a profile of why this person or company is extraordinary — citing awards, press, patents, and recognitions.

All privacy-first: embeddings run locally, and users control what's saved or forgotten.

## MentraOS Backend API

The `MentraOS_Backend/app.py` is a Flask server that provides file upload capabilities to Firebase/Google Cloud Storage for the MementoAI system.

### Features

- **Health Check Endpoint**: Monitor server status
- **Signed URL Upload**: Generate secure upload URLs for direct client-to-storage uploads
- **Direct File Upload**: Handle multipart file uploads from smart glasses or other devices
- **Firebase Integration**: Automatic metadata storage in Firestore
- **Google Cloud Storage**: Secure file storage with organized folder structure
- **Vertex AI Vector Search**: Face recognition and similarity search using Google Cloud Vertex AI
- **Embedding Management**: Store and search face embeddings with metadata
- **Identity Matching**: Find similar faces and group by identity

### API Endpoints

#### `GET /healthz`
Simple health check endpoint that returns "ok" with 200 status.

#### `POST /mintUploadUrl`
Generates a signed URL for direct file upload to Google Cloud Storage.

**Request Body:**
```json
{
  "uid": "user_id",
  "sessionId": "session_identifier", 
  "ext": "mp4",
  "contentType": "video/mp4"
}
```

**Response:**
```json
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "storagePath": "inputs/uid/sessionId/timestamp.ext",
  "itemId": "timestamp"
}
```

**Features:**
- Creates signed URL valid for 10 minutes
- Organizes files by user and session: `inputs/{uid}/{sessionId}/{timestamp}.{ext}`
- Pre-creates Firestore document with "uploading" status
- Supports custom file extensions and content types

#### `POST /ingest`
Direct file upload endpoint for multipart form data (typically from smart glasses).

**Request (multipart/form-data):**
- `uid`: User identifier
- `sessionId`: Session identifier  
- `itemType`: Type of content (optional, defaults to "unknown")
- `file`: The file to upload

**Response:**
```json
{
  "ok": true,
  "storagePath": "inputs/uid/sessionId/timestamp.ext", 
  "itemId": "timestamp"
}
```

**Features:**
- Streams file directly to Google Cloud Storage
- Automatically detects file extension and MIME type
- Creates Firestore metadata document with "uploaded" status
- Preserves original filename extension

#### `POST /ingestEmbedding`
Store face embeddings in Vertex AI Vector Search with Firestore metadata.

**Request Body:**
```json
{
  "uid": "user_id",
  "sessionId": "session_identifier",
  "vector": [0.1, 0.2, 0.3, ...],  // 512-dimensional face embedding
  "meta": {
    "model": "facenet",
    "modality": "face",
    "quality": 0.95,
    "identityId": "person_123",
    "tenantId": "org_456"
  }
}
```

**Response:**
```json
{
  "vectorId": "vec_user_session_abc123",
  "userPath": "users/user_id/embeddings/vec_user_session_abc123"
}
```

#### `POST /search`
General vector similarity search in Vertex AI.

**Request Body:**
```json
{
  "queryVector": [0.1, 0.2, 0.3, ...],
  "numNeighbors": 10,
  "filters": {
    "modality": "face",
    "model": "facenet"
  },
  "uid": "user_id"  // optional filter
}
```

**Response:**
```json
{
  "results": [
    {
      "vector_id": "vec_user_session_abc123",
      "distance": 0.15,
      "metadata": {}
    }
  ]
}
```

#### `POST /searchFaces`
Search for similar faces with enriched Firestore metadata.

**Request Body:**
```json
{
  "queryVector": [0.1, 0.2, 0.3, ...],
  "numNeighbors": 10,
  "uid": "user_id",        // optional
  "sessionId": "session_id" // optional
}
```

**Response:**
```json
{
  "results": [
    {
      "vector_id": "vec_user_session_abc123",
      "distance": 0.15,
      "uid": "user_id",
      "session_id": "session_123",
      "item_type": "embedding",
      "model": "facenet",
      "quality": 0.95,
      "identity_id": "person_123",
      "tenant_id": "org_456",
      "created_at": "2024-01-01T00:00:00Z",
      "metadata": {},
      "firestore_path": "users/user_id/embeddings/vec_user_session_abc123"
    }
  ]
}
```

#### `POST /searchByIdentity`
Find all faces for a specific identity.

**Request Body:**
```json
{
  "identityId": "person_123",
  "numNeighbors": 10,
  "uid": "user_id"  // optional
}
```

**Response:**
```json
{
  "results": [
    {
      "vector_id": "vec_user_session_abc123",
      "distance": 0.0,  // exact identity match
      "uid": "user_id",
      "identity_id": "person_123",
      "session_id": "session_123",
      "quality": 0.95,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Data Storage Structure

#### Google Cloud Storage
Files are organized in the following structure:
```
inputs/
├── {uid}/
│   └── {sessionId}/
│       ├── {timestamp}.mp4
│       ├── {timestamp}.jpg
│       └── ...
```

#### Firestore Database
Metadata is stored in Firestore with this structure:

**File Upload Metadata:**
```
sessions/
├── {sessionId}/
│   └── items/
│       └── {timestamp}/
│           ├── uid: string
│           ├── storagePath: string
│           ├── status: "uploading" | "uploaded"
│           ├── itemType: string (for /ingest)
│           ├── contentType: string
│           └── createdAt: timestamp
```

**Vector Embeddings:**
```
users/
├── {uid}/
│   └── embeddings/
│       └── {vectorId}/
│           ├── uid: string
│           ├── sessionId: string
│           ├── itemType: "embedding"
│           ├── store: "vertex"
│           ├── vectorId: string
│           ├── indexEndpoint: string
│           ├── deployedIndexId: string
│           ├── dim: number
│           ├── model: string
│           ├── modality: "face"
│           ├── tenantId: string
│           ├── identityId: string
│           ├── quality: number
│           ├── meta: object
│           └── createdAt: timestamp

vectorsIndex/
├── {vectorId}/
│   ├── path: string  // pointer to user document
│   ├── uid: string
│   ├── sessionId: string
│   └── createdAt: timestamp
```

### Environment Setup

#### Required Environment Variables

**Storage:**
- `BUCKET`: Google Cloud Storage bucket name (e.g., "mementoai.firebasestorage.app")
- `GOOGLE_CLOUD_PROJECT`: GCP project ID (e.g., "mementoai")

**Vertex AI Vector Search:**
- `GCP_PROJECT`: GCP project ID for Vertex AI
- `GCP_LOCATION`: GCP region (e.g., "us-central1")
- `INDEX_ENDPOINT`: Full Vertex AI index endpoint path
- `DEPLOYED_INDEX_ID`: Deployed index alias (e.g., "faces_prod")
- `INDEX_ID`: Vertex AI index ID

#### Dependencies
```
flask==3.0.0
firebase-admin==6.4.0
google-cloud-storage==2.10.0
google-cloud-aiplatform==1.38.0
google-cloud-firestore==2.13.1
gunicorn==21.2.0
```

#### Authentication
The app uses Google Cloud Workload Identity for authentication (no service account key file needed when deployed to Cloud Run).

### Running the Server

#### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
source MentraOS_Backend/deployment/set_vertex_env.sh

# Run the Flask server
python MentraOS_Backend/app.py
```

#### Production Deployment
The app is deployed to Google Cloud Run at: https://mementoai-backend-528890859039.us-central1.run.app/

**Deployment Features:**
- Dockerfile for containerization
- Gunicorn as WSGI server with 4 threads
- Automatic scaling (0-10 instances)
- 2GB memory, 2 CPU allocation
- 300-second timeout
- All environment variables configured automatically

**Deploy Command:**
```bash
./deployment/deploy.sh
```

### Use Cases

1. **Smart Glasses Integration**: The `/ingest` endpoint receives files directly from smart glasses devices
2. **Web/Mobile Apps**: The `/mintUploadUrl` endpoint provides secure upload URLs for client applications
3. **Face Recognition**: Store and search face embeddings using `/ingestEmbedding` and `/searchFaces`
4. **Identity Management**: Group and search faces by identity using `/searchByIdentity`
5. **Session Management**: All uploads are organized by user sessions for easy retrieval and processing
6. **Real-time Processing**: Firestore integration enables real-time triggers for AI processing pipelines

### Security Features

- Signed URLs with 10-minute expiration
- Content-type validation
- Organized storage paths prevent conflicts
- Firebase security rules can control access
- No sensitive data in URLs (uses timestamps as identifiers)
- Vector embeddings stored securely in Vertex AI
- User-scoped access controls for face recognition data
- Tenant isolation for multi-organization deployments

### Vertex AI Vector Search Configuration

**Infrastructure:**
- **Index**: faces-streaming (ID: 9168398654489231360)
- **Endpoint**: faces-endpoint (ID: 4118983862904684544)
- **Deployed Index**: faces_prod
- **Configuration**: 512-dimensional vectors, cosine distance, streaming updates
- **Region**: us-central1
- **Project**: mementoai

**Features:**
- Real-time vector ingestion with streaming updates
- Cosine similarity matching for face recognition
- Metadata filtering by user, session, model, and tenant
- Automatic deduplication using deterministic vector IDs
- Production-ready scaling and performance
