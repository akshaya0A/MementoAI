// src/index.ts
// MentraOS speech → AI summary → spoken recap
// Node 18+ or Bun. Uses Claude/OpenAI Chat Completions with function calling and AJV for runtime validation.

import 'dotenv/config';
import { AppServer, AppSession } from '@mentra/sdk';
import Ajv from 'ajv';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const {
  MENTRAOS_API_KEY,
  PACKAGE_NAME,
  CLAUDE_API_KEY,
  CLAUDE_MODEL,
  OPENAI_API_KEY,
  OPENAI_MODEL,
  WAKE_WORD,
  PORT,
  USER_ID
} = process.env;

if (!MENTRAOS_API_KEY || !PACKAGE_NAME) {
  console.error(
    'Missing env. Required: MENTRAOS_API_KEY, PACKAGE_NAME'
  );
  process.exit(1);
}

if (!CLAUDE_API_KEY && !OPENAI_API_KEY) {
  console.error(
    'Missing API keys. Required: CLAUDE_API_KEY or OPENAI_API_KEY (or both for fallback)'
  );
  process.exit(1);
}

const anthropic = CLAUDE_API_KEY ? new Anthropic({ apiKey: CLAUDE_API_KEY }) : null;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Test Claude models availability (commented out for production)
// if (anthropic) {
//   anthropic.models.list().then(models => {
//     console.log('Available Claude models:', models.data.map(m => m.id));
//   }).catch(err => {
//     console.error('Error fetching Claude models:', err.message);
//   });
// }

// ---------- Event-focused types ----------
export interface Summary {
  info: string; // Main important information to speak back
  contact: string; // Contact information exchanged
  skills: string[]; // Skills, interests, or projects discussed
  location: string; // Where the person was met (booth, event, etc.)
  next: string; // Follow-up actions or next steps
  conf: number; // 0..1
}

// ---------- Additional Type Definitions ----------
interface TranscriptionData {
  text: string;
  isFinal: boolean;
  startTime?: number;
  endTime?: number;
  speakerId?: string;
}

interface VoiceActivityData {
  status: boolean | "true" | "false";
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: string;
  timestamp: string;
  locationName: string;
}

interface PhotoData {
  filename: string;
  size: number;
  mimeType: string;
  buffer: Buffer;
}

interface BackendPayload {
  uid: string;
  sessionId: string;
  timestamp: string;
  location: string;
  summary: string;
  transcript: string;
  skills: string;
  nextSteps: string;
  confidence: number;
  contactInfo: string;
  gpsLocation: LocationData | null;
  rawTranscript: unknown;
}

interface JSONData {
  timestamp: string;
  contactInfo: string;
  skills: string[];
  location: string;
  nextSteps: string;
  confidence: number;
  summary: string;
  gpsLocation: LocationData | null;
  faceEmbedding: number[] | null;
  transcript: {
    original: string;
    cleaned: string;
    raw: unknown;
  };
}

// ---------- Utility Functions ----------
function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100); // Limit length
}

function validateFilePath(filePath: string): boolean {
  // Basic validation to prevent directory traversal
  return !filePath.includes('..') && !filePath.includes('~') && filePath.length < 500;
}

// ---------- Event-focused JSON Schema ----------
const schema = {
  type: 'object',
  properties: {
    info: { 
      type: 'string', 
      description: 'Main important information to speak back (1-2 sentences about the person or opportunity). MUST include the person\'s name if mentioned.' 
    },
    contact: {
      type: 'string',
      description: 'Contact information exchanged (email, phone, LinkedIn, etc.)',
    },
    skills: {
      type: 'array',
      items: { type: 'string' },
      description: 'Skills, interests, projects, or technologies discussed',
    },
    location: {
            type: 'string',
      description: 'Where the person was met (booth number, company name, event location, etc.)',
    },
    next: {
      type: 'string',
      description: 'Follow-up actions or next steps discussed',
    },
    conf: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Model confidence',
    },
  },
  required: ['info', 'contact', 'skills', 'location', 'next', 'conf'],
  additionalProperties: false,
} as const;

