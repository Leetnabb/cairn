# Plan 4: Landingsside v2

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the landing page with editorial Scandinavian voice, concrete value demonstration, and honest early-access positioning. Structure: Hero → Problem → Product preview → Insights → Differentiation → Human voice → CTA.

**Architecture:** Complete rewrite of `CairnLanding.tsx`. Preserves the existing animation system (Intersection Observer + FadeIn) and visual identity (dark theme, dimension colors, serif/sans typography). Adds an embedded read-only Strategy Path preview component.

**Tech Stack:** React 19 / TypeScript / Tailwind CSS / react-i18next

**Spec:** `docs/superpowers/specs/2026-03-18-cairn-improvement-design.md` section 5

**Depends on:** Plan 1-3 for product preview component (can use static mockup initially).

**Voice guidelines:** Editorial, Scandinavian, confident. Not salesy. Short sentences. Never: "powerful", "seamless", "robust", "game-changing". Never: "roadmap" — use "Strategy Path" or "stien".

---

## File Structure

### New Files
- `src/components/landing/sections/HeroSection.tsx` — Hero with cairn metaphor + effect chain
- `src/components/landing/sections/ProblemSection.tsx` — Fog, dynamic strategy, the TO
- `src/components/landing/sections/ProductPreview.tsx` — Interactive or animated Strategy Path preview
- `src/components/landing/sections/InsightsSection.tsx` — Three insight cards (Skjevheten, Koblingene, Retningen)
- `src/components/landing/sections/DifferentiationSection.tsx` — Not PowerPoint / Not EA / Not PM
- `src/components/landing/sections/TestimonialSection.tsx` — One human voice
- `src/components/landing/sections/CTASection.tsx` — Early access contact
- `src/components/landing/LandingNav.tsx` — Fixed navigation bar
- `src/components/landing/LandingFooter.tsx` — Footer
- `src/data/landingPreviewData.ts` — Static example data for the product preview

### Modified Files
- `src/components/landing/CairnLanding.tsx` — Rewrite to compose new sections
- `src/i18n/locales/en.json` — New landing page keys
- `src/i18n/locales/nb.json` — New landing page keys

---

## Task 1: Landing Page Data and Types

**Files:**
- Create: `src/data/landingPreviewData.ts`

- [ ] **Step 1: Create example data for product preview**

```typescript
// src/data/landingPreviewData.ts
// Static, anonymized strategic picture used in the landing page preview
// Shows: 12-14 initiatives across 4 dimensions, deliberately skewed toward technology
// This data IS the selling point — it should trigger recognition in the visitor
export const landingPreviewData = {
  initiatives: [
    // 9 technology, 1 leadership, 1 organisation, 2 business
    { id: 'l1', name: 'Ny styringsmodell', dimension: 'ledelse', horizon: 'near', status: 'planned' },
    { id: 'v1', name: 'Kundeportal 2.0', dimension: 'virksomhet', horizon: 'near', status: 'in_progress' },
    { id: 'v2', name: 'Automatisert rapportering', dimension: 'virksomhet', horizon: 'far', status: 'planned' },
    { id: 'o1', name: 'Kompetanseløft digital', dimension: 'organisasjon', horizon: 'near', status: 'planned' },
    { id: 't1', name: 'Skymigrering fase 2', dimension: 'teknologi', horizon: 'near', status: 'in_progress' },
    { id: 't2', name: 'API-plattform', dimension: 'teknologi', horizon: 'near', status: 'planned' },
    { id: 't3', name: 'IAM-modernisering', dimension: 'teknologi', horizon: 'near', status: 'planned' },
    { id: 't4', name: 'Dataplatform', dimension: 'teknologi', horizon: 'near', status: 'planned' },
    { id: 't5', name: 'DevOps-pipeline', dimension: 'teknologi', horizon: 'near', status: 'in_progress' },
    { id: 't6', name: 'Legacy-utfasing', dimension: 'teknologi', horizon: 'far', status: 'planned' },
    { id: 't7', name: 'Integrasjonsplattform', dimension: 'teknologi', horizon: 'far', status: 'planned' },
    { id: 't8', name: 'AI/ML-kapabilitet', dimension: 'teknologi', horizon: 'far', status: 'planned' },
    { id: 't9', name: 'Sikkerhetsprogram', dimension: 'teknologi', horizon: 'near', status: 'in_progress' },
  ],
  capabilities: [
    { id: 'c1', name: 'Skyinfrastruktur', level: 1, maturity: 2, risk: 2 },
    { id: 'c2', name: 'Integrasjon', level: 1, maturity: 1, risk: 3 },
    { id: 'c3', name: 'Datastyring', level: 1, maturity: 1, risk: 2 },
    { id: 'c4', name: 'Endringsledelse', level: 1, maturity: 1, risk: 3 },
    { id: 'c5', name: 'Digital kompetanse', level: 1, maturity: 1, risk: 2 },
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/data/landingPreviewData.ts
git commit -m "feat: add landing page preview data"
```

