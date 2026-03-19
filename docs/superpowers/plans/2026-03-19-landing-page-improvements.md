# Landing Page Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix landing page copy (hero, problem section), resolve Norwegian/English language mixing in product preview, improve differentiation contrast, and add a working contact form via Vercel serverless + Resend.

**Architecture:** Translation-driven copy changes in i18n JSON files, component simplification in ProblemSection, i18n-aware preview data, CSS contrast fixes, and a new Vercel API route (`api/contact.ts`) with Resend for email delivery.

**Tech Stack:** React 19 / TypeScript / react-i18next / Vercel Serverless Functions / Resend API

**Spec:** `docs/superpowers/specs/2026-03-19-landing-page-copy-and-form-design.md`

---

## File Structure

### New Files
- `api/contact.ts` — Vercel serverless function that sends notification email via Resend

### Modified Files
- `src/i18n/locales/en.json` — rewrite landing.hero and landing.problem keys
- `src/i18n/locales/nb.json` — rewrite corresponding Norwegian keys
- `src/components/landing/sections/ProblemSection.tsx` — remove silo cards, simplify to 3 paragraphs
- `src/data/landingPreviewData.ts` — add bilingual name support (en/nb)
- `src/components/landing/sections/ProductPreview.tsx` — use i18n for dimension labels and initiative names
- `src/components/landing/sections/DifferentiationSection.tsx` — update color values for contrast
- `src/components/landing/sections/CTASection.tsx` — integrate with `/api/contact` endpoint
- `vercel.json` — add API route before SPA catch-all rewrite
- `package.json` — add `resend` dependency

---

## Task 1: Update Hero and Problem Copy

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/components/landing/sections/ProblemSection.tsx`

- [ ] **Step 1: Update English hero copy in en.json**

Replace the `landing.hero` keys:

```json
"hero": {
  "headline": "When the fog rolls in, you don't need a better map. You need a cairn.",
  "subline1": "Cairn connects strategy to execution — through capabilities, initiatives, and effects — in one living picture.",
  "cta": "Request early access",
  "emailPlaceholder": "your@email.com",
  "submitted": "You're on the list — we'll be in touch."
}
```

Remove `subline2` key (no longer needed — the two old sublines are merged into the new `subline1`).

- [ ] **Step 2: Update Norwegian hero copy in nb.json**

```json
"hero": {
  "headline": "Når tåken legger seg, trenger du ikke et bedre kart. Du trenger en varde.",
  "subline1": "Cairn kobler strategi til gjennomføring — gjennom kapabiliteter, initiativer og effekter — i ett levende bilde.",
  "cta": "Ta kontakt",
  "emailPlaceholder": "din@epost.no",
  "submitted": "Du er på listen — vi tar kontakt."
}
```

- [ ] **Step 3: Update English problem copy in en.json**

Replace the `landing.problem` keys:

```json
"problem": {
  "context": "Leaders navigate constant change — in technology, regulation, and markets. The further ahead you look, the harder it is to see clearly. That's not a failure of planning. It's the nature of leading through complexity.",
  "headline": "Most organisations have a strategy. Most have projects. But the link between them — from strategic intent to actual impact — is invisible. Initiatives live in one tool, strategy in another, capabilities in a third. No one sees the full picture.",
  "closing": "Cairn makes the connections visible — so you can lead, not just plan."
}
```

Remove `body1`, `silo1`, `silo2`, `silo3` keys.

- [ ] **Step 4: Update Norwegian problem copy in nb.json**

```json
"problem": {
  "context": "Ledere navigerer konstant endring — i teknologi, regulering og markeder. Jo lenger frem du ser, desto vanskeligere er det å se klart. Det er ikke en svikt i planleggingen. Det er naturen av å lede gjennom kompleksitet.",
  "headline": "De fleste organisasjoner har en strategi. De fleste har prosjekter. Men koblingen mellom dem — fra strategisk intensjon til faktisk effekt — er usynlig. Initiativene lever i ett verktøy, strategien i et annet, kapabilitetene i et tredje. Ingen ser hele bildet.",
  "closing": "Cairn gjør sammenhengene synlige — slik at du kan lede, ikke bare planlegge."
}
```

Remove `body1`, `silo1`, `silo2`, `silo3` keys.

- [ ] **Step 5: Simplify ProblemSection.tsx**

Remove the silo card rendering block (the `<div>` with `flexDirection: "column"` containing the 3 silo items, roughly lines 67-110). Remove the `body1` paragraph (lines 52-65). The section should now render:
1. Context paragraph (`t("landing.problem.context")`)
2. Headline (`t("landing.problem.headline")`)
3. Closing (`t("landing.problem.closing")`)

Also update `HeroSection.tsx` if it renders `subline2` — check and remove the reference to the deleted key.

- [ ] **Step 6: Verify build**

Run: `cd /Users/monsnorve/cairn/.worktrees/cairn-improvements && npx tsc -b && npx vite build`
Expected: Clean build, no errors

- [ ] **Step 7: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/nb.json src/components/landing/sections/ProblemSection.tsx src/components/landing/sections/HeroSection.tsx
git commit -m "feat: rewrite hero and problem section copy"
```