const ajv = new Ajv({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

// ---------- AI tool definitions ----------
const claudeTool = {
  name: 'summary',
  description:
    'Extract key information from recruiter/student conversations at events. Focus on person names, contact details, skills, interests, and next steps.',
  input_schema: {
    type: 'object' as const,
    properties: {
      info: { 
        type: 'string' as const, 
        description: 'Main important information to speak back (1-2 sentences about the person or opportunity). MUST include the person\'s name if mentioned.' 
      },
      contact: {
        type: 'string' as const,
        description: 'Contact information exchanged (email, phone, LinkedIn, etc.)',
      },
      skills: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Skills, interests, projects, or technologies discussed',
      },
      location: {
        type: 'string' as const,
        description: 'Where the person was met (booth number, company name, event location, etc.)',
      },
      next: {
        type: 'string' as const,
        description: 'Follow-up actions or next steps discussed',
      },
      conf: {
        type: 'number' as const,
        minimum: 0,
        maximum: 1,
        description: 'Model confidence',
      },
    },
    required: ['info', 'contact', 'skills', 'location', 'next', 'conf'],
    additionalProperties: false,
  },
};

const openaiTool = {
  type: 'function' as const,
  function: {
    name: 'summary',
  description:
      'Extract key information from recruiter/student conversations at events. Focus on person names, contact details, skills, interests, and next steps.',
    parameters: schema as unknown as Record<string, unknown>,
  },
};

// System prompt for event conversations
const PROMPT = `You are an AI assistant helping with networking conversations at events like career fairs, hackathons, and conferences. 

Extract key information from recruiter-student or professional networking conversations:
- Person's full name (first name and last name if mentioned)
- Contact details (email, phone, LinkedIn, business cards)
- Skills, technologies, projects, or interests discussed
- Location where the person was met (booth number, company name, event area, etc.)
- Company/role information and opportunities
- Next steps or follow-up actions
- Important details about the person or opportunity

CRITICAL: Always include the person's name in the summary. If you can identify both first and last name, use the full name. If only first name is available, use that. Make the summary personal and include the name prominently.

Focus on actionable information that helps especially with follow-up and relationship building.`;

// Comprehensive wake word detection with multiple options
const WAKE_WORDS = [
  'hey memento',
  'hey memento ai',
  'start recording',
  'start taking notes',
  'begin recording',
  'capture this',
  'remember this',
  'take notes',
  'start notes',
  'begin notes',
  'record conversation',
  'log conversation',
  'save conversation',
  'document this',
  'track this',
  'memento start',
  'memento begin',
  'ai assistant',
  'smart glasses',
  'start listening'
];

// Check if any wake word is detected
function hasWakeWord(text: string): boolean {
  const lowerText = text.toLowerCase().trim();
  
  // Check custom wake word first if specified
  const customWakeWord = WAKE_WORD?.toLowerCase().trim();
  if (customWakeWord && lowerText.includes(customWakeWord)) {
    return true;
  }
  
  // Check against predefined wake words
  return WAKE_WORDS.some(wakeWord => lowerText.includes(wakeWord.toLowerCase()));
}

// Get the detected wake word for logging purposes
function getDetectedWakeWord(text: string): string | null {
  const lowerText = text.toLowerCase().trim();
  
  // Check custom wake word first
  const customWakeWord = WAKE_WORD?.toLowerCase().trim();
  if (customWakeWord && lowerText.includes(customWakeWord)) {
    return customWakeWord;
  }
  
  // Find matching predefined wake word
  return WAKE_WORDS.find(wakeWord => lowerText.includes(wakeWord.toLowerCase())) || null;
}

// Pre-process transcript to improve accuracy
function cleanTranscript(transcript: string): string {
  return transcript
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Remove common transcription artifacts
    .replace(/\b(um|uh|er|ah)\b/gi, '')
    .replace(/\b(like|you know|so|well)\b/gi, '')
    // Fix common contractions
    .replace(/\bgonna\b/gi, 'going to')
    .replace(/\bwanna\b/gi, 'want to')
    .replace(/\bkinda\b/gi, 'kind of')
    .replace(/\bgotta\b/gi, 'got to')
    // Remove repeated words (simple pattern)
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    // Clean up punctuation
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([,.!?])\s*([,.!?])/g, '$1')
    // Final cleanup
    .replace(/\s+/g, ' ')
    .trim();
}

// Guard to avoid spammy, tiny transcripts
function isBigEnough(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length >= 20) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length >= 5;
}

// One-shot repair prompt
function repairPrompt(invalidJSON: unknown): string {
  return `The following JSON is invalid or does not match the schema. Return corrected JSON only via the summary tool.

Invalid JSON:
${typeof invalidJSON === 'string' ? invalidJSON : JSON.stringify(invalidJSON)}`;
}

// Summarize using AI with fallback
async function summarize(
  transcript: string,
  session: AppSession
): Promise<Summary> {
  const started = Date.now();
  session.logger.info(
    `[AI] Summarize request; chars=${transcript.length}`
  );

  // Try Claude first if available
  if (anthropic) {
    session.logger.info(`[Claude] Attempting to use Claude API...`);
    try {
      const summary = await callClaude(transcript, session);
  session.logger.info(
    `[Claude] Summarize done in ${Date.now() - started}ms`
  );
  return summary;
    } catch (e) {
      session.logger.warn(`[Claude] Failed, falling back to OpenAI: ${(e as Error).message}`);
      session.logger.error(`[Claude] Full error: ${JSON.stringify(e)}`);
    }
  } else {
    session.logger.warn(`[Claude] Claude client not initialized, using OpenAI`);
  }

  // Fallback to OpenAI if available
  if (openai) {
    try {
      const summary = await callOpenAI(transcript, session);
      session.logger.info(
        `[OpenAI] Summarize done in ${Date.now() - started}ms`
      );
      return summary;
    } catch (e) {
      session.logger.error(`[OpenAI] Also failed: ${(e as Error).message}`);
      throw new Error('Both Claude and OpenAI failed');
    }
  }

  throw new Error('No AI provider available');
}

async function callClaude(
  transcript: string,
  session: AppSession
): Promise<Summary> {
  if (!anthropic) {
    throw new Error('Claude client not initialized');
  }

  // Basic retry on 429/5xx
  let attempt = 0;
  const maxAttempts = 3;

  while (true) {
    attempt++;

    try {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL || 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        temperature: 0.1,
        system: PROMPT,
        messages: [
          {
            role: 'user',
            content: `Extract key networking information from this conversation at an event. Focus on the person's name (first and last name if mentioned), contact details, skills/interests, opportunities, location where met, and next steps.\n\nIMPORTANT: Always include the person's name in the summary. Make it personal and prominent.\n\nConversation:\n${transcript}`,
          },
        ],
        tools: [claudeTool],
        tool_choice: { type: 'tool', name: 'summary' },
      });

      // Check for tool use
      const toolUse = response.content.find((item: any) => item.type === 'tool_use') as any;
      if (!toolUse || toolUse.name !== 'summary') {
        session.logger.error(`[Claude] No tool use in response or wrong tool`);
        throw new Error('No tool use in response or wrong tool');
      }

      // Parse and validate
      let parsed: unknown;
      try {
        // Check if toolUse.input is already an object or a string
        if (typeof toolUse.input === 'string') {
          parsed = JSON.parse(toolUse.input);
        } else {
          parsed = toolUse.input;
        }
      } catch (e) {
        session.logger.error(
          `[Claude] Invalid JSON from tool: ${typeof toolUse.input === 'string' ? toolUse.input : JSON.stringify(toolUse.input)}`
        );
        throw new Error('Invalid JSON from tool');
      }

      return validateInput(parsed as unknown, session);
    } catch (error: unknown) {
      const status = (error as any)?.status ?? 500;
      const errorMessage = error instanceof Error ? error.message : String(error);
      session.logger.error(`[Claude] Request failed (attempt ${attempt}/${maxAttempts}): ${errorMessage}`);
      session.logger.error(`[Claude] Error details: ${JSON.stringify(error)}`);
      
      if ((status === 429 || status >= 500) && attempt < maxAttempts) {
        const backoff = 300 * Math.pow(2, attempt - 1);
        session.logger.warn(
          `[Claude] ${status} received. Backing off ${backoff}ms then retrying (${attempt}/${maxAttempts})`
        );
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      session.logger.error(`[Claude] Request failed: ${errorMessage}`);
      throw error;
    }
  }
}

