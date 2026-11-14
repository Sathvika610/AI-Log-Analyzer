import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  Crosshair,
  Search,
  WrapText,
  X,
} from 'lucide-react';
import { LogFilterLevel, ParsedLogLine, RcaAnalysis } from '../types/loglens';

interface LogViewerPanelProps {
  parsedLines: ParsedLogLine[];
  analysis: RcaAnalysis;
  jumpTarget: { lineNumber: number; nonce: number } | null;
}

export const LogViewerPanel: React.FC<LogViewerPanelProps> = ({
  parsedLines,
  analysis,
  jumpTarget,
}) => {
  const [filterLevel, setFilterLevel] = useState<LogFilterLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [wrapLines, setWrapLines] = useState(true);
  const [pulsingLine, setPulsingLine] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const cascadingSet = useMemo(
    () => new Set(analysis.cascadingErrorLines),
    [analysis.cascadingErrorLines],
  );

  const counts = useMemo(() => {
    let errorCount = 0;
    let warnCount = 0;
    let infoCount = 0;
    for (const line of parsedLines) {
      if (line.level === 'FATAL' || line.level === 'ERROR') errorCount++;
      else if (line.level === 'WARN') warnCount++;
      else infoCount++;
    }
    return {
      ALL: parsedLines.length,
      ERROR: errorCount,
      WARN: warnCount,
      INFO: infoCount,
    };
  }, [parsedLines]);

  const filteredLines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return parsedLines.filter((line) => {
      if (filterLevel === 'ERROR' && line.level !== 'ERROR' && line.level !== 'FATAL') {
        return false;
      }
      if (filterLevel === 'WARN' && line.level !== 'WARN') {
        return false;
      }
      if (filterLevel === 'INFO' && line.level !== 'INFO') {
        return false;
      }
      if (q && !line.raw.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [parsedLines, filterLevel, searchQuery]);

  // Smooth scroll when jumpTarget changes
  useEffect(() => {
    if (!jumpTarget) return;
    const { lineNumber } = jumpTarget;

    // Ensure the target line isn't hidden by active filters
    const isVisible = filteredLines.some((l) => l.lineNumber === lineNumber);
    if (!isVisible) {
      setFilterLevel('ALL');
      setSearchQuery('');
    }

    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const targetEl = container.querySelector<HTMLElement>(`[data-line="${lineNumber}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setPulsingLine(lineNumber);
        setTimeout(() => {
          setPulsingLine((curr) => (curr === lineNumber ? null : curr));
        }, 1400);
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [jumpTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderHighlightedText = (text: string) => {
    const q = searchQuery.trim();
    if (!q) return text;
    const lower = text.toLowerCase();
    const qLower = q.toLowerCase();
    const parts: React.ReactNode[] = [];
    let start = 0;
    let matchIdx = lower.indexOf(qLower, start);
    let key = 0;

    while (matchIdx !== -1) {
      if (matchIdx > start) {
        parts.push(text.slice(start, matchIdx));
      }
      parts.push(
        <mark
          key={key++}
          className="rounded-xs bg-indigo-500/40 px-0.5 text-indigo-100"
        >
          {text.slice(matchIdx, matchIdx + q.length)}
        </mark>,
      );
      start = matchIdx + q.length;
      matchIdx = lower.indexOf(qLower, start);
    }
    if (start < text.length) {
      parts.push(text.slice(start));
    }
    return parts;
  };

  const filterTabs: Array<{ id: LogFilterLevel; label: string; count: number }> = [
    { id: 'ALL', label: 'ALL', count: counts.ALL },
    { id: 'ERROR', label: 'ERROR', count: counts.ERROR },
    { id: 'WARN', label: 'WARN', count: counts.WARN },
    { id: 'INFO', label: 'INFO', count: counts.INFO },
  ];

  return (
    <section className="flex h-full flex-col overflow-hidden bg-[#0B0F19]">
      {/* Log Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#111827] px-4 py-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter logs by text, code, req_id..."
            aria-label="Search log lines"
            className="w-full rounded-md border border-slate-700 bg-[#0B0F19] py-1.5 pl-8 pr-7 font-mono text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Severity Filter Segmented Control */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            role="group"
            aria-label="Filter logs by severity"
            className="flex items-center rounded-lg border border-slate-800 bg-[#0B0F19] p-0.5"
          >
            {filterTabs.map((tab) => {
              const isActive = filterLevel === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterLevel(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#1E293B] text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono text-[11px] text-slate-400">{tab.count}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setWrapLines((w) => !w)}
            title="Toggle line wrapping"
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              wrapLines
                ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200'
                : 'border-slate-700 bg-[#1E293B] text-slate-300 hover:text-white'
            }`}
          >
            <WrapText className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Wrap</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterLevel('ALL');
              setSearchQuery('');
              const target = scrollContainerRef.current?.querySelector<HTMLElement>(
                `[data-line="${analysis.patientZeroLine}"]`,
              );
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setPulsingLine(analysis.patientZeroLine);
                setTimeout(() => setPulsingLine(null), 1400);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/25 whitespace-nowrap shrink-0"
          >
            <Crosshair className="h-3.5 w-3.5 text-red-400" />
            <span>Patient Zero (L{analysis.patientZeroLine})</span>
          </button>
        </div>
      </div>

      {/* Log Lines Viewport */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto font-mono text-[12.5px] leading-5"
      >
        {filteredLines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertOctagon className="h-7 w-7 text-slate-600" />
            <div>
              <p className="text-sm font-medium text-slate-300">No matching log lines</p>
              <p className="mt-1 text-xs text-slate-500">
                Try clearing your search query or switching back to ALL severities.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFilterLevel('ALL');
                setSearchQuery('');
              }}
              className="rounded-md border border-slate-700 bg-[#1E293B] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="min-w-full py-2">
            {filteredLines.map((line) => {
              const isPatientZero = line.lineNumber === analysis.patientZeroLine;
              const isCascading = cascadingSet.has(line.lineNumber);
              const isPulsing = pulsingLine === line.lineNumber;

              let rowClass = 'hover:bg-slate-800/40 text-slate-300';
              if (isPatientZero) {
                rowClass =
                  'bg-red-500/20 text-red-50 ring-1 ring-inset ring-red-500/50';
              } else if (isCascading) {
                rowClass =
                  'bg-amber-500/10 text-amber-100 ring-1 ring-inset ring-amber-500/25';
              } else if (line.level === 'FATAL' || line.level === 'ERROR') {
                rowClass = 'bg-red-950/20 text-red-200/90 hover:bg-red-950/35';
              } else if (line.level === 'WARN') {
                rowClass = 'bg-amber-950/15 text-amber-200/90 hover:bg-amber-950/25';
              }

              return (
                <div
                  key={line.lineNumber}
                  data-line={line.lineNumber}
                  className={`group flex items-start gap-3 px-4 py-0.5 transition-colors ${rowClass} ${
                    isPulsing ? 'animate-line-pulse' : ''
                  }`}
                >
                  {/* Preserved Original Line Number */}
                  <span
                    className={`w-10 shrink-0 select-none text-right text-[11px] leading-5 ${
                      isPatientZero
                        ? 'font-bold text-red-300'
                        : isCascading
                          ? 'font-semibold text-amber-300'
                          : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  >
                    {line.lineNumber}
                  </span>

                  {/* Semantic Role / Level Marker */}
                  <span className="w-24 shrink-0 select-none pt-0.5 text-[10px] font-semibold tracking-wider">
                    {isPatientZero ? (
                      <span className="rounded bg-red-500/30 px-1.5 py-0.5 text-red-200">
                        PATIENT ZERO
                      </span>
                    ) : isCascading ? (
                      <span className="rounded bg-amber-500/25 px-1.5 py-0.5 text-amber-200">
                        CASCADE
                      </span>
                    ) : line.level === 'FATAL' ? (
                      <span className="text-red-400">FATAL</span>
                    ) : line.level === 'ERROR' ? (
                      <span className="text-red-400/80">ERROR</span>
                    ) : line.level === 'WARN' ? (
                      <span className="text-amber-400/80">WARN</span>
                    ) : (
                      <span className="text-slate-600">INFO</span>
                    )}
                  </span>

                  {/* Raw Log Line Content */}
                  <span
                    className={`flex-1 ${
                      wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
                    }`}
                  >
                    {line.raw ? renderHighlightedText(line.raw) : '\u00A0'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subtle Bottom Metadata Strip (No fake telemetry, strictly real parsed line stats) */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-[#111827] px-4 py-1.5 font-mono text-[11px] text-slate-400">
        <span>
          Showing {filteredLines.length} of {parsedLines.length} lines
        </span>
        <span>
          Patient Zero: L{analysis.patientZeroLine} · Cascading: {analysis.cascadingErrorLines.length}
        </span>
      </div>
    </section>
  );
};
