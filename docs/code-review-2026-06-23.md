# Fullstendig code review — Cairn

**Dato:** 2026-06-23
**Omfang:** Hele kodebasen på `main` (branch `claude/keen-bardeen-ogtog1` er identisk med `main`, ingen åpen diff).
**Metode:** Statisk gjennomgang av frontend (`src/`), backend (`server/`), Supabase edge functions og SQL, kombinert med kjøring av typecheck, lint og testsuite.

## Helsesjekk (verktøy)

| Sjekk | Resultat |
|---|---|
| `tsc -b --noEmit` (typecheck) | ✅ Ren |
| `vitest run` | ✅ 85 tester / 11 filer passerer |
| `eslint .` | ⚠️ 29 problemer (24 errors, 5 warnings) — satt til `continue-on-error` i CI |
| `tsc` + `vitest` server | (ikke kjørt — egne deps) |

Lint-feilene fordeler seg på: `react-hooks/refs` (12), `react-refresh/only-export-components` (6), `react-hooks/exhaustive-deps` (5), `@typescript-eslint/no-explicit-any` (4), `react-hooks/set-state-in-effect` (2).

---

## Det viktigste først: arkitektur er halvferdig og fragmentert

Den enkeltobservasjonen som rammer inn alt annet:

1. **Live-appen persisterer kun til `localStorage`.** `src/hooks/useSupabaseSync.ts` er en bevisst no-op (`// Placeholder — workspace sync disabled for now`). All tilstand lagres via Zustand `persist`-middleware i nettleseren.
2. **Det finnes to separate backends som nesten ikke er koblet til appen:**
   - **Supabase-prosjektet** — brukes til *auth* (`AuthProvider`) og *AI* (edge functions). RLS-skjemaet i `supabase/migrations/001_initial_schema.sql` er solid.
   - **En frittstående multi-tenant Fastify/Postgres-server i `server/`** (skjema-per-tenant, repository-mønster, plan-håndheving, GDPR-sletting). Frontend kaller denne på **ett eneste sted**: GDPR-eksport i `DataTab.tsx`.
3. **`src/lib/workspace.ts`** (Supabase-basert datapersistering) er reelt sett død kode — ingenting i live-stien kaller den.

**Konsekvens for prioritering:** De alvorlige server-funnene nedenfor er i praksis dempet av at serveren knapt er i bruk — men de *må* fikses før serveren tas i bruk, og fragmenteringen i seg selv er den største risikoen for prosjektet. Det er tre datamodeller (localStorage-store, Supabase RLS-tabeller, server-skjema) som ikke er forenet.

> **Anbefaling:** Ta en bevisst beslutning om én datasti. Enten (a) Supabase RLS som backend (fjern `server/`), eller (b) den dedikerte serveren (koble `useSupabaseSync` til den, fjern `workspace.ts`). Å holde tre halvferdige spor i live er den dyreste tilstanden.

---

## Kritiske funn

### K1 — Stack overflow i kritisk-sti-beregning ved avhengighetssyklus
`src/lib/criticalPath.ts:7-23`. `longestPath` har ingen syklusvakt og skriver memo *etter* rekursjon. En syklus (`A→B→A`) eller selvreferanse (`A→A`) gir uendelig rekursjon → `RangeError`, som krasjer hele roadmap-/dashboard-renderingen. `Initiative.dependsOn` er uvalidert og kan settes via import eller redigering. **Verifisert.**
*Fiks:* `visiting`-Set som returnerer `[]` på bakkant.

### K2 — JSON-import er ikke lossless: `strategicFrame`, `modules`, `strategies` slettes
`src/lib/importData.ts:88-99` bygger objektet med kun 9 felt og dropper `modules`, `strategicFrame` og `strategies`. `exportJson.ts` eksporterer dem, men `importState` (`useStore.ts:584`) gjør shallow merge, så feltene gjenopprettes aldri. **Hver eksport→import-runde mister hele den strategiske rammen og modulinnstillinger.**
*Fiks:* valider og før gjennom de manglende feltene; legg til `version`-felt for migrering (se K3-relatert).

### K3 — Import validerer ikke at `activeScenario` peker på et eksisterende scenario
`src/lib/importData.ts:30-32` sjekker bare at det er en string. Store-aksessorer (`addInitiative`/`updateInitiative`/`bulkMoveInitiatives`, `useStore.ts:170,182,530,544`) gjør `state.scenarioStates[state.activeScenario].initiatives` **uten optional chaining** → kaster ved dangling referanse. En importert fil kan dermed gjøre kjernehandlinger krasjsikre.
*Fiks:* valider at nøkkelen finnes (eller fall tilbake til første), og guard aksessorene.