---

## Task 2: Section Components

**Files:**
- Create all section components

- [ ] **Step 1: HeroSection**

```typescript
// src/components/landing/sections/HeroSection.tsx
// Animated cairn logo (reuse existing HeroMark)
// Headline: "Når tåken legger seg, trenger du ikke et bedre kart. Du trenger en varde."
// Sub: "Strategi → Kapabiliteter → Initiativer → Effekter."
// Sub: "Ett bilde. Levende. For de som leder."
// Scroll indicator at bottom
// Dark background, serif headline, FadeIn animation
```

- [ ] **Step 2: ProblemSection**

```typescript
// src/components/landing/sections/ProblemSection.tsx
// Copy (Norwegian/English):
// "Teknologi endrer seg raskere enn organisasjonen klarer å følge.
//  Regulering strammes til. Geopolitikk skaper usikkerhet.
//  Når alt beveger seg samtidig, blir det vanskelig å se fremover. Tåken."
//
// "Alle har en strategi. De fleste har prosjekter.
//  Men det som mangler er TO-en — koblingen mellom strategy og execution."
//
// "Initiativene lever i prosjektverktøy. Strategien lever i presentasjoner.
//  Kapabilitetene lever i EA-verktøy som kun arkitekten forstår.
//  Effektene antas, men måles sjelden."
//
// "Her trengs dynamisk strategi — ikke en plan som låses fast,
//  men en levende sti som oppdateres fra varde til varde."
```

- [ ] **Step 3: ProductPreview**

```typescript
// src/components/landing/sections/ProductPreview.tsx
// Intro text: "Fire dimensjoner. To horisonter. Alle initiativ,
//   kapabiliteter og effekter — koblet sammen i ett bilde."
//
// Embedded mini Strategy Path using landingPreviewData:
//   - 4 dimension swim lanes (color-coded)
//   - 2 horizon columns (near/far)
//   - Initiative cards with dimension dots
//   - Animated: initiatives fade in one by one
//   - Click an initiative → highlight connected capabilities
//   - Non-interactive fallback for mobile (static image)
//
// This is the most critical section. It must look real, not like a mockup.
// Use the same visual language as the actual app (same colors, same card style).
```

- [ ] **Step 4: InsightsSection**

```typescript
// src/components/landing/sections/InsightsSection.tsx
// "Tre ting som endrer samtalen i ledergruppen:"
// Three cards:
//   1. "Skjevheten" — dimension dots (9 indigo, 1 green, 1 yellow, 1 red)
//      "12 initiativer. 9 er teknologi. Hvem driver organisasjonsendringen?"
//   2. "Koblingene" — connection icon
//      "Tre kapabiliteter blokkerer alt annet. De har ingen eier."
//   3. "Retningen" — filled/empty dots (◉ ◉ ◉ ◯ ◯)
//      "Konkret på kort sikt. Retning på lang sikt. Fra varde til varde."
// Cards have dimension-color top borders (red, yellow, green)
```

