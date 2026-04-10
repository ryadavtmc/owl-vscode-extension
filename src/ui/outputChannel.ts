import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

function getChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('Owl Security Log');
  }
  return channel;
}

export function logSecurityEvent(
  command: string,
  riskLevel: string,
  risks: string[]
): void {
  const ch = getChannel();
  const timestamp = new Date().toISOString();

  ch.appendLine('─'.repeat(60));
  ch.appendLine(`[${timestamp}] SECURITY ALERT — ${riskLevel.toUpperCase()}`);
  ch.appendLine(`Command: ${command}`);
  ch.appendLine('Risks:');
  risks.forEach((r, i) => ch.appendLine(`  ${i + 1}. ${r}`));
  ch.appendLine('');

  // Reveal the log for HIGH risk events
  if (riskLevel.toLowerCase() === 'high') {
    ch.show(true);
  }
}

export function disposeChannel(): void {
  channel?.dispose();
  channel = undefined;
}
