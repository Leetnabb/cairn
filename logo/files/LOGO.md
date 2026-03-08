# Cairn Logo — Implementering

## Logodesign

Cairn-logoen består av fire horisontale avrundede streker (som en stilisert varde/cairn),
der hver strek representerer en dimensjon i verktøyet:

| Strek    | Dimensjon    | Farge   | Bredde  |
|----------|-------------|---------|---------|
| 1 (topp) | Ledelse     | #ef4444 | Smalest |
| 2        | Virksomhet  | #22c55e | Medium  |
| 3        | Organisasjon| #eab308 | Bred    |
| 4 (bunn) | Teknologi   | #6366f1 | Bredest |

Strekene er sentrert, har rx/ry=3.5 for avrunding, og 0.9 opacity.
De stables vertikalt med jevn avstand — som steiner i en varde.

Teksten "Cairn" settes i Instrument Serif (fallback: Georgia).
Tagline "navigate the fog" i Plus Jakarta Sans (fallback: system-ui).

## Filer

1. CairnLogo.tsx — React-komponent med CairnMark og CairnLogo exports
2. cairn-mark.svg — Bare ikonet (favicon, app icon)
3. cairn-logo-full.svg — Komplett med tekst

## Bruk

    // Full logo med tagline
    <CairnLogo size={1} />

    // Uten tagline
    <CairnLogo size={1} showTagline={false} />

    // Bare ikon
    <CairnMark size={0.5} />

    // Mørk bakgrunn
    <CairnLogo dark={true} />

## Google Fonts — legg til i index.html

    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
