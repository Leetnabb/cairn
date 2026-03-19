# Landing Page — Copy, Language, Contrast, and Contact Form

**Date:** 2026-03-19
**Status:** Approved design

---

## Context

The landing page at cairnpath.io has strong structure but several issues:
1. Copy jumps from metaphor to effect chain without explaining what Cairn is
2. "The fog." as a standalone sentence reads awkwardly
3. "the TO — the link between strategy and execution" doesn't work in English
4. Silo lines are repetitive
5. Product preview data and dimension labels are hardcoded in Norwegian while the page is in English
6. "Not this" differentiation section has poor text contrast
7. Contact form validates locally but never sends — emails go nowhere

---

## 1. Hero — Add explanation between metaphor and effect chain

**Current:**
> "When the fog rolls in, you don't need a better map. You need a cairn."
> Strategy → Capabilities → Initiatives → Effects.
> One picture. Living. For those who lead.

**New:**
> "When the fog rolls in, you don't need a better map. You need a cairn."
>
> Cairn connects strategy to execution — through capabilities, initiatives, and effects — in one living picture.

The effect chain is woven into an explanation of what the product does, rather than listed as a standalone formula.

Norwegian equivalent:
> "Når tåken legger seg, trenger du ikke et bedre kart. Du trenger en varde."
>
> Cairn kobler strategi til gjennomføring — gjennom kapabiliteter, initiativer og effekter — i ett levende bilde.

---

## 2. Problem section — Rewrite

**Current issues:** "The fog." as fragment, "the TO" concept, repetitive silo lines.

**New English copy:**

`landing.problem.context`:
> Leaders navigate constant change — in technology, regulation, and markets. The further ahead you look, the harder it is to see clearly. That's not a failure of planning. It's the nature of leading through complexity.

`landing.problem.headline`:
> Most organisations have a strategy. Most have projects. But the link between them — from strategic intent to actual impact — is invisible. Initiatives live in one tool, strategy in another, capabilities in a third. No one sees the full picture.

`landing.problem.closing`:
> Cairn makes the connections visible — so you can lead, not just plan.

The silo cards (`silo1`, `silo2`, `silo3`) and `body1` keys are removed. The new `headline` incorporates the silo concept in flowing prose.

**New Norwegian copy:**

`landing.problem.context`:
> Ledere navigerer konstant endring — i teknologi, regulering og markeder. Jo lenger frem du ser, desto vanskeligere er det å se klart. Det er ikke en svikt i planleggingen. Det er naturen av å lede gjennom kompleksitet.

`landing.problem.headline`:
> De fleste organisasjoner har en strategi. De fleste har prosjekter. Men koblingen mellom dem — fra strategisk intensjon til faktisk effekt — er usynlig. Initiativene lever i ett verktøy, strategien i et annet, kapabilitetene i et tredje. Ingen ser hele bildet.

`landing.problem.closing`:
> Cairn gjør sammenhengene synlige — slik at du kan lede, ikke bare planlegge.

---

## 3. Product preview — Fix language mixing

### Initiative names
Add English variants to `landingPreviewData.ts`. Use i18n to select the correct language.

| Norwegian | English |
|-----------|---------|
| Ny styringsmodell | New governance model |
| Kundeportal 2.0 | Customer portal 2.0 |
| Automatisert rapportering | Automated reporting |
| Kompetanseløft digital | Digital competency programme |
| Skymigrering fase 2 | Cloud migration phase 2 |
| API-plattform | API platform |
| IAM-modernisering | IAM modernisation |
| Dataplatform | Data platform |
| DevOps-pipeline | DevOps pipeline |
| Legacy-utfasing | Legacy decommission |
| Integrasjonsplattform | Integration platform |
| AI/ML-kapabilitet | AI/ML capability |
| Sikkerhetsprogram | Security programme |

### Capability names

| Norwegian | English |
|-----------|---------|
| Skyinfrastruktur | Cloud infrastructure |
| Integrasjon | Integration |
| Datastyring | Data governance |
| Endringsledelse | Change management |
| Digital kompetanse | Digital competence |

### Dimension labels
Move hardcoded `DIMENSION_LABELS` in ProductPreview.tsx to i18n keys. Use existing dimension translation keys from the app, or add new ones under `landing.product.dimensions.*`.

| Key | English | Norwegian |
|-----|---------|-----------|
| ledelse | Leadership | Ledelse |
| virksomhet | Business | Virksomhet |
| organisasjon | Organisation | Organisasjon |
| teknologi | Technology | Teknologi |

---

## 4. Differentiation section — Improve contrast

| Element | Current | New |
|---------|---------|-----|
| Card text | `#334155` (slate-700) | `#94a3b8` (slate-400) |
| Eyebrow "Not this" | `#3a4558` | `#64748b` (slate-500) |
| ✕ symbol | `#ef4444` at `opacity: 0.5` | `#ef4444` at `opacity: 1` |
| Card border | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.1)` |

Closing line retains its current strong contrast.

---

## 5. Contact form — Vercel Serverless + Resend

### Architecture
- **Sending:** Vercel serverless function (`api/contact.ts`) calls Resend API
- **Receiving:** ImprovMX forwards hello@cairnpath.io → personal email
- **Flow:** User submits form → serverless function → Resend sends notification email to hello@cairnpath.io → ImprovMX forwards to personal inbox

### Serverless function (`api/contact.ts`)
- Accepts POST with `{ email: string }`
- Validates email server-side
- Sends notification email via Resend API to hello@cairnpath.io
- Returns 200 on success, 400/500 on error
- Environment variable: `RESEND_API_KEY`

### Frontend changes (`CTASection.tsx`)
- Replace local-only validation with fetch to `/api/contact`
- Show loading state during submission
- Show success/error message based on response
- Keep existing UI design

### DNS setup (manual, documented)
ImprovMX requires 2 MX records in Vercel DNS:
- `MX mx1.improvmx.com 10`
- `MX mx2.improvmx.com 20`

Plus a TXT record for SPF:
- `TXT v=spf1 include:spf.improvmx.com ~all`

Resend requires domain verification (TXT record) — Resend dashboard provides the exact value.

---

## Files to change

- `src/i18n/locales/en.json` — rewrite landing.hero, landing.problem keys
- `src/i18n/locales/nb.json` — rewrite corresponding Norwegian keys
- `src/components/landing/sections/ProblemSection.tsx` — simplify structure (remove silo cards)
- `src/components/landing/sections/ProductPreview.tsx` — use i18n for dimension labels
- `src/data/landingPreviewData.ts` — add English name variants, restructure for i18n
- `src/components/landing/sections/DifferentiationSection.tsx` — update color values
- `src/components/landing/sections/CTASection.tsx` — integrate with serverless function
- `api/contact.ts` — new serverless function (Vercel API route)
- `package.json` — add `resend` dependency
