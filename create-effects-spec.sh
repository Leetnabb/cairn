cat > EFFECTS-SPEC.md << 'CAIRN_EOF'
# Cairn — Tilleggsspesifikasjon: Effekter

## Bakgrunn

Cairn dekker i dag to av tre strategiske nivåer:

- **Aktivitet** — Hva gjør vi? → Dekket
- **Kapabilitet** — Hva blir vi i stand til? → Dekket (modenhetssimulering)
- **Effekt** — Hva oppnår vi? → Mangler

Effektlaget lukker gapet mellom kapabilitet og verdi. Når en CIO presenterer for styret er spørsmålet aldri «går vi fra modenhet 1 til 3 på datakvalitet?» — det er «hva betyr det for oss i praksis?»

## Designprinsipper

### Strategisk nivå bevares
Effekter i Cairn er IKKE gevinstrealisering. Ingen kronebeløp, NPV, tidspunkt for realisering, eller detaljert gevinstoppfølging. Detaljert gevinstrealisering hører hjemme i et dedikert rammeverk under Cairn-nivået.

### Effektkjeden er kjernen
Aktivitet → Kapabilitet (modenhetseffekt) → Effekt (strategisk verdi)

Styringsgruppen skal kunne se hvilke aktiviteter som driver hvilke effekter, og hvilke kapabilitetsløft som muliggjør dem.

### CIO-testregelen
«Ville en CIO stille dette spørsmålet i et styringsmøte?»
- «Hva oppnår vi med denne porteføljen?» → Ja
- «Hva er netto nåverdi av effekt 3?» → Nei

## Datamodell

```typescript
interface Effect {
  id: string;
  name: string;              // "Redusert manuelt arbeid"
  description: string;       // "Automatisering av registrering fjerner manuelle steg"
  type: 'cost' | 'quality' | 'speed' | 'compliance' | 'strategic';
  capabilities: string[];    // Hvilke kapabilitetsløft som muliggjør effekten
  initiatives: string[];     // Hvilke aktiviteter som bidrar direkte
  indicator?: string;        // "Timer per registrering"
  baseline?: string;         // "45 min"
  target?: string;           // "5 min"
}
```

### Effekttyper

| Type | Beskrivelse | Eksempel |
|------|-------------|----------|
| cost | Kostnadsreduksjon eller besparelse | Eliminert dobbeltarbeid i registrering |
| quality | Bedre kvalitet, færre feil | Enhetlig datakvalitet i medlemsregisteret |
| speed | Raskere gjennomføring, kortere ledetid | Registreringstid fra 45 til 5 minutter |
| compliance | Etterlevelse av regulering/policy | GDPR-konform datahåndtering |
| strategic | Ny evne, strategisk handlingsrom | Datadrevet beslutningstaking i ledergruppen |

Typene er bevisst brede — kategorier for presentasjon og filtrering, ikke et komplett gevinstrealiseringsrammeverk.

## Relasjoner

### Effekt → Kapabilitet
En effekt muliggjøres av ett eller flere kapabilitetsløft. «Hvilken evne må vi bygge for å realisere denne effekten?»

### Effekt → Aktivitet
En effekt drives av en eller flere aktiviteter. «Hvilke initiativer må gjennomføres for at effekten skal inntre?»

## Eksempeldata

7 effekter som passer inn i eksisterende seed-data:

