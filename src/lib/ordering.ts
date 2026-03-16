import type { Initiative, DimensionKey, Effect, EffectType, Capability } from '../types';

/**
 * Reorders initiatives when one is moved to a new position.
 * Returns a new array with updated `order` values.
 * O(n) complexity using a Map for zone index lookups.
 */
export function reorderInitiatives(
  initiatives: Initiative[],
  id: string,
  dimension: DimensionKey,
  horizon: 'near' | 'far',
  newOrder: number,
): Initiative[] | null {
  // Apply dimension/horizon change to the moved initiative
  const updated = initiatives.map(i =>
    i.id === id ? { ...i, dimension, horizon } : i
  );

  // Collect all items in the target zone except the moved one
  const zone = updated
    .filter(i => i.dimension === dimension && i.horizon === horizon && i.id !== id)
    .sort((a, b) => a.order - b.order);

  const moved = updated.find(i => i.id === id);
  if (!moved) return null;

  // Insert at requested position
  zone.splice(newOrder, 0, moved);

  // Build O(1) lookup: id → new order index
  const zoneOrderMap = new Map(zone.map((item, idx) => [item.id, idx]));

  return updated.map(i => {
    const idx = zoneOrderMap.get(i.id);
    if (idx !== undefined) return { ...i, order: idx };
    return i;
  });
}

/**
 * Reorders effects when one is moved to a new position or type column.
 * Returns a new array with updated `order` and `type` values.
 */
export function reorderEffects(
  effects: Effect[],
  id: string,
  type: EffectType,
  newOrder: number,
): Effect[] | null {
  const updated = effects.map(e =>
    e.id === id ? { ...e, type } : e
  );

  const group = updated
    .filter(e => e.type === type && e.id !== id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const moved = updated.find(e => e.id === id);
  if (!moved) return null;

  group.splice(newOrder, 0, moved);

  const groupOrderMap = new Map(group.map((item, idx) => [item.id, idx]));

  return updated.map(e => {
    const idx = groupOrderMap.get(e.id);
    if (idx !== undefined) return { ...e, order: idx };
    return e;
  });
}

/**
 * Reorders capabilities when one is moved to a new parent or position.
 * Returns a new array with updated `order` and `parent` values.
 * newParent=null means L1 level (no parent).
 */
export function reorderCapabilities(
  capabilities: Capability[],
  id: string,
  newParent: string | null,
  newOrder: number,
): Capability[] | null {
  const updated = capabilities.map(c =>
    c.id === id ? { ...c, parent: newParent } : c
  );

  const group = updated
    .filter(c => c.parent === newParent && c.id !== id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const moved = updated.find(c => c.id === id);
  if (!moved) return null;

  group.splice(newOrder, 0, moved);

  const groupOrderMap = new Map(group.map((item, idx) => [item.id, idx]));

  return updated.map(c => {
    const idx = groupOrderMap.get(c.id);
    if (idx !== undefined) return { ...c, order: idx };
    return c;
  });
}
