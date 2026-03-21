# Auth + Supabase Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase authentication, database persistence, and AI proxy to Cairn, replacing the current client-only localStorage approach for authenticated users.

**Architecture:** Supabase provides auth (JWT), database (profiles + workspaces with RLS), and Edge Functions (AI proxy to Claude API). The React SPA on Vercel communicates directly with Supabase via the JS client. Unauthenticated users get localStorage-only demo mode. Authenticated users get server-side persistence and AI generation without needing an API key.

**Tech Stack:** React 19, Zustand 5, Supabase (auth + postgres + edge functions), Deno (edge functions runtime), TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/001_initial_schema.sql` | Create | Database schema, RLS, triggers |
| `supabase/functions/generate-strategic-picture/index.ts` | Create | AI generation proxy with rate limiting |
| `supabase/functions/ai-chat/index.ts` | Create | Chat streaming proxy |
| `supabase/functions/ai-form-suggest/index.ts` | Create | Form suggestion proxy |
| `src/lib/supabase.ts` | Create | Supabase client singleton |
| `src/providers/AuthProvider.tsx` | Create | Reactive auth context with onAuthStateChange |
| `src/pages/Login.tsx` | Create | Login/register/password-reset forms |
| `src/lib/ai/generateStrategicPicture.ts` | Modify | Add Edge Function proxy mode |
| `src/lib/ai/claude.ts` | Modify | Add Edge Function proxy mode for chat + form suggest |
| `src/stores/useStore.ts` | Modify | Dual persistence (Supabase / localStorage) |
| `src/components/onboarding/StepUpload.tsx` | Modify | Conditionally hide API key input |
| `src/App.tsx` | Modify | Wrap with AuthProvider, protect routes |
| `src/main.tsx` | Modify | Add /login route |
| `src/hooks/useAuthContext.ts` | Delete | Replaced by AuthProvider |
| `src/hooks/useApiClient.ts` | Delete | Replaced by direct Supabase client |
| `src/hooks/useAIChat.ts` | Modify | Make apiKey optional, use proxy when authenticated |
| `src/components/ai/AIFormAssist.tsx` | Modify | Make apiKey optional, use proxy when authenticated |
| `src/components/settings/DataTab.tsx` | Modify | Replace useApiClient with Supabase client |
| `src/components/settings/TeamTab.tsx` | Modify | Replace useApiClient with Supabase client |
| `src/components/settings/OrganisationTab.tsx` | Modify | Replace useApiClient with Supabase client |
| `src/components/settings/LocalStorageMigration.tsx` | Modify | Replace useApiClient with Supabase client |
| `src/i18n/locales/nb.json` | Modify | Auth-related i18n keys |
| `src/i18n/locales/en.json` | Modify | Auth-related i18n keys |

---

### Task 1: Supabase project setup and database migration

**Prerequisites:** Create a Supabase project at https://supabase.com. Note the project URL and anon key.

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `.env.local` (gitignored)

- [ ] **Step 1: Install Supabase CLI and init project**

```bash
npm install @supabase/supabase-js
npx supabase init
```

This creates the `supabase/` directory structure.

- [ ] **Step 2: Create the migration file**

Create `supabase/migrations/001_initial_schema.sql`:

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

-- Index for rate limit queries
create index generation_log_user_date on generation_log (user_id, created_at);

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

- [ ] **Step 3: Create `.env.local`**

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Verify `.env.local` is in `.gitignore`. If not, add it.

- [ ] **Step 4: Apply migration to Supabase**

```bash
npx supabase db push
```

Or apply via the Supabase dashboard SQL editor if not using CLI link.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql supabase/config.toml
git commit -m "feat: add Supabase schema with profiles, workspaces, and RLS"
```

---

### Task 2: Supabase client library

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create the Supabase client singleton**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing — running in local-only mode');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
```

The `null` fallback allows the app to run without Supabase configured (local dev, demo mode).

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: add Supabase client library"
```

---

### Task 3: AuthProvider (replace useAuthContext)

**Files:**
- Create: `src/providers/AuthProvider.tsx`
- Modify: `src/App.tsx`
- Delete: `src/hooks/useAuthContext.ts`
- Delete: `src/hooks/useApiClient.ts`