async function callOpenAI(
  transcript: string,
  session: AppSession
): Promise<Summary> {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  // Basic retry on 429/5xx
  let attempt = 0;
  const maxAttempts = 3;

  while (true) {
    attempt++;

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: PROMPT },
        {
          role: 'user',
          content: `Extract key networking information from this conversation at an event. Focus on the person's name (first and last name if mentioned), contact details, skills/interests, opportunities, location where met, and next steps.\n\nIMPORTANT: Always include the person's name in the summary. Make it personal and prominent.\n\nConversation:\n${transcript}`,
        },
      ];

      const res = await openai.chat.completions.create({
        model: OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        tools: [openaiTool],
        tool_choice: { type: 'function', function: { name: 'summary' } }, // force function call
        temperature: 0.1,
      });

      const choice = res.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;
      const toolCall = toolCalls?.find(
        (c: any) => c?.function?.name === 'summary'
      );

      if (!toolCall) {
        // One-shot repair if we got plain text or malformed output
        const rawText = (choice?.message?.content as string) || '';
        session.logger.warn(
          `[OpenAI] No tool_call payload found. Attempting one-shot repair.`
        );

        const repairMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
          [
            { role: 'system', content: 'Return corrected JSON only via the summary tool. No commentary.' },
            { role: 'user', content: repairPrompt(rawText) },
          ];

        const repaired = await openai.chat.completions.create({
          model: OPENAI_MODEL || 'gpt-4o-mini',
          messages: repairMessages,
          tools: [openaiTool],
          tool_choice: { type: 'function', function: { name: 'summary' } },
          temperature: 0,
        });

        const repairedChoice = repaired.choices?.[0];
        const repairedTool = repairedChoice?.message?.tool_calls?.find(
          (c: any) => c?.function?.name === 'summary'
        );
        if (!repairedTool) {
          throw new Error('Repair did not return a summary tool call');
        }
        const args = parseJSON((repairedTool as any).function.arguments);
        return validateInput(args, session);
      }

      const args = parseJSON((toolCall as any).function.arguments);
      try {
        return validateInput(args, session);
      } catch (error: unknown) {
        // Validation failed — try a repair pass using the invalid JSON
        const errorMessage = error instanceof Error ? error.message : String(error);
        session.logger.warn(
          `[Validate] Invalid JSON from tool. Attempting repair: ${errorMessage.slice(0, 200)}`
        );

        const repairMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
          [
            { role: 'system', content: 'Return corrected JSON only via the summary tool. No commentary.' },
            { role: 'user', content: repairPrompt((toolCall as any).function.arguments) },
          ];

        const repaired = await openai.chat.completions.create({
          model: OPENAI_MODEL || 'gpt-4o-mini',
          messages: repairMessages,
          tools: [openaiTool],
          tool_choice: { type: 'function', function: { name: 'summary' } },
          temperature: 0,
        });

        const repairedChoice = repaired.choices?.[0];
        const repairedTool = repairedChoice?.message?.tool_calls?.find(
          (c: any) => c?.function?.name === 'summary'
        );
        if (!repairedTool) {
          throw new Error('Repair did not return a summary tool call');
        }
        const repairArgs = parseJSON((repairedTool as any).function.arguments);
        return validateInput(repairArgs, session);
      }
    } catch (error: unknown) {
      const status = (error as any)?.status ?? 500;
      const errorMessage = error instanceof Error ? error.message : String(error);
      if ((status === 429 || status >= 500) && attempt < maxAttempts) {
        const backoff = 300 * Math.pow(2, attempt - 1);
        session.logger.warn(
          `[OpenAI] ${status} received. Backing off ${backoff}ms then retrying (${attempt}/${maxAttempts})`
        );
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      session.logger.error(`[OpenAI] Request failed: ${errorMessage}`);
      throw error;
    }
  }
}

function parseJSON(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s; // let repair handle raw string
  }
}

function validateInput(input: unknown, session: AppSession): Summary {
  // Type guard to check if input has expected structure
  const isSummaryLike = (obj: unknown): obj is Partial<Summary> => {
    return typeof obj === 'object' && obj !== null;
  };

  if (!isSummaryLike(input)) {
    throw new Error('Invalid input: expected object');
  }

  // Basic coercions: ensure arrays and defaults
  const cleaned: Summary = {
    info: input.info ?? '',
    contact: input.contact ?? '',
    skills: Array.isArray(input.skills) ? input.skills : [],
    location: input.location ?? '',
    next: input.next ?? '',
    conf: typeof input.conf === 'number' ? input.conf : 0.5,
  };

  const valid = validate(cleaned);
  if (!valid) {
    const err = ajv.errorsText(validate.errors, {
      separator: '; ',
    });
    session.logger.error(`[Validate] Invalid summary JSON: ${err}`);
    throw new Error(`Invalid summary JSON: ${err}`);
  }
  return cleaned;
}

// ---------- Mentra app wiring ----------
type Unsubscribe = () => void;

