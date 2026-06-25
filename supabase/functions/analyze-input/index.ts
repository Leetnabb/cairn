import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  jsonResponse,
  underRateLimit,
  logUsage,
  extractText,
} from '../_shared/edge.ts';

const RATE_LIMIT_KIND = 'analyze';
const DAILY_LIMIT = 50;

const ANALYSIS_PROMPT = `You are a strategic advisor analyzing organizational documents.

Your task is to ANALYZE the input and extract strategic findings. Do NOT generate new content — only identify what exists in the documents.

For each finding, assess:
- Is this specific to THIS organization, or could it be any organization?
- What is the source (which document/section)?
- Confidence: high (explicitly stated), medium (implied), low (inferred)

Then identify GAPS — what's missing for a complete strategic picture:
- Are initiatives distributed across dimensions (leadership, business, organization, technology)?
- Are there clear effect/outcome targets?
- Is the information specific enough to be recognizable?

Generate 0-3 follow-up questions ONLY for critical gaps. Each question must:
- Reference something specific found in the documents
- Provide 3-4 multiple choice options adapted to the organization's context
- Never be generic — always grounded in what was found

Respond with ONLY valid JSON:
{
  "summary": "Norwegian summary of what was found",
  "findings": [
    { "text": "name of finding", "type": "initiative|effect|strategy", "confidence": "high|medium|low", "source": "document reference" }
  ],
  "questions": [
    { "id": "q1", "text": "question in Norwegian", "context": "why we ask — what triggered this", "options": ["option a", "option b", "option c", "annet"], "allowFreeText": true }
  ],
  "readiness": 0-100
}

Rules:
- Write all user-facing text in Norwegian
- Never guess. If uncertain, generate a question instead.
- Maximum 3 questions. Prioritize by impact on result quality.
- readiness: 80-100 = few/no questions needed, 40-79 = questions will help significantly, 0-39 = very little found`;

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

    const { input, industry, orgSize } = await req.json();
    if (!input || typeof input !== 'string') {
      return jsonResponse({ error: 'Missing input' }, 400, cors);
    }

    if (!(await underRateLimit(supabase, user.id, RATE_LIMIT_KIND, DAILY_LIMIT))) {
      return jsonResponse({ error: 'Rate limit exceeded' }, 429, cors);
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return jsonResponse({ error: 'AI service not configured' }, 500, cors);
    }

    const contextPrefix = [
      industry ? `Bransje: ${industry}` : '',
      orgSize ? `Størrelse: ${orgSize}` : '',
    ].filter(Boolean).join('\n');

    const userMessage = contextPrefix
      ? `${contextPrefix}\n\n${input}`
      : input;

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
        max_tokens: 2048,
        system: ANALYSIS_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!aiResponse.ok) {
      return jsonResponse({ error: `AI request failed: ${aiResponse.status}` }, 502, cors);
    }

    const aiData = await aiResponse.json();
    const text = extractText(aiData);
    if (!text) {
      return jsonResponse({ error: 'AI returned no usable content' }, 502, cors);
    }

    return jsonResponse({ text }, 200, cors);
  } catch (err) {
    console.error('[analyze-input] Unhandled error', err);
    return jsonResponse({ error: 'Internal server error' }, 500, cors);
  }
});
