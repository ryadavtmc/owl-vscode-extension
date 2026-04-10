import * as vscode from 'vscode';
import { callGroq } from '../ai/client';
import { buildErrorPrompt } from '../ai/prompts/errorIntel';
import { hasError, detectLanguage } from '../utils/patterns';
import { showErrorExplanation } from '../ui/webview';
import { setThinking, setWatching } from '../ui/statusBar';

export async function handleErrorOutput(output: string, command: string): Promise<void> {
  if (!hasError(output)) {
    return;
  }

  const language = detectLanguage(output);

  const selection = await vscode.window.showInformationMessage(
    `🦉 Owl detected an error in: ${command || 'terminal output'}`,
    'Explain',
    'Dismiss'
  );

  if (selection !== 'Explain') {
    return;
  }

  setThinking();

  const prompt = buildErrorPrompt(output, language);
  const raw = await callGroq(prompt, 'smart');

  setWatching();

  if (!raw) {
    return;
  }

  try {
    const data = JSON.parse(raw);
    showErrorExplanation(data);
  } catch {
    console.error('[Owl] Failed to parse error intel response:', raw);
  }
}