- [ ] **Step 1: Create AuthProvider**

Create `src/providers/AuthProvider.tsx`:

```typescript
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type TenantRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'BOARD';
type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  role: TenantRole | null;
  plan: PlanTier | null;
  tenantId: string | null;
  userId: string | null;
  signUp: (email: string, password: string, meta?: { display_name?: string; consent_research?: boolean }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;
  const appMeta = (user?.app_metadata ?? {}) as Record<string, unknown>;

  const signUp = useCallback(async (email: string, password: string, meta?: { display_name?: string; consent_research?: boolean }) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error ? new Error(error.message) : null };
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: !!session,
    isLoading,
    session,
    user,
    role: (appMeta.role as TenantRole) ?? null,
    plan: (appMeta.plan as PlanTier) ?? null,
    tenantId: (appMeta.tenant_id as string) ?? null,
    userId: user?.id ?? null,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Update App.tsx — replace useAuthContext with useAuth**

In `src/App.tsx`:
- Replace `import { useAuthContext } from './hooks/useAuthContext';` with `import { useAuth } from './providers/AuthProvider';`
- Replace `const auth = useAuthContext();` with `const auth = useAuth();`
- Everything else (board-user gating) stays the same since the interface is compatible.

- [ ] **Step 3: Wrap the app with AuthProvider in main.tsx**

In `src/main.tsx`, wrap the router with `AuthProvider`:
```typescript
import { AuthProvider } from './providers/AuthProvider';
```

Wrap inside `<BrowserRouter>`:
```tsx
<AuthProvider>
  <Routes>
    ...existing routes...
  </Routes>
</AuthProvider>
```

- [ ] **Step 4: Delete old auth hooks and update consumers**

Delete `src/hooks/useAuthContext.ts`.

Delete `src/hooks/useApiClient.ts` — but first update its four consumers. These settings components use `useApiClient()` to make API calls that currently target `VITE_API_URL` (which may not exist yet). Replace with Supabase client calls:

In each of these files, replace `import { useApiClient } from '../../hooks/useApiClient';` with `import { supabase } from '../../lib/supabase';` and replace `const api = useApiClient();` with direct Supabase calls. Since these settings tabs (TeamTab, OrganisationTab, DataTab, LocalStorageMigration) target server endpoints that don't exist in Supabase yet, stub them to show "Coming soon" or make them no-ops for now. The key thing is they must compile:

- `src/components/settings/DataTab.tsx` — remove `useApiClient` import, replace API calls with Supabase workspace operations or no-ops
- `src/components/settings/TeamTab.tsx` — remove `useApiClient` import, stub the member list (team management comes later)
- `src/components/settings/OrganisationTab.tsx` — remove `useApiClient` import, stub org data (read from profile instead)
- `src/components/settings/LocalStorageMigration.tsx` — remove `useApiClient` import, this component will be repurposed in the localStorage-to-Supabase migration flow

Search for any remaining imports:
```bash
grep -r "useAuthContext\|useApiClient" src/ --include="*.ts" --include="*.tsx"
```

Replace any remaining `useAuthContext()` calls with `useAuth()`.

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

Expected: Clean build. The app should work identically to before (no Supabase session = unauthenticated = same behavior as old useAuthContext with no token).

- [ ] **Step 6: Commit**

```bash
git add src/providers/AuthProvider.tsx src/App.tsx src/main.tsx
git rm src/hooks/useAuthContext.ts src/hooks/useApiClient.ts
git commit -m "feat: add reactive AuthProvider, replace stale useAuthContext"
```

---

### Task 4: Auth i18n keys

**Files:**
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Add Norwegian auth keys**

Add a new top-level `"auth"` section in `nb.json`:

```json
"auth": {
  "login": "Logg inn",
  "register": "Opprett konto",
  "logout": "Logg ut",
  "email": "E-post",
  "password": "Passord",
  "displayName": "Navn",
  "consentResearch": "Bidra anonymt til forskning",
  "forgotPassword": "Glemt passord?",
  "resetPassword": "Tilbakestill passord",
  "resetPasswordSent": "Sjekk eposten din for tilbakestillingslenke",
  "checkEmail": "Sjekk eposten din for å bekrefte kontoen",
  "sessionExpired": "Sesjonen utløp. Logg inn på nytt.",
  "loginError": "Feil e-post eller passord",
  "registerError": "Kunne ikke opprette konto",
  "noAccount": "Har du ikke konto?",
  "hasAccount": "Har du allerede en konto?",
  "rateLimitExceeded": "Du har brukt opp dagens genereringer. Prøv igjen i morgen.",
  "userMenu": "Min konto"
}
```

- [ ] **Step 2: Add English auth keys**

Add a new top-level `"auth"` section in `en.json`:

```json
"auth": {
  "login": "Log in",
  "register": "Create account",
  "logout": "Log out",
  "email": "Email",
  "password": "Password",
  "displayName": "Name",
  "consentResearch": "Contribute anonymously to research",
  "forgotPassword": "Forgot password?",
  "resetPassword": "Reset password",
  "resetPasswordSent": "Check your email for a reset link",
  "checkEmail": "Check your email to verify your account",
  "sessionExpired": "Session expired. Please log in again.",
  "loginError": "Incorrect email or password",
  "registerError": "Could not create account",
  "noAccount": "Don't have an account?",
  "hasAccount": "Already have an account?",
  "rateLimitExceeded": "You've used all of today's generations. Try again tomorrow.",
  "userMenu": "My account"
}
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/nb.json src/i18n/locales/en.json
git commit -m "feat: add auth i18n keys (nb + en)"
```

---

### Task 5: Login/Register page and routing

**Files:**
- Create: `src/pages/Login.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create Login page**

