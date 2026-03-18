# Plan 2: Innsikt-først-dashboard

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the dashboard from a flat analytics view (12+ widgets) to a 3-layer decision-support view: Layer 1 = "What should you discuss?", Layer 2 = strategic health metrics, Layer 3 = deep-dive analysis for advisors.

**Architecture:** The existing Dashboard component gets restructured into three collapsible layers. The existing insights engine (`insights.ts`) and narrative engine (`narrativeEngine.ts`) are promoted to power Layer 1. Existing dashboard widgets become Layer 2 and Layer 3 content. Layer 3 visibility is controlled by the complexity level from Plan 1.

**Tech Stack:** React 19 / TypeScript / Zustand / Vitest / react-i18next

**Spec:** `docs/superpowers/specs/2026-03-18-cairn-improvement-design.md` section 3

**Depends on:** Plan 1 (complexity level in store) — but can be started before Plan 1 is complete by temporarily hardcoding level checks.

---

## File Structure

### New Files
- `src/lib/strategicInsights.ts` — Enhanced insight engine that produces prioritized, discussion-ready insights (wraps existing insights.ts)
- `src/lib/strategicInsights.test.ts` — Tests
- `src/components/dashboard/InsightCards.tsx` — Layer 1: clickable insight cards that drill into relevant data
- `src/components/dashboard/StrategicHealth.tsx` — Layer 2: contextual KPIs with delta tracking
- `src/components/dashboard/DeepDive.tsx` — Layer 3: wrapper for existing analytical widgets

### Modified Files
- `src/components/dashboard/Dashboard.tsx` — Restructure into 3-layer layout
- `src/lib/insights.ts` — Minor additions to support ranking/priority
- `src/i18n/locales/en.json` — New keys
- `src/i18n/locales/nb.json` — New keys

---

## Task 1: Enhanced Strategic Insights Engine

**Files:**
- Create: `src/lib/strategicInsights.ts`
- Create: `src/lib/strategicInsights.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/strategicInsights.test.ts
import { describe, it, expect, vi } from 'vitest';
import { computeStrategicInsights } from './strategicInsights';

vi.mock('react-i18next', () => ({
  default: { t: (k: string) => k },
}));

vi.mock('../types', async () => {
  const actual = await vi.importActual('../types');
  return { ...actual };
});

describe('computeStrategicInsights', () => {
  it('returns max 4 insights ranked by priority', () => {
    const initiatives = [
      // 9 teknologi, 1 ledelse
      ...Array.from({ length: 9 }, (_, i) => makeInit({ id: `t${i}`, dimension: 'teknologi' })),
      makeInit({ id: 'l1', dimension: 'ledelse' }),
    ];
    const capabilities = [
      makeCap({ id: 'c1', maturity: 1, risk: 3 }),
    ];
    const result = computeStrategicInsights(initiatives, capabilities, []);
    expect(result.length).toBeLessThanOrEqual(4);
    expect(result[0].priority).toBeLessThanOrEqual(result[1]?.priority ?? Infinity);
  });

  it('formats insights as discussion questions, not technical warnings', () => {
    const initiatives = [
      ...Array.from({ length: 8 }, (_, i) => makeInit({ id: `t${i}`, dimension: 'teknologi' })),
      makeInit({ id: 'o1', dimension: 'organisasjon' }),
    ];
    const result = computeStrategicInsights(initiatives, [], []);
    // Should be phrased as a question or observation, not "WARNING:"
    result.forEach(insight => {
      expect(insight.message).not.toMatch(/^WARNING/i);
    });
  });
});

// Factory helpers (matching existing test patterns)
function makeInit(overrides: Partial<any> = {}) {
  return {
    id: 'i1', name: 'Test', dimension: 'teknologi', horizon: 'near',
    order: 0, capabilities: [], description: '', owner: '',
    dependsOn: [], maturityEffect: {}, notes: '', valueChains: [],
    status: 'planned', confidence: 'confirmed', ...overrides,
  };
}

function makeCap(overrides: Partial<any> = {}) {
  return {
    id: 'c1', name: 'Cap', level: 1, parent: null,
    maturity: 2, risk: 1, description: '', order: 0, ...overrides,
  };
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/strategicInsights.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement strategic insights**

```typescript
// src/lib/strategicInsights.ts
import { computeInsights } from './insights';
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
  const raw = computeInsights(initiatives, capabilities, effects);
  const strategic: StrategicInsight[] = [];

  // Dimension imbalance — highest priority
  const dimCounts = { ledelse: 0, virksomhet: 0, organisasjon: 0, teknologi: 0 };
  initiatives.forEach(i => { dimCounts[i.dimension]++; });
  const total = initiatives.length;
  const dominant = Object.entries(dimCounts).sort((a, b) => b[1] - a[1])[0];
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

  // Orphan capabilities on critical path
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

  // Effects without initiative linkage
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

  // Owner overload
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/strategicInsights.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/strategicInsights.ts src/lib/strategicInsights.test.ts
git commit -m "feat: add strategic insights engine for dashboard layer 1"
```

---

## Task 2: InsightCards Component (Layer 1)

**Files:**
- Create: `src/components/dashboard/InsightCards.tsx`

- [ ] **Step 1: Implement InsightCards**

```typescript
// src/components/dashboard/InsightCards.tsx
// Renders 2-4 StrategicInsight cards at the top of the dashboard
// Each card shows:
//   - Type icon/color (imbalance=red, blocker=yellow, gap=orange, opportunity=green)
//   - Message text (the strategic question)
//   - Detail text (supporting data, smaller)
//   - Click handler → calls setSelectedItem or setFilter to navigate to related data
// Layout: horizontal row of cards, responsive (stack on mobile)
// Uses existing dimension colors and Tailwind classes
```

The component receives `insights: StrategicInsight[]` as props and `onInsightClick: (insight: StrategicInsight) => void`.

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/InsightCards.tsx
git commit -m "feat: add InsightCards component for dashboard layer 1"
```

