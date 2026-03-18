import type { Capability } from '../../types';
import { AIError } from './claude';
import { parseJsonArrayFromAI } from './parseJsonResponse';

export interface SuggestedCapability extends Capability {
  reasoning: string;
  selected: boolean;
}

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export async function suggestCapabilities(
  orgDescription: string,
  existingCaps: Capability[],
  apiKey: string,
): Promise<SuggestedCapability[]> {
  const capList = existingCaps
    .filter(c => c.level === 1)
    .map(c => {
      const subs = existingCaps.filter(s => s.level === 2 && s.parent === c.id);
      return `- ${c.name}: ${subs.map(s => s.name).join(', ')}`;
    })
    .join('\n');

  const systemPrompt = `Du er en EA-rådgiver som hjelper med kapabilitetskartlegging.
Brukeren har beskrevet organisasjonen: "${orgDescription}"

Eksisterende kapabiliteter i malen:
${capList}

Foreslå 5-10 tilleggskapabiliteter som IKKE finnes i malen, men som er relevante for denne organisasjonen.
Kapabilitetene skal ha unike IDer som starter med "ai_" etterfulgt av et kort navn (f.eks. "ai_prosjektstyring").

Returner KUN gyldig JSON-array uten markdown-formatering:
[{
  "id": "ai_eksempel",
  "name": "Kapabilitetsnavn",
  "description": "Kort beskrivelse",
  "level": 1 eller 2,
  "parent": null eller ID til eksisterende L1-kapabilitet,
  "maturity": 1 eller 2 eller 3,
  "risk": 1 eller 2 eller 3,
  "reasoning": "Kort begrunnelse for hvorfor denne er relevant"
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
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Foreslå tilleggskapabiliteter for min organisasjon basert på beskrivelsen og eksisterende kapabiliteter.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new AIError(`API error: ${res.status}`, res.status);
  }

  const json = await res.json();
  const text: string = json.content?.[0]?.text || '';
  return parseJsonArrayFromAI<SuggestedCapability>(text);
}