Create `src/pages/Login.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

type Mode = 'login' | 'register' | 'reset';

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [consentResearch, setConsentResearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(t('auth.loginError'));
        } else {
          navigate('/app', { replace: true });
        }
      } else if (mode === 'register') {
        const { error } = await signUp(email, password, {
          display_name: displayName,
          consent_research: consentResearch,
        });
        if (error) {
          setError(t('auth.registerError'));
        } else {
          setMessage(t('auth.checkEmail'));
        }
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setMessage(t('auth.resetPasswordSent'));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-xl font-bold text-text-primary text-center mb-6">
          {mode === 'login' && t('auth.login')}
          {mode === 'register' && t('auth.register')}
          {mode === 'reset' && t('auth.resetPassword')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('auth.displayName')}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary placeholder:text-text-tertiary"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.email')}
            required
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary placeholder:text-text-tertiary"
          />

          {mode !== 'reset' && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              required
              minLength={6}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary placeholder:text-text-tertiary"
            />
          )}

          {mode === 'register' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consentResearch}
                onChange={(e) => setConsentResearch(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary"
              />
              <span className="text-xs text-text-secondary">{t('auth.consentResearch')}</span>
            </label>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {message && (
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '...' : (
              mode === 'login' ? t('auth.login') :
              mode === 'register' ? t('auth.register') :
              t('auth.resetPassword')
            )}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {mode === 'login' && (
            <>
              <button
                onClick={() => { setMode('reset'); setError(null); setMessage(null); }}
                className="text-xs text-text-tertiary hover:text-primary transition-colors"
              >
                {t('auth.forgotPassword')}
              </button>
              <p className="text-xs text-text-tertiary">
                {t('auth.noAccount')}{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); setMessage(null); }}
                  className="text-primary font-medium hover:underline"
                >
                  {t('auth.register')}
                </button>
              </p>
            </>
          )}

          {mode === 'register' && (
            <p className="text-xs text-text-tertiary">
              {t('auth.hasAccount')}{' '}
              <button
                onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                className="text-primary font-medium hover:underline"
              >
                {t('auth.login')}
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => { setMode('login'); setError(null); setMessage(null); }}
              className="text-xs text-primary font-medium hover:underline"
            >
              {t('auth.login')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add /login route to main.tsx**

In `src/main.tsx`, add the login route:

```typescript
import { Login } from './pages/Login';
```

Add before the `/app/*` route:
```tsx
<Route path="/login" element={<Login />} />
```

- [ ] **Step 3: Add route protection for /app/***

In `src/main.tsx`, create a simple route guard component and wrap the App route:

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './providers/AuthProvider';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

Wrap the App route:
```tsx
<Route path="/app/*" element={<RequireAuth><App /></RequireAuth>} />
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

Expected: Clean build. Navigate to `/login` in browser — should show login form.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Login.tsx src/main.tsx
git commit -m "feat: add login/register page with route protection"
```

---

### Task 6: Header user menu

**Files:**
- Modify: `src/App.tsx` (the header is rendered inline in App.tsx, lines ~98-143)
- Alternatively: `src/components/header/HeaderMenu.tsx` if it exists as a separate component

- [ ] **Step 1: Identify the exact header location**

The header is rendered inline in `src/App.tsx`. Read the file and find the `<nav>` or header section (around lines 98-143). If there's a separate `HeaderMenu` component, use that instead.

- [ ] **Step 2: Add user menu to header**

Add a conditional section to the header:
- If `isAuthenticated`: show user email/name + "Logg ut" button
- If not: show "Logg inn" link to `/login`

```tsx
import { useAuth } from '../providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Inside the header component:
const { isAuthenticated, user, signOut } = useAuth();
const navigate = useNavigate();
const { t } = useTranslation();

// In the JSX, add to the right side of the header:
{isAuthenticated ? (
  <div className="flex items-center gap-3">
    <span className="text-xs text-text-secondary">{user?.email}</span>
    <button
      onClick={async () => { await signOut(); navigate('/login'); }}
      className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
    >
      {t('auth.logout')}
    </button>
  </div>
) : (
  <button
    onClick={() => navigate('/login')}
    className="text-xs font-medium text-primary hover:underline"
  >
    {t('auth.login')}
  </button>
)}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add <header-file>
git commit -m "feat: add user menu to header with login/logout"
```

---

### Task 7: Edge Function — generate-strategic-picture

**Files:**
- Create: `supabase/functions/generate-strategic-picture/index.ts`

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/generate-strategic-picture/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth
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

    // Parse input
    const { input } = await req.json();
    if (!input || typeof input !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Claude API
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a strategic advisor analyzing organizational documents to create a strategic overview.

Given the input (document text or organization description), generate a COMPLETE strategic picture as JSON.

Requirements:
- 3-5 strategies with clear priorities
- 12-18 capabilities organized in max 2 levels: 4-6 Level 1 capability domains and 2-3 Level 2 sub-capabilities per domain. This forms the organisation's first capability map.
- Generate capabilities SPECIFIC to this organisation based on the input provided. Do NOT use generic capability names. Level 1 capabilities should reflect the organisation's actual domains (e.g., for a municipality: 'Innbyggertjenester', 'Helse & Omsorg'; for an IT company: 'Produktutvikling', 'Tjenesteleveranse'). Level 2 should be concrete sub-capabilities.
- 8-15 initiatives distributed across ALL FOUR dimensions: ledelse, virksomhet, organisasjon, teknologi
- Each initiative MUST reference 1-3 capabilities by name from the capabilities list. Use exact capability names.
- 3-5 effects with types: cost, quality, speed, compliance, strategic
- 2-4 insights — observations about balance, gaps, or risks. Write in Norwegian. Be specific and provocative.

CRITICAL: Distribute initiatives across dimensions. Most organizations over-index on technology. Call this out explicitly in insights if present.

Respond with ONLY valid JSON matching this schema:
{
  "strategies": [{ "name": "", "description": "", "timeHorizon": "short|medium|long", "priority": 1-3 }],
  "capabilities": [{ "name": "", "description": "", "level": 1|2, "parent": null|"parent name", "maturity": 1-3, "risk": 1-3 }],
  "initiatives": [{ "name": "", "dimension": "ledelse|virksomhet|organisasjon|teknologi", "horizon": "near|far", "description": "", "capabilityNames": ["exact name of capability this builds"] }],
  "effects": [{ "name": "", "type": "cost|quality|speed|compliance|strategic", "description": "" }],
  "insights": ["string"]
}`;

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
        system: systemPrompt,
        messages: [{ role: 'user', content: input }],
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      return new Response(JSON.stringify({ error: `AI request failed: ${aiResponse.status}`, details: errBody }), {
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Set the Anthropic API key as a Supabase secret**

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

- [ ] **Step 3: Deploy the Edge Function**

```bash
npx supabase functions deploy generate-strategic-picture
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/generate-strategic-picture/index.ts
git commit -m "feat: add Edge Function for AI generation with rate limiting"
```

---

### Task 8: Edge Functions — ai-chat and ai-form-suggest

**Files:**
- Create: `supabase/functions/ai-chat/index.ts`
- Create: `supabase/functions/ai-form-suggest/index.ts`

- [ ] **Step 1: Create ai-chat Edge Function**

Create `supabase/functions/ai-chat/index.ts`. This proxies streaming chat responses:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { messages, systemPrompt } = await req.json();

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({ error: `AI request failed: ${aiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream the response through
    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Create ai-form-suggest Edge Function**

Create `supabase/functions/ai-form-suggest/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { messages, systemPrompt } = await req.json();

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({ error: `AI request failed: ${aiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    return new Response(JSON.stringify(aiData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 3: Deploy both Edge Functions**

```bash
npx supabase functions deploy ai-chat
npx supabase functions deploy ai-form-suggest
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-chat/index.ts supabase/functions/ai-form-suggest/index.ts
git commit -m "feat: add Edge Functions for AI chat and form suggestions"
```

---

### Task 9: Frontend AI proxy mode

**Files:**
- Modify: `src/lib/ai/generateStrategicPicture.ts`
- Modify: `src/lib/ai/claude.ts`

- [ ] **Step 1: Update generateStrategicPicture to support proxy mode**

In `src/lib/ai/generateStrategicPicture.ts`, replace the `generateStrategicPicture` function (keep `parseStrategicPicture` and the `SYSTEM_PROMPT` unchanged):

```typescript
import { supabase } from '../supabase';

export async function generateStrategicPicture(
  input: string,
  apiKey?: string,
  signal?: AbortSignal,
): Promise<GeneratedStrategicPicture> {
  let text: string;

  if (supabase && !apiKey) {
    // Proxy mode: call Edge Function
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-strategic-picture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ input }),
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
  } else if (apiKey) {
    // Direct mode: call Anthropic API (power-user / unauthenticated)
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
    text = data.content[0].text;
  } else {
    throw new Error('No API key and no Supabase session');
  }

  return parseStrategicPicture(text);
}
```

The third parameter `apiKey` becomes optional. If Supabase is configured and no API key is provided, it uses the proxy. If an API key is provided, it uses direct mode (backwards compatible).

- [ ] **Step 2: Update claude.ts — add proxy mode for streamChatResponse**

In `src/lib/ai/claude.ts`, update `streamChatResponse` to accept an optional `apiKey`. When no key is provided and Supabase is available, call the Edge Function:

Add at the top:
```typescript
import { supabase } from '../supabase';
```

Update the function signature and add proxy branch:
```typescript
export async function* streamChatResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey?: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  let response: Response;

  if (supabase && !apiKey) {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new AIError('Not authenticated', 401);

    response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages, systemPrompt }),
        signal,
      }
    );
  } else if (apiKey) {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages,
      }),
      signal,
    });
  } else {
    throw new AIError('No API key and no Supabase session', 401);
  }

  if (!response.ok) {
    throw new AIError(`AI request failed: ${response.status}`, response.status);
  }

  // ... rest of SSE parsing stays the same ...
}
```

- [ ] **Step 3: Update claude.ts — add proxy mode for getFormSuggestion**

Similarly update `getFormSuggestion` to use proxy when authenticated. **Important:** Preserve the existing message construction logic (which uses Norwegian prompt text). The proxy branch should construct the same messages and pass them to the Edge Function. Read the current `getFormSuggestion` function body to get the exact message format, then replicate it in both branches:

```typescript
export async function getFormSuggestion(
  description: string,
  context: string,
  tabType: 'initiative' | 'capability',
  systemPrompt: string,
  apiKey?: string,
): Promise<Record<string, unknown>> {
  // Build messages using the EXISTING format from the current function
  // Read claude.ts to get the exact Norwegian prompt text
  const messages = [/* ... existing message construction ... */];

  let aiData: { content: Array<{ text: string }> };

  if (supabase && !apiKey) {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new AIError('Not authenticated', 401);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-form-suggest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages, systemPrompt }),
      }
    );

    if (!response.ok) throw new AIError(`AI request failed: ${response.status}`, response.status);
    aiData = await response.json();
  } else if (apiKey) {
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
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) throw new AIError(`AI request failed: ${response.status}`, response.status);
    aiData = await response.json();
  } else {
    throw new AIError('No API key and no Supabase session', 401);
  }

  return parseJsonObjectFromAI(aiData.content[0].text);
}
```

- [ ] **Step 4: Update all AI function callers**

Three files call these AI functions and need updating:

**`src/hooks/useAIChat.ts`** — calls `streamChatResponse(messages, systemPrompt, apiKey, signal)`.
Update: make apiKey optional. When the user is authenticated (check via `useAuth()`), pass `undefined` for apiKey so the function uses the proxy. When unauthenticated, pass the stored API key as before.

**`src/components/ai/AIFormAssist.tsx`** — calls `getFormSuggestion(text, context, tabType, systemPrompt, apiKey)`.
Update: same pattern. When authenticated, omit apiKey. When unauthenticated, pass stored key.

**`src/components/onboarding/StepUpload.tsx`** — handled in Task 10.

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

Expected: Clean build. Functions now support both modes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/generateStrategicPicture.ts src/lib/ai/claude.ts
git commit -m "feat: add AI proxy mode via Supabase Edge Functions"
```

