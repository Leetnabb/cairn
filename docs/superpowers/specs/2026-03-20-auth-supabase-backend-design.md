# Auth + Supabase Backend

**Date:** 2026-03-20
**Status:** Draft
**Phase:** 1 of 4 (Auth → Demo → Interview guide → Data collection)

## Problem

Cairn is a client-side-only app with localStorage persistence. This blocks:
- Secure document upload (directors won't upload strategy docs to an open site)
- Data collection for anonymized research insights
- Any form of user identity or persistence across devices

## Solution

Add Supabase as backend (auth, database, AI proxy). Cairn remains a React SPA on Vercel. Supabase JS client communicates directly from browser. No custom backend server.

## Architecture

```
Browser (Vercel) ←→ Supabase Auth (JWT)
                 ←→ Supabase Database (profiles, workspaces)
                 ←→ Supabase Edge Functions (AI proxy → Claude API)
```

### Dual-mode operation

- **Unauthenticated:** Demo-only (Phase 2). Data in localStorage. No document upload, no AI generation.
- **Authenticated:** Full functionality. Data in Supabase. Document upload, interview guide, AI generation via proxy.

## Existing auth scaffolding

The codebase already has auth hooks prepared for Supabase:

- `src/hooks/useAuthContext.ts` — decodes JWT from `localStorage.getItem('cairn_access_token')`, extracts `role`, `plan`, `tenantId` from `app_metadata`. Supports roles (OWNER, ADMIN, EDITOR, VIEWER, BOARD) and plans (FREE, PRO, ENTERPRISE).
- `src/hooks/useApiClient.ts` — attaches JWT as Bearer token, targets `VITE_API_URL + /api/v1/...`.
- `src/App.tsx` — already imports `useAuthContext()` with board-user gating.

**Decision:** Replace `useAuthContext` with a new reactive `AuthProvider` that uses Supabase's `onAuthStateChange` listener. The existing hook has a stale-data bug (empty `useMemo` dependency array — auth state never updates after mount). The new provider wraps the app and provides reactive session state.

Replace `useApiClient` with direct Supabase client calls. `VITE_API_URL` is superseded by `VITE_SUPABASE_URL`. The existing role/plan types are preserved in the new auth context for forward compatibility.

## Auth flow

### Registration
- Email + password via Supabase Auth
- Consent checkbox at registration: "Bidra anonymt til forskning" (opt-in)
- Consent stored in `raw_user_meta_data` at signup, then synced to `profiles.consent_research` via trigger
- Email verification required

### Login
- Email + password
- Session managed by Supabase JS client (localStorage-based token management — no custom backend needed for httpOnly cookies)

### Password reset
- "Glemt passord?" link on login page
- Uses `supabase.auth.resetPasswordForEmail()`
- Redirect to password update page

### UI
- Custom login/register forms (not `@supabase/auth-ui-react` — it's minimal and won't match Cairn's design language)
- Header shows user menu (logged in) or "Logg inn" button
- Login/register as dedicated page at `/login`
- `/app/*` routes require authentication (redirect to `/login` if unauthenticated)
- `/` landing page and `/demo` accessible without auth

### Auth error/loading states
- Registration pending email verification → "Sjekk eposten din" message
- Expired session → automatic redirect to login with "Sesjonen utløp" message
- Network error during auth → inline error with retry
- Rate limit exceeded on AI generation → "Du har brukt opp dagens genereringer. Prøv igjen i morgen."

## Database schema

```sql
-- profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  consent_research boolean default false,
  created_at timestamptz default now()
);

-- workspaces (one per strategic picture)
create table workspaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null default 'Hovedscenario',
  state jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- generation_log (rate limiting)
create table generation_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Row-Level Security: profiles
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Row-Level Security: workspaces
alter table workspaces enable row level security;

create policy "Users CRUD own workspaces"
  on workspaces for all using (auth.uid() = user_id);

-- Row-Level Security: generation_log
alter table generation_log enable row level security;

create policy "Users read own generation log"
  on generation_log for select using (auth.uid() = user_id);

create policy "Users insert own generation log"
  on generation_log for insert with check (auth.uid() = user_id);

-- Auto-update updated_at on workspaces
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at();

-- Auto-create profile on signup (with consent from user_meta_data)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, consent_research)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    coalesce((new.raw_user_meta_data->>'consent_research')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

`state` as JSONB is deliberate — Cairn's AppState is already a serializable object in localStorage. Same model, just in Supabase. No need to normalize strategies/capabilities/initiatives into separate tables yet.

`on delete cascade` on all foreign keys ensures account deletion cleanly removes all user data (GDPR compliance).

## AI proxy via Supabase Edge Functions

### Why
- No API key in the browser
- Directors don't know what an API key is
- Full control over data flowing to Claude API (enables Phase 4 data collection)
- Natural point for future pricing

### Edge Function: `generate-strategic-picture`

```
POST /functions/v1/generate-strategic-picture
Authorization: Bearer <supabase-jwt>
Body: { "input": "<concatenated text>" }
Response: { GeneratedStrategicPicture JSON }
```

- Verifies user is authenticated via JWT
- Calls Claude API with Cairn's API key (stored as Supabase secret)
- Rate limit: max 10 generations per user per day, tracked via `generation_log` table. Edge Function counts rows for user where `created_at > now() - interval '1 day'` before proceeding.
- Model: claude-sonnet-4-20250514, max_tokens: 4096
- Returns complete JSON response (no streaming)

### Edge Function: `ai-chat`

Proxies the existing `streamChatResponse` functionality (currently in `src/lib/ai/claude.ts`). Streams response back to client.

### Edge Function: `ai-form-suggest`

Proxies the existing `getFormSuggestion` functionality (currently in `src/lib/ai/claude.ts`). Returns suggestion JSON.

### Scope of AI proxy migration

All three direct-to-Anthropic API calls in `src/lib/ai/claude.ts` (`streamChatResponse`, `getFormSuggestion`) and `src/lib/ai/generateStrategicPicture.ts` are moved behind Edge Functions for authenticated users. No API key touches the browser for logged-in users.

For unauthenticated demo mode: no AI calls at all (pre-generated example data).

## Frontend changes

### New files

| File | Responsibility |
|------|----------------|
| `src/lib/supabase.ts` | Supabase client initialization |
| `src/providers/AuthProvider.tsx` | Auth context with `onAuthStateChange` — reactive session, user, role, plan |
| `src/pages/Login.tsx` | Custom login/register/password-reset forms |
| `supabase/functions/generate-strategic-picture/index.ts` | Edge Function: AI generation proxy |
| `supabase/functions/ai-chat/index.ts` | Edge Function: chat streaming proxy |
| `supabase/functions/ai-form-suggest/index.ts` | Edge Function: form suggestion proxy |
| `supabase/migrations/001_initial_schema.sql` | Database schema + RLS + triggers |

### Modified files

| File | Change |
|------|--------|
| `src/stores/useStore.ts` | Dual persistence: Supabase for authenticated, localStorage for unauthenticated |
| `src/lib/ai/generateStrategicPicture.ts` | Add proxy mode (call Edge Function instead of direct API) |
| `src/lib/ai/claude.ts` | Add proxy mode for chat and form suggestions |
| `src/components/onboarding/StepUpload.tsx` | Remove API key section for authenticated users |
| `src/App.tsx` | Wrap with AuthProvider, add login route, protect `/app/*` routes |
| `src/main.tsx` | Add `/login` route |
| Root layout / header | Add user menu or login button |

### Removed/replaced files

| File | Action |
|------|--------|
| `src/hooks/useAuthContext.ts` | Replace with `AuthProvider` (reactive, Supabase-based) |
| `src/hooks/useApiClient.ts` | Replace with direct Supabase client calls |

### Persistence strategy

- **Authenticated:** On save, upsert workspace to Supabase. On load, fetch workspace from Supabase.
- **Unauthenticated:** localStorage as today (demo mode only).
- **Migration path:** When a user who explored demo mode registers, offer to import their localStorage data into their new account.

## What does NOT change

- Demo flow — designed separately in Phase 2
- Interview guide — Phase 3
- Data collection pipeline — Phase 4
- Core app logic (stores, components, views) — only persistence layer changes
- Vercel deployment — remains the same, just add Supabase env vars

## Environment variables

Vercel (frontend):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous/public key

Supabase secrets (Edge Functions):
- `ANTHROPIC_API_KEY` — Cairn's Claude API key

## Verification

1. Register new account with consent → profile created with `consent_research = true`
2. Register without consent → profile created with `consent_research = false`
3. Login → session active, header shows user menu
4. Logout → returns to unauthenticated state
5. Password reset → email received, can set new password
6. Generate strategic picture (authenticated) → works without API key input
7. AI chat (authenticated) → works without API key input
8. Rate limit → 11th generation in a day returns error message
9. RLS → user A cannot see user B's workspaces
10. Save workspace → data persisted in Supabase
11. Reload page → workspace loaded from Supabase
12. Unauthenticated user → can browse landing/demo but cannot upload/generate
13. Delete account → all user data cascade-deleted
14. Expired session → redirected to login with message
15. `npm run build` → clean
