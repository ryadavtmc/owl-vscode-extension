export const ERROR_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'nodejs',   pattern: /at .+ \(.+:\d+:\d+\)/ },
  { name: 'python',   pattern: /Traceback \(most recent call last\)/i },
  { name: 'java',     pattern: /Exception in thread|\.java:\d+\)/ },
  { name: 'rust',     pattern: /error\[E\d+\]/ },
  { name: 'go',       pattern: /goroutine \d+ \[/ },
  { name: 'generic',  pattern: /^(error|fatal|panic|uncaught exception):/im },
];

export const DANGEROUS_PATTERNS: RegExp[] = [
  /rm\s+-rf/i,
  /git\s+reset\s+--hard/i,
  /git\s+rebase/i,
  /git\s+push\s+(--force|-f)/i,
  /sudo\s+/i,
  /chmod\s+777/i,
  /dd\s+if=/i,
  /mkfs/i,
  />\s*\/dev\//,
  /drop\s+table/i,
  /truncate\s+table/i,
];

export const SECURITY_PATTERNS: RegExp[] = [
  /curl.+\|\s*(ba)?sh/i,
  /wget.+\|\s*(ba)?sh/i,
  /curl.+>\s*.+\.sh/i,
  /eval\s*\(/i,
  /bash\s+-c\s+["'].*curl/i,
];

export const VERBOSE_COMMANDS: RegExp[] = [
  /^docker\s/,
  /^npm\s+(install|i)\b/,
  /^yarn\s+(install)?\s*$/,
  /^pip\s+install/,
  /^cargo\s+build/,
  /^gradle\b/,
  /^mvn\b/,
  /^webpack\b/,
  /^tsc\b/,
];

export function detectLanguage(output: string): string {
  for (const { name, pattern } of ERROR_PATTERNS) {
    if (pattern.test(output)) {
      return name;
    }
  }
  return 'unknown';
}

export function hasError(output: string): boolean {
  return ERROR_PATTERNS.some(({ pattern }) => pattern.test(output));
}

export function isDangerous(command: string): boolean {
  return DANGEROUS_PATTERNS.some(p => p.test(command));
}

export function isSecurityThreat(command: string): boolean {
  return SECURITY_PATTERNS.some(p => p.test(command));
}

export function isVerboseCommand(command: string): boolean {
  return VERBOSE_COMMANDS.some(p => p.test(command.trim()));
}