---

## Task 2: Fix Product Preview Language Mixing

**Files:**
- Modify: `src/data/landingPreviewData.ts`
- Modify: `src/components/landing/sections/ProductPreview.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/nb.json`

- [ ] **Step 1: Add bilingual data to landingPreviewData.ts**

Restructure each item to have `name` as `{ en: string, nb: string }`:

```typescript
export const landingPreviewData = {
  initiatives: [
    { id: 'l1', name: { en: 'New governance model', nb: 'Ny styringsmodell' }, dimension: 'ledelse' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 'v1', name: { en: 'Customer portal 2.0', nb: 'Kundeportal 2.0' }, dimension: 'virksomhet' as const, horizon: 'near' as const, status: 'in_progress' as const },
    { id: 'v2', name: { en: 'Automated reporting', nb: 'Automatisert rapportering' }, dimension: 'virksomhet' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 'o1', name: { en: 'Digital competency programme', nb: 'Kompetanseløft digital' }, dimension: 'organisasjon' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't1', name: { en: 'Cloud migration phase 2', nb: 'Skymigrering fase 2' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'in_progress' as const },
    { id: 't2', name: { en: 'API platform', nb: 'API-plattform' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't3', name: { en: 'IAM modernisation', nb: 'IAM-modernisering' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't4', name: { en: 'Data platform', nb: 'Dataplatform' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't5', name: { en: 'DevOps pipeline', nb: 'DevOps-pipeline' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'in_progress' as const },
    { id: 't6', name: { en: 'Legacy decommission', nb: 'Legacy-utfasing' }, dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't7', name: { en: 'Integration platform', nb: 'Integrasjonsplattform' }, dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't8', name: { en: 'AI/ML capability', nb: 'AI/ML-kapabilitet' }, dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't9', name: { en: 'Security programme', nb: 'Sikkerhetsprogram' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'in_progress' as const },
  ],
  capabilities: [
    { id: 'c1', name: { en: 'Cloud infrastructure', nb: 'Skyinfrastruktur' }, level: 1 as const, maturity: 2, risk: 2 },
    { id: 'c2', name: { en: 'Integration', nb: 'Integrasjon' }, level: 1 as const, maturity: 1, risk: 3 },
    { id: 'c3', name: { en: 'Data governance', nb: 'Datastyring' }, level: 1 as const, maturity: 1, risk: 2 },
    { id: 'c4', name: { en: 'Change management', nb: 'Endringsledelse' }, level: 1 as const, maturity: 1, risk: 3 },
    { id: 'c5', name: { en: 'Digital competence', nb: 'Digital kompetanse' }, level: 1 as const, maturity: 1, risk: 2 },
  ],
};
```

- [ ] **Step 2: Add dimension label translation keys**

In `en.json` under `landing.product`, add:

```json
"dimensions": {
  "ledelse": "Leadership",
  "virksomhet": "Business",
  "organisasjon": "Organisation",
  "teknologi": "Technology"
}
```

In `nb.json`:

```json
"dimensions": {
  "ledelse": "Ledelse",
  "virksomhet": "Virksomhet",
  "organisasjon": "Organisasjon",
  "teknologi": "Teknologi"
}
```

- [ ] **Step 3: Update ProductPreview.tsx to use i18n**

Replace the hardcoded `DIMENSION_LABELS` with:

```typescript
const getDimensionLabel = (dim: Dimension) => t(`landing.product.dimensions.${dim}`);
```

For initiative names, get current language and use it:

```typescript
import i18n from '../../../i18n';

// In component or where name is rendered:
const lang = i18n.language?.startsWith('nb') ? 'nb' : 'en';
// Then: item.name[lang] instead of item.name
```

Update all references to `item.name` → `item.name[lang]` and `DIMENSION_LABELS[dim]` → `getDimensionLabel(dim)`.

- [ ] **Step 4: Verify build**

