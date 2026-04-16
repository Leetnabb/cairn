// Static, anonymized strategic picture for the landing page product preview.
// Deliberately skewed toward technology to trigger recognition in visitors.

export const landingPreviewData = {
  initiatives: [
    { id: 'l1', name: 'New governance model', dimension: 'ledelse' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 'v1', name: 'Customer portal 2.0', dimension: 'virksomhet' as const, horizon: 'near' as const, status: 'active' as const },
    { id: 'v2', name: 'Automated reporting', dimension: 'virksomhet' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 'o1', name: 'Digital capability uplift', dimension: 'organisasjon' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't1', name: 'Cloud migration phase 2', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'active' as const },
    { id: 't2', name: 'API platform', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't3', name: 'IAM modernization', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't4', name: 'Data platform', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'planned' as const },
    { id: 't5', name: 'DevOps pipeline', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'active' as const },
    { id: 't6', name: 'Legacy decommissioning', dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't7', name: 'Integration platform', dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't8', name: 'AI/ML capability', dimension: 'teknologi' as const, horizon: 'far' as const, status: 'planned' as const },
    { id: 't9', name: 'Security program', dimension: 'teknologi' as const, horizon: 'near' as const, status: 'active' as const },
  ],
  capabilities: [
    { id: 'c1', name: 'Cloud Infrastructure', level: 1 as const, maturity: 2, risk: 2 },
    { id: 'c2', name: 'Integration', level: 1 as const, maturity: 1, risk: 3 },
    { id: 'c3', name: 'Data Governance', level: 1 as const, maturity: 1, risk: 2 },
    { id: 'c4', name: 'Change Management', level: 1 as const, maturity: 1, risk: 3 },
    { id: 'c5', name: 'Digital Competence', level: 1 as const, maturity: 1, risk: 2 },
  ],
};
