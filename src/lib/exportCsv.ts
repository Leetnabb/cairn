import type { Capability, Initiative, Effect } from '../types';
import type { UIState } from '../types';
import i18n from '../i18n';

const BOM = '\uFEFF';

export type ExportFilters = UIState['filters'] | undefined;

function filterInitiatives(initiatives: Initiative[], filters?: ExportFilters): Initiative[] {
  if (!filters) return initiatives;
  return initiatives.filter(i => {
    if (filters.dimensions.length > 0 && !filters.dimensions.includes(i.dimension)) return false;
    if (filters.horizon !== 'all' && filters.horizon !== i.horizon) return false;
    if (filters.owner && !i.owner.toLowerCase().includes(filters.owner.toLowerCase())) return false;
    if (filters.status && (i.status ?? 'planned') !== filters.status) return false;
    if (filters.search && !i.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
}

function escapeCsv(val: string): string {
  if (val.includes(';') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportCapabilitiesCsv(capabilities: Capability[]) {
  const header = i18n.t('export.csvCapHeaders', { returnObjects: true }) as string[];
  const rows = capabilities.map(c => [
    c.id, c.name, String(c.level), c.parent ?? '', String(c.maturity), String(c.risk), c.description,
  ]);
  const csv = BOM + [header, ...rows].map(r => r.map(escapeCsv).join(';')).join('\n');
  downloadCsv(csv, i18n.t('export.csvCapFilename'));
}

export function exportInitiativesCsv(initiatives: Initiative[], filters?: ExportFilters) {
  initiatives = filterInitiatives(initiatives, filters);
  const header = i18n.t('export.csvInitHeaders', { returnObjects: true }) as string[];
  const rows = initiatives.map(i => [
    i.id, i.name, i.dimension, i.horizon, String(i.order), i.owner, i.description,
    i.capabilities.join(','), i.dependsOn.join(','), i.notes, i.valueChains.join(','),
    i.status ?? 'planned',
  ]);
  const csv = BOM + [header, ...rows].map(r => r.map(escapeCsv).join(';')).join('\n');
  downloadCsv(csv, i18n.t('export.csvInitFilename'));
}

export function exportEffectsCsv(effects: Effect[]) {
  const header = i18n.t('export.csvEffHeaders', { returnObjects: true }) as string[];
  const rows = effects.map(e => [
    e.id, e.name, e.type, e.description,
    e.indicator ?? '', e.baseline ?? '', e.target ?? '',
    e.capabilities.join(','), e.initiatives.join(','),
  ]);
  const csv = BOM + [header, ...rows].map(r => r.map(escapeCsv).join(';')).join('\n');
  downloadCsv(csv, i18n.t('export.csvEffFilename'));
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