function setupPipeline(session: AppSession, sessionLocation: LocationData | null) {
  // --- STATE ---
  let armed = false;           // after wake phrase
  let collecting = false;      // currently recording
  let processing = false;      // currently processing (ignore new events)
  let segments: string[] = []; // finalized chunks
  let partial: string = "";    // latest interim text
  let idleTimeout: NodeJS.Timeout | null = null;
  let currentFaceEmbedding: number[] | null = null; // Store face embedding from wake word

  // Long safety timeout; normal stop is via "done"
  const SILENCE_MS = 120_000; // 2 minutes

  const resetIdleTimer = () => {
    if (idleTimeout) {
      clearTimeout(idleTimeout);
      idleTimeout = null;
    }
    idleTimeout = setTimeout(() => {
      if (collecting) {
        finishNote("silence-timeout");
      }
    }, SILENCE_MS);
  };

  const liveNoteText = () => (segments.join(" ") + (partial ? " " + partial : "")).trim();

  const updateLiveHUD = () => {
    const live = liveNoteText();
    const wordCount = live.split(/\s+/).filter(Boolean).length;
    const charCount = live.length;
    
    const stopSuggestions = "Say 'done', 'thanks', 'that's it', or 'goodbye' to finish.";
    
    session.layouts.showTextWall(
      `🎤 Recording... ${stopSuggestions}\n\n${live ? live : "..."}\n\n📊 ${wordCount} words, ${charCount} chars`
    );
  };

  const startCollection = async () => {
    collecting = true;
    segments = [];
    partial = "";
    await session.audio.speak("Recording started. Say done, thanks, or goodbye when finished.");
    updateLiveHUD();
    resetIdleTimer();
  };

  const finishNote = async (reason: string) => {
    collecting = false;
    armed = false;
    processing = true; // Set processing flag to ignore new events
    if (idleTimeout) { clearTimeout(idleTimeout); idleTimeout = null; }

    // Commit any remaining partial
    const textNowRaw = liveNoteText();
    partial = "";

    if (!textNowRaw) {
      session.logger.warn(`No content captured (${reason}).`);
      await session.audio.speak("I did not catch anything.");
      session.layouts.showTextWall("No note captured.");
      return;
    }

    // Clean the transcript before processing
    const cleanedTranscript = cleanTranscript(textNowRaw);
    const wordCount = cleanedTranscript.split(/\s+/).filter(Boolean).length;
    
    // Capture raw transcript data for backend processing
    const rawTranscriptData = {
      fullText: textNowRaw,
      segments: segments.map((s, index) => ({
        text: s,
        isFinal: true,
        segmentIndex: index,
        timestamp: new Date().toISOString()
      })),
      wordCount: textNowRaw.split(/\s+/).filter(Boolean).length,
      charCount: textNowRaw.length,
      processingTime: Date.now()
    };
    
    session.logger.info(`Processing conversation: ${textNowRaw.length} chars → ${cleanedTranscript.length} chars (cleaned), ${wordCount} words`);
    session.layouts.showTextWall(`Processing conversation...\n\n📊 ${wordCount} words, ${cleanedTranscript.length} chars (cleaned)`);

    try {
      const summary = await summarize(cleanedTranscript, session);
      
      // Save structured data to JSON file
      try {
        // Create output directory if it doesn't exist
        const outputDir = join(process.cwd(), 'output');
        mkdirSync(outputDir, { recursive: true });
        
        // Generate filename: contact-john-doe-2024-01-15.json
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const contactName = summary.contact ? 
          summary.contact.split(/[@,\s]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 
          'unknown';
        const filename = sanitizeFilename(`contact-${contactName}-${today}.json`);
        const filepath = join(outputDir, filename);
        
        // Validate file path for security
        if (!validateFilePath(filepath)) {
          throw new Error('Invalid file path detected');
        }
        
        // Use session-specific location
        const locationData = sessionLocation;
        
        // Create JSON data structure
        const jsonData = {
          timestamp: new Date().toISOString(),
          contactInfo: summary.contact,
          skills: summary.skills,
          location: summary.location,
          nextSteps: summary.next,
          confidence: summary.conf,
          summary: summary.info,
          gpsLocation: locationData || null,
          faceEmbedding: currentFaceEmbedding,
          transcript: {
            original: textNowRaw,
            cleaned: cleanedTranscript,
            raw: rawTranscriptData
          }
        };
        
        // Write JSON file locally
        writeFileSync(filepath, JSON.stringify(jsonData, null, 2));
        console.log(`📄 Saved networking data to: ${filename}`);
        
        // Send to backend API using /ingestEncounter endpoint
        const backendSuccess = await sendToBackend(jsonData, session);
        
        // Show success message in UI
        const locationStatus = locationData ? '📍 Location captured' : '❌ Location unavailable';
        const backendStatus = backendSuccess ? '☁️ Backend synced' : '❌ Backend failed';
        await session.layouts.showTextWall(`📄 JSON saved: ${filename}\n${locationStatus}\n${backendStatus}\n\nProcessing audio...`);
        
      } catch (jsonError) {
        console.error(`JSON save failed: ${(jsonError as Error).message}`);
        await session.layouts.showTextWall(`❌ JSON save failed\n\nContinuing with audio...`);
      }
      
      // Create structured output for networking
      let output = summary.info;
      
      if (summary.contact) {
        output += ` Contact: ${summary.contact}`;
      }
      
      if (summary.location) {
        output += ` Met at: ${summary.location}`;
      }
      
      if (summary.skills.length > 0) {
        output += ` Skills discussed: ${summary.skills.join(', ')}`;
      }
      
      if (summary.next) {
        output += ` Next steps: ${summary.next}`;
      }

      await session.audio.speak("Okay. Here is the summary.");
      await session.audio.speak(output);
      session.layouts.showTextWall(`Summary\n\n${output}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      session.logger.error(`[Pipeline] Error: ${errorMessage}`);
      await session.audio.speak("Sorry, something went wrong summarizing.");
      session.layouts.showTextWall("Error summarizing");
    } finally {
      // Reset processing flag to allow new conversations
      processing = false;
    }
  };

  // ============== Transcription handling ===================================

  const onTranscription = async (data: TranscriptionData) => {
    // Ignore all transcription if we're processing
    if (processing) {
      return;
    }

    const { text, isFinal } = data;
    const lower = text.toLowerCase().trim();

    // Log transcription details for debugging
    session.logger.info(`Transcription: "${text}" (final: ${isFinal})`, {
      startTime: data.startTime,
      endTime: data.endTime,
      speakerId: data.speakerId
    } as any);

    // Wake word: arm and start immediately so we do not miss first words
    if (!armed) {
      if (hasWakeWord(text)) {
        armed = true;
        const detectedWakeWord = getDetectedWakeWord(text);
        const recognitionStatus = FACE_RECOGNITION_ENABLED ? "face recognition and " : "";
        session.logger.info(`Wake phrase detected: "${detectedWakeWord}". Starting ${recognitionStatus}recorder.`);
        
        if (FACE_RECOGNITION_ENABLED) {
          // Capture photo and check for recognition
          const embedding = await capturePhotoOnWakeWord(session);
          
          if (embedding) {
            // Store embedding for later use
            currentFaceEmbedding = embedding;
            
            // Check if person is already recognized
            const recognition = await checkPersonRecognition(embedding, session);
            
            if (recognition) {
              // Person already known - block transcription and show previous summary
              await handleRecognizedPerson(recognition, session);
              armed = false; // Reset armed state
              return;
            }
          }
        } else {
          // Face recognition disabled - just capture photo for storage
          await capturePhotoOnWakeWord(session);
          currentFaceEmbedding = null;
        }
        
        // Proceed with normal transcription
        startCollection();
      }
      return;
    }

    if (!collecting) {
      // Safety: if armed but not collecting, start
      startCollection();
    }

    // Comprehensive stop phrases for natural conversation ending
    const STOP_PHRASES = [
      "done", "that's it", "stop recording", "stop", "finished", "complete",
      "that's all", "that's everything", "end recording", "stop taking notes",
      "end notes", "finish notes", "conversation over", "we're done",
      "thank you", "thanks", "goodbye", "bye", "see you later",
      "catch you later", "talk to you later", "nice meeting you",
      "great talking with you", "that concludes", "that wraps up",
      "that covers it", "nothing more", "all set", "we're good",
      "that's everything I wanted to say", "I think we covered everything",
      "memento stop", "memento end", "ai stop", "assistant stop"
    ];
    
    const hasStop = STOP_PHRASES.some((p) => lower.includes(p));
    const isNaturalEnding = lower.endsWith("done") || lower.endsWith("stop") || 
                           lower.endsWith("thanks") || lower.endsWith("bye") ||
                           lower.endsWith("goodbye") || lower.endsWith("finished");
    
    if (hasStop && (isFinal || isNaturalEnding)) {
      session.logger.info("🛑 Stop phrase detected - immediately stopping all recording");
      
      // Immediately stop all recording and processing
      collecting = false;
      armed = false;
      processing = true; // Set processing flag immediately to block new events
      if (idleTimeout) { clearTimeout(idleTimeout); idleTimeout = null; }
      
      // Clear any pending transcription updates
      partial = "";
      
      // Immediately update UI to show processing
      session.layouts.showTextWall("🛑 Processing conversation...");
      
      void finishNote("user-stopped");
      return;
    }

    // Build up the note
    if (isFinal) {
      if (partial && lower.endsWith(partial.toLowerCase())) partial = "";
      if (lower) segments.push(text);
    } else {
      partial = text; // interim preview
    }

    resetIdleTimer();
    updateLiveHUD();
  };

  // ============== Voice Activity Detection ===================================

  const onVoiceActivity = (data: VoiceActivityData) => {
    // Ignore all VAD if we're processing or not collecting
    if (processing || !collecting) {
      session.logger.debug(`VAD ignored - processing: ${processing}, collecting: ${collecting}`);
      return;
    }

    const isSpeaking = data.status === true || data.status === "true";
    
    session.logger.info(`Voice Activity: ${isSpeaking ? 'Speaking' : 'Silent'}`, {
      status: data.status,
      processing,
      collecting
    } as any);

    // Update visual indicator based on voice activity
    const live = liveNoteText();
    const status = isSpeaking ? "🎤 Speaking..." : "⏸️ Listening...";
    const stopSuggestions = "Say 'done', 'thanks', 'that's it', or 'goodbye' to finish.";
    session.layouts.showTextWall(
      `${status}\n\n${live ? live : "..."}\n\n${stopSuggestions}`
    );
  };

  // Subscribe to events
  const unsubscribeTranscription = session.events.onTranscription(onTranscription);
  const unsubscribeVAD = session.events.onVoiceActivity(onVoiceActivity);

  // Combined unsubscribe function
  const unsubscribe = () => {
    unsubscribeTranscription();
    unsubscribeVAD();
  };

  return {
    unsubscribe,
    stop: async () => {
      try {
        await session.audio.stopAudio();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        session.logger.warn(`[Audio] Stop audio failed: ${errorMessage}`);
      }
    },
  };
}

// Face recognition toggle - set to false to disable temporarily
const FACE_RECOGNITION_ENABLED = false;

// Global session management to prevent duplicate greetings
let globalSessionCounter = 0;
let hasGreetedInLastMinute = false;
let lastGreetingTime = 0;
let isStartingSession = false;
const GREETING_COOLDOWN_MS = 30000; // 30 seconds between greetings

// More robust greeting cooldown check
function shouldPlayGreeting(): boolean {
  const now = Date.now();
  const timeSinceLastGreeting = now - lastGreetingTime;
  
  if (timeSinceLastGreeting >= GREETING_COOLDOWN_MS) {
    lastGreetingTime = now;
    hasGreetedInLastMinute = true;
    return true;
  }
  
  return false;
}

// Function to capture photo when wake word is detected
async function capturePhotoOnWakeWord(session: AppSession): Promise<number[] | null> {
  try {
    session.logger.info('📸 Wake word detected - capturing photo...');
    const photo = await session.camera.requestPhoto();

    session.logger.info(`Photo captured on wake word: ${photo.filename}`);

    // Save to file locally
    const filename = sanitizeFilename(`wake_word_photo_${Date.now()}.jpg`);
    const outputDir = join(process.cwd(), 'output');
    mkdirSync(outputDir, { recursive: true });
    const filepath = join(outputDir, filename);
    
    // Validate file path for security
    if (!validateFilePath(filepath)) {
      throw new Error('Invalid file path detected');
    }
    
    writeFileSync(filepath, photo.buffer);
    session.logger.info(`Wake word photo saved: ${filename}`);

    // Send to external API for storage
    await uploadPhotoToAPI(photo.buffer, photo.mimeType, session);
    
    if (FACE_RECOGNITION_ENABLED) {
      // Generate face embedding for recognition
      const embedding = await generateFaceEmbedding(photo.buffer, photo.mimeType, session);
      return embedding;
    } else {
      session.logger.info("Face recognition disabled - skipping embedding generation");
      return null;
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    session.logger.error(`Wake word photo capture failed: ${errorMessage}`);
    return null;
  }
}

// Function to generate face embeddings from photo
async function generateFaceEmbedding(buffer: Buffer, mimeType: string, session: AppSession): Promise<number[] | null> {
  try {
    session.logger.info("Generating face embedding from photo...");
    const formData = new FormData();
    const filename = `photo_${Date.now()}.jpg`;
    formData.append('photo', new Blob([buffer], { type: mimeType }), filename);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('http://127.0.0.1:5000/embed', { 
      method: 'POST', 
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const result = await response.json();
      if (result.embedding && Array.isArray(result.embedding) && result.embedding.length === 128) {
        session.logger.info("Face embedding generated successfully");
        return result.embedding;
      } else {
        session.logger.warn("Invalid embedding format received");
        return null;
      }
    } else {
      session.logger.error(`Face embedding generation failed: ${response.status}`);
      return null;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('fetch')) {
      session.logger.warn("Face recognition service not available at localhost:5000 - continuing without face recognition");
      // Don't treat this as an error, just log it
    } else {
      session.logger.error(`Face embedding generation error: ${errorMessage}`);
    }
    return null;
  }
}

// Function to check if person is already recognized
async function checkPersonRecognition(embedding: number[], session: AppSession): Promise<any | null> {
  try {
    session.logger.info("Checking person recognition...");
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://mementoai-backend-528890859039.us-central1.run.app/identifyEmbedding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: USER_ID || 'mentra_user',
        vector: embedding,
        k: 5,
        threshold: 0.55
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status === 'recognized' && result.person) {
      session.logger.info(`Person recognized: ${result.person.displayName} (confidence: ${result.confidence})`);
      return result;
    } else {
      session.logger.info("Person not recognized - new encounter");
      return null;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    session.logger.warn(`Person recognition check failed: ${errorMessage} - continuing with new encounter`);
    return null;
  }
}

// Function to handle when a person is recognized (show previous summary)
async function handleRecognizedPerson(recognition: any, session: AppSession): Promise<void> {
  try {
    const person = recognition.person;
    const confidence = recognition.confidence;
    
    session.logger.info(`Handling recognized person: ${person.displayName}`);
    
    // Show recognition message
    await session.audio.speak(`I recognize ${person.displayName}. Here's what I remember from your previous meeting.`);
    
    // Create summary from previous encounter data
    let summary = person.summary || "No previous summary available.";
    
    if (person.company) {
      summary += ` They work at ${person.company}.`;
    }
    
    if (person.role) {
      summary += ` Their role is ${person.role}.`;
    }
    
    // Speak the previous summary
    await session.audio.speak(summary);
    
    // Show on screen
    const displayText = `👤 RECOGNIZED: ${person.displayName}\n\n📋 Previous Summary:\n${summary}\n\n🎯 Confidence: ${Math.round(confidence * 100)}%`;
    session.layouts.showTextWall(displayText);
    
    // Optional: Ask if they want to update the summary
    await session.audio.speak("Would you like to add anything new to your notes about this person? Say 'update notes' if you'd like to add more information.");
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    session.logger.error(`Error handling recognized person: ${errorMessage}`);
    await session.audio.speak("Sorry, I had trouble retrieving the previous information.");
  }
}

// Function to upload photo to API (shared between wake word and button press)
async function uploadPhotoToAPI(buffer: Buffer, mimeType: string, session: AppSession): Promise<void> {
  try {
    if (FACE_RECOGNITION_ENABLED) {
      // console.log("Uploading photo to API...");
      const formData = new FormData();
      const filename = `photo_${Date.now()}.jpg`;
      formData.append('photo', new Blob([buffer], { type: mimeType }), filename);
      
      const response = await fetch('http://127.0.0.1:5000/upload', { 
        method: 'POST', 
        body: formData 
      });
      
      if (response.ok) {
        // console.log("Photo uploaded successfully");
        session.logger.info("Photo uploaded to API successfully");
      } else {
        // console.error(`Photo upload failed: ${response.status}`);
        session.logger.error(`Photo upload failed: ${response.status}`);
      }
    } else {
      session.logger.info("Photo upload skipped - face recognition disabled");
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (FACE_RECOGNITION_ENABLED) {
      console.error("Failed to upload photo:", error);
      session.logger.error(`Photo upload error: ${errorMessage}`);
    } else {
      session.logger.info("Photo upload skipped - face recognition disabled");
    }
  }
}

// Function to get location name from coordinates using AI
async function getLocationName(latitude: number, longitude: number, session: AppSession): Promise<string> {
  try {
    // console.log(`🗺️ Getting location name for coordinates: ${latitude}, ${longitude}`);
    
    const prompt = `Given the coordinates ${latitude}, ${longitude}, provide a concise, human-readable location name. This should be specific enough to identify where someone is (e.g., "Tech Conference Center, San Francisco" or "MIT Campus, Cambridge, MA" or "Downtown Seattle Convention Center"). Return only the location name, no additional text.`;
    
    // Try Claude first if available
    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL || 'claude-3-5-haiku-20241022',
          max_tokens: 100,
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }]
        });
        
        const locationName = response.content[0]?.type === 'text' ? response.content[0].text.trim() : 'Unknown Location';
        // console.log(`📍 AI location name: ${locationName}`);
        return locationName;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`[Claude] Location name failed, trying OpenAI: ${errorMessage}`);
      }
    }
    
    // Fallback to OpenAI
    if (openai) {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.1
      });
      
      const locationName = response.choices[0]?.message?.content?.trim() || 'Unknown Location';
      // console.log(`📍 AI location name: ${locationName}`);
      return locationName;
    }
    
    return 'Unknown Location';
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to get location name:', errorMessage);
    return 'Unknown Location';
  }
}