### K4 — `SET LOCAL search_path` kjøres utenfor transaksjon → tenant-isolasjon kan svikte (server)
`server/src/db/pool.ts:31`. `queryInSchema` setter `SET LOCAL search_path` uten `BEGIN`. `SET LOCAL` har kun effekt *inne i* en transaksjon; utenfor er det en no-op. At det «virker» i dag er tilfeldig — poolede connections beholder `search_path` fra forrige `transactionInSchema`-bruk. En query kan dermed treffe **feil tenants skjema**. Alle repository-lesninger går via `queryInSchema`. **Verifisert.**
*Fiks:* bruk `SET search_path` (session-nivå) eller pakk set+query i én transaksjon; reset (`DISCARD ALL`) ved release.

### K5 — SQL-injeksjon via skjemanavn i GDPR-eksport (server)
`server/src/routes/settings.ts:102-106` interpolerer `schemaName` direkte inn i SQL uten validering (i motsetning til `dropTenantSchema` som har regex-vakt). Defense-in-depth-svikt; en manipulert `schema_name`-rad gir vilkårlig SQL.
*Fiks:* bruk repositories/`search_path`, eller valider mot `/^tenant_[0-9a-f]{32}$/` og bruk identifier-quoting.

---

## Høy alvorlighet

### H1 — CORS `Access-Control-Allow-Origin: *` på alle fire edge functions
`supabase/functions/*/index.ts:4`. Wildcard på Anthropic-proxyer som koster ekte API-kreditt. Kombinert med manglende rate-limit (H4) er dette en kostnads-/misbruksvektor.
*Fiks:* allow-list mot `Origin`-header, ekko tilbake spesifikt origin.

### H2 — Utdatert/utgående Anthropic-modell-ID overalt
8 steder bruker `claude-sonnet-4-20250514` (ai-chat/ai-form-suggest/analyze-input/generate-strategic-picture + `claude.ts`/`autolink.ts`/`onboarding.ts`/`generateStrategicPicture.ts`). Dette er en **ekte, men deprekert** modell med utfasing **2026-06-15** — altså allerede passert i dag (2026-06-23). Når den fases ut returnerer API-et 404 og alle AI-funksjoner stopper.
*Fiks:* migrer til en gjeldende modell (f.eks. `claude-sonnet-4-6`) og sentraliser modellstrengen til én konstant (den er duplisert i mange filer).

### H3 — Klient-kontrollert `systemPrompt` videresendes til Anthropic
`ai-chat/index.ts:36,57` og `ai-form-suggest/index.ts:36,57` tar både `messages` og `systemPrompt` rått fra request-body. En kaller kan erstatte system-prompten fullstendig og gjøre din kreditt-finansierte proxy til et generelt Claude-endepunkt («confused deputy»). Ingen shape-validering av `messages`.
*Fiks:* flytt system-prompten server-side (slik `analyze-input`/`generate-strategic-picture` allerede gjør); valider `messages`.

### H4 — Rate-limit kun på `generate-strategic-picture`; de tre andre proxyene er ubegrenset
`ai-chat` (streaming), `ai-form-suggest`, `analyze-input` har ingen per-bruker-throttle. Autentisert bruker kan loope og brenne ubegrenset Anthropic-budsjett.
*Fiks:* samme `generation_log`-baserte grense på alle fire (og gjør tellingen atomisk — dagens count-så-insert er TOCTOU-racy).

### H5 — Server: rolle/plan stoles fra JWT-claim uten medlemskaps-revalidering
`server/src/auth/middleware.ts:44-69`. `role` leses fra `app_metadata` og brukes direkte i autorisasjon; `plan`-claim vinner over DB (`plan ?? rows[0].plan`). Det sjekkes **aldri** at brukeren faktisk er medlem av tenant via `tenant_memberships`; `role` defaulter til `VIEWER` for en hvilken som helst tenant-id i claim-en. **Nyanse:** i Supabase er `app_metadata` server-kontrollert (ikke bruker-redigerbart), så dette er primært et *stale-claim / manglende revalidering*-problem, ikke triviell forfalskning — men det undergraver fortsatt rolle/plan-nedgradering og tenant-tilhørighet. **Verifisert.**
*Fiks:* slå opp medlemskap for `(tenantId, userId)`, avled `role` derfra, og bruk DB som fasit for `plan`.

