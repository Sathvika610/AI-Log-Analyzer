import { LogLevel, ParsedLogLine, RcaAnalysis, TimelineEvent } from '../types/loglens';

const TIMESTAMP_REGEX =
  /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?|\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})/;

const STACK_FRAME_REGEX =
  /^\s+(at\s+|Caused by:|\.\.\.\s+\d+\s+more|\d+:\s+0x[0-9a-fA-F]+)/;

export function detectLineLevel(line: string, prevLevel: LogLevel): { level: LogLevel; isStackFrame: boolean } {
  const isStackFrame = STACK_FRAME_REGEX.test(line);
  if (isStackFrame) {
    return { level: prevLevel === 'INFO' ? 'ERROR' : prevLevel, isStackFrame: true };
  }

  const upper = line.toUpperCase();
  if (
    /\bFATAL\b/.test(upper) ||
    /FATAL ERROR/.test(upper) ||
    /CRASHLOOPBACKOFF/.test(upper) ||
    /SIGABRT|SIGKILL|OOM/.test(upper)
  ) {
    return { level: 'FATAL', isStackFrame: false };
  }
  if (
    /\bERROR\b|\bERR\b|\[ERROR\]/.test(upper) ||
    /EXCEPTION|TYPEERROR|REPLYERROR|MAXRETRIESPERREQUESTERROR|UNHANDLED/.test(upper) ||
    /\b50[0-4]\b/.test(upper) ||
    /EXIT CODE [1-9]/.test(upper) ||
    /TERMINATED WITH EXIT CODE/.test(upper)
  ) {
    return { level: 'ERROR', isStackFrame: false };
  }
  if (/\bWARN\b|\bWARNING\b|\[WARN\]|DEGRADED|SATURATION|BACK-OFF|RETRYSTRATEGY/.test(upper)) {
    return { level: 'WARN', isStackFrame: false };
  }
  return { level: 'INFO', isStackFrame: false };
}

export function parseRawLog(rawLog: string): ParsedLogLine[] {
  const normalized = rawLog.replace(/\r\n/g, '\n');
  const rawLines = normalized.split('\n');
  let prevLevel: LogLevel = 'INFO';

  return rawLines.map((raw, index) => {
    const match = raw.match(TIMESTAMP_REGEX);
    const { level, isStackFrame } = detectLineLevel(raw, prevLevel);
    prevLevel = level;
    return {
      lineNumber: index + 1,
      raw,
      level,
      timestamp: match ? match[1] : null,
      isStackFrame,
    };
  });
}

export function findLineForTimelineEvent(
  event: TimelineEvent,
  parsedLines: ParsedLogLine[],
): number | null {
  if (
    typeof event.lineNumber === 'number' &&
    event.lineNumber >= 1 &&
    event.lineNumber <= parsedLines.length
  ) {
    return event.lineNumber;
  }

  const ts = event.timestamp?.trim();
  if (ts) {
    const exactTs = parsedLines.find((l) => l.raw.includes(ts));
    if (exactTs) return exactTs.lineNumber;

    // Match HH:MM:SS portion if full ISO timestamp differs slightly
    const timeOnly = ts.match(/\d{2}:\d{2}:\d{2}/)?.[0];
    if (timeOnly) {
      const partialTs = parsedLines.find((l) => l.raw.includes(timeOnly));
      if (partialTs) return partialTs.lineNumber;
    }
  }

  return null;
}

export function generateMarkdownReport(
  analysis: RcaAnalysis,
  parsedLines: ParsedLogLine[],
  sourceName: string,
): string {
  const patientZeroText =
    parsedLines.find((l) => l.lineNumber === analysis.patientZeroLine)?.raw ?? '';

  const cascadingSection =
    analysis.cascadingErrorLines.length > 0
      ? analysis.cascadingErrorLines
          .map((lineNum) => {
            const text = parsedLines.find((l) => l.lineNumber === lineNum)?.raw ?? '';
            return `- **Line ${lineNum}:** \`${text.trim()}\``;
          })
          .join('\n')
      : '- None detected';

  const timelineSection = analysis.timeline
    .map((item) => {
      const marker = item.isError ? '[ERROR]' : '[INFO]';
      const lineRef = item.lineNumber ? ` (Line ${item.lineNumber})` : '';
      return `- \`${item.timestamp}\` ${marker} ${item.event}${lineRef}`;
    })
    .join('\n');

  return `# Incident Post-Mortem: ${analysis.incidentTitle}

- **Severity:** ${analysis.severity}
- **Category:** ${analysis.rootCauseCategory}
- **Log Source:** ${sourceName}
- **Total Lines Analyzed:** ${parsedLines.length}
- **Generated:** ${new Date().toISOString()}

---

## Executive Summary
${analysis.summary}

---

## Patient Zero (Root Cause Origin)
- **Line Number:** Line ${analysis.patientZeroLine}

\`\`\`log
${patientZeroText}
\`\`\`

### Cascading Downstream Errors
${cascadingSection}

---

## Incident Timeline
${timelineSection}

---

## Suggested Fix & Remediation
${analysis.suggestedFix.explanation}

\`\`\`${analysis.suggestedFix.language || 'text'}
${analysis.suggestedFix.codeSnippet}
\`\`\`
`;
}
