# Cairn — Strategisk navigasjon for emergent strategi

## Konseptdesign

**Dato:** 2026-03-27
**Status:** Utkast

### Forhold til tidligere produktretning

Denne spec-en erstatter den tidligere AI-samtalepivoten (mars 2026) som primær konseptretning. Den tidligere retningen fokuserte på AI-drevet samtale som onboarding-mekanisme ("15-20 minutters samtale som bygger strategisk bilde"). Denne spec-en beholder AI-samtale som inputkanal (se Datainput, fase 2), men reposisjonerer Cairn fundamentalt: fra et verktøy som hjelper deg *formulere* en strategi, til et verktøy som hjelper deg *navigere* mens strategien utfolder seg. AI-ens primærrolle skifter fra samtalepartner i oppstart til løpende strategisk rådgiver som leser og tolker helhetsbildet over tid.

---

## Kjernekonsept og filosofi

Cairn er et strategisk navigasjonsverktøy for organisasjoner som anerkjenner at strategi er emergent.

Fundamentet er Mintzbergs innsikt: den realiserte strategien er alltid en blanding av det som var planlagt og det som oppsto underveis. I stedet for å love en bedre plan, gir Cairn en bedre oversikt — slik at ledelsen kan navigere bevisst mens strategien utfolder seg.

### Tre bærende prinsipper

1. **Bred retning, ikke smal sti.** Toppledelsen setter strategiske rammer — den brede retningen organisasjonen skal bevege seg i. Ikke detaljerte mål med KPI-er, men tydelige grenser for hva som er "innenfor" og "utenfor" kurs.

2. **Bildet fremtrer nedenfra.** Initiativer, prosjekter og beslutninger registreres av taktisk nivå. Cairn aggregerer dette til et helhetsbilde som viser hva organisasjonen faktisk gjør — uavhengig av hva planen sier.

3. **Innsikt muliggjør navigasjon.** AI-en tolker bildet mot de strategiske rammene og fire governance-dimensjoner (Ledelse, Virksomhet, Organisasjon, Teknologi). Den synliggjør ubalanse, drift, og gapet mellom intendert og realisert retning.

### Metaforen

Organisasjonen beveger seg gjennom tåke. Toppledelsen peker ut retningen. Taktisk nivå legger vardene (registrerer det som skjer). Cairn viser terrenget som avtegner seg — og AI-en sier "du driver nordover, men du pekte sørvestover".

### Posisjonering

**Tagline:** "Navigate the fog."

**Posisjoneringssetning:** Cairn gir ledere oversikt over hva organisasjonen faktisk gjør — og om det henger sammen med retningen de har satt.

---

## Intellektuelt fundament

Cairn bygger på en alternativ strategitradisjon til den dominerende Porter/Gartner-skolen:

- **Henry Mintzberg** — Deliberate vs. emergent strategy. Strategi som mønster i en strøm av beslutninger, ikke en plan som skrives på forhånd. "Crafting Strategy" (1987), "The Rise and Fall of Strategic Planning" (1994).
- **Karl Weick** — Sensemaking. Vi handler først og forstår etterpå. Strategi er retrospektiv meningsskaping.
- **Dave Snowden** — Cynefin. I komplekse domener kan du ikke analysere deg til svaret. Du må probe-sense-respond.
- **Rita McGrath** — Transient advantage. Varige konkurransefortrinn er en illusjon.

### Kontrast til etablerte verktøy

| Kategori | Eksempler | Antagelse | Cairns antagelse |
|---|---|---|---|
| Strategisk planlegging | Cascade, Quantive, Workboard | Strategi er deliberate — sett mål, mål fremdrift | Strategi er emergent — se hva som skjer, naviger bevisst |
| EA/arkitektur | LeanIX, Ardoq | Kartlegg arkitektur, koble til strategi | Kartlegg retning og balanse, ikke arkitektur |
| Prosjektstyring | Jira, Azure DevOps | Planlegg og lever | Cairn er ikke prosjektstyring |
| BI/rapportering | Power BI, Tableau | Måler operasjonelle metrikker i sanntid | Tolker strategisk koherens — henger det vi gjør sammen med retningen? |
| Presentasjon | PowerPoint | Strategidokumentet som stillbilde | Levende bilde som oppdateres kontinuerlig |

