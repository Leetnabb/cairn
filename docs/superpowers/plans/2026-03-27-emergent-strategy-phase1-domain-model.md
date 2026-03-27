# Emergent Strategy Phase 1: Domain Model Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Cairn's domain model with strategic frames, updated initiative statuses, a third horizon level, and reframed effects — the data foundation for the emergent strategy repositioning.

**Architecture:** Add `StrategicFrame` as a new top-level entity in AppState (optional field for backward compat). Extend `InitiativeStatus` with two new values. Add `mid` as a third horizon between `near` and `far` (avoids renaming 44+ files). Add `confidence` to `Effect`. All changes are additive — existing persisted data works without migration.

**Tech Stack:** TypeScript, Zustand, Vitest, React, i18next

**Spec:** `docs/superpowers/specs/2026-03-27-cairn-concept-emergent-strategy-design.md`

**Note on Strategy type:** The existing `Strategy` type (with `timeHorizon`, `priority`) will be deprecated in a later phase once the `StrategicFrame` concept is validated. For now both coexist.

---

### Task 1: Add StrategicFrame type and extend Initiative/Effect types

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/types/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test for new types**

```typescript
// src/types/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import type { StrategicFrame, StrategicTheme, Initiative, Effect, InitiativeStatus } from '../index';

describe('StrategicFrame type', () => {
  it('accepts a valid strategic frame', () => {
    const frame: StrategicFrame = {
      direction: 'Vi skal bli en datadrevet organisasjon',
      themes: [
        { id: 'st_1', name: 'Kundedata', description: 'Samle og bruke kundedata aktivt' },
      ],
    };
    expect(frame.direction).toBeDefined();
    expect(frame.themes).toHaveLength(1);
  });
});

describe('Initiative extended statuses', () => {
  it('accepts stopped and changed_direction statuses', () => {
    const statuses: InitiativeStatus[] = ['planned', 'in_progress', 'done', 'stopped', 'changed_direction'];
    expect(statuses).toHaveLength(5);
  });
});

describe('Initiative three horizons', () => {
  it('accepts mid as a horizon value', () => {
    const initiative: Partial<Initiative> = { horizon: 'mid' };
    expect(initiative.horizon).toBe('mid');
  });

  it('still accepts near and far for backward compat', () => {
    const near: Partial<Initiative> = { horizon: 'near' };
    const far: Partial<Initiative> = { horizon: 'far' };
    expect(near.horizon).toBe('near');
    expect(far.horizon).toBe('far');
  });
});

describe('Effect confidence field', () => {
  it('accepts effect with confidence', () => {
    const effect: Effect = {
      id: 'eff_1',
      name: 'Øke medlemstall',
      description: 'Forventet effekt av digitalisering',
      type: 'strategic',
      capabilities: [],
      initiatives: [],
      confidence: 'tentative',
    };
    expect(effect.confidence).toBe('tentative');
  });

  it('accepts effect without confidence (backward compat)', () => {
    const effect: Effect = {
      id: 'eff_2',
      name: 'Test',
      description: '',
      type: 'cost',
      capabilities: [],
      initiatives: [],
    };
    expect(effect.confidence).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/types.test.ts`
Expected: FAIL — types don't exist yet.

- [ ] **Step 3: Add StrategicFrame and StrategicTheme types**

In `src/types/index.ts`, add after the `Strategy` interface (after line 33):

```typescript
export interface StrategicTheme {
  id: string;
  name: string;
  description: string;
}

export interface StrategicFrame {
  direction: string;
  themes: StrategicTheme[];
}
```

Note: No `id` field — `StrategicFrame` is a singleton per workspace.

- [ ] **Step 4: Extend InitiativeStatus**

In `src/types/index.ts`, replace line 1:

```typescript
export type InitiativeStatus = 'planned' | 'in_progress' | 'done' | 'stopped' | 'changed_direction';
```

- [ ] **Step 5: Define Horizon type and update Initiative**

In `src/types/index.ts`, add a shared `Horizon` type after `ConfidenceLevel`:

```typescript
export type Horizon = 'near' | 'mid' | 'far';
```

Update the `Initiative` interface `horizon` field (line 52) to use it:

```typescript
  horizon: Horizon;
```

Update `Milestone` interface `horizon` field (line 76) to use it:

```typescript
  horizon: Horizon;
```

