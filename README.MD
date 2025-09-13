# MementoAI - Event Networking Assistant

A MentraOS-powered AI assistant that captures networking conversations at events like career fairs, hackathons, and conferences. Uses wake word detection, real-time transcription, OpenAI processing, and GPS location capture to create structured networking data.

## Features

- 🎤 **Wake Word Activation** - Say your custom wake word to start recording
- 🗣️ **Real-time Transcription** - High-quality speech-to-text with MentraOS
- 🤖 **AI Processing** - OpenAI-powered conversation analysis and summarization
- 📍 **GPS Location Capture** - Automatic location tagging using MentraOS LocationManager
- 📄 **JSON Export** - Structured data output for backend processing
- 🎯 **Event-Focused** - Optimized for recruiter/student networking conversations

## Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run the application:**
   ```bash
   bun run dev
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MENTRAOS_API_KEY` | Your MentraOS API key | ✅ | - |
| `PACKAGE_NAME` | Your MentraOS package name | ✅ | - |
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ | - |
| `OPENAI_MODEL` | OpenAI model to use | ❌ | `gpt-4o-mini` |
| `WAKE_WORD` | Wake word to start recording | ❌ | `hey memento` |
| `PORT` | Server port | ❌ | `3000` |

## Usage

1. **Start the app** - The assistant will greet you and wait for the wake word
2. **Say the wake word** - "Hey memento" (or your custom wake word)
3. **Have your conversation** - Talk naturally with your networking contact
4. **Say "done"** - When finished, say "done" to stop recording
5. **Get your summary** - The AI will speak back the key information
6. **Check the JSON file** - Find your structured data in the `output/` folder

## JSON Output Structure

The application generates comprehensive JSON files with structured networking data. Here's the complete schema:

### Main Structure

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "contactInfo": "john@company.com, LinkedIn: john-doe",
  "skills": ["React", "Python", "Machine Learning"],
  "location": "Tech Career Fair - Google Booth",
  "nextSteps": "Send resume and portfolio by Friday",
  "confidence": 0.95,
  "summary": "Met John, a senior developer at Google working on AI projects...",
  "gpsLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": "hundredMeters",
    "timestamp": "2024-01-15T10:30:45.123Z"
  },
  "transcript": {
    "original": "um hey so I'm John and I work at Google and um I'm looking for...",
    "cleaned": "hey I'm John and I work at Google and I'm looking for...",
    "raw": {
      "fullText": "um hey so I'm John and I work at Google and um I'm looking for...",
      "segments": [
        {
          "text": "um hey so I'm John",
          "isFinal": true,
          "segmentIndex": 0,
          "timestamp": "2024-01-15T10:30:45.123Z"
        }
      ],
      "wordCount": 15,
      "charCount": 67,
      "processingTime": 1705327845123
    }
  }
}
```

### Field Descriptions

#### Top-Level Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `timestamp` | string (ISO) | When the conversation was processed | `"2024-01-15T10:30:45.123Z"` |
| `contactInfo` | string | Contact details exchanged | `"john@company.com, LinkedIn: john-doe"` |
| `skills` | array[string] | Skills/technologies discussed | `["React", "Python", "ML"]` |
| `location` | string | Where the person was met | `"Tech Career Fair - Google Booth"` |
| `nextSteps` | string | Follow-up actions discussed | `"Send resume by Friday"` |
| `confidence` | number (0-1) | AI confidence in the summary | `0.95` |
| `summary` | string | Main important information | `"Met John, a senior developer..."` |

#### GPS Location Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `latitude` | number | GPS latitude coordinate | `37.7749` |
| `longitude` | number | GPS longitude coordinate | `-122.4194` |
| `accuracy` | string | GPS accuracy tier used | `"hundredMeters"` |
| `timestamp` | string (ISO) | When location was captured | `"2024-01-15T10:30:45.123Z"` |

#### Transcript Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `original` | string | Raw transcript from MentraOS | `"um hey so I'm John..."` |
| `cleaned` | string | Pre-processed transcript | `"hey I'm John..."` |
| `raw` | object | Detailed raw data | See Raw Transcript Object |

#### Raw Transcript Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `fullText` | string | Complete original transcript | `"um hey so I'm John..."` |
| `segments` | array[object] | Individual transcript segments | See Segment Object |
| `wordCount` | number | Total word count | `15` |
| `charCount` | number | Total character count | `67` |
| `processingTime` | number | Unix timestamp of processing | `1705327845123` |

#### Segment Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `text` | string | Segment text content | `"um hey so I'm John"` |
| `isFinal` | boolean | Whether segment is final | `true` |
| `segmentIndex` | number | Order of segment in conversation | `0` |
| `timestamp` | string (ISO) | When segment was processed | `"2024-01-15T10:30:45.123Z"` |

## File Output

### Naming Convention
- **Format**: `contact-{name}-{date}.json`
- **Example**: `contact-john-2024-01-15.json`
- **Location**: `output/` directory in project root

### File Structure
```
output/
├── contact-john-2024-01-15.json
├── contact-sarah-2024-01-15.json
└── contact-mike-2024-01-16.json
```

## Backend Processing

### Data Analysis Possibilities

#### Contact Management
- **Email extraction**: Parse `contactInfo` for email addresses
- **LinkedIn parsing**: Extract LinkedIn profiles from contact info
- **Phone number detection**: Identify phone numbers in contact details

#### Skill Analysis
- **Technology categorization**: Group `skills` by technology stacks
- **Skill trending**: Track popular skills across events
- **Skill matching**: Match contacts with similar skill sets

#### Geographic Features
- **Event mapping**: Plot `gpsLocation` coordinates on maps
- **Proximity analysis**: Find contacts met in same areas
- **Travel patterns**: Track movement between networking events

#### Transcript Analysis
- **Speech patterns**: Analyze `raw.segments` for speaking style
- **Quality metrics**: Compare `original` vs `cleaned` for accuracy
- **Timing analysis**: Use `processingTime` and segment timestamps
- **Content analysis**: NLP on `raw.fullText` for deeper insights

### Error Handling

- **GPS failures**: `gpsLocation` will be `null` if capture fails
- **Transcription errors**: `raw` data always preserved for debugging
- **Processing failures**: JSON still saves with available data

## Technical Details

### Transcription Processing
- **Pre-processing**: Removes filler words, fixes contractions
- **AI correction**: OpenAI-powered error correction and cleanup
- **Dual-layer processing**: Both JavaScript and AI-based cleaning

### Location Capture
- **Accuracy**: `hundredMeters` for good balance of accuracy vs battery
- **Method**: Single location fix using MentraOS LocationManager
- **Fallback**: Graceful handling if location capture fails

### Audio Processing
- **Wake word detection**: Configurable wake word via environment variable
- **Real-time transcription**: Continuous speech-to-text with MentraOS
- **Voice activity detection**: Automatic silence detection for conversation end

## Development

### Project Structure
```
src/
├── index.ts          # Main application file
output/               # Generated JSON files
├── contact-*.json
.env                  # Environment variables
package.json          # Dependencies
tsconfig.json         # TypeScript configuration
```

### Dependencies
- `@mentra/sdk` - MentraOS SDK for glasses integration
- `openai` - OpenAI API for AI processing
- `ajv` - JSON schema validation
- `dotenv` - Environment variable management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the MentraOS documentation
- Review the OpenAI API documentation
