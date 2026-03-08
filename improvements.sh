cat > IMPROVEMENTS.md << 'EOF'
# Cairn — Forbedringsforslag fra designgjennomgang

## 1. Forenklet grensesnitt

### Header: Tre primærknapper, resten bak meny
- Synlige: Veikart, Dashbord, Presentasjon
- Bak menyknapp (⋯): Sammenlign, Simulering, Kritisk sti, Import/Eksport, Snapshot, Innstillinger
- Scenario-valg som dropdown i header, ikke egen rad
- Advarsel-badge (klokkeikon med tall) erstatter innsiktsraden

### Fjern scenariolinje og filterrad som standard
- Filter tilgjengelig via filterikon — åpner kompakt dropdown ved behov
- Innsiktsrad erstattet av badge-ikon med antall advarsler
- Resultat: Under header er det ingenting — bare veikartet i full bredde

### Kapabilitetspanelet er overlay, ikke fast panel
- Standard: Veikartet + detaljpanel fyller hele bredden
- Kapabilitetskart åpnes som panel fra venstre via ikon/knapp
- Når ingen aktivitet er valgt: detaljpanelet kan vise kompakt kapabilitetsoversikt
- Kapabilitetskart som rutenett (2-3 kolonner) med L2 synlige, ikke flat liste

### Detaljpanel åpnes kun ved interaksjon
- Ingen tomt panel med "Velg et element"
- Veikartet fyller plassen som default
- Panel glir inn fra høyre ved klikk på aktivitet/kapabilitet
- Lukkes med klikk utenfor eller kryssknapp

## 2. Veikart-forbedringer

### Visuelt hierarki mellom horisonter
- Nær horisont: sterkere bakgrunn, tydeligere kort, kanskje subtil venstre-kant
- Lang horisont: lysere, lavere opacity — føles mer tentativ
- Formål: nær er der beslutningene tas NÅ, lang er retning

### Aktivitetskort: mer info, færre prikker
- Fjern fargeprikker for verdikjeder/avhengigheter
- Legg til kompakt infoline: "4 kap · 1 dep" eller antall effekter
- Behold dimensjonsfarge via svømmebanen, ikke på kortet
- Evt. lite lås/pil-ikon for avhengighet, blå prikk for notat

### Milepæler synlige i veikartet
- Vertikale stiplede linjer med label ("Styrevedtak", "Go/no-go")
- Filterknapp toggler av/på, men default er synlig
- Gir narrativ struktur ledere kjenner

### Verdikjede-spotlight
- Klikk på verdikjede → alt utenfor dimmes
- "Vis meg alt som driver Medlemsreisen" som ett klikk
- Fungerer på tvers av dimensjoner og horisonter

### Collapsible svømmebaner
- Klikk på dimensjonslabel → kollapser til én linje
- Frigjør plass for fokus på valgte dimensjoner
- Kontekst beholdes (du ser at banene finnes, bare minimert)

### Konsekvens ved fjerning: vis hele kaskaden
- Ikke bare "Vil blokkere: Datadrevet kultur"
- Vis også indirekte: "Datadrevet kultur blokkerer igjen AI-strategi"
- "Totalt 2 aktiviteter påvirkes nedstrøms"

## 3. Dashbord-redesign

### Layout: Les som en avis (hierarki ovenfra og ned)

```
┌─────────────────────────────────────────────────────┐
│ EXECUTIVE SUMMARY (3 setninger, full bredde)        │
├─────────────────────────────────────────────────────┤
│ EFFEKTTRAKT: 23 aktiviteter → 12 kap.løft → 7 eff. │
├──────────────────────┬──────────────────────────────┤
│ Dimensjonshelse      │ Modenhetsreise               │
│ (fargeprikk per dim) │ (linje: nå → mål per L1)     │
├──────────────────────┼──────────────────────────────┤
│ Eierbelastning       │ Kritisk sti                   │
│ (stolper + terskel)  │ (horisontal sekvens)          │
├──────────────────────┴──────────────────────────────┤
│ Verdikjeder (fremdrift)  │  Scenariosammenligning    │
└─────────────────────────────────────────────────────┘
```

### Executive summary (øverst, full bredde)
- Tre auto-genererte setninger som oppsummerer porteføljen
- "Porteføljen har 23 aktiviteter. Teknologi bærer 40% av belastningen.
   3 av 7 effekter avhenger av Dataplattform."
- Denne boksen er det en CEO leser. Alt under er utdyping.

### Effekttrakt
- Horisontal visualisering: Aktiviteter → Kapabilitetsløft → Effekter
- Tre tall koblet med piler — hele transformasjonens logikk på én linje
- Under: effekter gruppert etter type med baseline → target

