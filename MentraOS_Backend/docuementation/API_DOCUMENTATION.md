# MementoAI Backend API Documentation

## Base URL
```
https://mementoai-backend-528890859039.us-central1.run.app
```

## Overview
The MementoAI backend provides endpoints for file uploads, data ingestion, and session management for smart glasses and mobile applications.

## Authentication
Currently, the API is publicly accessible. All endpoints require `uid` and `sessionId` parameters for data organization.

## Endpoints

### 1. Health Check
**GET** `/`
- **Description**: Basic health check endpoint
- **Response**: `"MementoAI Backend is running"`

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

**Usage Flow**:
1. Call `/mintUploadUrl` to get signed URL
2. Use the `uploadUrl` to PUT your file directly to Google Cloud Storage
3. Monitor the Firestore document for upload status

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

### 3. Ingest Audio Metadata
**POST** `/ingestArray`

**Description**: Store audio metadata and conversation data from smart glasses in Firestore.

**Request Body**:
```json
{
  "uid": "user123",
  "sessionId": "session456",
  "timestamp": 1642723200000,
  "location": "Conference Room A",
  "summary": "Meeting with John about project updates",
  "transcript": "We discussed the quarterly goals and next steps",
  "confidence": 95,
  "gpsLocation": [37.7749, -122.4194],
  "rawTranscript": "Um, so we discussed the, uh, quarterly goals...",
  "nextSteps": "Follow up on action items",
  "skills": "project management, communication",
  "name": "John Smith"
}
```

**Parameters**:
- `uid` (required): User identifier
- `sessionId` (required): Session identifier
- `timestamp` (required): Timestamp of the conversation
- `location` (required): Location where conversation took place
- `summary` (required): Summary of the conversation
- `transcript` (required): Processed transcript
- `confidence` (required): Confidence score (0-100)
- `gpsLocation` (required): GPS coordinates [latitude, longitude]
- `rawTranscript` (required): Raw unprocessed transcript
- `nextSteps` (optional): Action items or next steps
- `skills` (optional): Skills mentioned or demonstrated
- `name` (optional): Name of person in conversation

**Response**:
```json
{
  "ok": true,
  "itemId": "1642723200000"
}
```

**Example cURL**:
```bash
curl -X POST https://mementoai-backend-528890859039.us-central1.run.app/ingestArray \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "sessionId": "session456",
    "timestamp": 1642723200000,
    "location": "Conference Room A",
    "summary": "Project meeting with team",
    "transcript": "We discussed Q4 goals",
    "confidence": 95,
    "gpsLocation": [37.7749, -122.4194],
    "rawTranscript": "We, uh, discussed Q4 goals"
  }'
```

---

### 4. Ingest Embeddings to Vertex AI Vector Search
**POST** `/ingestEmbedding`

**Description**: Store face embeddings and other vectors in Vertex AI Vector Search for similarity search.

**Request Body**:
```json
{
  "uid": "user123",
  "sessionId": "session456",
  "vector": [0.1, 0.2, 0.3, ...],
  "meta": {
    "model": "facenet",
    "modality": "face",
    "identityId": "person_abc123",
    "quality": 0.95,
    "tenantId": "org_456"
  }
}
```

**Parameters**:
- `uid` (required): User identifier
- `sessionId` (required): Session identifier
- `vector` (required): Embedding vector (512 floats for face embeddings)
- `meta` (optional): Metadata including model, modality, identityId, quality, tenantId

**Response**:
```json
{
  "vectorId": "vec_user123_session456_a1b2c3d4",
  "userPath": "users/user123/embeddings/vec_user123_session456_a1b2c3d4"
}
```

**Example cURL**:
```bash
curl -X POST https://mementoai-backend-528890859039.us-central1.run.app/ingestEmbedding \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "sessionId": "session456",
    "vector": [0.1, 0.2, 0.3, ...],
    "meta": {
      "modality": "face",
      "identityId": "person_001",
      "quality": 0.92
    }
  }'
```

