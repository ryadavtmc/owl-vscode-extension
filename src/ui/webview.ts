import * as vscode from 'vscode';

interface ErrorData {
  summary: string;
  cause: string;
  fix: string;
  fileRef: string | null;
  confidence: string;
}

interface CommandData {
  explanation: string;
  isDangerous: boolean;
  dangerReason: string | null;
  irreversible: boolean;
  command: string;
}

interface SecurityData {
  riskLevel: string;
  summary: string;
  risks: string[];
  recommendation: string;
  command: string;
  scriptContent?: string;
}

interface SummaryData {
  summary: string;
  status: string;
  keyPoints: string[];
  actionNeeded: string | null;
  command: string;
}

function baseStyles(): string {
  return `
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        font-size: 13px;
        line-height: 1.6;
      }
      .card { padding: 20px; }
      .label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.5;
        margin-bottom: 6px;
      }
      .value { margin-bottom: 18px; }
      .file-ref {
        display: inline-block;
        margin-top: 4px;
        color: var(--vscode-textLink-foreground);
        cursor: pointer;
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 12px;
        text-decoration: underline;
      }
      .file-ref:hover { opacity: 0.8; }
      .risks { list-style: none; padding: 0; }
      .risks li {
        padding: 6px 0 6px 20px;
        position: relative;
        border-bottom: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.06));
      }
      .risks li:last-child { border-bottom: none; }
      .risks li::before { content: '→'; position: absolute; left: 0; opacity: 0.5; }
      .key-points { list-style: none; padding: 0; }
      .key-points li { padding: 4px 0 4px 16px; position: relative; }
      .key-points li::before { content: '•'; position: absolute; left: 0; }
      code {
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 12px;
        background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05));
        padding: 2px 6px;
        border-radius: 3px;
        word-break: break-all;
      }
      .btn-row {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.08));
      }
      button {
        padding: 7px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      }
      .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
      .btn-secondary { background: var(--vscode-button-secondaryBackground, rgba(255,255,255,0.1)); color: var(--vscode-button-secondaryForeground, #ccc); }
      .btn-danger { background: #c0392b; color: #fff; }
    </style>
  `;
}

// ─── Error Intelligence ────────────────────────────────────────────────────────
export function showErrorExplanation(data: ErrorData): void {
  const panel = vscode.window.createWebviewPanel(
    'owlError',
    'Owl — Error',
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: false }
  );

  const badge = data.confidence === 'high' ? '#4caf50' : data.confidence === 'medium' ? '#ff9800' : '#9e9e9e';

  panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  ${baseStyles()}
  <style>
    .header {
      padding: 16px 20px;
      background: var(--vscode-editorGroupHeader-tabsBackground, rgba(255,255,255,0.03));
      border-bottom: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-title { font-weight: 600; font-size: 13px; }
    .badge {
      font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
      text-transform: uppercase; padding: 3px 8px; border-radius: 3px;
      background: ${badge}; color: #fff;
    }
    .fix {
      background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.04));
      border-left: 3px solid var(--vscode-textLink-foreground, #4fc3f7);
      padding: 10px 14px; border-radius: 0 4px 4px 0; margin-bottom: 18px;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="header-title">🦉 Owl · Error Detected</span>
    <span class="badge">${data.confidence} confidence</span>
  </div>
  <div class="card">
    <div class="label">What went wrong</div>
    <div class="value">${data.summary}</div>

    <div class="label">Why</div>
    <div class="value">${data.cause}</div>

    <div class="label">Fix</div>
    <div class="fix">${data.fix}</div>

    ${data.fileRef && data.fileRef !== 'null' && !data.fileRef.startsWith('[eval]') ? `
    <div class="label">Location</div>
    <div><span class="file-ref" id="fileRef">${data.fileRef}</span></div>
    ` : ''}
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const ref = document.getElementById('fileRef');
    if (ref) {
      ref.addEventListener('click', () => {
        vscode.postMessage({ command: 'openFile', fileRef: ref.textContent });
      });
    }
  </script>
</body>
</html>`;

  // Handle file ref click — open file at correct line
  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.command === 'openFile' && msg.fileRef) {
      await openFileAtRef(msg.fileRef);
    }
  });
}

async function openFileAtRef(fileRef: string): Promise<void> {
  // Split on last colon to separate path from line number
  const lastColon = fileRef.lastIndexOf(':');
  const filePath = lastColon !== -1 ? fileRef.slice(0, lastColon) : fileRef;
  const line = Math.max(0, parseInt(fileRef.slice(lastColon + 1) || '1') - 1);

  let uri: vscode.Uri;

  try {
    if (filePath.startsWith('/') || /^[A-Z]:\\/.test(filePath)) {
      // Absolute path — open directly
      uri = vscode.Uri.file(filePath);
    } else {
      // Relative path — search workspace
      const files = await vscode.workspace.findFiles(
        `**/${filePath}`,
        '**/node_modules/**',
        1
      );
      if (files.length === 0) {
        vscode.window.showWarningMessage(`Owl: Could not find file — ${filePath}`);
        return;
      }
      uri = files[0];
    }

    const position = new vscode.Position(line, 0);
    await vscode.window.showTextDocument(uri, {
      selection: new vscode.Range(position, position),
      viewColumn: vscode.ViewColumn.One,
      preview: false,
    });
  } catch (err) {
    vscode.window.showWarningMessage(`Owl: Could not open file — ${err}`);
  }
}

// ─── Command Preview ───────────────────────────────────────────────────────────
export function showCommandPreview(data: CommandData): void {
  const panel = vscode.window.createWebviewPanel(
    'owlCommand',
    'Owl — Command Preview',
    vscode.ViewColumn.Beside,
    { enableScripts: false, retainContextWhenHidden: false }
  );

  panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  ${baseStyles()}
  <style>
    .header {
      padding: 16px 20px;
      background: rgba(255, 152, 0, 0.1);
      border-bottom: 2px solid #ff9800;
      display: flex; align-items: center; gap: 10px;
    }
    .header-title { font-weight: 600; font-size: 13px; }
    .irreversible {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      padding: 3px 8px; border-radius: 3px; background: #f44336;
      color: #fff; margin-left: auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <span>⚠️</span>
    <span class="header-title">Dangerous Command</span>
    ${data.irreversible ? '<span class="irreversible">Irreversible</span>' : ''}
  </div>
  <div class="card">
    <div class="label">Command</div>
    <div class="value"><code>${data.command}</code></div>

    <div class="label">What it does</div>
    <div class="value">${data.explanation}</div>

    ${data.dangerReason ? `
    <div class="label">Why it's risky</div>
    <div class="value">${data.dangerReason}</div>
    ` : ''}
  </div>
</body>
</html>`;
}

