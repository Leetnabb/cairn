# Supabase (Cairn)

Backend for Cairn: Postgres (auth, profiles, workspaces, rate-limit log) + edge
functions that proxy Anthropic so the API key never reaches the browser.

## Layout

- `migrations/` — SQL migrations (apply in order).
- `functions/` — Deno edge functions, each **self-contained** (the CORS,
  rate-limiting, validation and Anthropic helpers are inlined at the top of each
  `index.ts`). This means a function can be created/edited/deployed entirely in
  the Supabase **dashboard editor** without a shared module.
  - `ai-chat`, `ai-form-suggest`, `analyze-input`, `generate-strategic-picture`.

> The helper block is duplicated across the four functions on purpose (so they
> stay dashboard-deployable). If you change a helper (e.g. CORS origins logic),
> update it in all four files.

## Edge function secrets

Set under **Dashboard → Edge Functions → Secrets** (or via CLI). Never commit them.

- `ANTHROPIC_API_KEY` (required) — Anthropic API key used by all four functions.
- `ALLOWED_ORIGINS` (optional) — comma-separated CORS allow-list. Defaults to
  `https://www.cairnpath.io,https://cairnpath.io,http://localhost:5173`.

`SUPABASE_URL` / `SUPABASE_ANON_KEY` are provided automatically by the platform.

## Deploy

### Migrations first (IMPORTANT)

The functions rate-limit per kind using the `generation_log.kind` column added in
migration `002`. **Apply it before deploying the functions** or AI requests fail
with 500 (missing column).

- **Dashboard:** SQL Editor → paste & run the contents of
  `migrations/002_generation_log_kind.sql` (idempotent).
- **CLI:** `supabase db push`.

### Functions

- **Dashboard:** Edge Functions → select the function (or "Deploy a new
  function") → paste the whole `index.ts` into the editor → Deploy. Repeat for
  all four. No shared file needed.
- **CLI:** `supabase functions deploy ai-chat ai-form-suggest analyze-input generate-strategic-picture`.

## Rate limits (per user, rolling 24h)

| Function                    | kind       | limit/day |
|-----------------------------|------------|-----------|
| ai-chat                     | `chat`     | 200       |
| ai-form-suggest             | `form`     | 200       |
| analyze-input               | `analyze`  | 50        |
| generate-strategic-picture  | `generate` | 10        |

Adjust the `DAILY_LIMIT` constant in each function as needed.
