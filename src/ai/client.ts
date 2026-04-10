import Groq from 'groq-sdk';
import * as vscode from 'vscode';

let client: Groq | null = null;
let missingKeyMessageShown = false;

const MODELS = {
  smart: 'llama-3.3-70b-versatile',  // error intel, security guard
  fast: 'llama-3.1-8b-instant',      // command preview, summarization
};

function getClient(): Groq | null {
  const apiKey = vscode.workspace.getConfiguration('owl').get<string>('apiKey', '');

  if (!apiKey) {
    if (!missingKeyMessageShown) {
      missingKeyMessageShown = true;
      vscode.window.showInformationMessage(
        'Owl: Add your Groq API key in settings to enable AI features.',
        'Open Settings'
      ).then(selection => {
        if (selection === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'owl.apiKey');
        }
      });
    }
    return null;
  }

  if (!client) {
    client = new Groq({ apiKey });
  }

  return client;
}

export function resetClient(): void {
  client = null;
  missingKeyMessageShown = false;
}

export async function callGroq(
  prompt: string,
  model: 'smart' | 'fast' = 'smart',
  maxTokens = 1024
): Promise<string | null> {
  const groq = getClient();
  if (!groq) {
    return null;
  }

  try {
    const response = await groq.chat.completions.create({
      model: MODELS[model],
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content ?? null;
  } catch (err) {
    console.error('[Owl] Groq API error:', err);
    return null;
  }
}
