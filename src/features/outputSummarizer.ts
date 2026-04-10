import * as vscode from 'vscode';
import { callGroq } from '../ai/client';
import { buildSummarizePrompt } from '../ai/prompts/outputSummarizer';
import { isVerboseCommand } from '../utils/patterns';
import { showOutputSummary } from '../ui/webview';
import { setThinking, setWatching } from '../ui/statusBar';

export async function handleOutput(output: string, command: string): Promise<void> {
  const threshold = vscode.workspace
    .getConfiguration('owl')
    .get<number>('summarizeThreshold', 50);

  const lines = output.split('\n').length;

  if (lines < threshold || !isVerboseCommand(command)) {
    return;
  }

  setThinking();

  const prompt = buildSummarizePrompt(output, command);
  const raw = await callGroq(prompt, 'fast');

  setWatching();

  if (!raw) {
    return;
  }

  try {
    const data = JSON.parse(raw);
    showOutputSummary({ ...data, command });
  } catch {
    console.error('[Owl] Failed to parse summarization response:', raw);
  }
}