### Hva Cairn bevisst ikke er

- Et prosjektstyringsverktøy
- Et strategisk planleggingsverktøy (i Porter-tradisjonen)
- Et EA-verktøy
- Et BI-verktøy

---

## Brukermodell — to lag, én virkelighet

### Taktisk nivå (bygger bildet)

**Hvem:** Programeiere, virksomhetsarkitekter, mellomledere, PMO.

**Hva de gjør:**
- Registrerer initiativer — hva gjøres, hvilken dimensjon, hvilke kapabiliteter berøres, avhengigheter
- Oppdaterer status — enkel: planlagt, pågår, stoppet, fullført, endret retning
- Kobler initiativer til kapabiliteter og effekter

Lavt friksjon er kritisk. Cairn trenger ikke timerapportering eller milepælsoppfølging. Det trenger et ærlig bilde av hva som skjer.

### Toppledelsen (leser bildet, setter rammer)

**Hvem:** CEO, CxO, ledergruppen.

**Hva de gjør:**

1. **Setter strategiske rammer** — den brede retningen. Ikke "vi skal øke omsetningen med 15%", men "vi skal digitalisere kundeflaten". Rammer som gir rom for emergent strategi, men med tydelige grenser.

2. **Leser det diagnostiske bildet:**
   - Hva organisasjonen faktisk gjør (aggregert fra taktisk nivå)
   - Hvordan det fordeler seg på de fire dimensjonene
   - Hvor det er ubalanse, blinde flekker, eller drift fra rammene
   - AI-genererte innsikter og spørsmål å ta stilling til

### Flyten mellom lagene

```
Toppledelsen:   Setter rammer    ←→    Leser bilde + innsikt    →    Justerer rammer
                     ↓                        ↑
Taktisk nivå:   Mottar rammer    →    Registrerer virkelighet   →    Bildet oppdateres
```

Ingen enveiskjøring. Når toppledelsen ser at den emergente strategien er bedre enn den intenderte, kan de justere rammene. Det er Mintzberg i praksis.

---

## Dimensjonsmodellen — diagnostisk linse

De fire governance-dimensjonene er Cairns kjernediagnostikk — en modell for om transformasjonen er bærekraftig.

### De fire dimensjonene

| Dimensjon | Hva den dekker | Typisk blindsone |
|---|---|---|
| **Teknologi** | Systemer, plattformer, infrastruktur, data, integrasjoner | Ofte overrepresentert — "digital transformasjon" tolkes som teknologiprosjekter |
| **Virksomhet** | Prosesser, tjenester, forretningsmodell, kundeflate, verdikjeder | Faller mellom stolene — "noen andre tar seg av prosessene" |
| **Organisasjon** | Kompetanse, kultur, kapasitet, endringsevne, roller, struktur | Mest undervurdert — "vi ansetter noen nye folk" |
| **Ledelse** | Styring, beslutningsstruktur, prioritering, governance, ansvar | Ofte implisitt — "det ordner seg når vi har teknologien" |

### Hypotese

En transformasjon som bare adresserer én eller to dimensjoner vil feile. Teknologi uten organisasjonsutvikling = systemer ingen bruker. Prosessendring uten ledelsesforankring = endring ingen følger opp.

### Hvordan Cairn bruker dimensjonene

1. **Hvert initiativ tagges med primærdimensjon(er)** — ikke rigid 1:1, men "dette handler primært om teknologi, og sekundært om organisasjon".

2. **Cairn aggregerer og viser balansen** — visuelt og tydelig: "Dere har 35 initiativer. 25 er teknologi, 6 er virksomhet, 3 er organisasjon, 1 er ledelse."

3. **AI-en tolker ubalansen** — ikke bare tall, men konsekvens: "Dere ruller ut et nytt CRM-system (teknologi) og endrer salgsprosessen (virksomhet), men har ingen initiativer for kompetanseutvikling i salgsorganisasjonen (organisasjon) eller ny ansvarsfordeling mellom salg og marked (ledelse). Erfaringsmessig betyr dette at adopsjonen vil bli lav."