---

### Task 10: Update StepUpload — remove API key for authenticated users

**Files:**
- Modify: `src/components/onboarding/StepUpload.tsx`

- [ ] **Step 1: Add auth context and conditionally hide API key**

In `src/components/onboarding/StepUpload.tsx`:

Add import:
```typescript
import { useAuth } from '../../providers/AuthProvider';
```

Inside the component, add:
```typescript
const { isAuthenticated } = useAuth();
```

Update `handleGenerate` — when authenticated, don't require API key:
```typescript
  const handleGenerate = async () => {
    // ... input assembly stays the same ...

    let key: string | undefined;
    if (!isAuthenticated) {
      key = getApiKey();
      if (!key) {
        if (!apiKeyInput.trim()) {
          setGenerationError(t('onboarding.upload.needApiKey'));
          return;
        }
        key = apiKeyInput.trim();
        setApiKey(key, persistKey);
      }
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateStrategicPicture(input, key);
      setGeneratedPicture(result);
      nextStep();
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMIT') {
        setGenerationError(t('auth.rateLimitExceeded'));
      } else {
        setGenerationError(err instanceof Error ? err.message : t('onboarding.upload.error'));
      }
    } finally {
      setIsGenerating(false);
    }
  };
```

Update `hasApiKey`:
```typescript
  const hasApiKey = isAuthenticated || !!getApiKey() || apiKeyInput.trim().length > 0;
```

