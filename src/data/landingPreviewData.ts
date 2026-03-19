// Static, anonymized strategic picture for the landing page product preview.
// Deliberately skewed toward technology to trigger recognition in visitors.

export const landingPreviewData = {
  initiatives: [
    { id: 'l1', name: { en: 'New governance model', nb: 'Ny styringsmodell' }, dimension: 'ledelse' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 'v1', name: { en: 'Customer portal 2.0', nb: 'Kundeportal 2.0' }, dimension: 'virksomhet' as const, horizon: 'near' as const, status: 'in_progress' as const },
    { id: 'v2', name: { en: 'Automated reporting', nb: 'Automatisert rapportering' }, dimension: 'virksomhet' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 'o1', name: { en: 'Digital competency programme', nb: 'Kompetanseløft digital' }, dimension: 'organisasjon' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't1', name: { en: 'Cloud migration phase 2', nb: 'Skymigrering fase 2' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'in_progress' as const },
    { id: 't2', name: { en: 'API platform', nb: 'API-plattform' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't3', name: { en: 'IAM modernisation', nb: 'IAM-modernisering' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't4', name: { en: 'Data platform', nb: 'Dataplatform' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't5', name: { en: 'DevOps pipeline', nb: 'DevOps-pipeline' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'in_progress' as const },
    { id: 't6', name: { en: 'Legacy decommission', nb: 'Legacy-utfasing' }, dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't7', name: { en: 'Integration platform', nb: 'Integrasjonsplattform' }, dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't8', name: { en: 'AI/ML capability', nb: 'AI/ML-kapabilitet' }, dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't9', name: { en: 'Security programme', nb: 'Sikkerhetsprogram' }, dimension: 'teknologi' as const, horizon: 'near' as const, status: 'in_progress' as const },
  ],
  capabilities: [
    { id: 'c1', name: { en: 'Cloud infrastructure', nb: 'Skyinfrastruktur' }, level: 1 as const, maturity: 2, risk: 2 },
    { id: 'c2', name: { en: 'Integration', nb: 'Integrasjon' }, level: 1 as const, maturity: 1, risk: 3 },
    { id: 'c3', name: { en: 'Data governance', nb: 'Datastyring' }, level: 1 as const, maturity: 1, risk: 2 },
    { id: 'c4', name: { en: 'Change management', nb: 'Endringsledelse' }, level: 1 as const, maturity: 1, risk: 3 },
    { id: 'c5', name: { en: 'Digital competence', nb: 'Digital kompetanse' }, level: 1 as const, maturity: 1, risk: 2 },
  ],
};
