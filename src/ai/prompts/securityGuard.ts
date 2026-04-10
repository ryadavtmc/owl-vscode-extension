export function buildSecurityPrompt(command: string, scriptContent?: string): string {
  return `You are a security-focused developer assistant inside a VSCode terminal extension called Owl.
Analyze this command for security risks.

Command: ${command}
${scriptContent ? `\nScript content (first 2000 chars):\n${scriptContent.slice(0, 2000)}` : ''}

Respond ONLY with this JSON structure, no markdown, no preamble:
{
  "riskLevel": "high or medium or low",
  "summary": "plain English explanation of what this command does",
  "risks": ["specific risk 1", "specific risk 2", "specific risk 3"],
  "recommendation": "block or warn or allow"
}`;
}
