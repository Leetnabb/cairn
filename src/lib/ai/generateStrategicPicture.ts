import { parseJsonObjectFromAI } from './parseJsonResponse';
import type { DimensionKey, EffectType, Horizon } from '../../types';


/** @deprecated Use analyzeInput + Edge Function for onboarding. Kept for direct API key mode. */
export interface GeneratedStrategicPicture {
  strategies: Array<{
    name: string;
    description: string;
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
    horizon: Horizon;
    description: string;
    capabilityNames?: string[];
  }>;
  effects: Array<{
    name: string;
    type: EffectType;
    description: string;
  }>;
  insights: string[];
}

/** @deprecated Use analyzeInput + Edge Function for onboarding. Kept for direct API key mode. */
const SYSTEM_PROMPT = `You are a strategic advisor analyzing organizational documents to create a strategic overview.

Given the input (document text or organization description), generate a COMPLETE strategic picture as JSON.

Requirements:
- 3-5 strategic goals (overordna mål)
- 12-18 capabilities organized in max 2 levels: 4-6 Level 1 capability domains and 2-3 Level 2 sub-capabilities per domain. This forms the organisation's first capability map.
- Generate capabilities SPECIFIC to this organisation based on the input provided. Do NOT use generic capability names. Level 1 capabilities should reflect the organisation's actual domains (e.g., for a municipality: 'Innbyggertjenester', 'Helse & Omsorg'; for an IT company: 'Produktutvikling', 'Tjenesteleveranse'). Level 2 should be concrete sub-capabilities.
- 8-15 initiatives distributed across ALL FOUR dimensions: ledelse, virksomhet, organisasjon, teknologi
- Each initiative MUST reference 1-3 capabilities by name from the capabilities list. Use exact capability names.
- 3-5 effects with types: cost, quality, speed, compliance, strategic
- 2-4 insights — observations about balance, gaps, or risks. Write in Norwegian. Be specific and provocative.

CRITICAL: Distribute initiatives across dimensions. Most organizations over-index on technology. Call this out explicitly in insights if present.

Respond with ONLY valid JSON matching this schema:
{
  "strategies": [{ "name": "", "description": "" }],
  "capabilities": [{ "name": "", "description": "", "level": 1|2, "parent": null|"parent name", "maturity": 1-3, "risk": 1-3 }],
  "initiatives": [{ "name": "", "dimension": "ledelse|virksomhet|organisasjon|teknologi", "horizon": "near|far", "description": "", "capabilityNames": ["exact name of capability this builds"] }],
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
  apiKeyOrToken?: string,
  signal?: AbortSignal,
  useProxy?: boolean,
): Promise<GeneratedStrategicPicture> {
  let text: string;

  if (useProxy && apiKeyOrToken) {
    // Proxy mode: call Edge Function with access token

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-strategic-picture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyOrToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ input, systemPrompt: SYSTEM_PROMPT }),
        signal,
      }
    );

    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    text = data.text;
  } else if (apiKeyOrToken && !useProxy) {
    // Direct mode: call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyOrToken,
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
    text = data.content[0].text;
  } else {
    throw new Error('No API key and no Supabase session');
  }

  return parseStrategicPicture(text);
}
