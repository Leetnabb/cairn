import type { Capability } from '../../types';
import { AIError } from './claude';
import { parseJsonArrayFromAI } from './parseJsonResponse';
import { CLAUDE_MODEL, ANTHROPIC_API_URL } from './model';

const API_URL = ANTHROPIC_API_URL;
const MODEL = CLAUDE_MODEL;

export interface CapabilityLinkSuggestion {
  capabilityId: string;
  capabilityName: string;
  confidence: number; // 0-1
  reasoning: string;
  suggestedMaturityEffect?: number;
}

export async function suggestCapabilityLinks(
  initiativeName: string,
  initiativeDescription: string,
  capabilities: Capability[],
  apiKey: string,
): Promise<CapabilityLinkSuggestion[]> {
  const capList = capabilities
    .map(c => `${c.id}: ${c.name} (L${c.level}${c.parent ? ', under ' + c.parent : ''})`)
    .join('\n');

  const systemPrompt = `Du er en EA-rådgiver som kobler initiativer til kapabiliteter.

Aktivitet: "${initiativeName}" - ${initiativeDescription}

Tilgjengelige kapabiliteter:
${capList}

Foreslå hvilke kapabiliteter denne aktiviteten påvirker.
Returner KUN gyldig JSON-array uten markdown-formatering, maks 8 forslag, sortert etter relevans:
[{
  "capabilityId": "id",
  "capabilityName": "navn",
  "confidence": 0.0-1.0,
  "reasoning": "kort begrunnelse",
  "suggestedMaturityEffect": 2 eller 3
}]`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: 'Foreslå kapabilitetskoblinger for denne aktiviteten.',
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new AIError(`API error: ${res.status}`, res.status);
  }

  const json = await res.json();
  const text: string = json.content?.[0]?.text || '';
  return parseJsonArrayFromAI<CapabilityLinkSuggestion>(text);
}
