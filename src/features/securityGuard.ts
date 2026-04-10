import { callGroq } from '../ai/client';
import { buildSecurityPrompt } from '../ai/prompts/securityGuard';
import { isSecurityThreat } from '../utils/patterns';
import { showSecurityWarning } from '../ui/webview';
import { logSecurityEvent } from '../ui/outputChannel';
import { setThinking, setWatching } from '../ui/statusBar';

function extractUrl(command: string): string | null {
  const match = command.match(/https?:\/\/[^\s|>'"]+/);
  return match ? match[0] : null;
}

async function fetchScript(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      return (await res.text()).slice(0, 2000);
    }
  } catch {
    // best-effort — silently skip
  }
  return undefined;
}

export async function handleSecurityThreat(command: string): Promise<void> {
  if (!isSecurityThreat(command)) {
    return;
  }

  setThinking();

  const url = extractUrl(command);
  const scriptContent = url ? await fetchScript(url) : undefined;

  const prompt = buildSecurityPrompt(command, scriptContent);
  const raw = await callGroq(prompt, 'smart');

  setWatching();

  if (!raw) {
    return;
  }

  try {
    const data = JSON.parse(raw);

    // Log to audit channel
    logSecurityEvent(command, data.riskLevel, data.risks);

    // Show webview with script content if available
    showSecurityWarning({ ...data, command, scriptContent });
  } catch {
    console.error('[Owl] Failed to parse security guard response:', raw);
  }
}