Update `UIState.filters.horizon` (line 191) to:

```typescript
    horizon: 'all' | Horizon;
```

Update `UIState.addModalDefaults` (line 203) to:

```typescript
  addModalDefaults: { dimension?: DimensionKey; horizon?: Horizon } | null;
```

- [ ] **Step 5b: Update all hardcoded `'near' | 'far'` types across codebase**

Search for `'near' | 'far'` across all `.ts` and `.tsx` files and replace with `Horizon` (importing it where needed). Key files:

- `src/stores/useStore.ts` — `moveInitiative` and `bulkMoveInitiatives` signatures
- `src/lib/ordering.ts` — `reorderInitiatives` parameter
- `src/components/roadmap/DropZone.tsx` — props type
- `src/components/roadmap/Roadmap.tsx` — `getInitiativesForZone` parameter
- `src/components/forms/EditInitiativeForm.tsx` — state type
- `src/components/modals/AddModal.tsx` — horizon casts
- `src/components/meeting/LensPath.tsx` — horizon reference
- `src/components/filters/FilterBar.tsx` — filter cast
- `src/components/header/FilterDropdown.tsx` — filter cast
- `src/components/detail/MilestoneDetail.tsx` — milestone horizon
- `src/lib/ai/generateStrategicPicture.ts` — AI generation type

For each file: import `Horizon` from `../../types` (or `../types`) and replace the literal union with the type alias. Run `npx tsc --noEmit` after to verify no type errors remain.

- [ ] **Step 6: Add confidence to Effect**

In `src/types/index.ts`, add to the `Effect` interface (after the `order` field, line 99):

```typescript
  confidence?: ConfidenceLevel;
```

- [ ] **Step 7: Add StrategicFrame to AppState**

In `src/types/index.ts`, add to the `AppState` interface (line 143):

```typescript
  strategicFrame?: StrategicFrame;
```

Optional field — existing stored states won't have it and that's fine.

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/types.test.ts`
Expected: PASS

- [ ] **Step 9: Run all existing tests to verify no regressions**

Run: `npx vitest run`
Expected: All PASS (all changes are additive, `near`/`far` still valid)

- [ ] **Step 10: Commit**

```bash
git add src/types/index.ts src/types/__tests__/types.test.ts
git commit -m "feat: add StrategicFrame type, extend Initiative status/horizon, add Effect confidence"
```

---

### Task 2: Add StrategicFrame CRUD to store

**Files:**
- Modify: `src/stores/useStore.ts`
- Create: `src/stores/__tests__/useStore.strategicFrame.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/stores/__tests__/useStore.strategicFrame.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../useStore';

