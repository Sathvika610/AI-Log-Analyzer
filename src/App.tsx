import { useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  FileSearch,
  Plus,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { AnalysisLoadingState } from './components/AnalysisLoadingState';
import { DebugCopilotPanel } from './components/DebugCopilotPanel';
import { LogIngestionPanel } from './components/LogIngestionPanel';
import { LogViewerPanel } from './components/LogViewerPanel';
import { RcaSummaryPanel } from './components/RcaSummaryPanel';
import { ChatMessage, RcaAnalysis } from './types/loglens';
import { generateMarkdownReport, parseRawLog } from './utils/logParser';

type AppView = 'ingest' | 'analyzing' | 'workspace';
type MobilePane = 'rca' | 'logs' | 'copilot';

export default function App() {
  const [view, setView] = useState<AppView>('ingest');
  const [mobilePane, setMobilePane] = useState<MobilePane>('logs');
  const [rawLog, setRawLog] = useState('');
  const [sourceName, setSourceName] = useState('pasted-log.log');
  const [analysis, setAnalysis] = useState<RcaAnalysis | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jumpTarget, setJumpTarget] = useState<{ lineNumber: number; nonce: number } | null>(null);

  const parsedLines = useMemo(() => parseRawLog(rawLog), [rawLog]);

  const handleAnalyze = async (overrideLog?: string, overrideSource?: string) => {
    const logToAnalyze = overrideLog ?? rawLog;
    const nameToUse = overrideSource ?? sourceName;
    if (!logToAnalyze.trim()) {
      setError('Please paste or upload log content before running analysis.');
      return;
    }

    if (overrideLog !== undefined) setRawLog(overrideLog);
    if (overrideSource !== undefined) setSourceName(overrideSource);

    setError(null);
    setView('analyzing');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawLog: logToAnalyze }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze logs.');
      }

      const rca: RcaAnalysis = data.analysis;
      setAnalysis(rca);
      setSessionId(data.sessionId ?? null);
      setChatMessages([]);
      setView('workspace');
      setMobilePane('rca');
      setJumpTarget({ lineNumber: rca.patientZeroLine, nonce: Date.now() });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during log analysis.',
      );
      setView('ingest');
    }
  };

  const handleJumpToLine = (lineNumber: number) => {
    setMobilePane('logs');
    setJumpTarget({ lineNumber, nonce: Date.now() });
  };

  const handleExportMarkdown = () => {
    if (!analysis) return;
    const markdown = generateMarkdownReport(analysis, parsedLines, sourceName);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const safeSlug = sourceName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.(log|txt|json)$/i, '');
    anchor.download = `${safeSlug || 'loglens'}-incident-report.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F19] text-[#F8FAFC]">
      {/* Top Bar (3-zone contract: Brand — Nav Links — Primary Action) */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-8 border-b border-slate-800 bg-[#111827]/95 px-4 backdrop-blur-sm sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => setView('ingest')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366F1] text-white">
            <Terminal className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-bold tracking-tight text-slate-50">
            LogLens AI
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav aria-label="Workspace navigation" className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setView('ingest')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              view === 'ingest'
                ? 'text-indigo-300 underline decoration-indigo-500 underline-offset-8'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Ingest Logs
          </button>
          <button
            type="button"
            disabled={!analysis}
            onClick={() => analysis && setView('workspace')}
            className={`transition-colors whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-40 ${
              view === 'workspace'
                ? 'text-indigo-300 underline decoration-indigo-500 underline-offset-8'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Diagnostics
          </button>
          <button
            type="button"
            disabled={!analysis}
            onClick={handleExportMarkdown}
            className="text-slate-400 transition-colors hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            Export Report
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          {view === 'workspace' ? (
            <button
              type="button"
              onClick={() => setView('ingest')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              New Analysis
            </button>
          ) : (
            <button
              type="button"
              disabled={!rawLog.trim() || view === 'analyzing'}
              onClick={() => handleAnalyze()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analyze Logs
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {view === 'ingest' && (
        <main className="flex-1 overflow-y-auto">
          <LogIngestionPanel
            rawLog={rawLog}
            sourceName={sourceName}
            onChangeLog={(text, name) => {
              setRawLog(text);
              setSourceName(name);
            }}
            onAnalyze={handleAnalyze}
            error={error}
            onDismissError={() => setError(null)}
          />
        </main>
      )}

      {view === 'analyzing' && (
        <main className="flex flex-1 flex-col overflow-hidden">
          <AnalysisLoadingState
            lineCount={parsedLines.length}
            sourceName={sourceName}
          />
        </main>
      )}

      {view === 'workspace' && analysis && (
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile / Tablet Pane Switcher */}
          <div className="flex border-b border-slate-800 bg-[#111827] px-3 py-2 lg:hidden">
            <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-[#0B0F19] p-1">
              <button
                type="button"
                onClick={() => setMobilePane('rca')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  mobilePane === 'rca'
                    ? 'bg-[#1E293B] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                RCA & Fix
              </button>
              <button
                type="button"
                onClick={() => setMobilePane('logs')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  mobilePane === 'logs'
                    ? 'bg-[#1E293B] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSearch className="h-3.5 w-3.5" />
                Log Viewer
              </button>
              <button
                type="button"
                onClick={() => setMobilePane('copilot')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  mobilePane === 'copilot'
                    ? 'bg-[#1E293B] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                Copilot
              </button>
            </div>
          </div>

          {/* 3-Column Desktop IDE Split Workspace */}
          <div className="grid flex-1 grid-cols-1 overflow-hidden lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[310px_minmax(0,1fr)_320px] xl:grid-cols-[360px_minmax(0,1fr)_380px]">
            <div
              className={`h-full overflow-hidden ${
                mobilePane === 'rca' ? 'block' : 'hidden lg:block'
              }`}
            >
              <RcaSummaryPanel
                analysis={analysis}
                parsedLines={parsedLines}
                onJumpToLine={handleJumpToLine}
                onExportMarkdown={handleExportMarkdown}
              />
            </div>

            <div
              className={`h-full overflow-hidden ${
                mobilePane === 'logs' ? 'block' : 'hidden lg:block'
              }`}
            >
              <LogViewerPanel
                parsedLines={parsedLines}
                analysis={analysis}
                jumpTarget={jumpTarget}
              />
            </div>

            <div
              className={`h-full overflow-hidden ${
                mobilePane === 'copilot' ? 'block' : 'hidden lg:block'
              }`}
            >
              <DebugCopilotPanel
                sessionId={sessionId}
                rawLog={rawLog}
                analysis={analysis}
                messages={chatMessages}
                onMessagesChange={setChatMessages}
              />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
