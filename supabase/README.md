# Supabase (Cairn)

Backend for Cairn: Postgres (auth, profiles, workspaces, rate-limit log) + edge
functions that proxy Anthropic so the API key never reaches the browser.

## Layout

- `migrations/` — SQL migrations (apply in order).
- `functions/` — Deno edge functions.
  - `_shared/edge.ts` — shared CORS, rate-limiting, validation and Anthropic helpers.
  - `ai-chat`, `ai-form-suggest`, `analyze-input`, `generate-strategic-picture`.

## Edge function secrets

Set via the Supabase CLI (never commit these):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# Optional — defaults to www.cairnpath.io, cairnpath.io and localhost:5173
supabase secrets set ALLOWED_ORIGINS="https://www.cairnpath.io,https://cairnpath.io,http://localhost:5173"
```

## Deploy order (IMPORTANT)

The functions rate-limit per kind using the `generation_log.kind` column added in
migration `002`. **Apply migrations before deploying the functions**, otherwise the
rate-limit query references a missing column and AI requests fail with 500.

```bash
supabase db push                      # 1. apply migrations (incl. 002)
supabase functions deploy ai-chat ai-form-suggest analyze-input generate-strategic-picture
```

## Rate limits (per user, rolling 24h)

| Function                    | kind       | limit/day |
|-----------------------------|------------|-----------|
| ai-chat                     | `chat`     | 200       |
| ai-form-suggest             | `form`     | 200       |
| analyze-input               | `analyze`  | 50        |
| generate-strategic-picture  | `generate` | 10        |

Adjust the `DAILY_LIMIT` constant in each function as needed.
