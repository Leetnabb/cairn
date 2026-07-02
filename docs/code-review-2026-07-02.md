# Code review runde 2 — Cairn

**Dato:** 2026-07-02 · **Baseline:** `main` @ eac4c10 (etter PR #19–#26)
**Metode:** Adversariell delta-review av alt endret siden forrige review (c237b50), triage av alle 24 lint-feil, og friskt-blikk-pass på dashboard/capabilities/meeting/presentation/eksport som fikk lett dekning sist. Toppfunnene er verifisert manuelt mot koden (og zundo-kildekoden).

**Verktøystatus:** `tsc` ren · `vitest` 106/106 · build OK · lint 24 errors / 5 warnings (uendret).

---

## Hovedkonklusjoner

1. **Synk-hooken (`useSupabaseSync`) er den store risikoen.** Den er trygg for én bruker i én fane, men har fire reelle datatap-/lekkasjescenarier (H2–H4, M1–M4) ved flerfane, flerenhet eller brukerbytte. Den bør herdes før synk markedsføres som pålitelig.
2. **Én regresjon fra runde 1-fiksene:** Stopp-knappen i AI-chatten avbryter ikke lenger en pågående strøm (H1, innført i #25).
3. **Lint-triage: ingen av de 24 lint-feilene er reelle korrekthetsbugs.** «Lint → blokkerende CI» er dermed billig: 2 små refaktoreringer + config-justeringer.
4. Fem ekte Medium-bugs i dashboards/eksport/simulering (B1–B5).

---

## High (verifisert)

### H1 — Stopp-knappen avbryter ikke lenger AI-strømmen (regresjon fra #25)
`src/lib/ai/claude.ts:147-149` + `:83`. `timeout.clear()` kjører i `finally` idet fetch-headerne er mottatt, og fjerner videresendingen fra callers abort-signal til den interne controlleren som fetch faktisk bruker. Stopp midt i strømmen gjør dermed ingenting — tekst fortsetter å strømme til serveren er ferdig.
**Fiks:** `clear()` skal kun cleare timeren; behold abort-lytteren til generatoren er ferdig (fjern i stream-loopens `finally`).

### H2 — Ctrl+Z etter innlogging kan skrive gammel lokal state over sky-data
`src/hooks/useSupabaseSync.ts:77` + zundo (verifisert: `store.setState` wrappes, ingen `equality` konfigurert). Hydreringen `useStore.setState(remote)` legger **pre-login-staten på undo-stacken**. Scenario: logg inn på enhet med gammel/tom lokal data → Ctrl+Z → hele pre-login-datasettet gjenopprettes → debounce pusher det til Supabase og overskriver kontoens nyere sky-data.
**Fiks:** pause/clear temporal rundt hydrering (`useStore.temporal.getState().pause()/resume()` + `clear()`).

### H3 — Brukerbytte i samme nettleser: datalekkasje og datatap
`AuthProvider.signOut` (`:88-91`) rydder verken Zustand-store eller `cairn-storage` i localStorage.
- **Lekkasje:** bruker B logger inn uten sky-workspace → seed-grenen (`useSupabaseSync.ts:80-85`) laster opp **bruker A sine data** til B sin konto.
- **Tap:** B har workspace → hydrering + persist overskriver A sine usynkede lokale data permanent.
**Fiks:** nullstill store (eller bruk per-bruker localStorage-nøkkel) ved sign-out; ved hydrering over ikke-triviell lokal state: spør («behold lokal / bruk sky») eller merge.

### H4 — Flerfane/flerenhet: last-writer-wins + duplikat-workspaces
`useSupabaseSync.ts:69-107`, `workspace.ts`. Ingen versjons-/`updated_at`-vakt på upsert: en stale fane som gjør én redigering pusher **hele sitt gamle snapshot** og visker ut den andre fanens endringer. To faner ved første innlogging kan begge treffe tom liste → to «Hovedscenario»-rader → data «flip-flopper» mellom innlogginger.
**Fiks:** `updated_at`-guard på upsert (retry-med-pull ved konflikt); unik indeks på `(user_id, name)` + upsert for førstegangsopprettelse. Vurder realtime-subscription senere.

## Medium — synk/AI/edge

- **M1** `useSupabaseSync.ts:100-106`: `lastSaved` settes **før** lagringen lykkes → feilet lagring retryes aldri (identisk state kortslutter). I tillegg returnerer `saveWorkspaceToSupabase` stille suksess når sesjonen mangler/er utløpt → utløpt sesjon gjør hver lagring til no-op mens UI-et later som det synker. Fiks: sett `lastSaved` i `.then()`, kast ved manglende sesjon.
- **M2** Redigeringer i pull-vinduet ved innlogging forkastes; cleanup dropper ventende debounce ved utlogging/lukking (ingen flush). Fiks: flush ved cleanup + `visibilitychange`.
- **M3** `isMeaningful` godtar `{scenarioStates: null}` (typeof null === 'object'); hydrering `setState(remote)` tar med vilkårlige nøkler (f.eks. `ui` fra en gammel rad → `selectedItems` blir ikke-Set → krasj), og validerer ikke `activeScenario ∈ scenarioStates` (samme invariant som import nå håndhever). Fiks: valider + plukk kun whitelistede felt.
- **M4** `clearStrategicFrame` synkes aldri: `JSON.stringify` dropper `undefined`-nøkkelen, og hydrering er merge → rammen gjenoppstår på andre enheter. Fiks: serialiser `?? null`, map tilbake ved hydrering.
- **M5** Edge functions: rate-limit er fortsatt count-then-insert (TOCTOU — parallellburst omgår capen), og **payload-cap finnes bare i 2 av 4 funksjoner** (`analyze-input`/`generate-strategic-picture` mangler; hjelper-drift som README advarer om er allerede i gang). Fiks: cap input-lengde i alle fire; atomisk kvote (security definer-funksjon) på sikt.
- **M6** Synk-subscriber kjører `JSON.stringify(hele workspace)` synkront på **hver** store-endring (også ren UI). Fiks: sammenlign felt-referanser først, stringify kun ved endring.

## Medium — dashboards/eksport/simulering (friskt blikk)

- **B1** `StrategicHealth.tsx:69`: delta sammenlignes mot **eldste** snapshot (store *prepender*), mens `ChangeIndicators` korrekt bruker `[0]`. KPI-en «endring siden sist» er feil. Fiks: bruk `snapshots[0]`.
- **B2** `ChangeIndicators.tsx:18`: teller initiativer fra **alle** scenarioer i snapshotet, men sammenligner mot kun aktivt scenario → «−10» uten reell endring ved flere scenarioer. Fiks: sammenlign per aktivt scenario.
- **B3** `MeetingNav.tsx:136-145`: «Export»-knappen har ingen `onClick` — synlig, gjør ingenting. Fiks: koble til eksport eller fjern.
- **B4** `exportPptx.ts`: kort som overflower slide-flaten droppes stille (per-dimensjon-slides fra ~6. kort; slide 2/3/effekter tilsvarende) → deck ser komplett ut, men mangler data. Fiks: «+N flere»-tekst eller paginering. Også `writeFile`-promise ignoreres.
- **B5** `simulation.ts:11-15`: **stoppede** initiativer bidrar fortsatt til simulert modenhetsløft (frivillig-malens `i11` er 'stopped' og løfter c6-treet). Fiks: hopp over `status === 'stopped'`.

## Lint-triage (alle 24 errors)

| Regel | Antall | Dom |
|---|---|---|
| `react-hooks/refs` | 12 | **Ingen reell bug.** 11 i `DependencyOverlay` (layout-lesing under render — fungerer pga. ResizeObserver-selvhelbredelse, men bør refaktoreres til `useLayoutEffect`-beregnet state for renhet/React Compiler); 1 i `Roadmap.tsx:283` er falsk positiv (stabil Map-identitet) — bytt `useRef(new Map())` til `useState(() => new Map())`. |
| `set-state-in-effect` | 2 | Falsk positiv (`MeetingNav` — bail-out på lik state) + triviell (`AuthProvider` — init `useState(!!supabase)`). |
| `only-export-components` | 6 | Kun dev-HMR-støy. Config-unntak eller filsplitting. |
| `no-explicit-any` | 4 | Alle i testfiler → slå av regelen for `**/*.test.ts`. |

**Konsekvens:** lint kan gjøres blokkerende i CI med ~2 små refaktoreringer + config-justeringer — mye billigere enn antatt i runde 1.

## Low / nits (utvalg)

- `claude.ts:100-105`: taperen i `Promise.race` etterlater en hengende 30s-timer (rydd i `finally`); `getFormSuggestion` fikk ingen timeout (inkonsistent med chat-stien).
- `useStore` temporal: snapshot-handlinger lager tomme undo-oppføringer (første Ctrl+Z «gjør ingenting») — legg til `equality` i temporal-opsjonene.
- `importData`: `status`/`criticalPathOverride`/array-elementer i nested felt valideres ikke (kun kastet).
- SYSTEM_GUARD i edge functions er rådgivende, ikke en grense — de reelle kontrollene er auth + rate-limit + payload-cap (jf. M5).
- Frivillig-mal: `strategyIds` peker på ikke-eksisterende strategier (goal-gruppering blir tom); `c2` har `maturityTarget` < `maturity` (150 % progresjonsring).
- `ExecutiveSummary.tsx` er død kode; `MaturityChevron.tsx:54` uguardet bucket-push; PresentationMode mangler `preventDefault` på Space/piltaster; `CapabilityLandscape` rendrer tomme seksjonsrammer ved tomt workspace; eier-gruppering i `OwnerLoad` er case-sensitiv.
- Positivt verifisert: focus-trap korrekt med alle fire modal-mønstre; CORS-oppsettet i edge functions korrekt; mal-ID-er kolliderer ikke med uuid-æraens ID-er; DataTab-eksport er lossless mot ny import.

---

## Anbefalt rekkefølge

1. **H1** (stopp-knapp-regresjon) — liten, isolert fiks.
2. **H2 + H3 + M1** — synk-sikkerhet: temporal-pause ved hydrering, store-reset ved sign-out, lastSaved-etter-suksess. Sammen fjerner de de verste datatap-kjedene.
3. **H4 + M3 + M4** — `updated_at`-guard, hydreringsvalidering, null-serialisering.
4. **B1–B5** — dashboards/eksport/simulering (synlige, små fikser).
5. **Lint → blokkerende** (DependencyOverlay-refaktor + config) og M5 payload-cap i de to edge-funksjonene.
