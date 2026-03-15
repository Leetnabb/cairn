import type { Initiative, DimensionKey } from '../types';

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
