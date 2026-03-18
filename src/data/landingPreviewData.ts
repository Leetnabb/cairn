// Static, anonymized strategic picture for the landing page product preview.
// Deliberately skewed toward technology to trigger recognition in visitors.

export const landingPreviewData = {
  initiatives: [
    { id: 'l1', name: 'Ny styringsmodell', dimension: 'ledelse' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 'v1', name: 'Kundeportal 2.0', dimension: 'virksomhet' as const, horizon: 'near' as const, status: 'in_progress' as const },
    { id: 'v2', name: 'Automatisert rapportering', dimension: 'virksomhet' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 'o1', name: 'Kompetanseløft digital', dimension: 'organisasjon' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't1', name: 'Skymigrering fase 2', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'in_progress' as const },
    { id: 't2', name: 'API-plattform', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't3', name: 'IAM-modernisering', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't4', name: 'Dataplatform', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't5', name: 'DevOps-pipeline', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'in_progress' as const },
    { id: 't6', name: 'Legacy-utfasing', dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't7', name: 'Integrasjonsplattform', dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't8', name: 'AI/ML-kapabilitet', dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't9', name: 'Sikkerhetsprogram', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'in_progress' as const },
  ],
  capabilities: [
    { id: 'c1', name: 'Skyinfrastruktur', level: 1 as const, maturity: 2, risk: 2 },
    { id: 'c2', name: 'Integrasjon', level: 1 as const, maturity: 1, risk: 3 },
    { id: 'c3', name: 'Datastyring', level: 1 as const, maturity: 1, risk: 2 },
    { id: 'c4', name: 'Endringsledelse', level: 1 as const, maturity: 1, risk: 3 },
    { id: 'c5', name: 'Digital kompetanse', level: 1 as const, maturity: 1, risk: 2 },
  ],
};