- [ ] **Step 5: DifferentiationSection**

```typescript
// src/components/landing/sections/DifferentiationSection.tsx
// Three cards in a row:
//   "PowerPoint-strategien er utdatert dagen etter styremøtet."
//   "EA-verktøyet forstås kun av arkitekten."
//   "Prosjektverktøyet viser oppgaver, ikke retning."
// Closing: "Cairn er verktøyet ledergruppen faktisk åpner mellom møtene."
```

- [ ] **Step 6: TestimonialSection**

```typescript
// src/components/landing/sections/TestimonialSection.tsx
// Single quote, serif italic, large text
// Placeholder structure:
//   "Vi brukte Cairn i ledergruppen for første gang. Etter ti minutter
//    så vi at 80% av initiativene våre var teknologi. Ingen eide
//    organisasjonsendringen. Den samtalen hadde vi aldri tatt uten dette bildet."
//   — [Tittel], [Organisasjon]
// Note: placeholder until real testimonial is available
// Component accepts quote, author, title, org as props
```

- [ ] **Step 7: CTASection**

```typescript
// src/components/landing/sections/CTASection.tsx
// "Vi er i early access."
// "Ta kontakt — så setter vi opp stien sammen."
// Contact form or email link (simple, not a complex form)
// Styling: centered, generous whitespace, serif headline
```

- [ ] **Step 8: Commit**

```bash
git add src/components/landing/sections/
git commit -m "feat: add all landing page section components"
```

---

## Task 3: Compose Landing Page

**Files:**
- Modify: `src/components/landing/CairnLanding.tsx`
- Create: `src/components/landing/LandingNav.tsx`
- Create: `src/components/landing/LandingFooter.tsx`

- [ ] **Step 1: Create LandingNav**

```typescript
// src/components/landing/LandingNav.tsx
// Fixed top nav: Cairn logo left, "Early Access" badge right
// Transparent → blur background on scroll (reuse existing scroll logic)
// Language toggle (EN/NB)
```

- [ ] **Step 2: Create LandingFooter**

```typescript
// src/components/landing/LandingFooter.tsx
// Simple footer: cairnpath.io, copyright, "navigate the fog" tagline
```

- [ ] **Step 3: Rewrite CairnLanding.tsx**

```typescript
// src/components/landing/CairnLanding.tsx
// Compose all sections in order:
// 1. LandingNav (fixed)
// 2. HeroSection
// 3. ProblemSection
// 4. ProductPreview
// 5. InsightsSection
// 6. DifferentiationSection
// 7. TestimonialSection
// 8. CTASection
// 9. LandingFooter
//
// Reuse existing:
//   - FadeIn animation wrapper
//   - BarDivider motif between sections
//   - Noise grain overlay
//   - Dark theme colors
//   - Typography (Instrument Serif + Plus Jakarta Sans)
//   - Dimension color constants
```

- [ ] **Step 4: Add translations**

Add comprehensive landing page translation keys to both `en.json` and `nb.json`, covering all section copy. Norwegian is the primary language for the landing page copy (already written in the spec).

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Build succeeds

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/ src/i18n/locales/en.json src/i18n/locales/nb.json
git commit -m "feat: rewrite landing page with editorial voice and product preview"
```

---

## Task 4: Visual Polish and Responsive

**Files:**
- Modify: various landing components

- [ ] **Step 1: Test on mobile viewport**

Check all sections at 375px, 768px, 1024px, 1440px widths. Product preview should gracefully degrade on mobile (static layout or simplified view).

- [ ] **Step 2: Verify animation performance**

Ensure FadeIn animations use `transform` and `opacity` only (GPU-composited). No layout thrashing.

- [ ] **Step 3: Check contrast ratios**

All text must meet WCAG AA contrast ratios against dark backgrounds. Use dimension colors only as accents, not for body text.

- [ ] **Step 4: Commit any fixes**

```bash
git commit -m "fix: landing page responsive and visual polish"
```
