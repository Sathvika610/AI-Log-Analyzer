import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  FileCode2,
  FileText,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { SAMPLE_LOG_DATASETS } from '../data/sampleLogs';
import { SampleLogDataset } from '../types/loglens';

interface LogIngestionPanelProps {
  rawLog: string;
  sourceName: string;
  onChangeLog: (text: string, sourceName: string) => void;
  onAnalyze: (overrideLog?: string, overrideSource?: string) => void;
  error: string | null;
  onDismissError: () => void;
}

const ACCEPTED_EXTENSIONS = ['.log', '.txt', '.json'];

export const LogIngestionPanel: React.FC<LogIngestionPanelProps> = ({
  rawLog,
  sourceName,
  onChangeLog,
  onAnalyze,
  error,
  onDismissError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = rawLog ? rawLog.replace(/\r\n/g, '\n').split('\n').length : 0;
  const byteSize = new Blob([rawLog]).size;
  const formattedSize =
    byteSize >= 1024 ? `${(byteSize / 1024).toFixed(1)} KB` : `${byteSize} B`;

  const handleFileRead = (file: File) => {
    setFileError(null);
    onDismissError();
    const lowerName = file.name.toLowerCase();
    const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      setFileError('Unsupported file format. Please upload a .log, .txt, or .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = typeof e.target?.result === 'string' ? e.target.result : '';
      if (!content.trim()) {
        setFileError('The selected file is empty.');
        return;
      }
      onChangeLog(content, file.name);
    };
    reader.onerror = () => {
      setFileError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleSelectSample = (sample: SampleLogDataset, autoAnalyze = false) => {
    setFileError(null);
    onDismissError();
    onChangeLog(sample.content, `${sample.id}.log`);
    if (autoAnalyze) {
      onAnalyze(sample.content, `${sample.id}.log`);
    }
  };

  const activeError = fileError || error;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Intro Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
            Isolate Root Causes in Seconds
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-400">
            Paste raw application telemetry, drop a log file, or load a production crash scenario to
            pinpoint Patient Zero errors and generate copyable code fixes.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono shrink-0">
          <span>{lineCount.toLocaleString()} lines</span>
          <span aria-hidden="true">·</span>
          <span>{formattedSize}</span>
        </div>
      </div>

      {/* Error Alert */}
      {activeError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>{activeError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFileError(null);
              onDismissError();
            }}
            className="text-xs font-medium text-red-300 hover:text-red-100 whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Grid: Paste/Upload + Sample Scenarios */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Left 8 cols: Paste / Drag-and-Drop Editor */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`lg:col-span-8 flex flex-col rounded-xl border transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/30'
              : 'border-slate-800 bg-[#111827]'
          }`}
        >
          {/* Editor Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <FileCode2 className="h-4 w-4 text-indigo-400" />
              <span className="truncate max-w-[220px] sm:max-w-xs">{sourceName}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".log,.txt,.json,text/plain,application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileRead(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-[#1E293B] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-700/70 whitespace-nowrap shrink-0"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-400" />
                Upload File
              </button>
              {rawLog.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFileError(null);
                    onDismissError();
                    onChangeLog('', 'pasted-log.log');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-transparent px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Monospace Textarea + Drag Overlay */}
          <div className="relative flex-1 min-h-[340px]">
            <textarea
              value={rawLog}
              onChange={(e) => {
                setFileError(null);
                onChangeLog(e.target.value, sourceName === 'pasted-log.log' ? 'pasted-log.log' : sourceName);
              }}
              spellCheck={false}
              placeholder="Paste raw stdout, JSON logs, Kubernetes events, or stack traces here — or drag & drop a .log, .txt, or .json file..."
              aria-label="Raw log input"
              className="h-full min-h-[340px] w-full resize-none bg-[#0B0F19]/60 p-4 font-mono text-[13px] leading-5 text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
            {isDragging && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0B0F19]/90 backdrop-blur-xs">
                <Upload className="h-8 w-8 text-indigo-400" />
                <p className="text-sm font-medium text-indigo-200">
                  Drop .log, .txt, or .json file to load
                </p>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3">
            <span className="text-xs text-slate-500">
              Supports plaintext, structured JSON, and multi-line stack traces (.log, .txt, .json)
            </span>
            <button
              type="button"
              disabled={!rawLog.trim()}
              onClick={() => onAnalyze()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              Analyze Logs
            </button>
          </div>
        </div>

        {/* Right 4 cols: Load Sample Logs */}
        <div className="lg:col-span-4 flex flex-col rounded-xl border border-slate-800 bg-[#111827] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Load Sample Logs</h2>
            <span className="text-xs text-slate-500">3 incidents</span>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-slate-400">
            Select a realistic multi-line production failure scenario to test Root Cause Analysis and
            Debug Copilot.
          </p>

          <div className="flex flex-1 flex-col gap-3">
            {SAMPLE_LOG_DATASETS.map((sample) => {
              const sampleLines = sample.content.split('\n').length;
              const isSelected = rawLog === sample.content;
              return (
                <div
                  key={sample.id}
                  className={`flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                    isSelected
                      ? 'border-indigo-500/60 bg-indigo-500/10'
                      : 'border-slate-800 bg-[#171b26] hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-snug text-slate-100">
                        {sample.title}
                      </h3>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <span>{sample.environment}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sampleLines} lines</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      {sample.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleSelectSample(sample, false)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-[#1E293B] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 whitespace-nowrap"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      Load into Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSample(sample, true)}
                      className="ml-auto inline-flex items-center gap-1 rounded-md bg-indigo-500/15 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/25 hover:text-indigo-200 whitespace-nowrap"
                    >
                      Run RCA
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
