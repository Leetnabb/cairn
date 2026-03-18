import { parseJsonObjectFromAI } from './parseJsonResponse';
import type { DimensionKey, EffectType } from '../../types';

export interface GeneratedStrategicPicture {
  strategies: Array<{
    name: string;
    description: string;
    timeHorizon: 'short' | 'medium' | 'long';
    priority: 1 | 2 | 3;
  }>;
  capabilities: Array<{
    name: string;
    description: string;
    level: 1 | 2;
    parent: string | null;
    maturity: 1 | 2 | 3;
    risk: 1 | 2 | 3;
  }>;
  initiatives: Array<{
    name: string;
    dimension: DimensionKey;
    horizon: 'near' | 'far';
    description: string;
  }>;
  effects: Array<{
    name: string;
    type: EffectType;
    description: string;
  }>;
  insights: string[];
}

const SYSTEM_PROMPT = `You are a strategic advisor analyzing organizational documents to create a strategic overview.

Given the input (document text or organization description), generate a COMPLETE strategic picture as JSON.

Requirements:
- 3-5 strategies with clear priorities
- 6-10 capabilities organized in max 2 levels (level 1 = domain, level 2 = sub-capability with parent referencing a level 1 name)
- 8-15 initiatives distributed across ALL FOUR dimensions: ledelse, virksomhet, organisasjon, teknologi
- 3-5 effects with types: cost, quality, speed, compliance, strategic
- 2-4 insights — observations about balance, gaps, or risks. Write in Norwegian. Be specific and provocative.

CRITICAL: Distribute initiatives across dimensions. Most organizations over-index on technology. Call this out explicitly in insights if present.

Respond with ONLY valid JSON matching this schema:
{
  "strategies": [{ "name": "", "description": "", "timeHorizon": "short|medium|long", "priority": 1-3 }],
  "capabilities": [{ "name": "", "description": "", "level": 1|2, "parent": null|"parent name", "maturity": 1-3, "risk": 1-3 }],
  "initiatives": [{ "name": "", "dimension": "ledelse|virksomhet|organisasjon|teknologi", "horizon": "near|far", "description": "" }],
  "effects": [{ "name": "", "type": "cost|quality|speed|compliance|strategic", "description": "" }],
  "insights": ["string"]
}`;

export function parseStrategicPicture(text: string): GeneratedStrategicPicture {
  const parsed = parseJsonObjectFromAI(text) as unknown as GeneratedStrategicPicture;

  if (!parsed.strategies?.length || !parsed.capabilities?.length ||
      !parsed.initiatives?.length || !parsed.effects?.length) {
    throw new Error('AI response missing required fields');
  }

  return parsed;
}

export async function generateStrategicPicture(
  input: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<GeneratedStrategicPicture> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input }],
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  return parseStrategicPicture(text);
}
