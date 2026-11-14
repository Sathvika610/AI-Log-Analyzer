import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Chat, GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-2.5-flash';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ChatSessionEntry {
  chat: Chat;
  lastUsed: number;
}

const chatSessions = new Map<string, ChatSessionEntry>();

// Periodically prune stale chat sessions (> 1 hour idle)
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, entry] of chatSessions.entries()) {
    if (entry.lastUsed < cutoff) {
      chatSessions.delete(id);
    }
  }
}, 10 * 60 * 1000).unref();

function formatNumberedLog(rawLog: string): { numbered: string; totalLines: number } {
  const lines = rawLog.replace(/\r\n/g, '\n').split('\n');
  const numbered = lines
    .map((line, idx) => `[L${idx + 1}] ${line}`)
    .join('\n');
  return { numbered, totalLines: lines.length };
}

function buildCopilotSystemInstruction(rawLog: string, analysis: Record<string, unknown>): string {
  const { numbered, totalLines } = formatNumberedLog(rawLog);
  return `You are LogLens AI Debug Copilot, an expert Staff Site Reliability Engineer and Backend Systems Debugger.
You are assisting a developer currently inspecting an incident in LogLens AI.

CRITICAL GROUNDING RULES:
- Base every answer strictly on the provided raw log (${totalLines} lines) and the Root Cause Analysis summary below.
- Whenever referencing a specific log line, cite its exact 1-based line number (e.g., "Line 25" or "L25") matching the [L<num>] prefixes below.
- Never invent or hallucinate log lines, stack frames, error codes, or file paths that do not exist in the log.
- When asked for regex filters, provide an accurate regex tested mentally against the exact log lines shown, plus a brief explanation.
- When asked for a Jira bug report, format it cleanly with Summary, Severity, Environment/Service, Root Cause, Affected Lines, Reproduction/Evidence from Logs, and Recommended Fix.
- Keep responses concise, technically precise, and formatted with clean Markdown and fenced code blocks.

ROOT CAUSE ANALYSIS SUMMARY:
${JSON.stringify(analysis, null, 2)}

NUMBERED RAW LOG (${totalLines} LINES):
${numbered}`;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('GEMINI_API_KEY')) {
    return {
      status: 500,
      message: 'Gemini API key is missing. Please configure GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'Gemini API authentication failed. Please check your GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Gemini API rate limit or quota reached. Please retry in a moment.',
    };
  }
  return {
    status: 500,
    message: msg || 'An unexpected error occurred while communicating with Gemini.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const { rawLog } = req.body as { rawLog?: string };
      if (!rawLog || typeof rawLog !== 'string' || !rawLog.trim()) {
        return res.status(400).json({ error: 'Please provide non-empty log text to analyze.' });
      }

      const ai = getAiClient();
      const { numbered, totalLines } = formatNumberedLog(rawLog);

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze the following ${totalLines}-line application log and produce a structured Root Cause Analysis.
Each line is prefixed with [L<number>] indicating its exact 1-based line number.
Requirements:
- patientZeroLine MUST be the exact integer line number (1 to ${totalLines}) where the root cause originated (NOT a downstream symptom like 502/503 or CrashLoopBackOff if an earlier error triggered it).
- cascadingErrorLines MUST be an array of exact integer line numbers (1 to ${totalLines}) representing downstream or secondary errors caused by Patient Zero.
- timeline MUST chronologically reconstruct the key events leading up to and following the failure, using timestamps from the log and including the exact lineNumber (1 to ${totalLines}) for each event.
- suggestedFix MUST provide an immediately actionable, production-safe code patch, config change, or CLI command with explanation, language identifier, and codeSnippet.

LOG INPUT:
${numbered}`,
        config: {
          systemInstruction:
            'You are an elite SRE and root-cause diagnostic engine. Always cite exact 1-based line numbers from the [L<num>] markers without hallucinating line numbers.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              incidentTitle: {
                type: Type.STRING,
                description: 'Short descriptive title of the failure.',
              },
              severity: {
                type: Type.STRING,
                enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                description: 'Overall incident severity level.',
              },
              summary: {
                type: Type.STRING,
                description: 'Concise, plain-English explanation of what went wrong and why.',
              },
              patientZeroLine: {
                type: Type.INTEGER,
                description: 'Exact 1-based line number where the root cause originated.',
              },
              cascadingErrorLines: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: 'Array of 1-based line numbers representing secondary/downstream errors.',
              },
              rootCauseCategory: {
                type: Type.STRING,
                description:
                  'Category such as Database, Network, Memory/Resource, Code Bug, or Configuration.',
              },
              suggestedFix: {
                type: Type.OBJECT,
                properties: {
                  explanation: {
                    type: Type.STRING,
                    description: 'Why this fix resolves the root cause.',
                  },
                  language: {
                    type: Type.STRING,
                    description: 'Code language identifier, e.g., javascript, typescript, sql, yaml, bash.',
                  },
                  codeSnippet: {
                    type: Type.STRING,
                    description: 'Concrete, copyable code fix, configuration diff, or CLI command.',
                  },
                },
                required: ['explanation', 'language', 'codeSnippet'],
              },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp: { type: Type.STRING },
                    event: { type: Type.STRING },
                    isError: { type: Type.BOOLEAN },
                    lineNumber: {
                      type: Type.INTEGER,
                      description: 'Exact 1-based line number corresponding to this timeline event.',
                    },
                  },
                  required: ['timestamp', 'event', 'isError', 'lineNumber'],
                },
                description: 'Chronological reconstruction of the failure sequence.',
              },
            },
            required: [
              'incidentTitle',
              'severity',
              'summary',
              'patientZeroLine',
              'cascadingErrorLines',
              'rootCauseCategory',
              'suggestedFix',
              'timeline',
            ],
          },
        },
      });

      const jsonText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(jsonText);

      // Clamp line numbers to valid 1..totalLines bounds
      const clampLine = (n: unknown): number => {
        const num = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 1;
        return Math.max(1, Math.min(totalLines, num));
      };

      const patientZeroLine = clampLine(parsed.patientZeroLine);
      const cascadingSet = new Set<number>();
      if (Array.isArray(parsed.cascadingErrorLines)) {
        for (const item of parsed.cascadingErrorLines) {
          const clamped = clampLine(item);
          if (clamped !== patientZeroLine) {
            cascadingSet.add(clamped);
          }
        }
      }

      const timeline = Array.isArray(parsed.timeline)
        ? parsed.timeline.map((t: Record<string, unknown>) => ({
            timestamp: String(t.timestamp ?? ''),
            event: String(t.event ?? ''),
            isError: Boolean(t.isError),
            lineNumber: t.lineNumber !== undefined ? clampLine(t.lineNumber) : undefined,
          }))
        : [];

      const analysis = {
        incidentTitle: String(parsed.incidentTitle || 'Application Incident Detected'),
        severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.severity)
          ? parsed.severity
          : 'HIGH',
        summary: String(parsed.summary || ''),
        patientZeroLine,
        cascadingErrorLines: Array.from(cascadingSet).sort((a, b) => a - b),
        rootCauseCategory: String(parsed.rootCauseCategory || 'Code Bug'),
        suggestedFix: {
          explanation: String(parsed.suggestedFix?.explanation || ''),
          language: String(parsed.suggestedFix?.language || 'bash'),
          codeSnippet: String(parsed.suggestedFix?.codeSnippet || ''),
        },
        timeline,
      };

      // Pre-initialize a stateful Gemini chat session bound to this log & RCA
      const sessionId = crypto.randomUUID();
      const chat = ai.chats.create({
        model: MODEL_NAME,
        config: {
          systemInstruction: buildCopilotSystemInstruction(rawLog, analysis),
        },
      });
      chatSessions.set(sessionId, { chat, lastUsed: Date.now() });

      return res.json({ analysis, sessionId });
    } catch (err) {
      console.error('Error in /api/analyze:', err);
      const { status, message } = formatGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { sessionId, message, rawLog, analysis, history } = req.body as {
        sessionId?: string;
        message?: string;
        rawLog?: string;
        analysis?: Record<string, unknown>;
        history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      };

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const ai = getAiClient();
      let entry = sessionId ? chatSessions.get(sessionId) : undefined;

      if (!entry) {
        if (!rawLog || !analysis) {
          return res.status(400).json({
            error: 'Missing log context to initialize Debug Copilot session.',
          });
        }
        const formattedHistory = Array.isArray(history)
          ? history.map((h) => ({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: h.content }],
            }))
          : [];

        const chat = ai.chats.create({
          model: MODEL_NAME,
          config: {
            systemInstruction: buildCopilotSystemInstruction(rawLog, analysis),
          },
          history: formattedHistory,
        });
        const newId = sessionId || crypto.randomUUID();
        entry = { chat, lastUsed: Date.now() };
        chatSessions.set(newId, entry);
      }

      entry.lastUsed = Date.now();
      const response = await entry.chat.sendMessage({ message });
      return res.json({
        reply: response.text ?? 'No response generated.',
      });
    } catch (err) {
      console.error('Error in /api/chat:', err);
      const { status, message } = formatGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LogLens AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
