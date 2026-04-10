import * as vscode from 'vscode';
import { startWatching } from './terminal/watcher';
import { createStatusBar, setWatching, setDisabled } from './ui/statusBar';
import { resetClient } from './ai/client';
import { installShellHook, uninstallShellHook, checkHookStatus } from './shell/installer';

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = createStatusBar();
  context.subscriptions.push(statusBar);

  // Start watching terminals for AI analysis
  startWatching(context);

  // Prompt to install shell hook on first activation
  const hookInstalled = context.globalState.get<boolean>('shellHookInstalled', false);
  if (!hookInstalled && !checkHookStatus()) {
    setTimeout(() => {
      installShellHook().then(() => {
        context.globalState.update('shellHookInstalled', true);
      });
    }, 3000); // slight delay so it doesn't fire immediately on startup
  }

  // Reset Groq client when API key changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('owl.apiKey')) {
        resetClient();
      }
    })
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('owl.enable', () => {
      vscode.workspace.getConfiguration('owl').update('enabled', true, true);
      setWatching();
      vscode.window.showInformationMessage('🦉 Owl is now watching your terminal.');
    }),

    vscode.commands.registerCommand('owl.disable', () => {
      vscode.workspace.getConfiguration('owl').update('enabled', false, true);
      setDisabled();
      vscode.window.showInformationMessage('Owl is disabled.');
    }),

    vscode.commands.registerCommand('owl.setApiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your Groq API key',
        password: true,
        placeHolder: 'gsk_...',
      });
      if (key) {
        await vscode.workspace.getConfiguration('owl').update('apiKey', key, true);
        resetClient();
        vscode.window.showInformationMessage('🦉 Owl: API key saved.');
      }
    }),

    vscode.commands.registerCommand('owl.installShellHook', () => {
      installShellHook();
    }),

    vscode.commands.registerCommand('owl.uninstallShellHook', () => {
      uninstallShellHook();
    })
  );
}

export function deactivate(): void {}