### H6 — Cross-tenant invitasjon / privilegieeskalering (server)
`MembershipRepository.ts:79-89` + `routes/memberships.ts:81-93`. `acceptInvite` binder ikke akseptering til invitert e-post, og `inviteUrl`/token returneres i API-svar. Hvem som helst med token + en gyldig JWT for tenant kan kapre medlemskapet (opp til ADMIN).
*Fiks:* aksepter per token alene, resolv tenant fra invite-rad, verifiser at autentisert brukers e-post == `invite_email`; ikke returner råtoken.

### H7 — Én global error boundary for hele appen
`src/main.tsx:14`. Enhver render-feil i en tung leaf (PresentationMode, BoardView, AIChatPanel, narrative-engine) river ned hele appen til full-screen reload og forkaster ulagret in-memory-tilstand (= eneste persistering utenom localStorage).
*Fiks:* lokale boundaries rundt høyrisiko-subtrær.

### H8 — `setState` under render
`src/components/ui/StrategicNarrative.tsx:31-34` og `AuthProvider.tsx` (lint: `set-state-in-effect`). Anti-mønster som under React 19 + StrictMode trigger kaskaderender. `criticalPath`-uavhengig, men gir flaky UI.
*Fiks:* `key`-reset eller `useEffect` for avledet state.

### H9 — Ikke-unike ID-er fra `Date.now()` (~15 steder)
`AddModal.tsx`, `AIChatPanel.tsx`, `ScenarioDropdown.tsx`, `ScenarioBar.tsx`, `CommentsSection.tsx`, `StrategicFrameEditor.tsx` m.fl. To opprettelser i samme millisekund (AI «create all», dobbeltklikk) gir dupliserte React-keys og store-korrupsjon. Onboarding gjør det riktig med `crypto.randomUUID()`.
*Fiks:* standardiser på `crypto.randomUUID()`.

---

## Middels alvorlighet (utvalg)

- **M1 — Eksport-import mangler `version`-felt** (`exportJson.ts`). Med pågående `strategies → strategicFrame`-migrering blir gamle filer verken migrert eller bevart. (Henger sammen med K2.)
- **M2 — zundo `temporal` sporer `snapshots` og all app-state** (`useStore.ts:666`). `partialize` ekskluderer kun `ui`. Konsekvens: å lagre et snapshot blir en angre-bar handling — Ctrl+Z sletter snapshotet du nettopp lagret; import/restore blir én gigantisk angre-bar state-swap. *Fiks:* ekskluder `snapshots` (+ tunge collections) fra temporal.
- **M3 — `NaN`/krasj ved ukjent `dimension`-nøkkel** i `strategicInsights.ts:20`, `strategicDiagnostics.ts:159`, `narrativeEngine.ts:30`. `strategicDiagnostics` *kaster*, de andre gir `NaN` som forgifter dominans/imbalanse-logikk. Samme rot som manglende dimension-validering i import (H-relatert).
- **M4 — Usikker tilgang til `aiData.content[0].text`** i edge functions (`ai-form-suggest:69`, `analyze-input:121`, `generate-strategic-picture:130`, `generateStrategicPicture.ts:128`). `stop_reason: "refusal"` gir tom `content` → `TypeError` → generisk 500. Frontend `claude.ts` bruker trygt `?.[0]?.text`. *Fiks:* finn første `type==='text'`-blokk, håndter refusal eksplisitt.
- **M5 — `parseJsonResponse.ts:17-21,34-36`** kaster rå `SyntaxError` fra code-block-grenen (ikke pakket i try/catch) i stedet for `AIError`; verifiserer heller ikke at resultatet er et objekt.
- **M6 — Kritisk-sti-narrativ navngir feil endepunkter** (`narrativeEngine.ts:129-137`): bruker innsettingsrekkefølge fra `getMergedCriticalPath`, ikke topologisk rekkefølge → «kritisk sti går fra X til Y» blir ofte feil.
- **M7 — CSV formula injection** (`exportCsv.ts:21-26`): nøytraliserer ikke ledende `= + - @`; brukerstyrte felt kan kjøre i Excel/Sheets.
- **M8 — Index brukt som React key for redigerbar/fjernbar liste** (`StepGenerated.tsx:199,220`): fjerning av midt-rad gjenbruker feil DOM-node/fokus.
- **M9 — `under-validert import-shape`** (`importData.ts:38-76`): enum-verdier (`level`, `maturity`, `risk`, `dimension`, `effect.type`) sjekkes ikke; obligatoriske array-felt (`capabilities`, `dependsOn`, `valueChains`) kan mangle → senere `.join`/`.map` kaster i eksport.
- **M10 — Modaler mangler focus-trap / `role="dialog"` / fokusgjenoppretting** (AddModal, ImportModal, SettingsModal, OnboardingWizard, BoardView). Tastatur/AT-brukere kan tabbe inn i bakgrunnen.
- **M11 — Interaktive `<div>` som knapper uten tastaturstøtte** (`BoardView.tsx:131`, `StepUpload.tsx:118`). Roadmap-lanene gjør det riktig — mønsteret er bare ikke konsekvent brukt.
- **M12 — SQL-init-scripts er ikke idempotente** (`server/sql/init_public.sql:135` bruker ugyldig `CREATE VIEW IF NOT EXISTS`; `CREATE TYPE` uten guard i begge filer) → re-kjøring/provisjonering feiler.
- **M13 — `horizon`-enum mismatch**: TS-type tillater `'mid'`, men DB-enum og zod tillater kun `'near'|'far'` (`server/src/types/index.ts:8` vs `init_tenant.sql:18` vs `routes/initiatives.ts:11`).
- **M14 — Audit-logging er fire-and-forget** (`AuditRepository.ts:20-40`): ikke awaitet, feil svelges — uheldig for en compliance-funksjon.
- **M15 — GDPR-sletting kjører fem separate statements uten transaksjon** (`gdprDeletion.ts:34-60`): krasj midt i gir tenant-rad uten skjema.