// COMMENTED OUT: Continuous location stream approach (following MentraOS docs exactly)
/*
async function getContinuousLocation(session: AppSession): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('🔍 Starting continuous location stream...');
    
    let locationReceived = false;
    const timeout = setTimeout(() => {
      if (!locationReceived) {
        console.error('⏰ Location stream timeout');
        reject(new Error('Location stream timeout'));
      }
    }, 10000); // 10 second timeout
    
    const unsubscribe = session.location.subscribeToStream({
      accuracy: 'realtime',
      onLocationUpdate: async (location) => {
        if (!locationReceived) {
          locationReceived = true;
          clearTimeout(timeout);
          unsubscribe();
          
          console.log('📍 Continuous location update:', JSON.stringify(location));
          
          if (location && location.lat && location.lng) {
            // Get AI-powered location name
            const locationName = await getLocationName(location.lat, location.lng, session);
            
            const locationData = {
              latitude: location.lat,
              longitude: location.lng,
              accuracy: location.accuracy || 'realtime',
              timestamp: new Date().toISOString(),
              locationName: locationName
            };
            
            console.log(`📍 Continuous location captured: ${location.lat}, ${location.lng} - ${locationName}`);
            resolve(locationData);
          } else {
            console.warn('⚠️ Continuous location returned incomplete data:', location);
            resolve(null);
          }
        }
      }
    });
  });
}
*/

