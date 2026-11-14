import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Crosshair,
  Download,
  Info,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { IncidentSeverity, ParsedLogLine, RcaAnalysis, TimelineEvent } from '../types/loglens';
import { findLineForTimelineEvent } from '../utils/logParser';

interface RcaSummaryPanelProps {
  analysis: RcaAnalysis;
  parsedLines: ParsedLogLine[];
  onJumpToLine: (lineNumber: number) => void;
  onExportMarkdown: () => void;
}

const SEVERITY_CONFIG: Record<
  IncidentSeverity,
  { label: string; classes: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  CRITICAL: {
    label: 'CRITICAL',
    classes: 'border-red-500/40 bg-red-500/15 text-red-300',
    Icon: AlertOctagon,
  },
  HIGH: {
    label: 'HIGH',
    classes: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    Icon: ShieldAlert,
  },
  MEDIUM: {
    label: 'MEDIUM',
    classes: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300',
    Icon: AlertTriangle,
  },
  LOW: {
    label: 'LOW',
    classes: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    Icon: Info,
  },
};

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export const RcaSummaryPanel: React.FC<RcaSummaryPanelProps> = ({
  analysis,
  parsedLines,
  onJumpToLine,
  onExportMarkdown,
}) => {
  const [copiedFix, setCopiedFix] = useState(false);

  const sev = SEVERITY_CONFIG[analysis.severity] ?? SEVERITY_CONFIG.HIGH;
  const SevIcon = sev.Icon;

  const patientZeroText =
    parsedLines.find((l) => l.lineNumber === analysis.patientZeroLine)?.raw ?? '';

  const handleCopyFix = async () => {
    const ok = await copyToClipboard(analysis.suggestedFix.codeSnippet);
    if (ok) {
      setCopiedFix(true);
      setTimeout(() => setCopiedFix(false), 2000);
    }
  };

  const handleTimelineClick = (item: TimelineEvent) => {
    const targetLine = findLineForTimelineEvent(item, parsedLines);
    if (targetLine !== null) {
      onJumpToLine(targetLine);
    }
  };

  return (
    <aside className="flex h-full flex-col overflow-y-auto bg-[#111827] border-r border-slate-800">
      {/* Header & Incident Summary */}
      <div className="border-b border-slate-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${sev.classes}`}
          >
            <SevIcon className="h-3.5 w-3.5" />
            {sev.label}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>{analysis.rootCauseCategory}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{analysis.cascadingErrorLines.length} cascading</span>
          </div>
        </div>

        <h2 className="mt-3 text-base font-semibold leading-snug text-slate-50">
          {analysis.incidentTitle}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{analysis.summary}</p>

        {/* Patient Zero Quick Anchor */}
        <div className="mt-4 rounded-lg border border-red-500/35 bg-red-500/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-red-300">
              Patient Zero · Line {analysis.patientZeroLine}
            </span>
            <button
              type="button"
              onClick={() => onJumpToLine(analysis.patientZeroLine)}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-500/20 border border-red-500/40 px-2.5 py-1 text-xs font-medium text-red-100 transition-colors hover:bg-red-500/30 whitespace-nowrap shrink-0"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Jump to Root Cause
            </button>
          </div>
          {patientZeroText && (
            <p className="mt-2 truncate font-mono text-[11px] text-red-200/85" title={patientZeroText}>
              {patientZeroText}
            </p>
          )}
        </div>
      </div>

      {/* Suggested Fix Section */}
      <div className="border-b border-slate-800 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Suggested Fix</h3>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {analysis.suggestedFix.language || 'code'}
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
          {analysis.suggestedFix.explanation}
        </p>

        <div className="mt-3 overflow-hidden rounded-lg border border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#171b26] px-3 py-1.5">
            <span className="font-mono text-[11px] text-slate-400">
              remediation.{analysis.suggestedFix.language || 'txt'}
            </span>
            <button
              type="button"
              onClick={handleCopyFix}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white whitespace-nowrap"
            >
              {copiedFix ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Fix</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-5 text-slate-200">
            <code>{analysis.suggestedFix.codeSnippet}</code>
          </pre>
        </div>
      </div>

      {/* Incident Timeline */}
      <div className="flex-1 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-100">Incident Timeline</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {analysis.timeline.length} events
          </span>
        </div>

        <ol className="space-y-2">
          {analysis.timeline.map((item, idx) => {
            const matchedLine = findLineForTimelineEvent(item, parsedLines);
            const isPatientZero = matchedLine === analysis.patientZeroLine;
            return (
              <li key={`${item.timestamp}-${idx}`}>
                <button
                  type="button"
                  onClick={() => handleTimelineClick(item)}
                  disabled={matchedLine === null}
                  className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                    isPatientZero
                      ? 'border-red-500/40 bg-red-500/10 hover:bg-red-500/15'
                      : item.isError
                        ? 'border-amber-500/25 bg-[#171b26] hover:border-amber-500/45 hover:bg-slate-800/70'
                        : 'border-slate-800 bg-[#171b26] hover:border-slate-700 hover:bg-slate-800/70'
                  } disabled:cursor-default`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                    <span className={item.isError ? 'text-red-300' : 'text-slate-400'}>
                      {item.timestamp || 'Event'}
                    </span>
                    {matchedLine !== null && (
                      <span
                        className={
                          isPatientZero
                            ? 'font-semibold text-red-300'
                            : 'text-indigo-400'
                        }
                      >
                        L{matchedLine}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-snug text-slate-200">{item.event}</p>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Bottom Export Footer */}
      <div className="border-t border-slate-800 bg-[#111827] p-4">
        <button
          type="button"
          onClick={onExportMarkdown}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#1E293B] px-4 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-600 hover:bg-slate-700/80 whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5 text-indigo-400" />
          Export Markdown Report
        </button>
      </div>
    </aside>
  );
};