```typescript
const DEFAULT_EFFECTS: Effect[] = [
  {
    id: "eff-001",
    name: "Redusert manuelt arbeid",
    description: "Automatisering av medlemsregistrering fjerner manuelle steg",
    type: "speed",
    capabilities: ["c1", "c1.1"],
    initiatives: ["t1", "v4"],
    indicator: "Timer per registrering",
    baseline: "45 min",
    target: "5 min"
  },
  {
    id: "eff-002",
    name: "Sanntidsoversikt",
    description: "Løpende innsikt i medlemsmasse og KPIer erstatter kvartalsrapporter",
    type: "quality",
    capabilities: ["c6.2", "c2.3"],
    initiatives: ["t4", "t5"],
    indicator: "Rapporteringsfrekvens",
    baseline: "Kvartalsvis",
    target: "Sanntid"
  },
  {
    id: "eff-003",
    name: "Enhetlig datakvalitet",
    description: "Felles dataplattform eliminerer duplikater og inkonsistens",
    type: "quality",
    capabilities: ["c6.3", "c6.1"],
    initiatives: ["t5", "t3"],
    indicator: "Duplikatrate",
    baseline: "12%",
    target: "< 1%"
  },
  {
    id: "eff-004",
    name: "GDPR-konformitet",
    description: "Sentral håndtering av samtykke og persondata",
    type: "compliance",
    capabilities: ["c1.2", "c1.3"],
    initiatives: ["t1"],
    indicator: "Avvik ved tilsyn",
    baseline: "Uavklart",
    target: "0 avvik"
  },
  {
    id: "eff-005",
    name: "Datadrevet beslutningstaking",
    description: "Ledergruppen tar beslutninger basert på data fremfor magefølelse",
    type: "strategic",
    capabilities: ["c6.2", "c6.3"],
    initiatives: ["l3", "t4", "v3"],
    indicator: "Andel datadrevne beslutninger",
    baseline: "Ad hoc",
    target: "Systematisk"
  },
  {
    id: "eff-006",
    name: "Helhetlig medlemsreise",
    description: "Sammenhengende digital opplevelse fra innmelding til engasjement",
    type: "strategic",
    capabilities: ["c1", "c3", "c5"],
    initiatives: ["v2", "t2", "t6"],
    indicator: "NPS/tilfredshet",
    baseline: "Ikke målt",
    target: "NPS > 40"
  },
  {
    id: "eff-007",
    name: "Reduserte driftskostnader",
    description: "Konsolidering av systemer reduserer lisens- og vedlikeholdskostnader",
    type: "cost",
    capabilities: ["c6.1"],
    initiatives: ["t3", "t1", "t2"],
    indicator: "Lisens- og vedlikeholdskost",
    baseline: "Fragmentert",
    target: "Konsolidert"
  }
];
```

## UI-endringer

### Dashbord
Nytt panel: Effektoversikt. Antall effekter per type som fargekodede badges. Klikk på type for å se tilhørende effekter med kobling til kapabiliteter og aktiviteter.

### Detaljpanel: Aktivitet
Ny seksjon «Bidrar til effekter» under kapabilitetslisten. Viser effekter aktiviteten driver, med type-badge og klikk-navigering.

### Detaljpanel: Kapabilitet
Ny seksjon «Muliggjør effekter» under aktivitetslisten.

### Detaljpanel: Effekt (ny)
Nytt detaljpanel ved klikk på effekt. Viser navn, type, beskrivelse, indikator med baseline/target, koblede kapabiliteter og aktiviteter med klikk-navigering. Redigerbar inline.

### Legg til-modal
Ny fane «Effekt». Felt: navn, type (dropdown), beskrivelse, indikator, baseline, target, kapabiliteter (chips), aktiviteter (chips).

### Presentasjonsmodus
Ny slide: «Effektkjede». Tre kolonner: Aktiviteter → Kapabiliteter → Effekter med visuell flyt. Dette er sliden som selger transformasjonen til styret.

### Scenariosammenlikning
Effektdekning per type som oppsummering. «Scenario A leverer 8 effekter, B leverer 6 — men B dekker compliance-effektene som A mangler.»

### Innsiktsmotor
Nye innsikter:
- Effekter uten tilknyttede aktiviteter på nær horisont
- Aktiviteter uten effektkobling (bidrar ikke til definert effekt)
- Effekttypebalanse (mangler porteføljen compliance? cost?)
- Effektkonsentrasjon (3 av 7 effekter avhenger av Dataplattform)

## Eksport

### JSON
Effects-array i eksisterende eksportformat. Bakoverkompatibel: import uten effects gir tom array.

### CSV
Ny fil effekter.csv: id;name;type;description;indicator;baseline;target;capabilities;initiatives

### PowerPoint
Ny slide: Effektoversikt med tre-kolonne effektkjede. Effekter gruppert etter type.

## Bevisste begrensninger (utenfor scope)

| Utelatt | Begrunnelse |
|---------|-------------|
| Kronebeløp på effekter | CFO-analyse, ikke styringsgruppe |
| NPV / ROI-beregning | Krever diskonteringsrater. Eget verktøy. |
| Tidspunkt for realisering | Bryter med sekvens-fremfor-dato-prinsippet |
| Gevinstoppfølging / status | Operasjonelt, ikke strategisk |
| Detaljerte gevinsteiere | Effekteierskap er gevinstrealisering |
CAIRN_EOF

echo "✓ EFFECTS-SPEC.md opprettet i $(pwd)"
