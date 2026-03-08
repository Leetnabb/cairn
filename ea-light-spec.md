# EA Light — Komplett spesifikasjon for Claude Code

## Hva dette er

Bygg en fullverdig React-applikasjon kalt **EA Light** — et strategisk veikartverktøy for enterprise architecture. Målgruppen er CIO-er, styringsgrupper, programledere og enterprise-arkitekter. Verktøyet bygger bro mellom strategi og eksekvering uten å kreve modelleringsekspertise.

**Kjerneidé**: Dette er et styringsverktøy — ikke en prosjektplan. Ingen Gantt-bars. To horisonter: nær (konkrete, prioriterte aktiviteter) og lang (strategisk retning der rekkefølge er viktigere enn tidspunkt).

## Tech stack

- React 18+ med TypeScript
- Vite som byggverktøy
- Tailwind CSS for styling
- Zustand for state management
- Persistent lagring via localStorage (med mulighet for backend senere)
- Ingen backend i første versjon — alt kjører client-side

## Datamodell

```typescript
interface Capability {
  id: string;
  name: string;
  level: 1 | 2;           // Nivå 1 = domene, Nivå 2 = underkapabilitet
  parent: string | null;   // ID til nivå 1-forelder (null for nivå 1)
  maturity: 1 | 2 | 3;    // 1=Lav, 2=Medium, 3=Høy
  risk: 1 | 2 | 3;        // 1=Lav, 2=Medium, 3=Høy
  description: string;
}

interface Initiative {
  id: string;
  name: string;
  dimension: DimensionKey;  // 'generelt' | 'ledelse' | 'virksomhet' | 'organisasjon' | 'teknologi'
  horizon: 'near' | 'far';
  order: number;            // Rekkefølge innenfor dimensjon+horisont
  capabilities: string[];   // Kapabilitet-IDer denne berører
  description: string;
  owner: string;
  dependsOn: string[];      // Initiative-IDer denne avhenger av
  maturityEffect: Record<string, number>; // Forventet modenhetsnivå per kapabilitet etter gjennomføring
  notes: string;            // Beslutningslogg / notater
  valueChains: string[];    // Verdikjede-IDer
}

interface Scenario {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface Milestone {
  id: string;
  name: string;             // F.eks. "Styrevedtak", "Go/no-go"
  horizon: 'near' | 'far';
  position: number;         // 0-1 relativ posisjon innenfor horisonten
  color: string;
}

interface ValueChain {
  id: string;
  name: string;             // F.eks. "Medlemsreisen", "Datadrevet styring"
  color: string;
}

interface Comment {
  id: string;
  itemId: string;           // Capability eller Initiative ID
  text: string;
  author?: string;
  timestamp: string;        // ISO datetime
}

interface Snapshot {
  id: string;
  timestamp: string;
  label?: string;
  data: AppState;           // Full kopi av tilstanden
}

// Dimensjoner er faste:
type DimensionKey = 'generelt' | 'ledelse' | 'virksomhet' | 'organisasjon' | 'teknologi';

interface Dimension {
  key: DimensionKey;
  label: string;
  color: string;     // Primærfarge
  bgColor: string;   // Bakgrunnsfarge
  bgLight: string;   // Lys bakgrunn
  textColor: string;  // Tekstfarge
}

// AppState per scenario:
interface ScenarioState {
  initiatives: Initiative[];
}

interface AppState {
  capabilities: Capability[];
  scenarios: Scenario[];
  scenarioStates: Record<string, ScenarioState>; // Key = scenario.id
  activeScenario: string;
  milestones: Milestone[];
  valueChains: ValueChain[];
  comments: Comment[];
  snapshots: Snapshot[];
}
```

## Fem dimensjoner (swim lanes)

