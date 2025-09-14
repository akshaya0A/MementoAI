# MementoAI Backend API Documentation

## Base URL
```
https://mementoai-backend-528890859039.us-central1.run.app
```

## Overview
The MementoAI backend provides endpoints for face recognition, encounter ingestion, vector search, and file uploads for smart glasses and mobile applications. It integrates with Google Cloud Vertex AI for vector similarity search and Firestore for data storage.

## Authentication
Currently, the API is publicly accessible. All endpoints require `uid` and `sessionId` parameters for data organization.

## Endpoints

### 1. Health Check
**GET** `/`
- **Description**: Basic health check endpoint
- **Response**: `"MementoAI Backend is running"`

**GET** `/health`
- **Description**: Health check endpoint with proper headers
- **Response**: `"ok"` with `Content-Type: text/plain`

---

### 2. Generate Signed Upload URL
**POST** `/mintUploadUrl`

**Description**: Generate a signed URL for direct file upload to Google Cloud Storage. Use this for audio, video, and image files.

**Request Body**:
```json
{
  "uid": "user123",
  "sessionId": "session456", 
  "ext": "mp4",
  "contentType": "video/mp4"
}
```

**Parameters**:
- `uid` (required): User identifier
- `sessionId` (required): Session identifier
- `ext` (optional): File extension (default: "bin")
- `contentType` (optional): MIME type (default: "application/octet-stream")

**Response**:
```json
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "storagePath": "inputs/user123/session456/1726257600000.mp4",
  "itemId": "1726257600000"
}
```

**Example cURL**:
```bash
curl -X POST https://mementoai-backend-528890859039.us-central1.run.app/mintUploadUrl \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "sessionId": "session456",
    "ext": "mp4",
    "contentType": "video/mp4"
  }'
```

---

### 3. Identify Face Embedding
**POST** `/identifyEmbedding`

**Description**: Identify a person from a face embedding vector. Returns recognized person data if found, or unknown status with candidates.

**Request Body**:
```json
{
  "uid": "user123",
  "vector": [0.1, 0.2, 0.3, ...], // 128-dimensional face embedding
  "k": 5, // Optional: number of neighbors to search (default: 5)
  "threshold": 0.55 // Optional: similarity threshold (default: user's threshold or 0.55)
}
```