### Dimensjonshelse (erstatter bare-tall-stolper)
- Prikk per dimensjon: grønn/gul/rød
- Automatisk beregnet fra eierbelastning + avhengighetsrisiko + kap.dekning
- Rød hvis: én eier > 4 samtidige, > 60% konsentrert, kritisk sti løper gjennom

### Eierbelastning med terskel
- Horisontale stolper + vertikal stiplet linje ved 4 aktiviteter
- Alt til høyre for linjen er rødt
- Umiddelbart synlig hvem som er overbelastet

### Modenhetsreise (erstatter to KPI-kort)
- Linje per L1-kapabilitet fra nåverdi til målverdi
- "Kommunikasjon gjør størst sprang, Data & Analyse har lengst vei"
- Mer handlingsrettet enn et gjennomsnitt

### Kritisk sti som narrativ
- Horisontal sekvens: "Prosess → Medlemsreise → Medlemssystem → Integrasjon → Data"
- Ikke bare "Kritisk sti: 5" — vis kjeden

### Scenariosammenlikning som kompakt kort
- Tre-linjers sammenligning: effekter, aktiviteter, kritisk sti per scenario
- Nok til å trigge diskusjon

### Advarsler som handlinger
- Ikke: "Kompetanse berøres av 3 samtidige aktiviteter"
- Men: "Vurder å forskyve Digital kompetanse for å avlaste HR"
- Startpunkt for diskusjon, trenger ikke være riktig

### Endringsindikatorer
- "Siden forrige snapshot: +2 aktiviteter, kritisk sti uendret"
- Små piler opp/ned ved KPI-er

### Verdikjeder med fremdrift
- "Medlemsreisen: 4 av 6 aktiviteter på nær horisont"
- Ikke bare inventarliste, men indikasjon på framdrift

## 4. Rollemoduser (ikke separate grensesnitt)

### Styringsmodus (møtemodus)
- Redigering låst, alt read-only
- Kommentarer kan legges til
- Litt større fonter, mer luft
- Verktøylinjer ryddigere — bare navigasjon og presentasjon
- Toggle via ikon i header (øye-ikon vs penn-ikon)

### Arbeidsmodus (standard)
- Full redigering, drag-and-drop, CRUD, import/eksport
- Alt synlig og redigerbart
- Der arkitekt/konsulent forbereder neste styringsmøte

### Standard landingsside per rolle
- CEO → lander på Dashbord
- CIO → lander på Veikart
- Konfigurerbar innstilling, ikke separate apper
- Alle kan navigere fritt til alle visninger

## 5. Status-håndtering (forsiktig)

- Maks tre verdier: Planlagt, Pågår, Fullført
- Aldri prosent, aldri fargegradient, aldri tidslinje
- Vurder om status bare skal vises i detaljpanel, ikke i veikartet
- Fullført-badges i veikartet → ser ut som prosjektrapport

## 6. Eksport-forbedring

- "Eksporter det du ser" — respekter aktive filter
- Filtrert til bare Teknologi nær horisont → PowerPoint med bare det
- Ikke alltid eksporter alt

## 7. Detaljpanel: Effektkjeden

- Ny seksjon "Bidrar til effekter" mellom kapabiliteter og overlapp
- Kobler aktivitet til verdi — svarer på "hvorfor gjør vi dette?"
- Uten den svarer panelet på "hva" men ikke "hvorfor"

## 8. Logo

### Design
- Fire horisontale avrundede streker (stilisert varde/cairn)
- Smalest øverst, bredest nederst
- Dimensjonsfargene: Ledelse (#ef4444), Virksomhet (#22c55e), Organisasjon (#eab308), Teknologi (#6366f1)
- NB: Unngå for runde, barneleke-aktige proporsjoner — mer kantete/flate streker

### Tekst
- "Cairn" i Instrument Serif (fallback: Georgia)
- Tagline "navigate the fog" i Plus Jakarta Sans

### Godkjente taglines
- "Cairn — navigate the fog"
- "Cairn — strategic wayfinding for leaders who move"
- "Stack the stones. See the path."
- "When the fog rolls in, you don't need a better map. You need a cairn."
- "A cairn doesn't need a legend. Neither should your strategy."

## Overordnet designprinsipp

Før du legger til en feature, spør: "Ville en CIO stille dette spørsmålet i et styringsmøte?"

- Ja → ta det med
- "Det ville prosjektlederen spørre om" → la det ligge

Cairn svarer på HVA og I HVILKEN REKKEFØLGE — aldri NÅR NØYAKTIG eller AV HVEM I DETALJ.

Vis veikartet. Bare veikartet. Alt annet er ett klikk unna.
EOF

echo "✓ IMPROVEMENTS.md opprettet i $(pwd)"
