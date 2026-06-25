import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  jsonResponse,
  underRateLimit,
  logUsage,
  extractText,
} from '../_shared/edge.ts';

const RATE_LIMIT_KIND = 'generate';
const DAILY_LIMIT = 10;

const GENERATION_PROMPT = `You are a strategic advisor generating a strategic initiative overview.

Based on the analysis findings and user answers provided, generate SPECIFIC initiatives and effects for this organization.

Rules:
- Generate ONLY initiatives and effects. No strategies, no capabilities.
- Each initiative MUST have a confidence level:
  - "high" = directly based on documents or user answers
  - "low" = suggested/inferred, needs user confirmation
- Each initiative must link to 1-3 effects by name
- Distribute initiatives across ALL FOUR dimensions: ledelse, virksomhet, organisasjon, teknologi
- Never generate generic content. If it could be any organization, don't include it.
- Provide reasoning for each initiative (what source/answer it's based on)
- 2-4 insights in Norwegian — observations about dimension balance, gaps, or risks
- Write all user-facing text in Norwegian

Respond with ONLY valid JSON:
{
  "initiatives": [{ "name": "", "dimension": "ledelse|virksomhet|organisasjon|teknologi", "horizon": "near|far", "description": "", "confidence": "high|low", "reasoning": "", "effectNames": ["effect name"] }],
  "effects": [{ "name": "", "type": "cost|quality|speed|compliance|strategic", "description": "", "confidence": "high|low" }],
  "insights": ["string"]
}`;

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401, cors);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401, cors);
    }

    if (!(await underRateLimit(supabase, user.id, RATE_LIMIT_KIND, DAILY_LIMIT))) {
      return jsonResponse({ error: 'Rate limit exceeded' }, 429, cors);
    }

    const { input, industry, orgSize, findings, answers } = await req.json();
    if (!input || typeof input !== 'string') {
      return jsonResponse({ error: 'Missing input' }, 400, cors);
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return jsonResponse({ error: 'AI service not configured' }, 500, cors);
    }

    const parts: string[] = [];
    if (industry) parts.push(`Bransje: ${industry}`);
    if (orgSize) parts.push(`Størrelse: ${orgSize}`);
    if (findings?.length) {
      parts.push('Analysefunn:\n' + findings.map((f: { text: string; type: string; confidence: string }) =>
        `- [${f.type}/${f.confidence}] ${f.text}`
      ).join('\n'));
    }
    if (answers && Object.keys(answers).length > 0) {
      parts.push('Brukerens svar:\n' + Object.entries(answers).map(([q, a]) =>
        `- ${q}: ${a}`
      ).join('\n'));
    }
    if (input) parts.push(input);
    const userMessage = parts.join('\n\n');

    await logUsage(supabase, user.id, RATE_LIMIT_KIND);

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: GENERATION_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      console.error('[generate-strategic-picture] AI request failed', aiResponse.status, errBody);
      return jsonResponse({ error: `AI request failed: ${aiResponse.status}` }, 502, cors);
    }

    const aiData = await aiResponse.json();
    const text = extractText(aiData);
    if (!text) {
      return jsonResponse({ error: 'AI returned no usable content' }, 502, cors);
    }

    return jsonResponse({ text }, 200, cors);
  } catch (err) {
    console.error('[generate-strategic-picture] Unhandled error', err);
    return jsonResponse({ error: 'Internal server error' }, 500, cors);
  }
});