Dimensjonsmodellen er ikke en universell sannhet — den er en linse som hjelper deg se det du ellers overser. Cairn påstår ikke at du trenger nøyaktig 25% i hver dimensjon. Men den synliggjør ubalanse slik at du kan ta et bevisst valg.

---

## AI-laget — fra bilde til innsikt

AI-en i Cairn er ikke en chatbot du stiller spørsmål. Den er en strategisk rådgiver som leser bildet og kommer til deg med observasjoner.

### Tre roller

#### 1. Diagnostikk — "Hva ser jeg?"

AI-en analyserer det samlede bildet og gir løpende diagnostikk:

- **Dimensjonsbalanse:** "72% av initiativene er teknologirettet. Organisasjon er sterkt underrepresentert."
- **Kapasitetsvurdering:** "Dere har startet 8 nye initiativer siste kvartal, men kun fullført 2. Organisasjonen ser ut til å ha absorberingsproblemer."
- **Avhengighetsrisiko:** "Initiativ X forutsetter kapabilitet Y som ingen andre initiativer bygger. Det er en blindsone."

#### 2. Driftsdeteksjon — "Hvor beveger dere dere?"

AI-en sammenligner den brede strategiske retningen med det som faktisk skjer — både mot strategiske rammer (retning) og dimensjonsbalanse. Disse er to uavhengige analyser som sammen gir et komplett bilde: retningsanalysen viser *om* dere går riktig vei, dimensjonsanalysen viser *om transformasjonen er bærekraftig* på veien dit.

- **Retningsdrift:** "Rammene sier 'datadrevet organisasjon', men 80% av nye initiativer handler om prosessoptimalisering. Dere gjør noe annet enn dere sa."
- **Emergent strategi:** "Det har dukket opp et kluster av initiativer rundt kundedata som ingen besluttet eksplisitt. Det kan være en emergent strategisk retning verdt å anerkjenne."
- **Gap:** "Dere sa 'digitalisere kundeflaten'. Ingenting av det dere gjør adresserer kundekontaktpunktene direkte."
- **Effektvurdering:** "Dere forventet at initiativ X, Y, Z skulle øke antall medlemmer. X er stoppet, Y har endret retning, bare Z pågår. Er den forventede effekten fortsatt realistisk?"
- **Effekt-dimensjon-kobling:** "Dere har 12 initiativer koblet til effekten 'økt kundetilfredshet', men ingen av dem adresserer organisasjonsdimensjonen. Kundetilfredshet krever typisk kompetanseendring i frontlinjen."

#### 3. Sparring — "Hva bør du tenke på?"

AI-en stiller spørsmål lederen ikke stilte selv:

- "Dere har kuttet tre initiativer innen organisasjonsutvikling de siste to månedene. Var det en bevisst prioritering, eller konsekvens av budsjettkutt?"
- "CRM-prosjektet er det største enkeltinitiativet. Det har ingen koblinger til ledelsesdimensjonen. Hvem eier endringen i salgsorganisasjonen?"
- "Forrige kvartal var du bekymret for endringstretthet. Siden da har dere startet fire nye initiativer. Har noe endret seg?"

### Prinsipp

AI-en skal være spesifikk og kontekstuell, ikke generisk. "Dere bør tenke på organisasjonsutvikling" er verdiløst. "Dere ruller ut nytt CRM uten noe initiativ for kompetansebygging i salg — det er konkret risiko for lav adopsjon" er verdifullt.

### Leveringsform

AI-innsiktene er ikke noe du må be om. De dukker opp som strategiske varsler — proaktivt, når bildet endrer seg eller når det er noe å reagere på. Toppledelsen åpner Cairn og ser: "3 nye innsikter siden sist."

---

## Domenemodell

### Strategiske rammer (toppledelsens input)

- **Strategisk retning** — den brede kursen: "Vi skal bli en datadrevet organisasjon". Ikke SMART-mål, men tydelige nok til at Cairn kan vurdere om initiativene beveger seg innenfor rammene.
- **Strategiske temaer** — de 3-5 områdene som retningen brytes ned i. F.eks. "kundedata", "prosessdigitalisering", "kompetanseløft". Fleksible nok til å justeres.

