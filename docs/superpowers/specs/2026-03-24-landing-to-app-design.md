# Landing → App: "Kom i gang"-flyt

## Sammendrag

Koble landingssiden til appen slik at "Kom i gang" fører brukeren direkte inn i `/app` og onboarding-wizarden — uten å kreve innlogging. Eksisterende brukere kan logge inn via en diskret lenke i nav-baren.

## Bakgrunn

I dag har landingssiden bare e-post-skjemaer (Hero + CTA-bunn). Appen (`/app`) krever innlogging via `RequireAuth`. Det finnes ingen vei fra landingssiden til appen uten å registrere seg først.

Målgruppen (CIO-er, styringsgrupper, enterprise-arkitekter) vil se verdi før de registrerer seg. Onboarding-wizarden med AI-generert strategibilde *er* demoen.

## Design

### 1. Ruting og tilgangskontroll

**Fil:** `src/main.tsx`

- Fjern `RequireAuth`-wrapperen rundt `/app`-ruten
- Slett `RequireAuth`-funksjonen (dead code etter endringen, trivielt å gjenskape)
- `/app` blir tilgjengelig for alle
- Innloggede brukere får Supabase-sync automatisk (eksisterende logikk)
- Uinnloggede brukere får localStorage-modus (fungerer allerede)
- Onboarding-wizarden trigges som før via `shouldAutoShowWizard()`
- Merk: `App.tsx` bruker `useAuth()` og `auth.role` — begge returnerer safe defaults (`isAuthenticated: false`, `role: null`) for gjester, så ingen endring trengs der
- Merk: `useSupabaseSync()` er i dag en no-op placeholder og fungerer uendret for gjester

### 2. Hero-seksjon

**Fil:** `src/components/landing/sections/HeroSection.tsx`

- Fjern e-post-skjema (`<input>`, `<form>`, `email`-state, `submitted`-state, `handleEmailSubmit`)
- Erstatt med én primærknapp: "Kom i gang" → `navigate('/app')`
- Legg til undertekst under knappen: "Ingen registrering nødvendig"
- Alt annet i hero (overskrift, undertekster, animasjoner, fog-effekter) forblir uendret

### 3. Nav-bar

**Fil:** `src/components/landing/LandingNav.tsx`

- Fjern `onCtaClick`-prop
- Erstatt dagens CTA-knapp med to elementer:
  - **"Logg inn"** — diskret tekstlenke-stil, navigerer til `/login`
  - **"Kom i gang"** — primærknapp (indigo ctaStyle), navigerer til `/app`
- "Early access"-badge beholdes
- Språkbytte beholdes

**Fil:** `src/components/landing/CairnLanding.tsx`

- Fjern `ctaRef`, `scrollToCta`, og `onCtaClick`-prop til `LandingNav`

### 4. CTA-seksjon (bunn)

**Fil:** `src/components/landing/sections/CTASection.tsx`

- Ingen endring. Beholder e-post-skjemaet for brukere som ikke er klare til å prøve.

### 5. i18n-nøkler

**Nye/endrede:**
- Nav bruker eksisterende `auth.login`-nøkkel ("Logg inn" / "Log in") — ingen ny nøkkel
- `landing.nav.cta` — Endres til "Kom i gang" / "Get started"
- `landing.hero.cta` — Endres til "Kom i gang" / "Get started"
- `landing.hero.noSignup` — "Ingen registrering nødvendig" / "No signup required"

**Fjernes:**
- `landing.hero.emailPlaceholder`
- `landing.hero.submitted`

## Ikke i scope

- Endringer i onboarding-wizarden selv
- "Lagre i sky"-prompt for gjeste-brukere
- Endringer i CTA-seksjonen nederst
- Nye sider eller ruter