**Parameters**:
- `uid` (required): User identifier
- `vector` (required): 128-dimensional face embedding vector
- `k` (optional): Number of neighbors to search (default: 5)
- `threshold` (optional): Similarity threshold (default: user's threshold or 0.55)

**Response (Recognized)**:
```json
{
  "status": "recognized",
  "person": {
    "id": "per_user123_abc123",
    "displayName": "John Smith",
    "summary": "Software engineer at Tech Corp",
    "avatarUri": "https://...",
    "company": "Tech Corp",
    "role": "Senior Engineer"
  },
  "confidence": 0.85,
  "vectorId": "vec_user123_session456_a1b2c3d4"
}
```

**Response (Unknown)**:
```json
{
  "status": "unknown",
  "confidence": 0.45,
  "vectorId": "vec_user123_session456_a1b2c3d4",
  "candidates": [
    {
      "vectorId": "vec_user123_session456_a1b2c3d4",
      "similarity": 0.45
    }
  ]
}
```

**Example cURL**:
```bash
curl -X POST https://mementoai-backend-528890859039.us-central1.run.app/identifyEmbedding \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "vector": [0.1, 0.2, 0.3, ...],
    "k": 5,
    "threshold": 0.55
  }'
```

---

### 4. Ingest Full Encounter
**POST** `/ingestEncounter`

**Description**: Ingest a complete encounter with optional face embedding and person enrollment. This is the main endpoint for smart glasses data.

**Request Body**:
```json
{
  "uid": "user123",
  "sessionId": "session456",
  "timestamp": 1642723200000,
  "location": "Conference Room A",
  "gps": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "summary": "Meeting with John about project updates",
  "transcript": "We discussed the quarterly goals and next steps",
  "rawTranscript": "Um, so we discussed the, uh, quarterly goals...",
  "confidence": 95,
  "nextSteps": "Follow up on action items",
  "skills": "project management, communication",
  "name": "John Smith",
  "contactEmail": "john@example.com",
  "vector": [0.1, 0.2, 0.3, ...] // Optional: 128-dimensional face embedding
}
```

**Parameters**:
- `uid` (required): User identifier
- `sessionId` (required): Session identifier
- `timestamp` (required): Timestamp of the encounter
- `location` (required): Location where encounter took place
- `gps` (required): GPS coordinates with lat/lng
- `summary` (required): Summary of the encounter
- `transcript` (required): Processed transcript
- `rawTranscript` (required): Raw unprocessed transcript
- `confidence` (required): Confidence score (integer)
- `nextSteps` (optional): Action items or next steps
- `skills` (optional): Skills mentioned or demonstrated
- `name` (optional): Name of person in encounter
- `contactEmail` (optional): Email for person enrollment
- `vector` (optional): 128-dimensional face embedding

**Response**:
```json
{
  "ok": true,
  "encounterId": "enc_1642723200000",
  "vectorId": "vec_user123_session456_a1b2c3d4",
  "person": {
    "id": "per_user123_abc123",
    "displayName": "John Smith",
    "summary": "Software engineer at Tech Corp",
    "avatarUri": "https://...",
    "company": "Tech Corp",
    "role": "Senior Engineer"
  },
  "confidence": 0.85
}
```

**Example cURL**:
```bash
curl -X POST https://mementoai-backend-528890859039.us-central1.run.app/ingestEncounter \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "sessionId": "session456",
    "timestamp": 1642723200000,
    "location": "Conference Room A",
    "gps": {"lat": 37.7749, "lng": -122.4194},
    "summary": "Project meeting with team",
    "transcript": "We discussed Q4 goals",
    "rawTranscript": "We, uh, discussed Q4 goals",
    "confidence": 95,
    "name": "John Smith",
    "contactEmail": "john@example.com"
  }'
```

---

### 5. Vector Similarity Search
**POST** `/search`

**Description**: Find similar vectors using Vertex AI Vector Search.

**Request Body**:
```json
{
  "queryVector": [0.1, 0.2, 0.3, ...], // 128-dimensional query vector
  "numNeighbors": 10,
  "filters": {
    "modality": "face",
    "model": "face-128@v1"
  },
  "uid": "user123" // Optional: filter by user
}
```

**Response**:
```json
{
  "results": [
    {
      "vectorId": "vec_user123_session456_a1b2c3d4",
      "distance": 0.15,
      "similarity": 0.85,
      "metadata": {}
    }
  ]
}
```

**Example cURL**:
```bash
curl -X POST https://mementoai-backend-528890859039.us-central1.run.app/search \
  -H "Content-Type: application/json" \
  -d '{
    "queryVector": [0.1, 0.2, 0.3, ...],
    "numNeighbors": 10,
    "filters": {"modality": "face", "model": "face-128@v1"},
    "uid": "user123"
  }'
```

---

### 6. Bulk Upsert Embeddings
**POST** `/bulkUpsertEmbeddings`

**Description**: Upload multiple face embeddings in batch for efficient processing.

**Request Body (Simple)**:
```json
{
  "uid": "user123",
  "sessionId": "session456",
  "vectors": [
    [0.1, 0.2, 0.3, ...], // 128-dimensional vector
    [0.4, 0.5, 0.6, ...]  // Another 128-dimensional vector
  ],
  "model": "face-128@v1",
  "modality": "face",
  "storeVector": false
}
```

**Request Body (Rich)**:
```json
{
  "uid": "user123",
  "sessionId": "session456",
  "items": [
    {
      "vector": [0.1, 0.2, 0.3, ...],
      "model": "face-128@v1",
      "modality": "face",
      "meta": {"quality": 0.95}
    }
  ],
  "storeVector": false
}
```

**Response**:
```json
{
  "ok": true,
  "count": 2,
  "vectorIds": ["vec_user123_session456_a1b2c3d4", "vec_user123_session456_b2c3d4e5"]
}
```

**Example cURL**:
```bash
curl -X POST https://mementoai-backend-528890859039.us-central1.run.app/bulkUpsertEmbeddings \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "sessionId": "session456",
    "vectors": [[0.1, 0.2, 0.3, ...], [0.4, 0.5, 0.6, ...]],
    "model": "face-128@v1",
    "modality": "face"
  }'
```

---

### 7. List Embeddings
**GET** `/embeddings`

**Description**: List embedding metadata with optional pagination and vector data.

**Query Parameters**:
- `uid` (optional): Filter by user identifier
- `limit` (optional): Number of results (default: 100, max: 1000)
- `includeVector` (optional): Include stored vector data (default: false)
- `pageToken` (optional): Pagination token

**Response**:
```json
{
  "items": [
    {
      "vectorId": "vec_user123_session456_a1b2c3d4",
      "uid": "user123",
      "model": "face-128@v1",
      "modality": "face",
      "dim": 128,
      "precision": "int",
      "personId": "per_user123_abc123",
      "encounterPath": "encounters/enc_1642723200000",
      "createdAt": "2025-01-14T20:00:00Z",
      "updatedAt": "2025-01-14T20:00:00Z",
      "vector": [0.1, 0.2, 0.3, ...] // Only if includeVector=true
    }
  ],
  "nextPageToken": "embeddings/vec_user123_session456_b2c3d4e5"
}
```

**Example cURL**:
```bash
curl "https://mementoai-backend-528890859039.us-central1.run.app/embeddings?uid=user123&limit=50&includeVector=false"
```

---

## Data Storage Structure

### Firestore Collections
Data is stored in Firestore with the following structure:

#### Encounters
```
encounters/{encounterId}
```
Contains encounter data with GPS coordinates, transcripts, and metadata.

#### People
```
people/{personId}
```
Contains person profiles with contact information and metadata.

#### Embeddings
```
embeddings/{vectorId}
```
Contains embedding metadata and pointers to Vertex AI vectors.

#### Sessions
```
sessions/{sessionId}/items/{itemId}
```
Contains file upload status and metadata.

### Document Schemas

#### Encounter Document
```json
{
  "uid": "user123",
  "sessionId": "session456",
  "timestamp": "2025-01-14T20:00:00Z",
  "location": "Conference Room A",
  "geo": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "summary": "Meeting with John about project updates",
  "transcript": "We discussed the quarterly goals and next steps",
  "rawTranscript": "Um, so we discussed the, uh, quarterly goals...",
  "nextSteps": "Follow up on action items",
  "skills": "project management, communication",
  "confidence": 95,
  "name": "John Smith",
  "vectorId": "vec_user123_session456_a1b2c3d4",
  "match": {
    "status": "recognized", // "unknown" | "recognized" | "enrolled"
    "personId": "per_user123_abc123",
    "score": 0.85
  },
  "createdAt": "2025-01-14T20:00:00Z"
}
```

#### Person Document
```json
{
  "displayName": "John Smith",
  "emails": ["john@example.com"],
  "summary": "Software engineer at Tech Corp",
  "createdByUid": "user123",
  "owners": {"user123": true},
  "encounterCount": 5,
  "avatarUri": "https://...",
  "company": "Tech Corp",
  "role": "Senior Engineer",
  "createdAt": "2025-01-14T20:00:00Z",
  "updatedAt": "2025-01-14T20:00:00Z"
}
```

#### Embedding Document
```json
{
  "vectorId": "vec_user123_session456_a1b2c3d4",
  "store": "vertex",
  "indexEndpoint": "projects/.../indexEndpoints/...",
  "deployedIndexId": "faces_streaming_v2",
  "uid": "user123",
  "encounterRef": "encounters/enc_1642723200000",
  "modality": "face",
  "model": "face-128@v1",
  "dim": 128,
  "precision": "int",
  "personId": "per_user123_abc123",
  "createdAt": "2025-01-14T20:00:00Z"
}
```

---

## Error Responses

All endpoints return appropriate HTTP status codes:

**400 Bad Request**:
```json
{
  "error": "uid and sessionId are required"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Vertex search failed: [error details]"
}
```

---

## Integration Examples

### Smart Glasses Face Recognition Workflow

**1. Capture and Identify Face**:
```javascript
// Step 1: Identify a face from embedding
const identifyResponse = await fetch('/identifyEmbedding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'glasses_user_001',
    vector: faceEmbedding, // 128-dimensional array from face recognition model
    k: 5,
    threshold: 0.55
  })
});

const identifyResult = await identifyResponse.json();

if (identifyResult.status === 'recognized') {
  console.log('Recognized:', identifyResult.person.displayName);
  console.log('Confidence:', identifyResult.confidence);
} else {
  console.log('Unknown person, confidence:', identifyResult.confidence);
}
```

**2. Full Encounter with Face Recognition**:
```javascript
// Step 2: Record complete encounter with face data
const encounterResponse = await fetch('/ingestEncounter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'glasses_user_001',
    sessionId: 'meeting_session_123',
    timestamp: Date.now(),
    location: 'Conference Room A',
    gps: { lat: 37.7749, lng: -122.4194 },
    summary: 'Q4 planning discussion with marketing team',
    transcript: 'We discussed the marketing strategy for Q4...',
    rawTranscript: 'We, uh, discussed the marketing strategy for Q4...',
    confidence: 85,
    skills: 'project management, strategic planning',
    nextSteps: 'Schedule follow-up with finance team',
    name: 'John Smith',
    contactEmail: 'john@example.com',
    vector: faceEmbedding // Optional: 128-dimensional face embedding
  })
});

const encounterResult = await encounterResponse.json();
console.log('Encounter recorded:', encounterResult.encounterId);
if (encounterResult.person) {
  console.log('Person enrolled/recognized:', encounterResult.person.displayName);
}
```

**3. Bulk Face Embedding Upload**:
```javascript
// Step 3: Upload multiple face embeddings
const bulkResponse = await fetch('/bulkUpsertEmbeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'glasses_user_001',
    sessionId: 'bulk_session_456',
    vectors: [
      faceEmbedding1, // 128-dimensional array
      faceEmbedding2, // 128-dimensional array
      faceEmbedding3  // 128-dimensional array
    ],
    model: 'face-128@v1',
    modality: 'face',
    storeVector: false
  })
});

const bulkResult = await bulkResponse.json();
console.log('Uploaded', bulkResult.count, 'embeddings');
console.log('Vector IDs:', bulkResult.vectorIds);
```

**4. Search for Similar Faces**:
```javascript
// Step 4: Search for similar faces
const searchResponse = await fetch('/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    queryVector: newFaceEmbedding, // 128-dimensional query vector
    numNeighbors: 10,
    filters: { modality: 'face', model: 'face-128@v1' },
    uid: 'glasses_user_001'
  })
});

const searchResult = await searchResponse.json();
console.log('Found', searchResult.results.length, 'similar faces');
searchResult.results.forEach(result => {
  console.log('Vector ID:', result.vectorId, 'Similarity:', result.similarity);
});
```

**5. List All Embeddings**:
```javascript
// Step 5: List all embeddings for a user
const listResponse = await fetch('/embeddings?uid=glasses_user_001&limit=50&includeVector=false');
const listResult = await listResponse.json();

console.log('Total embeddings:', listResult.items.length);
listResult.items.forEach(item => {
  console.log('Vector ID:', item.vectorId, 'Person:', item.personId);
});
```

---

## Environment Configuration

The backend is configured with:
- **Google Cloud Project**: `mementoai`
- **Storage Bucket**: `mementoai.firebasestorage.app`
- **Region**: `us-central1`
- **Vertex AI Index Endpoint**: `projects/528890859039/locations/us-central1/indexEndpoints/4118983862904684544`
- **Deployed Index ID**: `faces_streaming_v2`
- **Index ID**: `7462097345669234688`

---

## Rate Limits & Quotas

- No explicit rate limits currently implemented
- Google Cloud Storage and Firestore quotas apply
- Vertex AI Vector Search quotas apply
- Signed URLs expire after 10 minutes

---

## Support

For technical support or questions about integration, contact the MementoAI development team.

---

## Changelog

**v2.0.0** (2025-01-14)
- Updated to current implementation
- Added `/identifyEmbedding` endpoint for face recognition
- Added `/ingestEncounter` endpoint for complete encounter processing
- Added `/bulkUpsertEmbeddings` endpoint for batch processing
- Added `/embeddings` GET endpoint for listing embeddings
- Updated to 128-dimensional face embeddings
- Added person enrollment and recognition workflows
- Improved error handling and response formats

**v1.1.0** (2025-09-13)
- Added Vertex AI Vector Search integration
- New `/ingestEmbedding` endpoint for storing face embeddings
- New `/search` endpoint for vector similarity search
- Support for 512-dimensional face embeddings
- Cosine distance similarity matching

**v1.0.0** (2025-09-13)
- Initial API release
- File upload via signed URLs
- Array ingestion for embeddings
- Direct multipart upload
- Firestore integration