describe('StrategicFrame store actions', () => {
  beforeEach(() => {
    useStore.setState({ strategicFrame: undefined });
  });

  it('setStrategicFrame sets the frame', () => {
    useStore.getState().setStrategicFrame({
      direction: 'Bli datadrevet',
      themes: [{ id: 'st_1', name: 'Kundedata', description: '' }],
    });
    expect(useStore.getState().strategicFrame?.direction).toBe('Bli datadrevet');
  });

  it('updateStrategicDirection updates direction only', () => {
    useStore.getState().setStrategicFrame({ direction: 'Bli datadrevet', themes: [] });
    useStore.getState().updateStrategicDirection('Digitalisere kundeflaten');
    expect(useStore.getState().strategicFrame?.direction).toBe('Digitalisere kundeflaten');
  });

  it('addStrategicTheme adds a theme', () => {
    useStore.getState().setStrategicFrame({ direction: 'Test', themes: [] });
    useStore.getState().addStrategicTheme({ id: 'st_1', name: 'Kundedata', description: '' });
    expect(useStore.getState().strategicFrame?.themes).toHaveLength(1);
  });

  it('updateStrategicTheme updates a theme by id', () => {
    useStore.getState().setStrategicFrame({
      direction: 'Test',
      themes: [{ id: 'st_1', name: 'Kundedata', description: '' }],
    });
    useStore.getState().updateStrategicTheme('st_1', { name: 'Kundedata 2.0' });
    expect(useStore.getState().strategicFrame?.themes[0].name).toBe('Kundedata 2.0');
  });

  it('deleteStrategicTheme removes a theme by id', () => {
    useStore.getState().setStrategicFrame({
      direction: 'Test',
      themes: [
        { id: 'st_1', name: 'A', description: '' },
        { id: 'st_2', name: 'B', description: '' },
      ],
    });
    useStore.getState().deleteStrategicTheme('st_1');
    expect(useStore.getState().strategicFrame?.themes).toHaveLength(1);
    expect(useStore.getState().strategicFrame?.themes[0].id).toBe('st_2');
  });

  it('clearStrategicFrame removes the frame', () => {
    useStore.getState().setStrategicFrame({ direction: 'Test', themes: [] });
    useStore.getState().clearStrategicFrame();
    expect(useStore.getState().strategicFrame).toBeUndefined();
  });

  it('updateStrategicDirection is no-op when no frame exists', () => {
    useStore.getState().updateStrategicDirection('Test');
    expect(useStore.getState().strategicFrame).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/useStore.strategicFrame.test.ts`
Expected: FAIL — actions don't exist.

- [ ] **Step 3: Add StrategicFrame action signatures to StoreState interface**

In `src/stores/useStore.ts`, add to the import (line 4) `StrategicFrame, StrategicTheme`.

Add to the `StoreState` interface (before closing `}`):

```typescript
  // Strategic Frame
  setStrategicFrame: (frame: StrategicFrame) => void;
  updateStrategicDirection: (direction: string) => void;
  addStrategicTheme: (theme: StrategicTheme) => void;
  updateStrategicTheme: (id: string, updates: Partial<StrategicTheme>) => void;
  deleteStrategicTheme: (id: string) => void;
  clearStrategicFrame: () => void;
```

- [ ] **Step 4: Implement StrategicFrame actions**

Add implementations inside the store's `(set) => ({...})` block:

```typescript
      setStrategicFrame: (frame) => set({ strategicFrame: frame }),

      updateStrategicDirection: (direction) => set((state) => {
        if (!state.strategicFrame) return {};
        return { strategicFrame: { ...state.strategicFrame, direction } };
      }),

      addStrategicTheme: (theme) => set((state) => {
        if (!state.strategicFrame) return {};
        return { strategicFrame: { ...state.strategicFrame, themes: [...state.strategicFrame.themes, theme] } };
      }),

      updateStrategicTheme: (id, updates) => set((state) => {
        if (!state.strategicFrame) return {};
        return {
          strategicFrame: {
            ...state.strategicFrame,
            themes: state.strategicFrame.themes.map((t) => t.id === id ? { ...t, ...updates } : t),
          },
        };
      }),

      deleteStrategicTheme: (id) => set((state) => {
        if (!state.strategicFrame) return {};
        return {
          strategicFrame: {
            ...state.strategicFrame,
            themes: state.strategicFrame.themes.filter((t) => t.id !== id),
          },
        };
      }),

      clearStrategicFrame: () => set({ strategicFrame: undefined }),
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/useStore.strategicFrame.test.ts`
Expected: PASS

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/stores/useStore.ts src/stores/__tests__/useStore.strategicFrame.test.ts
git commit -m "feat: add StrategicFrame CRUD actions to store"
```

---

### Task 3: Add dimension imbalance insight

**Files:**
- Modify: `src/lib/insights.ts`
- Modify: `src/lib/__tests__/insights.test.ts`
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/__tests__/insights.test.ts` (read the file first to find the right insertion point):

```typescript
describe('dimension imbalance insights', () => {
  it('warns when one dimension has more than 60% of initiatives', () => {
    const makeInit = (id: string, dim: DimensionKey): Initiative => ({
      id, name: id, dimension: dim, horizon: 'near', order: 0,
      capabilities: [], description: '', owner: '', dependsOn: [],
      maturityEffect: {}, notes: '', valueChains: [],
    });
    const initiatives = [
      makeInit('1', 'teknologi'), makeInit('2', 'teknologi'),
      makeInit('3', 'teknologi'), makeInit('4', 'teknologi'),
      makeInit('5', 'virksomhet'),
    ];
    const insights = computeInsights(initiatives, [], []);
    const warning = insights.find(i =>
      i.type === 'warning' && i.message.includes('80%')
    );
    expect(warning).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/insights.test.ts`
Expected: FAIL — no imbalance warning produced.

- [ ] **Step 3: Add dimension imbalance detection**

In `src/lib/insights.ts`, add after the "Dimensions without near-horizon activities" block (after the `nearDims` loop, ~line 63):

```typescript
  // Dimension imbalance: one dimension dominates (>60%)
  if (initiatives.length >= 5) {
    const dimCounts: Record<string, number> = {};
    for (const dim of DIMENSIONS) dimCounts[dim.key] = 0;
    for (const init of initiatives) dimCounts[init.dimension] = (dimCounts[init.dimension] || 0) + 1;

    for (const dim of DIMENSIONS) {
      const pct = Math.round((dimCounts[dim.key] / initiatives.length) * 100);
      if (pct > 60) {
        insights.push({
          type: 'warning',
          message: i18n.t('insights.dimensionImbalance', {
            dimension: i18n.t(`labels.dimensions.${dim.key}`),
            pct,
            count: dimCounts[dim.key],
            total: initiatives.length,
          }),
        });
      }
    }
  }
```

- [ ] **Step 4: Add i18n keys**

In `src/i18n/locales/nb.json`, add to `insights`:
```json
"dimensionImbalance": "{{dimension}} utgjør {{pct}}% av alle initiativer ({{count}} av {{total}}). Transformasjoner tungt vektet mot én dimensjon har høyere risiko for å feile."
```

In `src/i18n/locales/en.json`, add to `insights`:
```json
"dimensionImbalance": "{{dimension}} accounts for {{pct}}% of all initiatives ({{count}} of {{total}}). Transformations heavily weighted toward one dimension carry higher failure risk."
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/insights.test.ts`
Expected: PASS

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/insights.ts src/lib/__tests__/insights.test.ts src/i18n/locales/nb.json src/i18n/locales/en.json
git commit -m "feat: add dimension imbalance warning to insights engine"
```

---

### Task 4: Update defaults with sample strategic frame

**Files:**
- Modify: `src/data/defaults.ts`

- [ ] **Step 1: Add default strategic frame**

Add `StrategicFrame` to the import line in `src/data/defaults.ts`.

Add after `defaultModules`:

```typescript
export const defaultStrategicFrame: StrategicFrame = {
  direction: 'Bli en datadrevet og medlemsnær organisasjon gjennom digital transformasjon',
  themes: [
    { id: 'st_1', name: 'Kundedata', description: 'Samle, strukturere og bruke kundedata aktivt i beslutninger' },
    { id: 'st_2', name: 'Prosessdigitalisering', description: 'Digitalisere kjernearbeidsflyter for effektivitet' },
    { id: 'st_3', name: 'Kompetanseløft', description: 'Bygge digital kompetanse i hele organisasjonen' },
  ],
};
```

- [ ] **Step 2: Do NOT add to createDefaultState**

The `strategicFrame` is optional on `AppState`. The default state should NOT include it — new users should be prompted to define their own frame, not get a sample one. The sample frame above is exported for use in templates only.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/data/defaults.ts
git commit -m "feat: add sample strategic frame for templates"
```

---

### Task 5: Update initiative forms for new statuses and mid horizon

**Files:**
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/components/forms/EditInitiativeForm.tsx`
- Modify: `src/components/filters/FilterBar.tsx`

- [ ] **Step 1: Read the form and filter files**

Read `src/components/forms/EditInitiativeForm.tsx` and `src/components/filters/FilterBar.tsx` to find the exact status/horizon dropdown locations.

- [ ] **Step 2: Add i18n keys for new statuses and horizons**

In `src/i18n/locales/nb.json`, ensure these exist (add or update):

```json
"status": {
  "planned": "Planlagt",
  "in_progress": "Pågår",
  "done": "Fullført",
  "stopped": "Stoppet",
  "changed_direction": "Endret retning"
},
"horizon": {
  "near": "Nå",
  "mid": "Neste",
  "far": "Senere"
}
```

Note: We relabel existing `near`/`far` with the Mintzberg-aligned labels ("Nå"/"Senere") via i18n, without changing the data values.

In `src/i18n/locales/en.json`:

```json
"status": {
  "planned": "Planned",
  "in_progress": "In progress",
  "done": "Done",
  "stopped": "Stopped",
  "changed_direction": "Changed direction"
},
"horizon": {
  "near": "Now",
  "mid": "Next",
  "far": "Later"
}
```

- [ ] **Step 3: Add new status options to EditInitiativeForm**

Add `<option value="stopped">` and `<option value="changed_direction">` to the status select.

- [ ] **Step 4: Add mid horizon option to EditInitiativeForm**

Add `<option value="mid">` between `near` and `far` in the horizon select.

- [ ] **Step 5: Update FilterBar for new statuses**

Add the two new statuses to the status filter dropdown.

- [ ] **Step 6: Manually verify in browser**

Run: `npm run dev`
- Edit an initiative — verify new statuses and "Neste" horizon appear
- Verify filter bar shows new status options

- [ ] **Step 7: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add src/i18n/locales/nb.json src/i18n/locales/en.json src/components/forms/EditInitiativeForm.tsx src/components/filters/FilterBar.tsx
git commit -m "feat: add new initiative statuses and mid horizon to UI"
```

---

### Task 6: Update Roadmap view for three horizons

**Files:**
- Modify: `src/components/roadmap/Roadmap.tsx`

- [ ] **Step 1: Read the current Roadmap component**

Read `src/components/roadmap/Roadmap.tsx` to understand the two-column (`near`/`far`) layout, grid structure, and drop zone logic.

- [ ] **Step 2: Add mid column between near and far**

Update the horizons array from `['near', 'far']` to `['near', 'mid', 'far']`.

Update the grid from `grid-cols-2` to `grid-cols-3`.

Ensure column headers use i18n keys: `t('horizon.near')`, `t('horizon.mid')`, `t('horizon.far')`.

- [ ] **Step 3: Update drop zone handlers**

Ensure drag-and-drop accepts `mid` as a valid target horizon. Update `moveInitiative` calls and the horizon filter in the `addModalDefaults`.

- [ ] **Step 4: Update the add-modal defaults**

When clicking "+" in the mid column, the add modal should default to `horizon: 'mid'`.

- [ ] **Step 5: Manually verify in browser**

Run: `npm run dev`
- Verify three columns: "Nå", "Neste", "Senere"
- Drag an initiative between columns — all three work
- Click "+" in mid column — new initiative defaults to mid
- Verify dimension grouping still works in all three columns

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/roadmap/Roadmap.tsx
git commit -m "feat: add mid horizon column to roadmap view"
```

---

### Task 7: Add StrategicFrameEditor component

**Files:**
- Create: `src/components/strategic-frame/StrategicFrameEditor.tsx`
- Modify: `src/components/settings/SettingsModal.tsx`
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Read SettingsModal to understand tab structure**

Read `src/components/settings/SettingsModal.tsx` to find how tabs are implemented.

- [ ] **Step 2: Add i18n keys for strategic frame editor**

In `src/i18n/locales/nb.json`:

```json
"strategicFrame": {
  "title": "Strategiske rammer",
  "empty": "Ingen strategiske rammer er definert. Sett den brede retningen organisasjonen skal bevege seg i.",
  "create": "Definer strategisk retning",
  "direction": "Strategisk retning",
  "directionPlaceholder": "F.eks. 'Bli en datadrevet og medlemsnær organisasjon'",
  "themes": "Strategiske temaer",
  "newThemePlaceholder": "Nytt tema..."
}
```

In `src/i18n/locales/en.json`:

```json
"strategicFrame": {
  "title": "Strategic frame",
  "empty": "No strategic frame defined. Set the broad direction for the organization.",
  "create": "Define strategic direction",
  "direction": "Strategic direction",
  "directionPlaceholder": "E.g. 'Become a data-driven, member-focused organization'",
  "themes": "Strategic themes",
  "newThemePlaceholder": "New theme..."
}
```

- [ ] **Step 3: Create StrategicFrameEditor component**

Create `src/components/strategic-frame/StrategicFrameEditor.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';

export function StrategicFrameEditor() {
  const { t } = useTranslation();
  const frame = useStore((s) => s.strategicFrame);
  const setFrame = useStore((s) => s.setStrategicFrame);
  const updateDirection = useStore((s) => s.updateStrategicDirection);
  const addTheme = useStore((s) => s.addStrategicTheme);
  const updateTheme = useStore((s) => s.updateStrategicTheme);
  const deleteTheme = useStore((s) => s.deleteStrategicTheme);
  const [newThemeName, setNewThemeName] = useState('');

  if (!frame) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t('strategicFrame.empty')}</p>
        <button
          onClick={() => setFrame({ direction: '', themes: [] })}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          {t('strategicFrame.create')}
        </button>
      </div>
    );
  }

  const handleAddTheme = () => {
    if (!newThemeName.trim()) return;
    addTheme({ id: `st_${Date.now()}`, name: newThemeName.trim(), description: '' });
    setNewThemeName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('strategicFrame.direction')}
        </label>
        <textarea
          value={frame.direction}
          onChange={(e) => updateDirection(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm"
          rows={3}
          placeholder={t('strategicFrame.directionPlaceholder')}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('strategicFrame.themes')}
        </label>
        <div className="space-y-2">
          {frame.themes.map((theme) => (
            <div key={theme.id} className="flex items-center gap-2">
              <input
                value={theme.name}
                onChange={(e) => updateTheme(theme.id, { name: e.target.value })}
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button
                onClick={() => deleteTheme(theme.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
            placeholder={t('strategicFrame.newThemePlaceholder')}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button
            onClick={handleAddTheme}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            {t('common.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add "Strategiske rammer" tab to SettingsModal**

Import `StrategicFrameEditor` and add it as a new tab following the existing tab pattern.

- [ ] **Step 5: Manually verify in browser**

Run: `npm run dev`
- Open Settings → "Strategiske rammer" tab
- Create a strategic frame with direction and 2-3 themes
- Refresh — verify it persists
- Delete a theme, edit direction — verify reactivity

- [ ] **Step 6: Commit**

```bash
git add src/components/strategic-frame/StrategicFrameEditor.tsx src/components/settings/SettingsModal.tsx src/i18n/locales/nb.json src/i18n/locales/en.json
git commit -m "feat: add StrategicFrameEditor component in settings"
```

---

### Task 8: Add Effect confidence UI

**Files:**
- Modify: `src/components/forms/EditEffectForm.tsx`
- Modify: `src/components/effects/EffectCard.tsx`
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Read the effect form and card**

Read `src/components/forms/EditEffectForm.tsx` and `src/components/effects/EffectCard.tsx`.

- [ ] **Step 2: Add i18n keys**

In `src/i18n/locales/nb.json`:
```json
"effectConfidence": {
  "label": "Konfidens",
  "confirmed": "Bekreftet",
  "tentative": "Tentativ",
  "under_consideration": "Under vurdering"
}
```

In `src/i18n/locales/en.json`:
```json
"effectConfidence": {
  "label": "Confidence",
  "confirmed": "Confirmed",
  "tentative": "Tentative",
  "under_consideration": "Under consideration"
}
```

- [ ] **Step 3: Add confidence select to EditEffectForm**

Add a confidence `<select>` after the existing form fields, using the i18n keys.

- [ ] **Step 4: Show confidence badge on EffectCard**

Add a small text/badge on the EffectCard showing confidence level when set. Use subtle styling (e.g., `text-xs text-gray-500`).

- [ ] **Step 5: Manually verify in browser**

Run: `npm run dev`
- Edit an effect → verify confidence dropdown
- Set confidence → verify badge on card
- Verify effects without confidence show no badge

- [ ] **Step 6: Commit**

```bash
git add src/components/forms/EditEffectForm.tsx src/components/effects/EffectCard.tsx src/i18n/locales/nb.json src/i18n/locales/en.json
git commit -m "feat: add confidence field to effect UI"
```

---

### Task 9: Show strategic frame on dashboard

**Files:**
- Modify: `src/components/dashboard/Dashboard.tsx`

- [ ] **Step 1: Read the Dashboard component**

Read `src/components/dashboard/Dashboard.tsx` to understand the layout and existing cards.

- [ ] **Step 2: Add strategic frame summary card**

Add a card at the top of the dashboard (before existing content) that:
- Shows `strategicFrame.direction` as a prominent text
- Shows themes as small tags/pills
- If no frame set, shows a muted prompt: "Definer strategiske rammer i innstillinger"
- Links to settings when clicked (calls `setSettingsOpen(true)`)

Use existing Tailwind patterns from the dashboard for styling consistency.

- [ ] **Step 3: Manually verify in browser**

Run: `npm run dev`
- Dashboard with frame set → shows direction and themes
- Dashboard without frame → shows prompt
- Click prompt → opens settings

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/Dashboard.tsx
git commit -m "feat: show strategic frame summary on dashboard"
```
