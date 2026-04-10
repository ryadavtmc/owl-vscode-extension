# Owl 🦉

**Your terminal, finally awake.**

Owl is a VSCode extension that adds an intelligent AI layer to your integrated terminal. It watches silently and speaks up when it matters — catching errors, explaining output, and blocking danger before it's too late.

---

## Features

### Error Intelligence
Owl detects stack traces and error output from any language or framework and instantly surfaces what went wrong, why, and how to fix it — without you leaving the editor.

Supports: Node.js, Python, Rust, Go, Java, and more.

### Command Preview
Running a destructive command? Owl intercepts it and shows you exactly what it will do in plain English before you proceed.

Flags: `rm -rf`, `git reset --hard`, `git push --force`, `sudo`, `chmod 777`, and more.

### Output Summarization
Long build logs, Docker output, npm installs — Owl collapses verbose output into a 2-3 line summary so you can scan it at a glance.

### Security Guard
Piping a script from the internet directly into bash? Owl fetches the script, analyzes it, and shows you a full risk breakdown before it runs.

Detects: `curl | bash`, `wget | sh`, and similar patterns.

---

## Requirements

- VSCode 1.85+
- A [Groq API key](https://console.groq.com/) — free to get started

---

## Setup

1. Install the extension from the VSCode Marketplace
2. Open Settings (`Cmd+,`) and search for `owl`
3. Add your Groq API key under `owl.apiKey` — get one free at [console.groq.com](https://console.groq.com/)
4. Open any terminal — Owl starts watching immediately

---

## Extension Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `owl.apiKey` | Your Anthropic API key | `""` |
| `owl.enabled` | Enable or disable Owl | `true` |

---

## Privacy

Owl processes terminal output locally. Only error output, commands, and flagged content are sent to the Anthropic API for analysis. Your full terminal history is never transmitted.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## License

MIT
