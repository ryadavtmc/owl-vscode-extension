export function buildCommandPreviewPrompt(command: string): string {
  return `You are a developer assistant inside a VSCode terminal extension called Owl.
A developer is about to run a potentially dangerous command. Explain it clearly.

Command: ${command}

Respond ONLY with this JSON structure, no markdown, no preamble:
{
  "explanation": "plain English explanation of exactly what this command does",
  "isDangerous": true,
  "dangerReason": "specific reason this command is risky",
  "irreversible": true or false
}`;
}