// ─── Security Guard ────────────────────────────────────────────────────────────
export function showSecurityWarning(data: SecurityData): void {
  const panel = vscode.window.createWebviewPanel(
    'owlSecurity',
    'Owl — Security Alert',
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  const riskColors: Record<string, string> = {
    high: '#c0392b',
    medium: '#e67e22',
    low: '#f39c12',
  };
  const riskColor = riskColors[data.riskLevel.toLowerCase()] ?? '#c0392b';
  const hasScript = !!data.scriptContent;

  panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  ${baseStyles()}
  <style>
    .header {
      padding: 20px;
      background: ${riskColor};
      display: flex; align-items: center; justify-content: space-between;
    }
    .header-title { font-weight: 700; font-size: 14px; color: #fff; }
    .risk-badge {
      font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
      text-transform: uppercase; padding: 4px 12px; border-radius: 4px;
      background: rgba(0,0,0,0.25); color: #fff;
    }
    .command-block {
      background: rgba(0,0,0,0.15);
      border-left: 3px solid ${riskColor};
      padding: 10px 14px; border-radius: 0 4px 4px 0;
      margin-bottom: 20px; word-break: break-all;
    }
    #scriptContent {
      display: none;
      margin-top: 16px;
      background: var(--vscode-textBlockQuote-background, rgba(0,0,0,0.2));
      border-radius: 4px; padding: 12px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 12px; white-space: pre-wrap; word-break: break-all;
      max-height: 300px; overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="header-title">⚠️ Security Risk Detected</span>
    <span class="risk-badge">${data.riskLevel.toUpperCase()}</span>
  </div>
  <div class="card">
    <div class="label">Command</div>
    <div class="command-block"><code>${data.command}</code></div>

    <div class="label">What this does</div>
    <div class="value">${data.summary}</div>

    <div class="label">Risks</div>
    <ul class="risks">
      ${data.risks.map((r, i) => `<li>${i + 1}. ${r}</li>`).join('')}
    </ul>

    ${hasScript ? `<div id="scriptContent">${data.scriptContent}</div>` : ''}

    <div class="btn-row">
      ${hasScript ? '<button class="btn-secondary" id="btnShowScript">Show Script</button>' : ''}
      <button class="btn-primary" id="btnDismiss">Dismiss</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const btnShow = document.getElementById('btnShowScript');
    if (btnShow) {
      btnShow.addEventListener('click', () => {
        const el = document.getElementById('scriptContent');
        if (el) {
          const visible = el.style.display === 'block';
          el.style.display = visible ? 'none' : 'block';
          btnShow.textContent = visible ? 'Show Script' : 'Hide Script';
        }
      });
    }

    document.getElementById('btnDismiss').addEventListener('click', () => {
      vscode.postMessage({ command: 'dismiss' });
    });
  </script>
</body>
</html>`;

  panel.webview.onDidReceiveMessage((msg) => {
    if (msg.command === 'dismiss') {
      panel.dispose();
    }
  });
}

// ─── Output Summarization ──────────────────────────────────────────────────────
export function showOutputSummary(data: SummaryData): void {
  const statusIcon = data.status === 'success' ? '✅' : data.status === 'failed' ? '❌' : '⚠️';

  vscode.window.showInformationMessage(
    `${statusIcon} Owl: ${data.summary}`,
    ...(data.actionNeeded ? ['What to do?'] : [])
  ).then(selection => {
    if (selection === 'What to do?') {
      vscode.window.showInformationMessage(`Owl: ${data.actionNeeded}`);
    }
  });
}
