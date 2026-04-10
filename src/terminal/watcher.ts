import * as vscode from 'vscode';
import { stripAnsi } from './ansiStripper';
import { handleErrorOutput } from '../features/errorIntel';
import { handleCommand } from '../features/commandPreview';
import { handleOutput } from '../features/outputSummarizer';
import { handleSecurityThreat } from '../features/securityGuard';

export function startWatching(context: vscode.ExtensionContext): void {
  const isEnabled = () =>
    vscode.workspace.getConfiguration('owl').get<boolean>('enabled', true);

  context.subscriptions.push(
    vscode.window.onDidStartTerminalShellExecution(async (e) => {
      if (!isEnabled()) {
        return;
      }

      const command = e.execution.commandLine.value.trim();

      // Security guard and command preview run immediately on command start
      if (command) {
        await handleSecurityThreat(command);
        await handleCommand(command);
      }

      // Collect full output as it streams
      let output = '';
      for await (const chunk of e.execution.read()) {
        output += stripAnsi(chunk);
      }

      // Error intel and summarization run after command completes
      if (output) {
        await handleErrorOutput(output, command);
        await handleOutput(output, command);
      }
    })
  );
}