### Initiativer (taktisk nivås input)

- **Beskrivelse** — hva gjøres, hvorfor, hvem eier det
- **Dimensjon(er)** — primær og eventuelt sekundær (Teknologi, Virksomhet, Organisasjon, Ledelse)
- **Kapabiliteter** — hvilke organisatoriske kapabiliteter dette berører eller bygger
- **Avhengigheter** — dette forutsetter/muliggjør andre initiativer
- **Status** — enkel: planlagt, pågår, stoppet, fullført, endret retning
- **Horisont** — tre nivåer: nå (pågår aktivt), neste (besluttet, ikke startet), senere (identifisert, usikkert). Gjenspeiler tåke-metaforen: det nære er tydelig, det fjerne er uklart.

### Kapabiliteter

Kapabiliteter i Cairn er *forretningskapabiliteter* — hva organisasjonen kan gjøre og trenger å kunne gjøre. Eksempler: "digital kundeservice", "datadrevet beslutningsstøtte", "smidig produktutvikling". De er grovkornede (10-30 stykker, ikke hundrevis) og beskriver evner, ikke systemer eller arkitektur. Cairn er ikke et EA-verktøy — det mapper ikke teknisk arkitektur, applikasjonslandskap eller integrasjoner. Kapabiliteter i Cairn svarer på spørsmålet "hva trenger vi å *kunne*?", ikke "hva har vi *bygget*?".

- **Kapabilitetskart** — organisasjonens nøkkelkapabiliteter, grovkornet
- **Modenhet** — enkel vurdering av nåtilstand
- **Kobling til initiativer** — hvilke initiativer bygger/endrer denne kapabiliteten

### Effekter (forventede konsekvenser)

- **Beskrivelse** — hva vi forventer skal skje: "øke antall medlemmer"
- **Koblede initiativer** — hvilke initiativer bidrar til denne effekten
- **Konfidensgrad** — hvor sikre er vi? Oppdateres over tid etterhvert som bildet endrer seg

Effekter er hypoteser, ikke mål. "Hvis vi gjør X, Y, Z, forventer vi at dette fører til økt antall medlemmer." AI-en bruker koblingen mellom initiativer og effekter til å vurdere: er det fortsatt sannsynlig at denne effekten oppnås, gitt det som faktisk skjer?

### Bevisst ekskludert fra domenemodellen

- Datoer og tidslinjer — sekvens og horisont, ja. Gantt-chart, nei.
- Budsjett/investering — ikke Cairns jobb. Finnes i økonomisystemer.
- Prosentvis fremdrift — meningsløst i et emergent perspektiv.
- KPI-er og måltall — Cairn viser retning og balanse, ikke target vs. actual.
- Ressursallokering — prosjektstyringsverktøyenes domene.

---

## Datainput — fasevis tilnærming

### Fase 1: Manuell input
Taktisk nivå registrerer initiativer, kapabiliteter og effekter direkte i Cairn. Lavest terskel, raskest å bygge.

### Fase 2: AI-assistert input
AI-samtalen som inputkanal — lederen snakker om hva som skjer, Cairn strukturerer det til initiativer og koblinger. Reduserer friksjon.

### Fase 3: Integrasjoner
Cairn henter data fra eksisterende systemer (Jira, Azure DevOps, budsjett, etc.) og aggregerer bildet automatisk. Mest ambisiøst, men gir mest komplett bilde. Denne fasen er aspirasjonell og ikke nødvendig for produktets kjerneverdi — fase 1 og 2 skal bære produktet alene. Fase 3 blir relevant når organisasjoner med 50+ initiativer trenger automatisert oppdatering.

---

## Scope og avgrensninger

### Organisasjonsgrenser

Denne spec-en beskriver Cairn for én organisatorisk enhet — en virksomhet, divisjon eller forretningsenhet. Spørsmålet om konsern-/gruppenivå (se på tvers av flere enheter) er en reell utvidelse, men utenfor scope for MVP. Det er en scoping-beslutning som bør tas etter at kjernekonseptet er validert med én organisasjon.
