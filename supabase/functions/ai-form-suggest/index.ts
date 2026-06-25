import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  jsonResponse,
  underRateLimit,
  logUsage,
  validateMessages,
  guardedSystemPrompt,
  extractText,
} from '../_shared/edge.ts';

const RATE_LIMIT_KIND = 'form';
const DAILY_LIMIT = 200;

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

    const { messages, systemPrompt } = await req.json();
    const validationError = validateMessages(messages, systemPrompt);
    if (validationError) {
      return jsonResponse({ error: validationError }, 400, cors);
    }

    if (!(await underRateLimit(supabase, user.id, RATE_LIMIT_KIND, DAILY_LIMIT))) {
      return jsonResponse({ error: 'Rate limit exceeded' }, 429, cors);
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return jsonResponse({ error: 'AI service not configured' }, 500, cors);
    }

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
        max_tokens: 1024,
        system: guardedSystemPrompt(systemPrompt),
        messages,
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
    console.error('[ai-form-suggest] Unhandled error', err);
    return jsonResponse({ error: 'Internal server error' }, 500, cors);
  }
});