// Function to get placeholder location (Boston, MIT)
async function getPlaceholderLocation(): Promise<LocationData> {
  // console.log('📍 Using placeholder location: Boston, MIT');
  
  const locationData = {
    latitude: 42.3601,
    longitude: -71.0942,
    accuracy: 'placeholder',
    timestamp: new Date().toISOString(),
    locationName: 'MIT Campus, Cambridge, MA'
  };
  
  // console.log(`📍 Placeholder location: ${locationData.latitude}, ${locationData.longitude} - ${locationData.locationName}`);
  return locationData;
}

// Function to send JSON data to backend API
async function sendToBackend(jsonData: JSONData, session: AppSession): Promise<boolean> {
  try {
    // console.log('🚀 Sending networking data to backend API...');
    
    // Transform our JSON data to match the /ingestEncounter endpoint format
    const backendPayload = {
      uid: USER_ID || 'mentra_user', // Use env var or default
      sessionId: `networking_${Date.now()}`, // Unique session ID
      timestamp: jsonData.timestamp,
      location: jsonData.location,
      summary: jsonData.summary,
      transcript: jsonData.transcript?.original || '',
      rawTranscript: jsonData.transcript?.raw || null,
      confidence: Math.round(jsonData.confidence * 100), // Convert 0-1 to 0-100
      nextSteps: jsonData.nextSteps,
      skills: Array.isArray(jsonData.skills) ? jsonData.skills.join(', ') : jsonData.skills,
      // GPS coordinates in the format expected by new API
      gps: {
        lat: jsonData.gpsLocation?.latitude || 42.3601, // Default to MIT if no location
        lng: jsonData.gpsLocation?.longitude || -71.0942
      },
      // Contact information - extract email if available
      contactEmail: extractEmailFromContact(jsonData.contactInfo),
      name: extractNameFromContact(jsonData.contactInfo),
      // Face embedding for recognition (if available)
      vector: jsonData.faceEmbedding || null
    };
    
    const response = await fetch('https://mementoai-backend-528890859039.us-central1.run.app/ingestEncounter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // console.log('✅ Data sent to backend successfully:', result);
    
    // Log recognition status if available
    if (result.person) {
      session.logger.info(`Person recognized: ${result.person.displayName} (ID: ${result.person.id})`);
    }
    
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to send data to backend:', errorMessage);
    return false;
  }
}

// Helper function to extract email from contact info
function extractEmailFromContact(contactInfo: string): string | null {
  if (!contactInfo) return null;
  
  // Simple email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = contactInfo.match(emailRegex);
  return match ? match[0].toLowerCase() : null;
}

// Helper function to extract name from contact info
function extractNameFromContact(contactInfo: string): string | null {
  if (!contactInfo) return null;
  
  // Remove email and common patterns, extract potential name
  let cleaned = contactInfo
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '') // Remove emails
    .replace(/[0-9()-]/g, ' ') // Remove phone numbers
    .replace(/linkedin|twitter|github|phone|email/gi, '') // Remove social media/platform names
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Look for patterns that might be names (First Last, First Middle Last, etc.)
  const namePatterns = [
    /^[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/, // First Last or First Middle Last
    /^[A-Z][a-z]+ [A-Z]\.\s*[A-Z][a-z]+$/, // First M. Last
    /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/ // First Middle Last (3 words)
  ];
  
  // Check if the cleaned string matches name patterns
  for (const pattern of namePatterns) {
    if (pattern.test(cleaned)) {
      return cleaned;
    }
  }
  
  // If we have something meaningful left (but not a clear name pattern), return it
  if (cleaned.length > 2 && cleaned.length < 50 && /^[A-Za-z\s\.]+$/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
}

async function onStart(session: AppSession) {
  // Protection against rapid session creation
  if (isStartingSession) {
    console.log('⏸️ Session already starting, skipping duplicate...');
    return;
  }
  
  isStartingSession = true;
  
  try {
    // ABSOLUTELY FIRST: Get location before ANYTHING else
    console.log('🚀 Starting new session...');
    let sessionLocation = null;
    
    try {
      // For now, use placeholder location (Boston, MIT)
      sessionLocation = await getPlaceholderLocation();
      
      // COMMENTED OUT: Real location capture
      // sessionLocation = await getContinuousLocation(session);
      
      if (sessionLocation) {
        // console.log(`✅ Location captured FIRST: ${sessionLocation.latitude}, ${sessionLocation.longitude} - ${sessionLocation.locationName}`);
      } else {
        // console.log('⚠️ Location capture failed - continuing without location');
      }
    } catch (locationError: unknown) {
      const errorMessage = locationError instanceof Error ? locationError.message : String(locationError);
      console.error('❌ Location capture error:', errorMessage);
    }

    // NOW: Do all other session setup after location is captured
    session.logger.info(`[Session] Started: ${Date.now()}`);
    
    // Increment session counter
    globalSessionCounter++;
    console.log(`📊 Session #${globalSessionCounter} started`);
    
    // Combined greeting (with robust cooldown to prevent duplicates across sessions)
    console.log(`⏰ Greeting check: shouldPlay=${shouldPlayGreeting()}, hasGreetedInLastMinute=${hasGreetedInLastMinute}`);
    
    if (shouldPlayGreeting()) {
      try {
        console.log('🗣️ Playing greeting message...');
        
        // Combine location and wake word info into one message
        const locationInfo = sessionLocation 
          ? `Location captured at ${sessionLocation.locationName}. `
          : 'Location unavailable. ';
        
        const wakeWordMessage = WAKE_WORD 
          ? `Say "${WAKE_WORD}" or can you hear me to start capturing conversation details.`
          : `Say "hey memento", "start recording", "take notes", or "capture this" to begin.`;
        
        const combinedMessage = `${locationInfo}Event networking assistant ready. ${wakeWordMessage}`;
        await session.audio.speak(combinedMessage);
        
        console.log('✅ Greeting message completed');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Greeting failed: ${errorMessage}`);
        session.logger.warn(`[Audio] Combined greeting failed: ${errorMessage}`);
      }
    } else {
      console.log('⏸️ Skipping greeting - already greeted recently');
    }

    const pipeline = setupPipeline(session, sessionLocation);

    // Cleanup on session end
    session.on('close', async () => {
      try {
        pipeline.unsubscribe();
        await pipeline.stop(); // Use the improved stop function
        
        // Session cleanup completed
        
        session.logger.info('[Session] Cleaned up subscriptions, audio, and greeting tracking.');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        session.logger.warn(
          `[Session] Cleanup error: ${errorMessage}`
        );
      }
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Session start error: ${errorMessage}`);
    session.logger.error(`[Session] Start error: ${errorMessage}`);
  } finally {
    // Reset the session starting flag
    isStartingSession = false;
  }
}

// ---------- Custom App Server Implementation ----------
class Server extends AppServer {
  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    console.log(`User ${userId} connected`);
    
    // Start the networking assistant functionality
    await onStart(session);
    
    // Subscribe to button press events for photo capture
    const unsubscribePhoto = session.events.onButtonPress(async (data) => {
      // console.log('Button pressed - capturing photo');
      await this.processPhoto(session);
    });

    // Add cleanup handler for photo events
    this.addCleanupHandler(unsubscribePhoto);
  }

  // Photo processing and uploading to API (button press)
  private async processPhoto(session: AppSession): Promise<void> {
    try {
      // console.log('📸 Button pressed - requesting photo from smart glasses...');
      const photo = await session.camera.requestPhoto(); // default size is medium

      // console.log(`Photo captured on button press: ${photo.filename}`);
      // console.log(`Size: ${photo.size} bytes`);
      // console.log(`Type: ${photo.mimeType}`);

      // Convert to base64 for storage or transmission
      const base64String = photo.buffer.toString('base64');
      session.logger.info(`Photo as base64 (first 50 chars): ${base64String.substring(0, 50)}...`);

      // Save to file locally
      const filename = sanitizeFilename(`button_photo_${Date.now()}.jpg`);
      const outputDir = join(process.cwd(), 'output');
      mkdirSync(outputDir, { recursive: true });
      const filepath = join(outputDir, filename);
      
      // Validate file path for security
      if (!validateFilePath(filepath)) {
        throw new Error('Invalid file path detected');
      }
      
      writeFileSync(filepath, photo.buffer);
      session.logger.info(`Button photo saved: ${filename}`);

      // Send to external API using shared function
      await uploadPhotoToAPI(photo.buffer, photo.mimeType, session);
      
      // Notify user
      await session.audio.speak("Photo captured and saved.");
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      session.logger.error(`Failed to process photo: ${errorMessage}`);
      try {
        await session.audio.speak("Sorry, photo capture failed.");
      } catch (audioError: unknown) {
        const audioErrorMessage = audioError instanceof Error ? audioError.message : String(audioError);
        session.logger.warn(`Audio feedback failed: ${audioErrorMessage}`);
      }
    }
  }
}

// ---------- Server bootstrap ----------
async function main() {
  console.log('🚀 Starting MementoAI server...');
  
  const server = new Server({
    apiKey: MENTRAOS_API_KEY as string,
    packageName: PACKAGE_NAME as string,
    port: Number(PORT),
  });

  // Handle graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  // Handle uncaught exceptions to prevent crashes
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  try {
    await server.start();
    console.log(`✅ MementoAI app server listening on port ${PORT || 3030}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
}

main().catch(error => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`❌ Fatal error in main: ${errorMessage}`);
  process.exit(1);
});

/*
Event Networking Assistant - Wake Word → Conversation → Structured Info

Perfect for career fairs, hackathons, conferences, and networking events!

Features:
- Listens for multiple natural wake words (configurable via WAKE_WORD env var)
- Default wake words: "hey memento", "start recording", "take notes", "capture this", etc.
- After wake word, captures networking conversation until natural stop phrases
- Natural stop phrases: "done", "thanks", "goodbye", "that's it", etc.
- Extracts contact details, skills, interests, and next steps
- Speaks back structured networking information

Captures:
- Contact information (email, phone, LinkedIn, etc.)
- Skills, technologies, and projects discussed
- Location where the person was met (booth, company, event area)
- Company/role opportunities
- Follow-up actions and next steps
- Important details about the person or opportunity

Environment Variables:
- MENTRAOS_API_KEY: Your MentraOS API key
- PACKAGE_NAME: Your app package name
- CLAUDE_API_KEY: Your Claude API key (primary)
- OPENAI_API_KEY: Your OpenAI API key (fallback)
- CLAUDE_MODEL: Claude model (default: claude-3-5-sonnet-20240620)
- OPENAI_MODEL: OpenAI model (default: gpt-4o-mini)
- WAKE_WORD: Custom wake word to trigger listening (optional, uses comprehensive defaults if not set)
- PORT: Server port (default: 3030)

Usage:
1. Start the app at your event
2. Say any wake word when starting a conversation ("hey memento", "start recording", "take notes", etc.)
3. Have your networking conversation naturally
4. End conversation naturally with phrases like "thanks", "goodbye", "that's it", or "done"
5. Hear structured summary with contact details and next steps
*/
