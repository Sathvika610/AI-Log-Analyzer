import React, { useEffect, useState } from 'react';
import { Loader2, Terminal } from 'lucide-react';

interface AnalysisLoadingStateProps {
  lineCount: number;
  sourceName: string;
}

export const AnalysisLoadingState: React.FC<AnalysisLoadingStateProps> = ({
  lineCount,
  sourceName,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    `Parsing ${lineCount.toLocaleString()} lines from ${sourceName}...`,
    'Isolating stack traces and error clusters...',
    'Correlating timestamps to pinpoint Patient Zero...',
    'Generating structured remediation patch and timeline...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1400);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Terminal Status Banner */}
      <div className="border-b border-slate-800 bg-[#111827] px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Running Gemini Root Cause Analysis
              </p>
              <p className="font-mono text-xs text-indigo-300">{steps[stepIndex]}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((label, idx) => {
              const completed = idx < stepIndex;
              const active = idx === stepIndex;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
                    active
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-200'
                      : completed
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                        : 'border-slate-800 bg-[#0B0F19] text-slate-500'
                  }`}
                >
                  <Terminal className="h-3 w-3 shrink-0" />
                  <span className="truncate">{label.split('...')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3-Column Skeleton Layout */}
      <div className="grid flex-1 grid-cols-1 gap-px bg-slate-800 lg:grid-cols-12 overflow-hidden">
        <div className="lg:col-span-3 bg-[#111827] p-5 space-y-5">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-800" />
          <div className="h-7 w-4/5 animate-pulse rounded bg-slate-800" />
          <div className="space-y-2">
            <div className="h-3.5 w-full animate-pulse rounded bg-slate-800/80" />
            <div className="h-3.5 w-11/12 animate-pulse rounded bg-slate-800/80" />
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-800/80" />
          </div>
          <div className="h-28 w-full animate-pulse rounded-lg bg-slate-800/70" />
          <div className="h-40 w-full animate-pulse rounded-lg bg-slate-800/70" />
        </div>

        <div className="lg:col-span-6 bg-[#0B0F19] p-5 space-y-2.5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="h-8 w-56 animate-pulse rounded-md bg-slate-800/80" />
            <div className="h-8 w-44 animate-pulse rounded-md bg-slate-800/80" />
          </div>
          {Array.from({ length: 16 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="h-4 w-8 animate-pulse rounded bg-slate-800/60" />
              <div
                className="h-4 animate-pulse rounded bg-slate-800/70"
                style={{ width: `${55 + ((idx * 17) % 40)}%` }}
              />
            </div>
          ))}
        </div>

        <div className="lg:col-span-3 bg-[#111827] p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-6 w-36 animate-pulse rounded bg-slate-800" />
            <div className="h-16 w-full animate-pulse rounded-lg bg-slate-800/70" />
            <div className="h-12 w-4/5 animate-pulse rounded-lg bg-slate-800/60" />
          </div>
          <div className="h-11 w-full animate-pulse rounded-lg bg-slate-800/80" />
        </div>
      </div>
    </div>
  );
};
