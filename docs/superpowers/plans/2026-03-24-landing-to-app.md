# Landing → App "Kom i gang" Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users go from the landing page directly into the app and onboarding wizard without requiring login.

**Architecture:** Remove the `RequireAuth` gate on `/app`, replace landing page email forms with navigation buttons, update i18n keys. No new routes or components needed.

**Tech Stack:** React Router, react-i18next, existing Cairn component patterns.

**Spec:** `docs/superpowers/specs/2026-03-24-landing-to-app-design.md`

---

### Task 1: Open `/app` route for all users

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Remove `RequireAuth` from `/app` route and delete the function**

In `src/main.tsx`, change the `/app` route from:
```tsx
<Route path="/app/*" element={<RequireAuth><App /></RequireAuth>} />
```
to:
```tsx
<Route path="/app/*" element={<App />} />
```

Then delete the `RequireAuth` function (lines 13-18) and the unused `useAuth` import on line 11.

- [ ] **Step 2: Verify the app loads without auth**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: open /app route for unauthenticated users"
```

---

### Task 2: Update i18n keys

**Files:**
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Update nb.json**

Change these keys in the `landing` section:

```json
"nav": {
  "earlyAccess": "Early Access",
  "cta": "Kom i gang"
},
"hero": {
  ...
  "cta": "Kom i gang",
  "noSignup": "Ingen registrering nødvendig"
}
```

Remove from `hero`:
- `"emailPlaceholder": "din@epost.no"`
- `"submitted": "Du er på listen — vi tar kontakt."`

- [ ] **Step 2: Update en.json**

Same structure changes:

```json
"nav": {
  "earlyAccess": "Early Access",
  "cta": "Get started"
},
"hero": {
  ...
  "cta": "Get started",
  "noSignup": "No signup required"
}
```

Remove from `hero`:
- `"emailPlaceholder"` key
- `"submitted"` key

- [ ] **Step 3: Verify no missing keys**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/nb.json src/i18n/locales/en.json
git commit -m "feat: update i18n keys for landing get-started flow"
```

---

### Task 3: Replace Hero email form with "Kom i gang" button

**Files:**
- Modify: `src/components/landing/sections/HeroSection.tsx`

- [ ] **Step 1: Add `useNavigate` import**

Add to imports:
```tsx
import { useNavigate } from "react-router-dom";
```

- [ ] **Step 2: Replace email state and form with navigation button**

Remove:
- `useState` for `email` and `submitted`
- `heroFormRef` ref
- `handleEmailSubmit` function

Replace the `<FadeIn delay={0.7}>` block (the form section) with:

```tsx
<FadeIn delay={0.7}>
  <div>
    <button
      onClick={() => navigate('/app')}
      style={{ ...ctaStyle, fontSize: 15, padding: "13px 32px" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#4f46e5";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#6366f1";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {t("landing.hero.cta")}
    </button>
    <p
      style={{
        fontSize: 13,
        color: "#475569",
        marginTop: 12,
        letterSpacing: "0.02em",
      }}
    >
      {t("landing.hero.noSignup")}
    </p>
  </div>
</FadeIn>
```

Add `const navigate = useNavigate();` inside the component function.

Remove unused imports: `useRef` (if no longer needed), remove `type CSSProperties` if no longer needed.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/sections/HeroSection.tsx
git commit -m "feat: replace hero email form with get-started button"
```

---

### Task 4: Update LandingNav with "Logg inn" + "Kom i gang"

**Files:**
- Modify: `src/components/landing/LandingNav.tsx`

- [ ] **Step 1: Update imports and props**

Add:
```tsx
import { useNavigate } from "react-router-dom";
```

Remove `onCtaClick` from the `LandingNavProps` interface and the destructured props.

- [ ] **Step 2: Add navigate hook and replace CTA button**

Add `const navigate = useNavigate();` inside the component.

Replace the existing CTA button block (`{!isMobile && (` ... `)}`) with:

```tsx
{!isMobile && (
  <>
    <button
      onClick={() => navigate('/login')}
      style={{
        fontSize: 13,
        fontWeight: 500,
        color: "#94a3b8",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        padding: "6px 12px",
        transition: "color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "#f1f5f9";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "#94a3b8";
      }}
    >
      {t("auth.login")}
    </button>
    <button
      onClick={() => navigate('/app')}
      style={ctaStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#4f46e5";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#6366f1";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {t("landing.nav.cta")}
    </button>
  </>
)}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/LandingNav.tsx
git commit -m "feat: add login link and get-started button to landing nav"
```

---

### Task 5: Clean up CairnLanding parent component

**Files:**
- Modify: `src/components/landing/CairnLanding.tsx`

- [ ] **Step 1: Remove scroll-to-CTA logic**

Remove:
- `useRef` import (if only used for `ctaRef`)
- `ctaRef` declaration (`const ctaRef = useRef<HTMLDivElement | null>(null);`)
- `scrollToCta` function
- `onCtaClick={scrollToCta}` prop from `<LandingNav>`
- `<div ref={ctaRef}>` wrapper around `<CTASection>` — keep `<CTASection>` itself

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

Verify:
1. Landing page (`/`) loads without errors
2. Hero shows "Kom i gang" button (not email form)
3. Below button: "Ingen registrering nødvendig" text
4. Nav bar shows "Logg inn" (text) + "Kom i gang" (button)
5. Clicking "Kom i gang" (hero or nav) navigates to `/app`
6. Onboarding wizard appears automatically on `/app`
7. CTA section at bottom still shows email form
8. Language toggle works (switches to English text)

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/CairnLanding.tsx
git commit -m "feat: remove scroll-to-CTA logic from landing page"
```