| Key | Label | Farge | Formål |
|-----|-------|-------|--------|
| generelt | Generelt | Slate/grå (#94a3b8) | Tverrgående aktiviteter |
| ledelse | Ledelse | Rød (#ef4444) | Styring, beslutningsstruktur, strategi |
| virksomhet | Virksomhet | Grønn (#22c55e) | Prosesser, KPI-er, forretningslogikk |
| organisasjon | Organisasjon | Gul (#eab308) | Kompetanse, kultur, roller |
| teknologi | Teknologi | Indigo (#6366f1) | Systemer, plattformer, integrasjoner |

## Alle features (prioritert rekkefølge)

### 1. Strategisk veikart (hovedvisning)
- Swim lane-layout: 5 rader (én per dimensjon) × 2 kolonner (nær/lang horisont)
- Nær horisont: konkrete aktiviteter med eier, tittel
- Lang horisont: strategisk retning, nummerert rekkefølge
- **Drag-and-drop**: Dra aktiviteter mellom dimensjoner, horisonter, og endre rekkefølge
- Visuell insert-indikator ved drag (farget vertikal stripe)
- Klikk på aktivitet for å se detaljer i sidepanel

### 2. Kapabilitetskart (venstre sidepanel)
- Rutenett med nivå 1-kapabiliteter som kort
- Nivå 2-kapabiliteter listet under forelder
- Fargekodede modenhet/risiko-indikatorer (prikker/striper)
- Toggle mellom modenhet- og risikovisning
- Klikk kapabilitet → marker relaterte aktiviteter i veikartet
- Klikk aktivitet i veikartet → marker berørte kapabiliteter

### 3. Detaljpanel (høyre sidepanel)
- Viser valgt kapabilitet eller aktivitet
- For kapabilitet: modenhet, risiko, beskrivelse, relaterte aktiviteter, underkapabiliteter
- For aktivitet: dimensjon, horisont, eier, beskrivelse, notater, avhengigheter, modenhetseffekt, kapabiliteter, overlappende aktiviteter
- Redigering inline (✎-knapp)
- Slett-funksjon
- Bidireksjonell navigering (klikk fra kapabilitet til aktivitet og tilbake)
- Kommentarfelt nederst

### 4. Avhengigheter mellom aktiviteter
- Hvert initiativ har `dependsOn`-liste med IDer til andre initiativer
- Visuell indikator: gul prikk øverst til høyre på bokser med avhengigheter
- Ved valg av en aktivitet: alle avhengigheter og avhengige markeres med gul bakgrunn i veikartet
- Detaljpanelet viser "Avhenger av" (gul) og "Blokkerer" (blå) med klikk-navigering
- Settes i redigeringsmodus og ved opprettelse
- Innsiktsmotoren advarer hvis nær-horisont-aktivitet avhenger av lang-horisont-aktivitet

### 5. Scenariosammenlikning
- Scenariolinje under header med tabs for hvert scenario
- Opprett nytt scenario (tomt), dupliser eksisterende, gi nytt navn, slett
- Hvert scenario har sin egen kopi av aktivitetene — kapabiliteter deles
- Sammenlikn-visning: side-om-side med fargekodet diff
  - Gul = endret posisjon (annen dimensjon eller horisont)
  - Grønn = finnes kun i scenario B
  - Rød = finnes kun i scenario A
- Scenarier har konfigurerbar farge

### 6. Filtrering og fokusvisning
- Filterrad med:
  - Dimensjonsknapper (toggle av/på per dimensjon)
  - Horisont-toggle (nær/lang)
  - Eier-dropdown
  - Fritekst-søk
- Filtrerte dimensjoner/horisonter dimmes til ~20% opacity (ikke skjult — kontekst beholdes)
- Aktiviteter som ikke matcher eier/søk dimmes innenfor synlige soner
- "Nullstill"-knapp når filter er aktivt

### 7. Import/eksport
- **JSON-eksport**: Komplett datasett (kapabiliteter, aktiviteter, scenarier, milepæler, verdikjeder)
- **CSV-eksport**: To filer — kapabiliteter.csv og aktiviteter.csv, semikolonseparert (Excel-vennlig for norske brukere)
- **JSON-import**: Last opp fil eller lim inn, validerer format, oppdaterer state
- **PowerPoint-eksport**: Generer .pptx med pptxgenjs (8 slides: tittel, totaloversikt, kapabilitetskart, 4 dimensjonsslides, tverrgående analyse)

### 8. Kapabilitetsmodenhets-simulering
- Toggle "Simulering" i header
- Når aktiv: kapabilitetskartet viser forventet modenhet etter gjennomføring av alle aktiviteter
- Grønn ▲-pil ved kapabiliteter som forbedres
- Basert på `maturityEffect`-feltet per aktivitet
- Dashbordet viser "Modenhet nå" vs "Modenhet mål"

### 9. Endringsbelastning per eier/enhet
- Dashbord-visning med stolpediagram per eier
- Rød farge ved ≥4 samtidige aktiviteter
- Innsiktsmotoren advarer automatisk om kapasitetsrisiko for mest belastede eier

### 10. Milepæler og beslutningspunkter
- Vertikale markører på veikartet
- Konfigurerbare: navn, farge, horisont, relativ posisjon (0-1)
- Standardeksempler: "Strategivedtak", "Go/no-go pilot", "Midtveisevaluering"
- CRUD for milepæler

### 11. Kritisk sti-analyse
- Beregnes fra avhengighetsgrafen — lengste kjeden
- Toggle "Kritisk sti" i header
- Aktiviteter på kritisk sti markeres med rød outline/shadow
- Dashbordet viser antall aktiviteter i kjeden

### 12. Notatfelt og beslutningslogg
- Hvert initiativ har `notes`-felt
- Vises som blått infobanner i detaljpanelet
- Redigerbart inline i edit-modus
- Blå prikk øverst til venstre på bokser som har notater
- Følger med i PowerPoint-eksport som ekstra tekst

### 13. Dashbord
- Egen visning (tab i header) med:
  - **KPI-kort**: Totalt antall aktiviteter, modenhet nå/mål, kritisk sti-lengde, totale avhengigheter
  - **Dimensjonsfordeling**: Stablede stolper per dimensjon (nær/lang)
  - **Eierbelastning**: Horisontale stolper, fargekodet etter belastning
  - **Verdikjedeoversikt**: Grupperte aktiviteter per verdikjede
  - **Risikoeksponering**: Kapabiliteter med høy risiko og lav modenhet

### 14. Kommentering
- Kommentarfelt per kapabilitet og per aktivitet
- Nedre del av detaljpanelet
- Tekstfelt + "Legg til"-knapp
- Tidsstempel per kommentar
- Persistent lagring

### 15. Verdikjeder/prosessmodell
- Definerbare verdikjeder med navn og farge
- Aktiviteter kan tagges med en eller flere verdikjeder
- Vises som fargede prikker/striper på aktivitetsboksene
- Aggregert i dashbordet
- CRUD for verdikjeder

### 16. Versjonering med snapshot
- Automatisk snapshot ved viktige endringer (scenariobytte, store oppdateringer)
- Manuell "Lagre snapshot"-knapp
- Snapshotliste med tidsstempel
- Mulighet til å gjenopprette en snapshot (erstatter current state)

### 17. Presentasjonsmodus
- Fullskjerm med mørk bakgrunn (#0f172a)
- Store fonter, optimert for projektor
- Slides: Oversikt → én per dimensjon → kapabilitetskart → oppsummering
- Piltast-navigering (høyre/mellomrom = neste, venstre = forrige)
- Esc = lukk
- Navigasjonsprikker øverst
- Dimensjonsslides: to-kolonne layout med nær/lang horisont, store kort per aktivitet

### 18. Innsiktsmotor (automatisk analyse)
- Kjører i sanntid basert på gjeldende data
- Fargekodede advarsler:
  - **Gul (warning)**: Kapabilitetskollisjon (≥3 samtidige), avhengighet nær→lang, kapasitetsrisiko per eier
  - **Blå (info)**: Dimensjoner uten nær-horisont-aktiviteter, statistikk
  - **Grønn (positive)**: Alle dimensjoner dekket, god bredde
- Vises som kompakt rad under header
- Ekspanderbar for full liste

### 19. CRUD for alle entiteter
- **Kapabiliteter**: Opprett (nivå 1 eller 2), rediger, slett (kaskader til underkapabiliteter og fjerner fra aktiviteter)
- **Aktiviteter**: Opprett med alle felt, rediger inline, slett (fjerner fra avhengigheter hos andre)
- **Scenarier**: Opprett, dupliser, gi nytt navn, slett
- **Milepæler**: Opprett, rediger, slett
- **Verdikjeder**: Opprett, rediger, slett
- Legg til-modal med tabs (Aktivitet / Kapabilitet)

## Eksempeldata (norsk kirke/medlemsorganisasjon)

Bruk dette som default seed-data:

### Kapabiliteter (6 domener, 18 underkapabiliteter)
- **Medlemshåndtering** (M:2, R:3): Registrering, Kontaktinfo, Segmentering
- **Økonomi & Regnskap** (M:3, R:2): Fakturering, Budsjett, Rapportering
- **Kommunikasjon** (M:1, R:3): Nettsted, Nyhetsbrev, Sosiale medier
- **HR & Personal** (M:2, R:2): Rekruttering, Kompetanse, Lønn
- **Arrangementer** (M:1, R:2): Booking, Påmelding, Kalender
- **Data & Analyse** (M:1, R:3): Dataintegrasjon, Dashbord, Datakvalitet

### Aktiviteter (23 stk fordelt på 5 dimensjoner, 2 horisonter)

**Generelt:**
- Strategisk forankring (nær, Ledergruppen) → c1, c2, c3
- Gevinstrealisering (lang, Programkontor) → c2, c6.2. Avhenger av: Strategisk forankring

**Ledelse:**
- Lederutviklingsprogram (nær, HR) → c4.2. MatEffect: c4.2→2
- Styringsmodell (nær, Ledergruppen) → c2.2. Avhenger av: Strategisk forankring. Notat: "Vedtatt i ledergruppen jan 2026"
- Datadrevet kultur (lang, Ledergruppen) → c6.2, c6.3. Avhenger av: BI & Rapportering, Lederutviklingsprogram. MatEffect: c6.2→3, c6.3→2
- AI-strategi (lang, IT/Ledelse) → c6. Avhenger av: Dataplattform. MatEffect: c6→2

**Virksomhet:**
- Prosesskartlegging (nær, Prosesseier) → c1, c2, c3, c5. Verdikjede: Medlemsreisen, Datadrevet styring
- Medlemsreise (nær, Fagavd.) → c1, c1.1, c1.3, c3. Avhenger av: Prosesskartlegging. MatEffect: c1→3, c1.1→3, c1.3→2. Verdikjede: Medlemsreisen
- KPI-rammeverk (nær, Økonomi) → c2.3, c6.2. Avhenger av: Prosesskartlegging. MatEffect: c2.3→3, c6.2→2. Verdikjede: Datadrevet styring
- Automatiserte prosesser (lang, IT/Fag) → c2.1, c5.1, c5.2. Avhenger av: Prosesskartlegging, Integrasjonsplattform. MatEffect: c5.1→3, c5.2→3. Verdikjede: Datadrevet styring
- Prediktiv analyse (lang, Analyse) → c6, c6.2, c6.3. Avhenger av: Dataplattform, KPI-rammeverk. MatEffect: c6→3, c6.2→3, c6.3→3

**Organisasjon:**
- Digital kompetanse (nær, HR) → c4.2. MatEffect: c4.2→3
- Endringsnettverk (nær, HR/Program) → c4. Avhenger av: Digital kompetanse
- Nye roller & ansvar (nær, Leder/HR) → c4, c6. Avhenger av: Digital kompetanse, Styringsmodell
- Samhandlingskultur (lang, HR) → c3, c4. Avhenger av: Endringsnettverk, Komm.plattform. MatEffect: c3→2
- Kontinuerlig læring (lang, HR) → c4.2. Avhenger av: Digital kompetanse

**Teknologi:**
- Nytt medlemssystem (nær, IT) → c1, c1.1, c1.2, c1.3. Avhenger av: Medlemsreise. MatEffect: c1→3, c1.1→3, c1.2→3, c1.3→3. Notat: "RFI sendt Q1 2026". Verdikjede: Medlemsreisen
- Kommunikasjonsplattform (nær, IT/Komm.) → c3, c3.1, c3.2, c3.3. MatEffect: c3→3, c3.1→3, c3.2→3, c3.3→2
- Integrasjonsplattform (nær, IT) → c6.1. MatEffect: c6.1→3. Verdikjede: Datadrevet styring
- BI & Rapportering (nær, IT/Økonomi) → c2.3, c6.2. Avhenger av: Integrasjonsplattform, KPI-rammeverk. MatEffect: c6.2→3. Verdikjede: Datadrevet styring
- Dataplattform (lang, IT) → c6, c6.1, c6.2, c6.3. Avhenger av: Integrasjonsplattform. MatEffect: c6→3, c6.1→3. Verdikjede: Datadrevet styring
- Arrangementssystem (lang, IT/Drift) → c5, c5.1, c5.2, c5.3. Avhenger av: Integrasjonsplattform. MatEffect: c5→3, c5.1→3, c5.2→3, c5.3→3
- AI/ML-kapabiliteter (lang, IT) → c6, c6.2, c6.3. Avhenger av: Dataplattform

### Milepæler
- Strategivedtak (nær, posisjon 0.15, indigo)
- Go/no-go pilot (nær, posisjon 0.6, gul)
- Midtveisevaluering (lang, posisjon 0.4, blå)

### Verdikjeder
- Medlemsreisen (rosa #ec4899)
- Datadrevet styring (cyan #06b6d4)

## Design-prinsipper

1. **Kompakt og informasjonstett** — Ledere har kort oppmerksomhet. Alt viktig synlig uten scrolling.
2. **Norsk tekst** — All UI-tekst på norsk. Norske termer: "Modenhet", "Risiko", "Aktivitet", "Kapabilitet", "Horisont", "Veikart".
3. **Dimensjonsfargene er hellige** — Rød, grønn, gul, indigo, grå. Brukes konsekvent overalt.
4. **Subtil interaktivitet** — Hover-effekter, transitions (0.12-0.15s), shadows bare der det trengs.
5. **Ingen fete modaler** — Sidepaneler og inline-redigering foretrekkes over modale dialoger.
6. **Progressive disclosure** — Basis-info synlig, detaljer tilgjengelig via klikk/expand.

## Designsystem

- **Font**: DM Sans (Google Fonts) med system-ui fallback
- **Primær**: #6366f1 (indigo) for interaktive elementer
- **Bakgrunn**: #f8fafc, kort: #fff med 1px #e2e8f0 border
- **Tekst**: #1e293b (primær), #64748b (sekundær), #94a3b8 (tertiær)
- **Shadows**: Minimal — `0 1px 2px rgba(0,0,0,0.03)` for kort, `0 2px 8px rgba(99,102,241,0.12)` for valgte
- **Border radius**: 4-6px
- **Spacing**: 4-12px gaps, 6-12px padding
- **Font sizes**: 8-11px for UI-elementer, 14-15px for headings, 36-48px for presentasjonsmodus

## Mappestruktur (forslag)

```
src/
├── components/
│   ├── roadmap/
│   │   ├── Roadmap.tsx          # Hovedveikart med swim lanes
│   │   ├── DropZone.tsx         # Drag-and-drop sone per dimensjon/horisont
│   │   ├── InitiativeBox.tsx    # Aktivitetsboks (draggable)
│   │   └── MilestoneMarker.tsx  # Vertikal milepælsmarkør
│   ├── capabilities/
│   │   ├── CapabilityMap.tsx    # Kapabilitetsrutenett
│   │   └── CapabilityCard.tsx   # Enkelt kapabilitetskort
│   ├── detail/
│   │   ├── DetailPanel.tsx      # Høyre sidepanel
│   │   ├── CapabilityDetail.tsx # Kapabilitetsdetaljer
│   │   ├── InitiativeDetail.tsx # Aktivitetsdetaljer
│   │   └── CommentsSection.tsx  # Kommentarfelt
│   ├── scenarios/
│   │   ├── ScenarioBar.tsx      # Scenariotabs
│   │   └── CompareView.tsx      # Side-om-side sammenlikning
│   ├── dashboard/
│   │   ├── Dashboard.tsx        # Hovedoversikt
│   │   ├── KPICard.tsx          # Enkelt KPI-kort
│   │   ├── OwnerLoad.tsx        # Eierbelastning
│   │   └── ValueChainView.tsx   # Verdikjeder
│   ├── insights/
│   │   └── InsightsBar.tsx      # Innsiktsrad med advarsler
│   ├── filters/
│   │   └── FilterBar.tsx        # Dimensjon/horisont/eier/søk-filter
│   ├── modals/
│   │   ├── AddModal.tsx         # Legg til aktivitet/kapabilitet
│   │   └── ImportModal.tsx      # Importer JSON
│   ├── presentation/
│   │   └── PresentationMode.tsx # Fullskjerm presentasjon
│   ├── forms/
│   │   ├── EditCapabilityForm.tsx
│   │   └── EditInitiativeForm.tsx
│   └── ui/
│       └── Button.tsx           # Gjenbrukbar knapp
├── stores/
│   └── useStore.ts              # Zustand store med all state + actions
├── lib/
│   ├── insights.ts              # Innsiktsberegning
│   ├── criticalPath.ts          # Kritisk sti-algoritme
│   ├── simulation.ts            # Modenhetssimulering
│   ├── exportJson.ts            # JSON-eksport
│   ├── exportCsv.ts             # CSV-eksport
│   ├── exportPptx.ts            # PowerPoint-eksport (pptxgenjs)
│   └── importData.ts            # Import + validering
├── data/
│   └── defaults.ts              # Seed-data (kapabiliteter, aktiviteter, etc.)
├── types/
│   └── index.ts                 # TypeScript interfaces
├── hooks/
│   └── useDragAndDrop.ts        # Drag-and-drop logikk
├── App.tsx
└── main.tsx
```

## Kritisk sti-algoritme

```typescript
function computeCriticalPath(initiatives: Initiative[]): Set<string> {
  const map = new Map(initiatives.map(i => [i.id, i]));
  const memo = new Map<string, string[]>();

  function longestPath(id: string): string[] {
    if (memo.has(id)) return memo.get(id)!;
    const init = map.get(id);
    if (!init || init.dependsOn.length === 0) {
      memo.set(id, [id]);
      return [id];
    }
    let longest: string[] = [];
    for (const depId of init.dependsOn) {
      if (!map.has(depId)) continue;
      const path = longestPath(depId);
      if (path.length > longest.length) longest = path;
    }
    const result = [...longest, id];
    memo.set(id, result);
    return result;
  }

  let critical: string[] = [];
  for (const init of initiatives) {
    const p = longestPath(init.id);
    if (p.length > critical.length) critical = p;
  }
  return new Set(critical);
}
```

## Modenhetssimulering

```typescript
function simulateMaturity(capabilities: Capability[], initiatives: Initiative[]): Capability[] {
  return capabilities.map(cap => {
    let bestMaturity = cap.maturity;
    for (const init of initiatives) {
      const effect = init.maturityEffect[cap.id];
      if (effect !== undefined) {
        bestMaturity = Math.max(bestMaturity, effect);
      }
    }
    return {
      ...cap,
      maturity: bestMaturity,
      improved: bestMaturity > cap.maturity
    };
  });
}
```

## PowerPoint-eksport (pptxgenjs)

Installer `pptxgenjs` som dependency. Generer 8 slides:

1. **Tittelslide**: Mørk bakgrunn (#1E293B), accent bar (#6366F1), fire dimensjonsbadges, dato
2. **Totaloversikt**: Swim lanes med alle aktiviteter, nær/lang horisont-kolonner
3. **Kapabilitetskart**: 3×2 rutenett med L1-kapabiliteter, M/R-badges, underkapabiliteter
4. **Ledelse-slide**: To-kolonne (nær/lang), aktivitetskort med eier, beskrivelse, kapabiliteter
5. **Virksomhet-slide**: Samme layout
6. **Organisasjon-slide**: Samme layout
7. **Teknologi-slide**: Samme layout
8. **Tverrgående analyse**: Oppsummeringskort per dimensjon + observasjoner

Design: Georgia for overskrifter, Calibri for brødtekst. Shadows: `{ type: "outer", blur: 4, offset: 1, angle: 135, color: "000000", opacity: 0.08 }`.

## Viktige detaljer

- **Drag-and-drop**: Bruk HTML5 DnD API. Insert-indikator (farget vertikal stripe) ved drop-posisjon. Automatisk re-ordering av `order`-felt.
- **Dimensjonsrekkefølge i veikart**: generelt → ledelse → virksomhet → organisasjon → teknologi (kan konfigureres)
- **Norske datoer**: Bruk `toLocaleDateString("no-NO")`
- **CSV-separator**: Semikolon (;) — standard i norske Excel-installasjoner
- **Modenhet-farger**: Lav=#dc2626, Medium=#f59e0b, Høy=#22c55e
- **Risiko-farger**: Lav=#22c55e, Medium=#f59e0b, Høy=#dc2626 (invertert)
- **År**: Bruk 2026 som current year. Nær = 2026-2027, Lang = 2027-2029.