Wrap the API key input section with the auth check:
```tsx
{!isAuthenticated && !getApiKey() && (
  <div className="space-y-2">
    {/* ... existing API key input ... */}
  </div>
)}
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: Clean build. Authenticated users see no API key input. Unauthenticated users see it as before.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/StepUpload.tsx
git commit -m "feat: hide API key input for authenticated users"
```

---

### Task 11: Dual persistence in store

**Files:**
- Modify: `src/stores/useStore.ts`

- [ ] **Step 1: Add workspace save/load functions**

Add to `src/stores/useStore.ts` (or create `src/lib/workspace.ts` if the store file is too large):

```typescript
import { supabase } from '../lib/supabase';

export async function saveWorkspaceToSupabase(workspaceId: string, name: string, state: object): Promise<void> {
  if (!supabase) return;
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return;

  await supabase
    .from('workspaces')
    .upsert({
      id: workspaceId,
      user_id: session.user.id,
      name,
      state,
    }, { onConflict: 'id' });
}

export async function loadWorkspaceFromSupabase(workspaceId: string): Promise<object | null> {
  if (!supabase) return null;
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return null;

  const { data } = await supabase
    .from('workspaces')
    .select('state')
    .eq('id', workspaceId)
    .single();

  return data?.state ?? null;
}

export async function listWorkspacesFromSupabase(): Promise<Array<{ id: string; name: string; updated_at: string }>> {
  if (!supabase) return [];
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return [];

  const { data } = await supabase
    .from('workspaces')
    .select('id, name, updated_at')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false });

  return data ?? [];
}
```

