export function buildSummarizePrompt(output: string, command: string): string {
  return `You are a developer assistant inside a VSCode terminal extension called Owl.
Summarize the following terminal output from the command: ${command}

Output:
${output.slice(0, 3000)}

Respond ONLY with this JSON structure, no markdown, no preamble:
{
  "summary": "2-3 sentence summary of what happened",
  "status": "success or failed or warning",
  "keyPoints": ["most important point", "second important point"],
  "actionNeeded": "what the developer should do next, or null if nothing needed"
}`;
}
