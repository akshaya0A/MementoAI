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

### 3. Ingest Numeric Arrays
**POST** `/ingestArray`

**Description**: Store numeric arrays (embeddings, sensor data, etc.) directly in Firestore.

**Request Body**:
```json
{
  "uid": "user123",
  "sessionId": "session456",
  "itemType": "embedding",
  "vector": [0.1, 0.2, 0.3, ...],
  "meta": {
    "model": "text-embedding-ada-002",
    "source": "transcription"
  }
}
```

**Parameters**:
- `uid` (required): User identifier
- `sessionId` (required): Session identifier
- `vector` (required): Array of numbers
- `itemType` (optional): Type of data (default: "embedding")
- `meta` (optional): Additional metadata object

**Response**:
```json
{
  "ok": true,
  "itemId": "1726257600000"
}
```

**Example cURL**:
```bash
curl -X POST https://mementoai-backend-528890859039.us-central1.run.app/ingestArray \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "sessionId": "session456",
    "itemType": "embedding",
    "vector": [0.1, 0.2, 0.3, 0.4, 0.5],
    "meta": {"source": "audio_transcription"}
  }'
```

---

### 4. Direct File Upload
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

**1. Audio Recording Upload**:
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
await fetch('/ingestArray', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'glasses_user_001',
    sessionId: 'recording_session_123',
    itemType: 'audio_embedding',
    vector: audioEmbedding,
    meta: { 
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

**v1.0.0** (2025-09-13)
- Initial API release
- File upload via signed URLs
- Array ingestion for embeddings
- Direct multipart upload
- Firestore integration
