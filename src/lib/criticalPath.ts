import type { Initiative } from '../types';

export function computeCriticalPath(initiatives: Initiative[]): Set<string> {
  const map = new Map(initiatives.map(i => [i.id, i]));
  const memo = new Map<string, string[]>();
  // Guards against infinite recursion when dependsOn contains a cycle or
  // self-reference (e.g. from hand-edited or imported data). On a back-edge we
  // treat the dependency as unreachable for this branch instead of recursing.
  const visiting = new Set<string>();

  function longestPath(id: string): string[] {
    const cached = memo.get(id);
    if (cached) return cached;
    const init = map.get(id);
    if (!init || init.dependsOn.length === 0) {
      memo.set(id, [id]);
      return [id];
    }
    visiting.add(id);
    let longest: string[] = [];
    for (const depId of init.dependsOn) {
      if (!map.has(depId) || visiting.has(depId)) continue;
      const path = longestPath(depId);
      if (path.length > longest.length) longest = path;
    }
    visiting.delete(id);
    const result = [...longest, id];
    memo.set(id, result);
    return result;
  }

  let critical: string[] = [];
  for (const init of initiatives) {
    const p = longestPath(init.id);
    if (p.length > critical.length) critical = p;
  }
  return new Set(critical);
}

export function getMergedCriticalPath(initiatives: Initiative[]): { merged: Set<string>; auto: Set<string> } {
  const auto = computeCriticalPath(initiatives);
  const merged = new Set<string>();

  for (const init of initiatives) {
    const override = init.criticalPathOverride;
    if (override === true) {
      merged.add(init.id);
    } else if (override === false) {
      // explicitly excluded — skip
    } else {
      // null/undefined — follow auto
      if (auto.has(init.id)) {
        merged.add(init.id);
      }
    }
  }

  return { merged, auto };
}
