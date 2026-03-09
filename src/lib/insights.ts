import type { Initiative, Capability, Effect, EffectType } from '../types';
import { DIMENSIONS } from '../types';
import i18n from '../i18n';

export interface Insight {
  type: 'warning' | 'info' | 'positive';
  message: string;
}

const CAP_COLLISION_THRESHOLD = 3;
const OWNER_CAPACITY_THRESHOLD = 4;
const MAX_ORPHAN_DISPLAY = 3;
const EFFECT_CONCENTRATION_THRESHOLD = 3;

export function computeInsights(initiatives: Initiative[], capabilities: Capability[], effects: Effect[] = []): Insight[] {
  const insights: Insight[] = [];

  // Capability collision: ≥3 initiatives touching same capability
  const capCount: Record<string, number> = {};
  for (const i of initiatives) {
    for (const c of i.capabilities) {
      capCount[c] = (capCount[c] || 0) + 1;
    }
  }
  for (const [capId, count] of Object.entries(capCount)) {
    if (count >= CAP_COLLISION_THRESHOLD) {
      const cap = capabilities.find(c => c.id === capId);
      insights.push({ type: 'warning', message: i18n.t('insights.capCollision', { name: cap?.name ?? capId, count }) });
    }
  }

  // Near depends on far
  const initMap = new Map(initiatives.map(i => [i.id, i]));
  for (const i of initiatives) {
    if (i.horizon === 'near') {
      for (const depId of i.dependsOn) {
        const dep = initMap.get(depId);
        if (dep && dep.horizon === 'far') {
          insights.push({ type: 'warning', message: i18n.t('insights.nearDependsFar', { nearName: i.name, farName: dep.name }) });
        }
      }
    }
  }

  // Owner capacity: ≥4 activities
  const ownerCount: Record<string, number> = {};
  for (const i of initiatives) {
    ownerCount[i.owner] = (ownerCount[i.owner] || 0) + 1;
  }
  for (const [owner, count] of Object.entries(ownerCount)) {
    if (count >= OWNER_CAPACITY_THRESHOLD) {
      insights.push({ type: 'warning', message: i18n.t('insights.ownerCapacity', { owner, count }) });
    }
  }

  // Dimensions without near-horizon activities
  const nearDims = new Set(initiatives.filter(i => i.horizon === 'near').map(i => i.dimension));
  for (const dim of DIMENSIONS) {
    if (!nearDims.has(dim.key)) {
      insights.push({ type: 'info', message: i18n.t('insights.dimensionNoNear', { dimension: i18n.t(`labels.dimensions.${dim.key}`) }) });
    }
  }

  // Orphan capabilities: capabilities not referenced by any initiative
  const referencedCaps = new Set(initiatives.flatMap(i => i.capabilities));
  const orphanCaps = capabilities.filter(c => c.level === 2 && !referencedCaps.has(c.id));
  for (const cap of orphanCaps.slice(0, MAX_ORPHAN_DISPLAY)) {
    insights.push({ type: 'warning', message: i18n.t('insights.orphanCapability', { name: cap.name }) });
  }
  if (orphanCaps.length > MAX_ORPHAN_DISPLAY) {
    insights.push({ type: 'warning', message: i18n.t('insights.more', { count: orphanCaps.length - MAX_ORPHAN_DISPLAY }) });
  }

  // Orphan initiatives: initiatives without any linked capabilities
  const orphanInits = initiatives.filter(i => i.capabilities.length === 0);
  for (const init of orphanInits.slice(0, MAX_ORPHAN_DISPLAY)) {
    insights.push({ type: 'warning', message: i18n.t('insights.orphanInitiative', { name: init.name }) });
  }
  if (orphanInits.length > MAX_ORPHAN_DISPLAY) {
    insights.push({ type: 'warning', message: i18n.t('insights.more', { count: orphanInits.length - MAX_ORPHAN_DISPLAY }) });
  }

  // All dimensions covered
  const allDims = new Set(initiatives.map(i => i.dimension));
  if (DIMENSIONS.every(d => allDims.has(d.key))) {
    insights.push({ type: 'positive', message: i18n.t('insights.allDimensionsCovered') });
  }

  // Effect insights
  if (effects.length > 0) {
    // Effects without near-horizon initiatives
    const nearInitIds = new Set(initiatives.filter(i => i.horizon === 'near').map(i => i.id));
    for (const eff of effects) {
      const hasNear = eff.initiatives.some(id => nearInitIds.has(id));
      if (!hasNear) {
        insights.push({ type: 'warning', message: i18n.t('effects.effectsWithoutNearInitiatives', { name: eff.name }) });
      }
    }

    // Initiatives without effect linkage
    const initIdsInEffects = new Set(effects.flatMap(e => e.initiatives));
    const unlinkedInits = initiatives.filter(i => !initIdsInEffects.has(i.id));
    for (const init of unlinkedInits.slice(0, MAX_ORPHAN_DISPLAY)) {
      insights.push({ type: 'warning', message: i18n.t('effects.initiativeWithoutEffect', { name: init.name }) });
    }

    // Missing effect types
    const allEffectTypes: EffectType[] = ['cost', 'quality', 'speed', 'compliance', 'strategic'];
    const presentTypes = new Set(effects.map(e => e.type));
    const missing = allEffectTypes.filter(t => !presentTypes.has(t));
    if (missing.length > 0) {
      const typeLabels = missing.map(t => i18n.t(`effects.types.${t}`)).join(', ');
      insights.push({ type: 'info', message: i18n.t('effects.missingEffectTypes', { types: typeLabels }) });
    }

    // Effect concentration: many effects depend on the same capability/initiative
    const capEffCount: Record<string, number> = {};
    for (const eff of effects) {
      for (const cid of eff.capabilities) {
        capEffCount[cid] = (capEffCount[cid] || 0) + 1;
      }
    }
    for (const [cid, count] of Object.entries(capEffCount)) {
      if (count >= EFFECT_CONCENTRATION_THRESHOLD) {
        const cap = capabilities.find(c => c.id === cid);
        if (cap) {
          insights.push({ type: 'info', message: i18n.t('effects.effectConcentration', { count, total: effects.length, name: cap.name }) });
        }
      }
    }
  }

  return insights;
}
