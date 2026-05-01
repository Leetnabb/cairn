import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit (10 per day)
    const { count } = await supabase
      .from('generation_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    if ((count ?? 0) >= 10) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { input, industry, orgSize, findings, answers } = await req.json();
    if (!input || typeof input !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: GENERATION_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      console.error('[generate-strategic-picture] AI request failed', aiResponse.status, errBody);
      return new Response(JSON.stringify({ error: `AI request failed: ${aiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const text = aiData.content[0].text;

    // Log generation for rate limiting
    await supabase.from('generation_log').insert({ user_id: user.id });

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[generate-strategic-picture] Unhandled error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