---

### 5. Vector Similarity Search
**POST** `/search`

**Description**: Find similar vectors using Vertex AI Vector Search.

**Request Body**:
```json
{
  "queryVector": [0.1, 0.2, 0.3, ...], // 512-dimensional query vector
  "numNeighbors": 10,
  "filters": {
    "modality": "face",
    "model": "face-recognition-v1"
  },
  "uid": "user123" // Optional: filter by user
}
```

**Response**:
```json
{
  "results": [
    {
      "vector_id": "vec_user123_session456_a1b2c3d4",
      "distance": 0.15,
      "metadata": {
        "modality": "face",
        "model": "face-recognition-v1"
      }
    }
  ]
}
```

---

### 6. Face Similarity Search with Metadata
**POST** `/searchFaces`

**Description**: Find similar face embeddings with enriched Firestore metadata.

**Request Body**:
```json
{
  "queryVector": [0.1, 0.2, 0.3, ...], // 512-dimensional face embedding
  "numNeighbors": 10,
  "uid": "user123", // Optional: filter by user
  "sessionId": "session456" // Optional: filter by session
}
```

**Response**:
```json
{
  "results": [
    {
      "vector_id": "vec_user123_session456_a1b2c3d4",
      "distance": 0.15,
      "uid": "user123",
      "session_id": "session456",
      "item_type": "embedding",
      "model": "face-recognition-v1",
      "quality": 0.95,
      "identity_id": "person_abc123",
      "tenant_id": null,
      "created_at": "2025-09-13T20:00:00Z",
      "metadata": {
        "name": "John Doe"
      },
      "firestore_path": "users/user123/embeddings/vec_user123_session456_a1b2c3d4"
    }
  ]
}
```

---

### 7. Search by Identity
**POST** `/searchByIdentity`

**Description**: Find all faces for a specific identity/person.

**Request Body**:
```json
{
  "identityId": "person_abc123",
  "numResults": 10,
  "uid": "user123" // Optional: filter by user
}
```

**Response**:
```json
{
  "results": [
    {
      "vector_id": "vec_user123_session456_a1b2c3d4",
      "distance": 0.0,
      "uid": "user123",
      "session_id": "session456",
      "identity_id": "person_abc123",
      "metadata": {
        "name": "John Doe"
      }
    }
  ]
}
```

---


### 8. Direct File Upload
**POST** `/ingest`

**Description**: Upload files directly through multipart form data (alternative to signed URLs).

**Request**: Multipart form data
- `uid` (required): User identifier
- `sessionId` (required): Session identifier  
- `itemType` (optional): Type of content (default: "unknown")
- `file` (required): File to upload

**Response**:
```json
{
  "ok": true,
  "storagePath": "inputs/user123/session456/1726257600000.jpg",
  "itemId": "1726257600000"
}
```

**Example cURL**:
```bash
curl -X POST https://mementoai-backend-528890859039.us-central1.run.app/ingest \
  -F "uid=user123" \
  -F "sessionId=session456" \
  -F "itemType=image" \
  -F "file=@/path/to/image.jpg"
```

---

## Data Storage Structure

### Firestore Collections
Data is stored in Firestore with the following structure:
```
sessions/{sessionId}/items/{itemId}
```

### Document Schema
```json
{
  "uid": "user123",
  "sessionId": "session456", 
  "storagePath": "inputs/user123/session456/1726257600000.mp4",
  "status": "uploaded", // "uploading" | "uploaded" | "processing"
  "contentType": "video/mp4",
  "itemType": "video",
  "createdAt": "2025-09-13T20:00:00Z",
  "vector": [0.1, 0.2, 0.3], // Only for array ingestion
  "meta": {} // Additional metadata
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
  "error": "Internal server error message"
}
```

---

## Integration Examples

### Smart Glasses Integration

