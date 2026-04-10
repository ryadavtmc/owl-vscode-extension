import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const MARKER_START = '# BEGIN OWL INTEGRATION';
const MARKER_END = '# END OWL INTEGRATION';

// ─── Zsh Hook (ZLE widget — intercepts Enter key) ─────────────────────────────
const ZSH_HOOK = `
${MARKER_START}
_owl_check_command() {
  local cmd="$BUFFER"

  # Skip empty commands
  [[ -z "\${cmd// }" ]] && { zle accept-line; return; }

  # ── Security threats: block and ask confirmation ───────────
  if echo "$cmd" | grep -qE 'curl[^|]*\\|[[:space:]]*(ba)?sh|wget[^|]*\\|[[:space:]]*(ba)?sh|eval[[:space:]]*\\('; then
    echo ""
    echo -e "\\033[41;97;1m ⚠  OWL SECURITY ALERT \\033[0m"
    echo -e "\\033[31m  Piping a remote script to bash can execute malicious code.\\033[0m"
    echo -ne "\\n\\033[33m  Proceed anyway? (y/N): \\033[0m"
    read -k 1 _owl_resp
    echo ""
    if [[ "$_owl_resp" != "y" && "$_owl_resp" != "Y" ]]; then
      echo -e "\\033[32m  ✓ Command blocked by Owl.\\033[0m\\n"
      zle reset-prompt
      return
    fi
    echo -e "\\033[33m  Proceeding as requested.\\033[0m\\n"
  fi

  # ── Dangerous commands: warn but allow ────────────────────
  if echo "$cmd" | grep -qE 'rm[[:space:]]+-rf|git[[:space:]]+reset[[:space:]]+--hard|git[[:space:]]+push[[:space:]]+(--force|-f)|chmod[[:space:]]+777|dd[[:space:]]+if=|mkfs'; then
    echo ""
    echo -e "\\033[43;30;1m ⚠  OWL WARNING \\033[0m \\033[33m Dangerous command — double-check before proceeding.\\033[0m\\n"
  fi

  zle accept-line
}
zle -N _owl_check_command
bindkey '^M' _owl_check_command
bindkey '^J' _owl_check_command
${MARKER_END}`;

// ─── Bash Hook (DEBUG trap — warns but cannot block) ──────────────────────────
const BASH_HOOK = `
${MARKER_START}
_owl_check_debug() {
  local cmd="$BASH_COMMAND"
  if echo "$cmd" | grep -qE 'curl[^|]*\\|[[:space:]]*(ba)?sh|wget[^|]*\\|[[:space:]]*(ba)?sh'; then
    echo -e "\\033[41;97;1m ⚠  OWL SECURITY ALERT \\033[0m \\033[31mPiping remote script to bash is dangerous.\\033[0m"
  elif echo "$cmd" | grep -qE 'rm[[:space:]]+-rf|git[[:space:]]+reset[[:space:]]+--hard|git[[:space:]]+push[[:space:]]+(--force|-f)'; then
    echo -e "\\033[43;30;1m ⚠  OWL WARNING \\033[0m \\033[33mDangerous command detected.\\033[0m"
  fi
}
trap '_owl_check_debug' DEBUG
${MARKER_END}`;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getShell(): string {
  return process.env.SHELL ?? '/bin/zsh';
}

function getShellConfig(): string | null {
  const shell = getShell();
  const home = os.homedir();

  if (shell.includes('zsh')) {
    return path.join(home, '.zshrc');
  }
  if (shell.includes('bash')) {
    const bashrc = path.join(home, '.bashrc');
    const bashProfile = path.join(home, '.bash_profile');
    return fs.existsSync(bashrc) ? bashrc : bashProfile;
  }
  return null;
}

function getHookContent(): string {
  return getShell().includes('zsh') ? ZSH_HOOK : BASH_HOOK;
}

function isInstalled(configPath: string): boolean {
  try {
    return fs.readFileSync(configPath, 'utf8').includes(MARKER_START);
  } catch {
    return false;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────
export async function installShellHook(): Promise<void> {
  const configPath = getShellConfig();

  if (!configPath) {
    vscode.window.showErrorMessage('Owl: Unsupported shell. Only zsh and bash are supported.');
    return;
  }

  if (isInstalled(configPath)) {
    vscode.window.showInformationMessage('🦉 Owl: Shell hook is already installed.');
    return;
  }

  const shellName = path.basename(getShell());
  const response = await vscode.window.showInformationMessage(
    `🦉 Owl: Add inline terminal warnings to your ${shellName} config (${configPath})?`,
    'Install',
    'Not Now'
  );

  if (response !== 'Install') {
    return;
  }

  try {
    fs.appendFileSync(configPath, getHookContent());

    const action = await vscode.window.showInformationMessage(
      `🦉 Owl: Shell hook installed. Open a new terminal to activate inline warnings.`,
      'Open New Terminal'
    );

    if (action === 'Open New Terminal') {
      vscode.commands.executeCommand('workbench.action.terminal.new');
    }
  } catch (err) {
    vscode.window.showErrorMessage(`🦉 Owl: Failed to install shell hook — ${err}`);
  }
}

export async function uninstallShellHook(): Promise<void> {
  const configPath = getShellConfig();

  if (!configPath || !isInstalled(configPath)) {
    vscode.window.showInformationMessage('🦉 Owl: Shell hook is not installed.');
    return;
  }

  try {
    let content = fs.readFileSync(configPath, 'utf8');
    const start = content.indexOf(MARKER_START);
    const end = content.indexOf(MARKER_END) + MARKER_END.length;

    if (start !== -1 && end !== -1) {
      content = content.slice(0, start).trimEnd() + '\n' + content.slice(end + 1).trimStart();
      fs.writeFileSync(configPath, content);
      vscode.window.showInformationMessage(
        '🦉 Owl: Shell hook removed. Open a new terminal to apply.'
      );
    }
  } catch (err) {
    vscode.window.showErrorMessage(`🦉 Owl: Failed to remove shell hook — ${err}`);
  }
}

export function checkHookStatus(): boolean {
  const configPath = getShellConfig();
  return configPath ? isInstalled(configPath) : false;
}
