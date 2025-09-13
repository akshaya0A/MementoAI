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

### Environment Setup

#### Required Environment Variables
- `BUCKET`: Google Cloud Storage bucket name (e.g., "myproject.appspot.com")

#### Dependencies
```
flask==3.0.3
gunicorn==22.0.0
firebase-admin==6.5.0
google-cloud-storage==2.18.2
```

#### Authentication
The app uses Google Cloud Workload Identity for authentication (no service account key file needed when deployed to Cloud Run).

### Running the Server

#### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export BUCKET=your-storage-bucket.appspot.com

# Run the Flask server
python MentraOS_Backend/app.py
```

#### Production Deployment
The app is designed to run on Google Cloud Run with:
- Dockerfile for containerization
- Gunicorn as WSGI server
- Automatic scaling based on traffic

### Use Cases

1. **Smart Glasses Integration**: The `/ingest` endpoint receives files directly from smart glasses devices
2. **Web/Mobile Apps**: The `/mintUploadUrl` endpoint provides secure upload URLs for client applications
3. **Session Management**: All uploads are organized by user sessions for easy retrieval and processing
4. **Real-time Processing**: Firestore integration enables real-time triggers for AI processing pipelines

### Security Features

- Signed URLs with 10-minute expiration
- Content-type validation
- Organized storage paths prevent conflicts
- Firebase security rules can control access
- No sensitive data in URLs (uses timestamps as identifiers)
