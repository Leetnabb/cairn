import type { Initiative, Capability, Effect } from '../types';

export interface StrategicInsight {
  id: string;
  priority: number; // lower = more important
  message: string; // discussion-ready, not technical
  detail: string; // supporting data
  relatedIds: string[]; // initiative/capability IDs for drill-down
  type: 'imbalance' | 'blocker' | 'gap' | 'opportunity';
}

export function computeStrategicInsights(
  initiatives: Initiative[],
  capabilities: Capability[],
  effects: Effect[],
): StrategicInsight[] {
  const strategic: StrategicInsight[] = [];

  // 1. Dimension imbalance — highest priority
  const dimCounts: Record<string, number> = { ledelse: 0, virksomhet: 0, organisasjon: 0, teknologi: 0 };
  initiatives.forEach(i => { dimCounts[i.dimension]++; });
  const total = initiatives.length;
  const sorted = Object.entries(dimCounts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  const empty = Object.entries(dimCounts).filter(([, c]) => c === 0).map(([d]) => d);

  if (total > 0 && dominant[1] / total > 0.5) {
    strategic.push({
      id: 'dimension-imbalance',
      priority: 1,
      message: `${dominant[1]} av ${total} initiativer er ${dominant[0]}. ${empty.length > 0 ? `${empty.join(' og ')} har ingen.` : ''}`,
      detail: Object.entries(dimCounts).map(([d, c]) => `${d}: ${c}`).join(', '),
      relatedIds: initiatives.filter(i => i.dimension === dominant[0]).map(i => i.id),
      type: 'imbalance',
    });
  }

  // 2. Unlinked capabilities (level 1 with no initiatives linked to them)
  const unlinked = capabilities.filter(c =>
    c.level === 1 && !initiatives.some(i => i.capabilities.includes(c.id))
  );
  if (unlinked.length > 0) {
    strategic.push({
      id: 'unlinked-capabilities',
      priority: 2,
      message: `${unlinked.length} kapabilitet${unlinked.length > 1 ? 'er' : ''} har ingen initiativer koblet til seg.`,
      detail: unlinked.map(c => c.name).join(', '),
      relatedIds: unlinked.map(c => c.id),
      type: 'blocker',
    });
  }

  // 3. Effects without initiative linkage
  const unlinkedEffects = effects.filter(e =>
    !e.initiatives || e.initiatives.length === 0
  );
  if (unlinkedEffects.length > 0) {
    strategic.push({
      id: 'unlinked-effects',
      priority: 3,
      message: `${unlinkedEffects.length} effektmål har ingen kobling til aktive initiativer.`,
      detail: unlinkedEffects.map(e => e.name).join(', '),
      relatedIds: unlinkedEffects.map(e => e.id),
      type: 'gap',
    });
  }

  // 4. Owner overload (>=4 initiatives)
  const ownerCounts: Record<string, number> = {};
  initiatives.forEach(i => { if (i.owner) ownerCounts[i.owner] = (ownerCounts[i.owner] || 0) + 1; });
  const overloaded = Object.entries(ownerCounts).filter(([, c]) => c >= 4);
  if (overloaded.length > 0) {
    strategic.push({
      id: 'owner-overload',
      priority: 4,
      message: `${overloaded.map(([o, c]) => `${o} (${c})`).join(', ')} har mange initiativer. Er kapasiteten realistisk?`,
      detail: '',
      relatedIds: initiatives.filter(i => overloaded.some(([o]) => i.owner === o)).map(i => i.id),
      type: 'blocker',
    });
  }

  return strategic.sort((a, b) => a.priority - b.priority).slice(0, 4);
}
