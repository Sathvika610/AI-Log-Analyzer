export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type LogLevel = 'FATAL' | 'ERROR' | 'WARN' | 'INFO';

export type LogFilterLevel = 'ALL' | 'ERROR' | 'WARN' | 'INFO';

export interface SuggestedFix {
  explanation: string;
  language: string;
  codeSnippet: string;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  isError: boolean;
  lineNumber?: number;
}

export interface RcaAnalysis {
  incidentTitle: string;
  severity: IncidentSeverity;
  summary: string;
  patientZeroLine: number;
  cascadingErrorLines: number[];
  rootCauseCategory: string;
  suggestedFix: SuggestedFix;
  timeline: TimelineEvent[];
}

export interface ParsedLogLine {
  lineNumber: number;
  raw: string;
  level: LogLevel;
  timestamp: string | null;
  isStackFrame: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export interface SampleLogDataset {
  id: string;
  title: string;
  shortLabel: string;
  environment: string;
  description: string;
  content: string;
}
