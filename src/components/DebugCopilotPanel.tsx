import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  Loader2,
  Send,
  User,
} from 'lucide-react';
import { ChatMessage, RcaAnalysis } from '../types/loglens';
import { copyToClipboard } from './RcaSummaryPanel';

interface DebugCopilotPanelProps {
  sessionId: string | null;
  rawLog: string;
  analysis: RcaAnalysis;
  messages: ChatMessage[];
  onMessagesChange: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const SUGGESTED_PROMPTS = [
  'Which service or line failed first?',
  'Explain the root cause error code',
  'Write a regex to filter these errors',
  'Draft a Jira bug report for this incident',
];

function MessageContent({ content }: { content: string }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Split markdown fenced code blocks ```lang\n...\n```
  const segments = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-[13px] leading-relaxed">
      {segments.map((seg, idx) => {
        if (seg.startsWith('```') && seg.endsWith('```')) {
          const inner = seg.slice(3, -3);
          const firstNewline = inner.indexOf('\n');
          const lang = firstNewline !== -1 ? inner.slice(0, firstNewline).trim() : '';
          const code = firstNewline !== -1 ? inner.slice(firstNewline + 1) : inner;

          return (
            <div
              key={idx}
              className="overflow-hidden rounded-lg border border-slate-700/80 bg-[#0B0F19]"
            >
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#171b26] px-3 py-1">
                <span className="font-mono text-[11px] text-slate-400">{lang || 'snippet'}</span>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(code);
                    if (ok) {
                      setCopiedIdx(idx);
                      setTimeout(() => setCopiedIdx(null), 2000);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-5 text-slate-200">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Render inline paragraphs & inline `code`
        return (
          <div key={idx} className="whitespace-pre-wrap break-words">
            {seg.split(/(`[^`]+`)/g).map((part, pIdx) => {
              if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
                return (
                  <code
                    key={pIdx}
                    className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[12px] text-indigo-200"
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <React.Fragment key={pIdx}>{part}</React.Fragment>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export const DebugCopilotPanel: React.FC<DebugCopilotPanelProps> = ({
  sessionId,
  rawLog,
  analysis,
  messages,
  onMessagesChange,
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const priorHistory = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));

    onMessagesChange((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
          rawLog,
          analysis,
          history: priorHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from Debug Copilot.');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onMessagesChange((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          err instanceof Error
            ? err.message
            : 'Unable to reach Gemini Debug Copilot. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      onMessagesChange((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const lineCount = rawLog.replace(/\r\n/g, '\n').split('\n').length;

  return (
    <aside className="flex h-full flex-col overflow-hidden border-l border-slate-800 bg-[#111827]">
      {/* Copilot Header */}
      <div className="border-b border-slate-800 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">AI Debug Copilot</h2>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {lineCount} lines · L{analysis.patientZeroLine}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Ask follow-up questions grounded strictly in the active log and RCA.
        </p>
      </div>

      {/* Chat Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-[#171b26] p-3.5">
            <p className="text-xs font-medium text-slate-200">
              Incident context loaded ({analysis.severity})
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Click a prompt below or ask anything about stack frames, error codes, regex filters,
              or remediation steps.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                    msg.isError
                      ? 'border-red-500/40 bg-red-500/15 text-red-400'
                      : 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                  }`}
                >
                  {msg.isError ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-lg border px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'border-indigo-500/40 bg-indigo-500/15 text-slate-100'
                    : msg.isError
                      ? 'border-red-500/40 bg-red-500/10 text-red-200'
                      : 'border-slate-800 bg-[#171b26] text-slate-200'
                }`}
              >
                <MessageContent content={msg.content} />
              </div>

              {msg.role === 'user' && (
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-[#1E293B] text-slate-300">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-indigo-500/40 bg-indigo-500/15 text-indigo-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#171b26] px-3.5 py-2.5 text-xs text-slate-400">
              Inspecting log evidence...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips + Input Composer */}
      <div className="border-t border-slate-800 bg-[#111827] p-3.5 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isSending}
              onClick={() => sendMessage(prompt)}
              className="rounded-md border border-slate-700/80 bg-[#171b26] px-2.5 py-1 text-left text-[11px] font-medium text-slate-300 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-200 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask Copilot about this incident..."
            aria-label="Ask AI Debug Copilot"
            className="flex-1 resize-none rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6366F1] text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
