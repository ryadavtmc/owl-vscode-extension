import { callGroq } from '../ai/client';
import { buildSecurityPrompt } from '../ai/prompts/securityGuard';
import { isSecurityThreat } from '../utils/patterns';
import { showSecurityWarning } from '../ui/webview';
import { setThinking, setWatching } from '../ui/statusBar';

function extractUrl(command: string): string | null {
  const match = command.match(/https?:\/\/[^\s|>'"]+/);
  return match ? match[0] : null;
}

async function fetchScript(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const text = await res.text();
      return text.slice(0, 2000);
    }
  } catch {
    // silently skip — script fetching is best-effort
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
    showSecurityWarning({ ...data, command });
  } catch {
    console.error('[Owl] Failed to parse security guard response:', raw);
  }
}