- [ ] **Step 2: Add `activeWorkspaceId` to the store**

Add to the `AppState` interface in `src/stores/useStore.ts`:
```typescript
activeWorkspaceId: string | null;
```

Initial value: `null`. Set to the workspace ID when loading from Supabase.

Add to the partialize function so it gets persisted.

- [ ] **Step 3: Add debounced auto-save to the store**

Create a Supabase sync hook in a new file `src/hooks/useSupabaseSync.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { useAuth } from '../providers/AuthProvider';
import { saveWorkspaceToSupabase, loadWorkspaceFromSupabase, listWorkspacesFromSupabase } from '../lib/workspace';

export function useSupabaseSync() {
  const { isAuthenticated, userId } = useAuth();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load workspace from Supabase on auth
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    async function loadWorkspace() {
      const workspaces = await listWorkspacesFromSupabase();
      if (workspaces.length > 0) {
        const state = await loadWorkspaceFromSupabase(workspaces[0].id);
        if (state) {
          useStore.getState().importState(state as Partial<AppState>);
          useStore.setState({ activeWorkspaceId: workspaces[0].id });
        }
      }
    }
    loadWorkspace();
  }, [isAuthenticated, userId]);

  // Auto-save on state changes (debounced)
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsub = useStore.subscribe((state) => {
      if (!state.activeWorkspaceId) return;
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveWorkspaceToSupabase(state.activeWorkspaceId!, 'Hovedscenario', state);
      }, 2000);
    });

    return () => {
      unsub();
      clearTimeout(saveTimeoutRef.current);
    };
  }, [isAuthenticated]);
}
```

