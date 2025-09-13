// src/index.ts
// MentraOS speech → ChatGPT summary → spoken recap
// Node 18+ or Bun. Uses OpenAI Chat Completions with function calling and AJV for runtime validation.

import 'dotenv/config';
import { AppServer, AppSession } from '@mentra/sdk';
import Ajv from 'ajv';
import OpenAI from 'openai';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const {
  MENTRAOS_API_KEY,
  PACKAGE_NAME,
  OPENAI_API_KEY,
  OPENAI_MODEL,
  WAKE_WORD,
  PORT,
  USER_ID
} = process.env;

if (!MENTRAOS_API_KEY || !PACKAGE_NAME || !OPENAI_API_KEY) {
  console.error(
    'Missing env. Required: MENTRAOS_API_KEY, PACKAGE_NAME, OPENAI_API_KEY'
  );
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ---------- Event-focused types ----------
export interface Summary {
  info: string; // Main important information to speak back
  contact: string; // Contact information exchanged
  skills: string[]; // Skills, interests, or projects discussed
  location: string; // Where the person was met (booth, event, etc.)
  next: string; // Follow-up actions or next steps
  conf: number; // 0..1
}

// ---------- Event-focused JSON Schema ----------
const schema = {
  type: 'object',
  properties: {
    info: { 
      type: 'string', 
      description: 'Main important information to speak back (1-2 sentences about the person or opportunity)' 
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
const validate = ajv.compile(schema as any);

// ---------- OpenAI tool (function) definition ----------
const tool = {
  type: 'function' as const,
  function: {
    name: 'summary',
  description:
      'Extract key information from recruiter/student conversations at events. Focus on contact details, skills, interests, and next steps.',
    parameters: schema as unknown as Record<string, unknown>,
  },
};

// System prompt for event conversations
const PROMPT = `You are an AI assistant helping with networking conversations at events like career fairs, hackathons, and conferences. 

Extract key information from recruiter-student or professional networking conversations:
- Contact details (email, phone, LinkedIn, business cards)
- Skills, technologies, projects, or interests discussed
- Location where the person was met (booth number, company name, event area, etc.)
- Company/role information and opportunities
- Next steps or follow-up actions
- Important details about the person or opportunity

Focus on actionable information that helps especially with follow-up and relationship building.`;

// Check if wake word is detected
function hasWakeWord(text: string): boolean {
  return text.toLowerCase().includes((WAKE_WORD || 'hey memento').toLowerCase());
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

// Summarize using ChatGPT (OpenAI) with forced tool use
async function summarize(
  transcript: string,
  session: AppSession
): Promise<Summary> {
  const started = Date.now();
  session.logger.info(
    `[OpenAI] Summarize request; chars=${transcript.length}`
  );

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: PROMPT },
      {
        role: 'user',
      content:
        'Extract key networking information from this conversation at an event. Focus on contact details, skills/interests, opportunities, location where met, and next steps.\n\nConversation:\n' +
              transcript,
          },
  ];

  const summary = await callOpenAI(messages, session);
  session.logger.info(
    `[OpenAI] Summarize done in ${Date.now() - started}ms`
  );
  return summary;
}

async function callOpenAI(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  session: AppSession
): Promise<Summary> {
  // Basic retry on 429/5xx
  let attempt = 0;
  const maxAttempts = 3;

  while (true) {
    attempt++;
    let res: OpenAI.Chat.Completions.ChatCompletion;

    try {
      res = await openai.chat.completions.create({
        model: OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        tools: [tool],
        tool_choice: { type: 'function', function: { name: 'summary' } }, // force function call
        temperature: 0.1,
      });
    } catch (e: any) {
      const status = e?.status ?? 500;
      if ((status === 429 || status >= 500) && attempt < maxAttempts) {
        const backoff = 300 * Math.pow(2, attempt - 1);
        session.logger.warn(
          `[OpenAI] ${status} received. Backing off ${backoff}ms then retrying (${attempt}/${maxAttempts})`
        );
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      session.logger.error(`[OpenAI] Request failed: ${String(e?.message || e)}`);
      throw e;
    }

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
        tools: [tool],
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
    } catch (e: any) {
      // Validation failed — try a repair pass using the invalid JSON
      session.logger.warn(
        `[Validate] Invalid JSON from tool. Attempting repair: ${String(
          e?.message || e
        ).slice(0, 200)}`
      );

      const repairMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [
          { role: 'system', content: 'Return corrected JSON only via the summary tool. No commentary.' },
          { role: 'user', content: repairPrompt((toolCall as any).function.arguments) },
        ];

      const repaired = await openai.chat.completions.create({
        model: OPENAI_MODEL || 'gpt-4o-mini',
        messages: repairMessages,
        tools: [tool],
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
  // Basic coercions: ensure arrays and defaults
  const cleaned = {
    info: (input as any)?.info ?? '',
    contact: (input as any)?.contact ?? '',
    skills: Array.isArray((input as any)?.skills)
      ? (input as any).skills
      : [],
    location: (input as any)?.location ?? '',
    next: (input as any)?.next ?? '',
    conf:
      typeof (input as any)?.conf === 'number'
        ? (input as any).conf
        : 0.5,
  };

  const valid = validate(cleaned);
  if (!valid) {
    const err = ajv.errorsText(validate.errors as any, {
      separator: '; ',
    });
    session.logger.error(`[Validate] Invalid summary JSON: ${err}`);
    throw new Error(`Invalid summary JSON: ${err}`);
  }
  return cleaned as Summary;
}

// ---------- Mentra app wiring ----------
type Unsubscribe = () => void;

function setupPipeline(session: AppSession) {
  // --- STATE ---
  let armed = false;           // after wake phrase
  let collecting = false;      // currently recording
  let segments: string[] = []; // finalized chunks
  let partial: string = "";    // latest interim text
  let idleTimeout: NodeJS.Timeout | null = null;

  // Long safety timeout; normal stop is via "done"
  const SILENCE_MS = 120_000; // 2 minutes

  const resetIdleTimer = () => {
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      if (collecting) finishNote("silence-timeout");
    }, SILENCE_MS);
  };

  const liveNoteText = () => (segments.join(" ") + (partial ? " " + partial : "")).trim();

  const updateLiveHUD = () => {
    const live = liveNoteText();
    const wordCount = live.split(/\s+/).filter(Boolean).length;
    const charCount = live.length;
    
    session.layouts.showTextWall(
      `🎤 Recording... say "done" to finish.\n\n${live ? live : "..."}\n\n📊 ${wordCount} words, ${charCount} chars`
    );
  };

  const startCollection = async () => {
    collecting = true;
    segments = [];
    partial = "";
    await session.audio.speak("Recording. Say done when finished.");
    updateLiveHUD();
    resetIdleTimer();
  };

  const finishNote = async (reason: string) => {
    collecting = false;
    armed = false;
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
        const filename = `contact-${contactName}-${today}.json`;
        const filepath = join(outputDir, filename);
        
        // Get location using MentraOS best practices
        const locationData = await getLocation(session);
        
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
          transcript: {
            original: textNowRaw,
            cleaned: cleanedTranscript,
            raw: rawTranscriptData
          }
        };
        
        // Write JSON file locally
        writeFileSync(filepath, JSON.stringify(jsonData, null, 2));
        console.log(`📄 Saved networking data to: ${filename}`);
        
        // Send to backend API (ready for new endpoint)
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
      
    } catch (err) {
      session.logger.error(`[Pipeline] Error: ${(err as Error).message}`);
      await session.audio.speak("Sorry, something went wrong summarizing.");
      session.layouts.showTextWall("Error summarizing");
    }
  };

  // ============== Transcription handling ===================================

  const onTranscription = (data: {
    text: string; 
    isFinal: boolean;
    startTime?: number;
    endTime?: number;
    speakerId?: string;
  }) => {
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
      if (lower.includes((WAKE_WORD || 'start recording').toLowerCase())) {
        armed = true;
        session.logger.info("Wake phrase detected. Starting recorder.");
        startCollection();
      }
      return;
    }

    if (!collecting) {
      // Safety: if armed but not collecting, start
      startCollection();
    }

    // Stop if any stop phrase appears
    const STOP_PHRASES = ["done", "that's it", "stop recording", "stop"];
    const hasStop = STOP_PHRASES.some((p) => lower.includes(p));
    if (hasStop && (isFinal || lower.endsWith("done") || lower.endsWith("stop"))) {
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

  const onVoiceActivity = (data: { status: boolean | "true" | "false" }) => {
    const isSpeaking = data.status === true || data.status === "true";
    
    session.logger.info(`Voice Activity: ${isSpeaking ? 'Speaking' : 'Silent'}`, {
      status: data.status
    } as any);

    // Update visual indicator based on voice activity
    if (collecting) {
      const live = liveNoteText();
      const status = isSpeaking ? "🎤 Speaking..." : "⏸️ Listening...";
      session.layouts.showTextWall(
        `${status}\n\n${live ? live : "..."}\n\nSay "done" to finish.`
      );
    }
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
      } catch (e) {
        session.logger.warn(`[Audio] Stop audio failed: ${(e as Error).message}`);
      }
    },
  };
}

// Track if greeting has been spoken to prevent duplicates
let greetingSpoken = false;

// Function to get location using MentraOS best practices
async function getLocation(session: AppSession): Promise<any> {
  return new Promise((resolve) => {
    console.log('🔍 Starting location capture...');
    
    // Try getLatestLocation first (most efficient)
    session.location.getLatestLocation({ accuracy: 'kilometer' })
      .then((currentLocation) => {
        console.log('📍 Raw location data from getLatestLocation:', currentLocation);
        
        if (currentLocation && currentLocation.lat && currentLocation.lng) {
          const locationData = {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            accuracy: 'kilometer',
            timestamp: new Date().toISOString()
          };
          console.log(`📍 Location captured: ${currentLocation.lat}, ${currentLocation.lng}`);
          resolve(locationData);
        } else {
          console.warn('⚠️ getLatestLocation returned incomplete data:', currentLocation);
          resolve(null);
        }
      })
      .catch((err) => {
        console.error('❌ getLatestLocation failed:', (err as Error).message);
        
        // Fallback: Try continuous stream for a few seconds
        console.log('🔄 Trying continuous location stream as fallback...');
        let locationReceived = false;
        
        const unsubscribe = session.location.subscribeToStream(
          { accuracy: 'kilometer' },
          (data) => {
            if (!locationReceived && data && data.lat && data.lng) {
              locationReceived = true;
              console.log('📍 Location from stream:', data);
              
              const locationData = {
                latitude: data.lat,
                longitude: data.lng,
                accuracy: 'kilometer',
                timestamp: new Date().toISOString()
              };
              
              unsubscribe(); // Stop the stream
              resolve(locationData);
            }
          }
        );
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!locationReceived) {
            console.warn('⏰ Location stream timeout');
            unsubscribe();
            resolve(null);
          }
        }, 5000);
      });
  });
}