---

## Lav / nits (utvalg)

- Hardkodede engelske/norske strenger som omgår i18n — verst i `BoardView.tsx` (hele rapport-setninger), også `DataTab.tsx` («Type DELETE to confirm»), `ValueChainView.tsx`, `PresentationMode.tsx`.
- `ImportModal.tsx:21` abonnerer på hele store (`useStore(s => s)`).
- `confirm()` for destruktive handlinger (`Roadmap.tsx:519`, `ScenarioDropdown.tsx:60`, `AIChatPanel.tsx:122`).
- Rå `error.message` vist til bruker i `Login.tsx:34,45,51` og server global handler (`index.ts:35`).
- `BENCHMARK_SALT` har usikker hardkodet default (`benchmarkExtractor.ts:200`).
- Ubrukte deps/imports i server: `@fastify/jwt`, `MembershipRepository` i `auth.ts`, m.m. `package.json db:init` peker på ikke-eksisterende `src/db/init.ts`.
- Oversized komponenter: `BoardView.tsx` (641), `AddModal.tsx` (612, ~30 useState), `CapabilityLandscape.tsx` (626).
- `useStore.ts` (~760 linjer) bør splittes i slices; 130-linjers `merge`-migrering med `as unknown as StoreState` omgår all typesjekk på persistert data.
- `documentParser.ts` regex-skraper rå bytes fra PDF/Office → komprimerte filer gir søppel uten feilmelding.
- `useMode.ts:13-21` kan lekke første timer ved rask toggle.

---

## Positivt

- Typecheck er ren og 85 enhetstester passerer; kjernelogikk (criticalPath, insights, diagnostics, ordering, strategicFrame) har god testdekning.
- **Ingen XSS-sink** i hele frontend (ingen `dangerouslySetInnerHTML`/`innerHTML`/`eval`); all brukerdata rendres som tekstnoder. Eneste eksterne lenke bruker `rel="noopener noreferrer"`.
- RLS-policyene i `001_initial_schema.sql` er gjennomtenkte (per-bruker, ingen UPDATE/DELETE på `generation_log`).
- Outside-click/keyboard/cleanup-effekter i dropdowns og PresentationMode er korrekt ryddet — ingen listener-/timer-lekkasjer funnet i UI.
- Server bruker repository-mønster, `metric`-allowlist for dynamiske kolonnenavn, og henter API-nøkkel fra `Deno.env` (aldri returnert/logget).

---

## Topp 5 å ta tak i

1. **Bestem én datasti** og fjern de to andre halvferdige sporene (arkitektur).
2. **K1** syklusvakt i `criticalPath.ts` — enkel fiks, hindrer total app-krasj.
3. **K2 + K3 + M9** gjør import-stien lossless og validert — hindrer stille datatap/krasj.
4. **H2** migrer Anthropic-modell-ID (allerede forbi utfasingsdato) — AI er ellers nede.
5. **K4 + K5 + H5 + H6** før serveren tas i bruk: fiks search_path-isolasjon, skjemanavn-injeksjon, medlemskaps-revalidering og invite-flyt.
