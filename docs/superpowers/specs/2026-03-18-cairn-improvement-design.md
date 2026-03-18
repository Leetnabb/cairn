# Cairn — Helhetlig forbedringsdesign

**Dato:** 2026-03-18
**Status:** Godkjent design, klar for implementeringsplanlegging

---

## Kontekst

Cairn er en strategisk navigasjonsplattform for ledergrupper, CIO-er og enterprise-arkitekter. Kjerneproblemene som skal løses:

1. **For kompleks for nye brukere** — ledere har ikke tid til å lære et nytt verktøy
2. **Time-to-value er for lang** — brukere må legge inn mye data før de ser nytten

Målgruppen er C-level/direktører som primærbrukere, med rådgivere, virksomhetsarkitekter og konsulenter som sekundærbrukere. Verktøyet skal brukes aktivt i ledermøter, arbeidsmøter, presentasjoner og styrerom.

### Retning: "Møteromsverktøyet"

Alt designes rundt kjernescenariet: **neste ledermøte**. Onboarding har et klart mål (klar til møtet), kompleksitet skjules bak progressiv avsløring, og landingssiden selger et konkret scenario.

---

## 1. AI-drevet onboarding — "Klar til ledermøtet"

**Prioritet:** 1 (forutsetning for alt annet)
**Løser:** Time-to-value, kompleksitet

### Nåværende problem

Onboarding-wizarden spør om organisasjonsnavn, modulvalg, og slipper brukeren løs i et tomt canvas. En C-level leder lukker fanen innen 2 minutter.

### Design

Onboarding er ikke "sett opp verktøyet" — det er "forbered neste møte".

**Steg 1 — Kontekst (30 sek)**
"Beskriv virksomheten din i 2-3 setninger — bransje, størrelse, og hva dere jobber med nå."
Alternativt: Lim inn fra strategidokument, årsrapport, eller styrepresentasjon.

**Steg 2 — AI genererer startpunkt (10 sek)**
Claude analyserer og foreslår:
- 3-5 strategiske mål
- 6-10 kapabiliteter
- 8-15 initiativer fordelt på dimensjoner
- 3-5 effektmål

Brukeren ser umiddelbart innsikter: "Dere har 12 initiativer — 9 av dem er teknologi. Kun 1 er ledelse."

**Steg 3 — Rediger og juster (5 min)**
Brukeren gjennomgår AI-forslaget: sletter, justerer, legger til. Guidet med tooltips og "Er dette riktig?"-prompts.

**Steg 4 — "Ditt strategibilde" (aha-øyeblikk)**
Ferdig Strategy Path med innsikter: dimensjonsbalanse, kapabilitetsgap, kritisk sti. CTA: "Del dette i neste ledermøte" → genererer møtemodus.

### Avhengigheter
- AI-integrasjon (delvis på plass via lib/ai/)
- Scope: onboarding-wizard rewrite + AI-prompt-engineering

---

## 2. Progressiv avsløring — Nivå 1/2/3

**Prioritet:** 2 (kan gjøres parallelt med P1)
**Løser:** Kompleksitet

### Design

Tre nivåer av kompleksitet, per-bruker:

**Nivå 1 — Leder (default for nye brukere)**
- Strategy Path (hovedvisning)
- Dashboard med innsikter
- Presentasjonsmodus / møtemodus
- Forenklet filter: kun dimensjon + søk

Skjult: Capabilities, Effects, Strategies som separate views. Avanserte filtre, scenariovalg, simulering.

**Nivå 2 — Strategisk**
- Alt fra Nivå 1
- Kapabilitetslandskap
- Effektstyring
- Strategiprioritering
- Avanserte filtre

For ledere som vil gå dypere, eller rådgivere som jobber med modellen.

**Nivå 3 — Ekspert**
- Alt fra Nivå 2
- Scenario-modellering
- Simulering (what-if)
- Kritisk sti-analyse
- Benchmarking
- Import/eksport

For virksomhetsarkitekter og konsulenter.

### Mekanikk
- Nye brukere starter på Nivå 1
- "Lås opp flere verktøy"-knapp i header, eller automatisk forslag ved avanserte handlinger
- Kan alltid nedgradere i innstillinger
- I et team kan lederen være på Nivå 1 og rådgiveren på Nivå 3

### Avhengigheter
- Refaktorering av navigasjon og header
- Selvstendig scope

---

## 3. Innsikt-først-dashboard

**Prioritet:** 3
**Løser:** Verdi-realisering, løpende nytte

### Nåværende problem

Dashboardet er organisert som et analytisk dashboard med 12+ widgets. En leder må selv finne hva som er viktig.

### Design

Omstrukturer til tre lag:

**Lag 1 — "Hva bør dere diskutere?" (alltid synlig)**
2-4 prioriterte innsikter, rangert etter strategisk betydning. Formulert som strategiske spørsmål, ikke tekniske advarsler. Klikkbare — driller ned til relevante initiativer/kapabiliteter.

Eksempler:
- "9 av 14 initiativer er teknologi. Organisasjon har kun 1."
- "3 kapabiliteter på kritisk sti mangler eier."
- "Effektmålet for kostnad har ingen kobling til aktive initiativer."

**Lag 2 — Strategisk helse (scroll ned)**
Nøkkeltall med kontekst — ikke rå tall, men tall med mening. Endring siden sist, gap mot mål.

