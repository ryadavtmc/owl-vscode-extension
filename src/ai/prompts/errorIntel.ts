export function buildErrorPrompt(stackTrace: string, language: string): string {
  return `You are a developer assistant inside a VSCode terminal extension called Owl.
A terminal error was detected. Analyze it and respond in JSON only.

Language/Runtime: ${language}
Stack Trace:
${stackTrace.slice(0, 3000)}

Respond ONLY with this JSON structure, no markdown, no preamble:
{
  "summary": "one sentence describing what went wrong",
  "cause": "one sentence explaining the root cause",
  "fix": "one sentence concrete actionable fix",
  "fileRef": "filename:lineNumber or null if not determinable",
  "confidence": "high or medium or low"
}`;
}