// Function to send JSON data to backend API
async function sendToBackend(jsonData: any, session: AppSession): Promise<boolean> {
  try {
    console.log('🚀 Sending networking data to backend API...');
    
    // Transform our JSON data to match the /ingestAudio endpoint format
    const backendPayload = {
      uid: USER_ID || 'mentra_user', // Use env var or default
      sessionId: `networking_${Date.now()}`, // Unique session ID
      timestamp: jsonData.timestamp,
      location: jsonData.location,
      summary: jsonData.summary,
      transcript: jsonData.transcript?.original || '',
      skills: Array.isArray(jsonData.skills) ? jsonData.skills.join(', ') : jsonData.skills,
      nextSteps: jsonData.nextSteps,
      confidence: Math.round(jsonData.confidence * 100), // Convert 0-1 to 0-100
      contactInfo: jsonData.contactInfo,
      // Include additional metadata
      gpsLocation: jsonData.gpsLocation,
      rawTranscript: jsonData.transcript?.raw || null
    };
    
    const response = await fetch('https://mementoai-backend-528890859039.us-central1.run.app/ingestAudio', {
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
    console.log('✅ Data sent to backend successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ Failed to send data to backend:', (error as Error).message);
    return false;
  }
}

async function onStart(session: AppSession) {
  session.logger.info(`[Session] Started: ${Date.now()}`);

  // Greet user with wake word info (only once)
  if (!greetingSpoken) {
    try {
      await session.audio.speak(`Event networking assistant ready. Say "${WAKE_WORD}" to start capturing conversation details.`);
      greetingSpoken = true;
  } catch (e) {
    session.logger.warn(`[Audio] Greeting speak failed: ${(e as Error).message}`);
    }
  }

  const pipeline = setupPipeline(session);

  // Cleanup on session end
  session.on('close', async () => {
    try {
      pipeline.unsubscribe();
      await pipeline.stop(); // Use the improved stop function
      session.logger.info('[Session] Cleaned up subscriptions and audio.');
    } catch (e) {
      session.logger.warn(
        `[Session] Cleanup error: ${(e as Error).message}`
      );
    }
  });
}

// ---------- Custom App Server Implementation ----------
class Server extends AppServer {
  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    await onStart(session);
  }
}

// ---------- Server bootstrap ----------
async function main() {
  const server = new Server({
    apiKey: MENTRAOS_API_KEY as string,
    packageName: PACKAGE_NAME as string,
    port: Number(PORT),
  });

  process.on('SIGINT', () => {
    console.log('Shutting down...');
    server.stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    server.stop();
    process.exit(0);
  });

  await server.start();
  console.log(`MementoAI app server listening on :${PORT}`);
}

main().catch(err => {
  console.error(`Fatal: ${(err as Error).message}`);
  process.exit(1);
});

/*
Event Networking Assistant - Wake Word → Conversation → Structured Info

Perfect for career fairs, hackathons, conferences, and networking events!

Features:
- Listens for wake word (configurable via WAKE_WORD env var, default: "hey mira")
- After wake word, captures networking conversation until silence
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
- OPENAI_API_KEY: Your OpenAI API key
- WAKE_WORD: Wake word to trigger listening (default: "hey mira")
- PORT: Server port (default: 3030)

Usage:
1. Start the app at your event
2. Say the wake word when starting a conversation
3. Have your networking conversation
4. Wait for silence (2 seconds)
5. Hear structured summary with contact details and next steps
*/
    