---

## Task 3: StrategicHealth Component (Layer 2)

**Files:**
- Create: `src/components/dashboard/StrategicHealth.tsx`

- [ ] **Step 1: Implement StrategicHealth**

```typescript
// src/components/dashboard/StrategicHealth.tsx
// Renders 4-5 contextual KPI cards in a row
// Each card shows:
//   - Large number (primary metric)
//   - Label (what it measures)
//   - Delta indicator (↑2 siden sist, or gap: "mål: 2.4")
// Cards:
//   1. Total initiatives count + delta from last snapshot
//   2. Coverage % (initiatives linked to capabilities)
//   3. Average maturity (current) with target gap
//   4. Drift count (unlinked initiatives)
//   5. Dimension balance (mini bar chart in card)
// Uses existing KPICard component as base, or replaces it
// Data computed from store using existing selectors
```

Reuse logic from `ExecutiveSummary.tsx` and `KPICard.tsx` but restructure to show contextual deltas.

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/StrategicHealth.tsx
git commit -m "feat: add StrategicHealth component for dashboard layer 2"
```

---

## Task 4: DeepDive Component (Layer 3)

**Files:**
- Create: `src/components/dashboard/DeepDive.tsx`

- [ ] **Step 1: Implement DeepDive**

```typescript
// src/components/dashboard/DeepDive.tsx
// Wrapper that renders existing analytical widgets:
//   - DimensionHealth
//   - MaturityJourney
//   - OwnerLoad
//   - CriticalPathNarrative
//   - StrategicBottlenecks
//   - ValueChainView
//   - EffectFunnel
//   - SnapshotList
// Only visible when complexity level >= 2
// Import useComplexityLevel hook to check visibility
// Renders as a collapsible section with "Analyse" header
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/DeepDive.tsx
git commit -m "feat: add DeepDive wrapper for dashboard layer 3"
```

---

## Task 5: Restructure Dashboard Layout

**Files:**
- Modify: `src/components/dashboard/Dashboard.tsx`

- [ ] **Step 1: Restructure Dashboard.tsx**

Replace the current flat widget layout with:

```typescript
// Layer 1: Always visible
<InsightCards insights={strategicInsights} onInsightClick={handleInsightClick} />

// Layer 2: Always visible
<StrategicHealth
  initiatives={initiatives}
  capabilities={capabilities}
  effects={effects}
  lastSnapshot={lastSnapshot}
/>

// Narrative (always visible — the strategic reading)
<StrategicNarrative narrative={narrative} />

// Layer 3: Complexity level 2+ only
<DeepDive
  initiatives={initiatives}
  capabilities={capabilities}
  effects={effects}
  // ...pass all existing props
/>
```

Remove the flat grid layout. Keep `ActionableWarnings` in Layer 1 area (merge with InsightCards if overlapping).

- [ ] **Step 2: Update translations**

Add to `en.json` and `nb.json`:

```json
"dashboard": {
  "layer1Title": "What should you discuss?",
  "layer2Title": "Strategic health",
  "layer3Title": "Deep dive",
  "layer1TitleNb": "Hva bør dere diskutere?",
  "layer2TitleNb": "Strategisk helse",
  "layer3TitleNb": "Dypdykk"
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Build succeeds

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/Dashboard.tsx src/i18n/locales/en.json src/i18n/locales/nb.json
git commit -m "feat: restructure dashboard into 3-layer insight-first layout"
```