**1. Face Recognition Workflow**:
```javascript
// Step 1: Store a face embedding
await fetch('/ingestEmbedding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'glasses_user_001',
    sessionId: 'face_session_123',
    vector: faceEmbedding, // 512-dimensional array from face recognition model
    meta: {
      modality: 'face',
      identityId: 'person_john_doe',
      quality: 0.95,
      model: 'face-recognition-v1'
    },
    name: 'John Doe'
  })
});

// Step 2: Search for similar faces
const searchResponse = await fetch('/searchFaces', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    queryVector: newFaceEmbedding, // 512-dimensional query vector
    numNeighbors: 5,
    uid: 'glasses_user_001'
  })
});

const { results } = await searchResponse.json();
// Results contain similar faces with metadata and distances
```

**2. Smart Glasses Audio Processing**:
```javascript
// Send processed audio data with metadata
await fetch('/ingestArray', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'glasses_user_001',
    sessionId: 'meeting_session_123',
    timestamp: Date.now(),
    location: 'Conference Room A',
    summary: 'Q4 planning discussion with marketing team',
    transcript: 'We discussed the marketing strategy for Q4...',
    confidence: 85,
    gpsLocation: [37.7749, -122.4194],
    rawTranscript: 'We, uh, discussed the marketing strategy for Q4...',
    skills: 'project management, strategic planning',
    nextSteps: 'Schedule follow-up with finance team',
    name: 'John Smith'
  })
});
```

**3. Vision/Image Processing (Vector Embeddings)**:
```javascript
// Send image embeddings for vision processing
await fetch('/ingestEmbedding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'glasses_user_001',
    sessionId: 'vision_session_456',
    vector: imageEmbedding, // Array of floats from vision model
    meta: {
      modality: 'vision',
      model: 'vision-transformer-v1',
      objects_detected: ['person', 'laptop', 'whiteboard'],
      location: 'Conference Room A'
    }
  })
});
```

**3. Raw Audio File Upload (if needed)**:
```javascript
// Step 1: Get signed URL
const uploadResponse = await fetch('/mintUploadUrl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'glasses_user_001',
    sessionId: 'recording_session_123',
    ext: 'wav',
    contentType: 'audio/wav'
  })
});

const { uploadUrl, itemId } = await uploadResponse.json();

// Step 2: Upload audio file
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'audio/wav' },
  body: audioBlob
});

// Step 3: Send embedding data
await fetch('/ingestEmbedding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'glasses_user_001',
    sessionId: 'recording_session_123',
    vector: audioEmbedding,
    meta: { 
      modality: 'audio',
      model: 'audio-embedding-v1',
      relatedItemId: itemId,
      duration: 30.5,
      sampleRate: 44100
    }
  })
});
```

**2. Image Capture**:
```javascript
const response = await fetch('/ingest', {
  method: 'POST',
  body: formData // Contains uid, sessionId, itemType, and image file
});
```

---

## Environment Configuration

The backend is configured with:
- **Google Cloud Project**: `mementoai`
- **Storage Bucket**: `mementoai.firebasestorage.app`
- **Region**: `us-central1`
- **Firestore Database**: Default database

---

## Rate Limits & Quotas

- No explicit rate limits currently implemented
- Google Cloud Storage and Firestore quotas apply
- Signed URLs expire after 10 minutes

---

## Support

For technical support or questions about integration, contact the MementoAI development team.

---

## Changelog

**v1.1.0** (2025-09-13)
- Added Vertex AI Vector Search integration
- New `/ingestEmbedding` endpoint for storing face embeddings
- New `/search` endpoint for vector similarity search
- New `/searchFaces` endpoint with Firestore metadata enrichment
- New `/searchByIdentity` endpoint for identity-based search
- Support for 512-dimensional face embeddings
- Cosine distance similarity matching

**v1.0.0** (2025-09-13)
- Initial API release
- File upload via signed URLs
- Array ingestion for embeddings
- Direct multipart upload
- Firestore integration
