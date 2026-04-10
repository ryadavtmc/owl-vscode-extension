import * as vscode from 'vscode';
import { callGroq } from '../ai/client';
import { buildCommandPreviewPrompt } from '../ai/prompts/commandPreview';
import { isDangerous } from '../utils/patterns';
import { showCommandPreview } from '../ui/webview';
import { setThinking, setWatching } from '../ui/statusBar';

export async function handleCommand(command: string): Promise<void> {
  if (!isDangerous(command)) {
    return;
  }

  setThinking();

  const prompt = buildCommandPreviewPrompt(command);
  const raw = await callGroq(prompt, 'fast', 256);

  setWatching();

  if (!raw) {
    return;
  }

  try {
    const data = JSON.parse(raw);

    const selection = await vscode.window.showWarningMessage(
      `⚠️ Owl: Dangerous command detected — ${data.explanation}`,
      'More Info',
      'Understood'
    );

    if (selection === 'More Info') {
      showCommandPreview({ ...data, command });
    }
  } catch {
    console.error('[Owl] Failed to parse command preview response:', raw);
  }
}