Call `useSupabaseSync()` from `App.tsx`.

The existing Zustand `persist` middleware continues to work as a local cache for both modes. For authenticated users, Supabase is the source of truth, loaded on auth.

- [ ] **Step 4: Add localStorage migration on first login**

After a user registers and logs in for the first time, check if there's existing data in localStorage (`cairn-storage` key). If so, offer to import it as their first workspace:

In `useSupabaseSync`, add to the loadWorkspace function:
```typescript
if (workspaces.length === 0) {
  // New user — check for existing localStorage data
  const localData = localStorage.getItem('cairn-storage');
  if (localData) {
    const parsed = JSON.parse(localData);
    if (parsed.state) {
      // Create a new workspace from localStorage data
      const newId = crypto.randomUUID();
      await saveWorkspaceToSupabase(newId, 'Hovedscenario', parsed.state);
      useStore.setState({ activeWorkspaceId: newId });
    }
  }
}
```

- [ ] **Step 5: Add expired session handling**

In `AuthProvider.tsx`, listen for the `TOKEN_REFRESHED` and `SIGNED_OUT` events in `onAuthStateChange`:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  setSession(session);
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    // Session expired or user signed out
    window.location.href = '/login?expired=true';
  }
});
```

In `Login.tsx`, check for the `expired` query parameter and show the message:
```typescript
const searchParams = new URLSearchParams(window.location.search);
const isExpired = searchParams.get('expired') === 'true';
// Show t('auth.sessionExpired') message if isExpired
```

- [ ] **Step 6: Build and verify**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/stores/useStore.ts src/lib/workspace.ts src/hooks/useSupabaseSync.ts src/providers/AuthProvider.tsx src/App.tsx
git commit -m "feat: add dual persistence — Supabase for authenticated, localStorage for demo"
```

---

## Verification Checklist

After all tasks are complete, verify end-to-end:

1. `npm run build` → clean
2. Register new account with consent → profile in Supabase with `consent_research = true`
3. Register without consent → `consent_research = false`
4. Login → session active, header shows user email + logout
5. Logout → redirected to login, header shows "Logg inn"
6. Password reset → email received
7. Generate strategic picture (authenticated) → works without API key input
8. Rate limit → 11th generation shows Norwegian error message
9. Navigate to `/app` without auth → redirected to `/login`
10. Save workspace → data in Supabase `workspaces` table
11. Reload → workspace loaded from Supabase
12. Unauthenticated at `/` → landing page loads fine
