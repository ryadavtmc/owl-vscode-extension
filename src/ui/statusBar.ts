import * as vscode from 'vscode';

let statusBar: vscode.StatusBarItem;

export function createStatusBar(): vscode.StatusBarItem {
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = '$(eye) Owl';
  statusBar.tooltip = 'Owl is watching your terminal';
  statusBar.command = 'owl.disable';
  statusBar.show();
  return statusBar;
}

export function setWatching(): void {
  statusBar.text = '$(eye) Owl';
  statusBar.tooltip = 'Owl is watching your terminal';
  statusBar.color = undefined;
}

export function setThinking(): void {
  statusBar.text = '$(loading~spin) Owl';
  statusBar.tooltip = 'Owl is analyzing...';
}

export function setDisabled(): void {
  statusBar.text = '$(eye-closed) Owl';
  statusBar.tooltip = 'Owl is disabled — click to enable';
  statusBar.command = 'owl.enable';
}