**Lag 3 — Dypdykk (Nivå 2/3 brukere)**
Dimensjonsfordeling, eierbelastning, effekttrakt, modenhetsreise, snapshot-sammenligning, verdikjede-visning.

### Avhengigheter
- Bygger på eksisterende insights.ts og narrativeEngine.ts
- Lag 3 synlighet kobles til progressiv avsløring (P2)

---

## 4. Levende møtemodus

**Prioritet:** 4
**Løser:** Bruksadopsjon, vane-dannelse

### Nåværende problem

Presentasjonsmodus genererer slides og eksporterer til PowerPoint. Paradoks: Cairn skal erstatte statiske presentasjoner, men eksporterer selv til slides.

### Design

Ikke slides — et interaktivt strategibilde optimalisert for fellesskap rundt en skjerm.

**Hva som endres i møtemodus:**

Fjernes:
- Redigeringsknapper og edit-modus
- Filterbar (forenklet til én dimensjonsvelger)
- Settings, AI-panel, undo/redo
- Alle admin-elementer

Forsterkes:
- Større tekst og kort — lesbart på 3m avstand
- Klikk-navigering (ingen tastatur nødvendig)
- Fokus-modus: klikk et initiativ → se koblinger
- Dimensjonsfarger tydeligere og mer kontrastrike

**Tre linser (istedenfor slides):**

1. **Stien** — Strategy Path. "Hva gjør vi, og i hvilken rekkefølge?"
2. **Evnene** — Kapabilitetskartet. "Hva må vi bli bedre på?"
3. **Effektene** — Effektkjeden. "Hva oppnår vi egentlig?"

**Narrativ åpning:**
Møtemodus åpner med auto-generert strategisk lesning — 3-4 setninger som oppsummerer status og endringer siden sist. Setter agendaen uten forberedelse.

**PowerPoint-eksport:**
Beholdes som sekundær handling for compliance/distribusjon. Default er levende visning.

### Avhengigheter
- Bygger på eksisterende PresentationMode-komponent
- Narrativmotor (narrativeEngine.ts)

---

## 5. Landingsside v2

**Prioritet:** 5 (etter at produktet er forbedret)
**Løser:** Konvertering, posisjonering

### Designprinsipper
- Editorial, skandinavisk, selvsikker stemme
- Ikke selgende. Korte setninger. Aldri: "powerful", "seamless", "robust"
- Visjon leder, men grunnes i konkrete eksempler
- Cairn-metaforen er kjerne, ikke pynt

### Sidestruktur

**1. Hero**
"Når tåken legger seg, trenger du ikke et bedre kart. Du trenger en varde."
Strategi → Kapabiliteter → Initiativer → Effekter.
Ett bilde. Levende. For de som leder.

**2. Problemet**
Alle har en strategi. De fleste kan ikke si om den beveger seg.
Initiativene lever i prosjektverktøy. Strategien lever i presentasjoner. Kapabilitetene lever ingen steder. Effektene antas, men måles sjelden.
Gapet mellom strategi og eksekvering er ikke et verktøyproblem. Det er et synlighetsproblem.

**3. Cairn — se stien**
Fire dimensjoner. To horisonter. Alle initiativ, kapabiliteter og effekter — koblet sammen i ett bilde.
Klikk et initiativ — se hvilken kapabilitet det bygger. Se hvilken effekt det driver. Se hva som blokkerer.
**Bærende element: interaktiv produktpreview** (embedded read-only visning med eksempeldata, eller animert gjennomgang).

**4. Hva du ser**
Tre ting som endrer samtalen i ledergruppen:
- **Skjevheten** — 12 initiativer. 9 er teknologi. Hvem driver organisasjonsendringen?
- **Koblingene** — Tre kapabiliteter blokkerer alt annet. De har ingen eier.
- **Retningen** — Konkret på kort sikt. Retning på lang sikt. Fra varde til varde.

**5. Ikke enda et verktøy**
PowerPoint-strategien er utdatert dagen etter styremøtet.
EA-verktøyet forstås kun av arkitekten.
Prosjektverktøyet viser oppgaver, ikke retning.
Cairn er verktøyet ledergruppen faktisk åpner mellom møtene.

**6. Menneskelig stemme**
Én sitat fra én person med tittel og organisasjon. Viser aha-øyeblikket, ikke generisk ros.

**7. CTA**
"Vi er i early access. Ta kontakt — så setter vi opp stien sammen."

### Avhengigheter
- Produktpreview krever at Strategy Path fungerer i embedded/read-only modus
- Menneskelig stemme krever faktisk bruker-sitat

---

## Terminologi

- **Aldri** bruk "roadmap" — bruk "Strategy Path", "stien", eller tilsvarende cairn-metafor
- Cairn navigerer, den plotter ikke. Ledere leder, de administrerer ikke.
- Begreper: initiativ (ikke prosjekt), kapabilitet (ikke kompetanse), effekt (ikke KPI), horisont (ikke tidslinje)

---

## Gjennomføringsrekkefølge

```
P1: AI-drevet onboarding        → forutsetning for alt annet
P2: Progressiv avsløring        → gjør appen brukbar (parallelt med P1)
P3: Innsikt-først-dashboard     → gir grunn til å komme tilbake
P4: Levende møtemodus           → gjør Cairn til en vane
P5: Landingsside v2             → selger det som nå fungerer
```

P1 og P2 kan utvikles parallelt. P3-P5 er sekvensielle, da hver bygger på verdien fra forrige.