Run: `cd /Users/monsnorve/cairn/.worktrees/cairn-improvements && npx tsc -b && npx vite build`
Expected: Clean build

- [ ] **Step 5: Commit**

```bash
git add src/data/landingPreviewData.ts src/components/landing/sections/ProductPreview.tsx src/i18n/locales/en.json src/i18n/locales/nb.json
git commit -m "feat: add bilingual support to product preview data and dimension labels"
```

---

## Task 3: Improve Differentiation Contrast

**Files:**
- Modify: `src/components/landing/sections/DifferentiationSection.tsx`

- [ ] **Step 1: Update color values**

In `DifferentiationSection.tsx`:

1. Eyebrow text color (line 31): `#3a4558` → `#64748b`
2. ✕ symbol opacity (line 63): `opacity: 0.5` → `opacity: 1`
3. Card text color (line 72): `#334155` → `#94a3b8`
4. Card border (line 55): `rgba(255,255,255,0.05)` → `rgba(255,255,255,0.1)`

- [ ] **Step 2: Verify build**

Run: `cd /Users/monsnorve/cairn/.worktrees/cairn-improvements && npx tsc -b`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/sections/DifferentiationSection.tsx
git commit -m "fix: improve contrast in differentiation section"
```

---

## Task 4: Contact Form with Vercel Serverless + Resend

**Files:**
- Create: `api/contact.ts`
- Modify: `vercel.json`
- Modify: `src/components/landing/sections/CTASection.tsx`
- Modify: `package.json`

**Pre-conditions (manual, not code tasks):**
- Sign up at resend.com, get API key
- Add `RESEND_API_KEY` to Vercel environment variables
- Verify cairnpath.io domain in Resend dashboard (TXT record)
- Set up ImprovMX for hello@cairnpath.io (MX records in Vercel DNS)

- [ ] **Step 1: Install resend dependency**

Run: `cd /Users/monsnorve/cairn/.worktrees/cairn-improvements && npm install resend`

- [ ] **Step 2: Update vercel.json**

The current `vercel.json` rewrites all routes to `index.html`. API routes must be excluded. Replace with:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The first rule ensures `/api/*` routes go to serverless functions. The second is the SPA catch-all.

- [ ] **Step 3: Create api/contact.ts**

Create `api/contact.ts` at the project root (Vercel convention for serverless functions):

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    await resend.emails.send({
      from: 'Cairn <noreply@cairnpath.io>',
      to: 'hello@cairnpath.io',
      subject: `Early access request from ${email}`,
      text: `New early access request:\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send' });
  }
}
```

- [ ] **Step 4: Update CTASection.tsx**

Replace the local-only `handleSubmit` with a fetch to the API:

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

  setLoading(true);
  setError(false);

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      setError(true);
    }
  } catch {
    setError(true);
  } finally {
    setLoading(false);
  }
};
```

Add loading state to the button: disable during submission, show "..." or spinner text.
Add error state: show a red message below the form if submission fails.

Add translation keys for error and loading:

In `en.json`:
```json
"landing.cta.error": "Something went wrong. Try again.",
"landing.cta.sending": "Sending..."
```

In `nb.json`:
```json
"landing.cta.error": "Noe gikk galt. Prøv igjen.",
"landing.cta.sending": "Sender..."
```

- [ ] **Step 5: Verify build**

Run: `cd /Users/monsnorve/cairn/.worktrees/cairn-improvements && npx tsc -b && npx vite build`
Expected: Clean build (API route is not compiled by Vite — it's a separate Vercel function)

- [ ] **Step 6: Commit**

```bash
git add api/contact.ts vercel.json src/components/landing/sections/CTASection.tsx package.json package-lock.json src/i18n/locales/en.json src/i18n/locales/nb.json
git commit -m "feat: add working contact form with Vercel serverless + Resend"
```

---

## DNS Setup Documentation

After all code tasks are done, the user needs to complete these manual steps:

### Resend (email sending)
1. Sign up at resend.com
2. Add domain `cairnpath.io` → get TXT record value
3. Add TXT record in Vercel DNS dashboard
4. Get API key → add as `RESEND_API_KEY` in Vercel environment variables

### ImprovMX (email receiving at hello@cairnpath.io)
1. Sign up at improvmx.com
2. Add domain `cairnpath.io` → set forwarding address (personal email)
3. Add MX records in Vercel DNS:
   - `MX mx1.improvmx.com` priority 10
   - `MX mx2.improvmx.com` priority 20
4. Add SPF TXT record: `v=spf1 include:spf.improvmx.com ~all`
