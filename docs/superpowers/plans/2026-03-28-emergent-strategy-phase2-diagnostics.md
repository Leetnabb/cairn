# Emergent Strategy Phase 2: Strategic Diagnostics Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the strategic diagnostics engine that compares what the organization is *actually doing* (initiatives) against the *strategic frame* (direction + themes), and surfaces drift, effect feasibility, and absorption capacity warnings.

**Architecture:** Create a new `strategicDiagnostics.ts` module with pure functions that take AppState and return typed diagnostic results. Extend the existing `computeInsights()` to include diagnostics when a strategic frame is present. Update AI prompts to include strategic frame context. Keep all analysis logic in pure, testable functions — no React dependencies.

**Tech Stack:** TypeScript, Vitest, i18next

**Spec:** `docs/superpowers/specs/2026-03-27-cairn-concept-emergent-strategy-design.md` — Section "AI-laget"

**Depends on:** Phase 1 complete (StrategicFrame type, store CRUD, Horizon type, Effect confidence)

---

### Task 1: Create strategic drift detection

**Files:**
- Create: `src/lib/strategicDiagnostics.ts`
- Create: `src/lib/__tests__/strategicDiagnostics.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/__tests__/strategicDiagnostics.test.ts
import { describe, it, expect } from 'vitest';
import { detectStrategicDrift } from '../strategicDiagnostics';
import type { Initiative, StrategicFrame } from '../../types';

const makeInit = (id: string, name: string, dim: string): Initiative => ({
  id, name, dimension: dim as any, horizon: 'near', order: 0,
  capabilities: [], description: '', owner: '', dependsOn: [],
  maturityEffect: {}, notes: '', valueChains: [],
});

describe('detectStrategicDrift', () => {
  const frame: StrategicFrame = {
    direction: 'Bli en datadrevet organisasjon',
    themes: [
      { id: 'st_1', name: 'Kundedata', description: 'Samle kundedata' },
      { id: 'st_2', name: 'Prosessdigitalisering', description: 'Digitalisere prosesser' },
    ],
  };

  it('returns no drift when no frame is set', () => {
    const result = detectStrategicDrift([], undefined);
    expect(result).toEqual([]);
  });

  it('returns no drift when frame has no themes', () => {
    const result = detectStrategicDrift([], { direction: 'Test', themes: [] });
    expect(result).toEqual([]);
  });

  it('detects themes with no supporting initiatives', () => {
    const initiatives = [
      makeInit('1', 'Bygg kundedata-plattform', 'teknologi'),
    ];
    const result = detectStrategicDrift(initiatives, frame);
    const unaddressed = result.find(r => r.type === 'unaddressed_theme');
    expect(unaddressed).toBeDefined();
    expect(unaddressed?.themeName).toBe('Prosessdigitalisering');
  });

  it('matches initiatives to themes by name similarity', () => {
    const initiatives = [
      makeInit('1', 'Kundedata-plattform', 'teknologi'),
      makeInit('2', 'Digitalisere innkjøpsprosess', 'virksomhet'),
    ];
    const result = detectStrategicDrift(initiatives, frame);
    const unaddressed = result.filter(r => r.type === 'unaddressed_theme');
    expect(unaddressed).toHaveLength(0);
  });

  it('detects initiatives not matching any theme', () => {
    const initiatives = [
      makeInit('1', 'Kundedata-plattform', 'teknologi'),
      makeInit('2', 'Ny kantineløsning', 'virksomhet'),
      makeInit('3', 'Oppgradere parkeringsautomat', 'teknologi'),
    ];
    const result = detectStrategicDrift(initiatives, frame);
    const unaligned = result.find(r => r.type === 'unaligned_initiatives');
    expect(unaligned).toBeDefined();
    expect(unaligned?.count).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/strategicDiagnostics.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement detectStrategicDrift**

Create `src/lib/strategicDiagnostics.ts`:

```typescript
import type { Initiative, StrategicFrame, Effect } from '../types';

export interface DiagnosticResult {
  type: 'unaddressed_theme' | 'unaligned_initiatives' | 'effect_at_risk' | 'absorption_warning';
  severity: 'warning' | 'info';
  themeName?: string;
  count?: number;
  message: string;
  details?: string;
}

/**
 * Simple word-overlap matching between an initiative name and a theme name/description.
 * Returns true if any significant word (>3 chars) from the theme appears in the initiative.
 * Exported for reuse in narrativeEngine.ts.
 */
export function initiativeMatchesTheme(
  initiative: Initiative,
  theme: { name: string; description: string }
): boolean {
  const initWords = new Set(
    `${initiative.name} ${initiative.description}`.toLowerCase().split(/\s+/)
  );
  const themeWords = `${theme.name} ${theme.description}`.toLowerCase().split(/\s+/)
    .filter(w => w.length > 3);
  return themeWords.some(w => {
    for (const iw of initWords) {
      if (iw.includes(w) || w.includes(iw)) return true;
    }
    return false;
  });
}

export function detectStrategicDrift(
  initiatives: Initiative[],
  frame: StrategicFrame | undefined
): DiagnosticResult[] {
  if (!frame || frame.themes.length === 0) return [];

  const results: DiagnosticResult[] = [];

  // Find themes with no supporting initiatives
  for (const theme of frame.themes) {
    const hasSupport = initiatives.some(i => initiativeMatchesTheme(i, theme));
    if (!hasSupport) {
      results.push({
        type: 'unaddressed_theme',
        severity: 'warning',
        themeName: theme.name,
        message: `Strategisk tema "${theme.name}" har ingen initiativer som støtter det.`,
      });
    }
  }

  // Find initiatives not matching any theme
  const unaligned = initiatives.filter(i =>
    !frame.themes.some(t => initiativeMatchesTheme(i, t))
  );
  if (unaligned.length > 0 && initiatives.length >= 3) {
    const pct = Math.round((unaligned.length / initiatives.length) * 100);
    if (pct > 30) {
      results.push({
        type: 'unaligned_initiatives',
        severity: 'warning',
        count: unaligned.length,
        message: `${unaligned.length} av ${initiatives.length} initiativer (${pct}%) kan ikke kobles til noen strategiske temaer. Dette kan indikere strategisk drift — eller en emergent retning verdt å anerkjenne.`,
        details: unaligned.map(i => i.name).join(', '),
      });
    }
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/strategicDiagnostics.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/strategicDiagnostics.ts src/lib/__tests__/strategicDiagnostics.test.ts
git commit -m "feat: add strategic drift detection engine"
```

---

### Task 2: Add effect feasibility assessment

**Files:**
- Modify: `src/lib/strategicDiagnostics.ts`
- Modify: `src/lib/__tests__/strategicDiagnostics.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/__tests__/strategicDiagnostics.test.ts`:

```typescript
import { assessEffectFeasibility } from '../strategicDiagnostics';
import type { Effect } from '../../types';

describe('assessEffectFeasibility', () => {
  it('returns empty when no effects', () => {
    expect(assessEffectFeasibility([], [])).toEqual([]);
  });

  it('warns when effect has all linked initiatives stopped', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'stopped' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'stopped' as const },
    ];
    const effects: Effect[] = [{
      id: 'e1', name: 'Øke medlemstall', description: '', type: 'strategic',
      capabilities: [], initiatives: ['1', '2'],
    }];
    const result = assessEffectFeasibility(initiatives, effects);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('effect_at_risk');
  });

  it('warns when majority of linked initiatives are stopped or changed', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'stopped' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'changed_direction' as const },
      { ...makeInit('3', 'C', 'teknologi'), status: 'in_progress' as const },
    ];
    const effects: Effect[] = [{
      id: 'e1', name: 'Øke medlemstall', description: '', type: 'strategic',
      capabilities: [], initiatives: ['1', '2', '3'],
    }];
    const result = assessEffectFeasibility(initiatives, effects);
    expect(result).toHaveLength(1);
  });

  it('does not warn when initiatives are healthy', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'in_progress' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'planned' as const },
    ];
    const effects: Effect[] = [{
      id: 'e1', name: 'Øke medlemstall', description: '', type: 'strategic',
      capabilities: [], initiatives: ['1', '2'],
    }];
    const result = assessEffectFeasibility(initiatives, effects);
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/strategicDiagnostics.test.ts`
Expected: FAIL — function doesn't exist.

- [ ] **Step 3: Implement assessEffectFeasibility**

Add to `src/lib/strategicDiagnostics.ts`:

```typescript
export function assessEffectFeasibility(
  initiatives: Initiative[],
  effects: Effect[]
): DiagnosticResult[] {
  if (effects.length === 0) return [];

  const results: DiagnosticResult[] = [];
  const initMap = new Map(initiatives.map(i => [i.id, i]));

  for (const effect of effects) {
    if (effect.initiatives.length === 0) continue;

    const linked = effect.initiatives
      .map(id => initMap.get(id))
      .filter((i): i is Initiative => i !== undefined);

    if (linked.length === 0) continue;

    const derailed = linked.filter(i =>
      i.status === 'stopped' || i.status === 'changed_direction'
    );

    if (derailed.length > 0 && derailed.length >= linked.length * 0.5) {
      results.push({
        type: 'effect_at_risk',
        severity: 'warning',
        message: `Forventet effekt "${effect.name}" er truet: ${derailed.length} av ${linked.length} koblede initiativer er stoppet eller har endret retning.`,
      });
    }
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/strategicDiagnostics.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/strategicDiagnostics.ts src/lib/__tests__/strategicDiagnostics.test.ts
git commit -m "feat: add effect feasibility assessment"
```

---

### Task 3: Add absorption capacity warning

**Files:**
- Modify: `src/lib/strategicDiagnostics.ts`
- Modify: `src/lib/__tests__/strategicDiagnostics.test.ts`

- [ ] **Step 1: Write the failing test**

Add to test file:

```typescript
import { detectAbsorptionIssues } from '../strategicDiagnostics';

describe('detectAbsorptionIssues', () => {
  it('returns empty when few initiatives', () => {
    const initiatives = [makeInit('1', 'A', 'teknologi')];
    expect(detectAbsorptionIssues(initiatives)).toEqual([]);
  });

  it('warns when many initiatives started but few completed', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'in_progress' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'in_progress' as const },
      { ...makeInit('3', 'C', 'virksomhet'), status: 'in_progress' as const },
      { ...makeInit('4', 'D', 'organisasjon'), status: 'in_progress' as const },
      { ...makeInit('5', 'E', 'teknologi'), status: 'in_progress' as const },
      { ...makeInit('6', 'F', 'teknologi'), status: 'in_progress' as const },
      { ...makeInit('7', 'G', 'teknologi'), status: 'planned' as const },
      { ...makeInit('8', 'H', 'teknologi'), status: 'done' as const },
    ];
    const result = detectAbsorptionIssues(initiatives);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('absorption_warning');
  });

  it('does not warn when ratio is healthy', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'in_progress' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'done' as const },
      { ...makeInit('3', 'C', 'teknologi'), status: 'done' as const },
      { ...makeInit('4', 'D', 'teknologi'), status: 'done' as const },
      { ...makeInit('5', 'E', 'teknologi'), status: 'planned' as const },
    ];
    const result = detectAbsorptionIssues(initiatives);
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/strategicDiagnostics.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement detectAbsorptionIssues**

Add to `src/lib/strategicDiagnostics.ts`:

```typescript
export function detectAbsorptionIssues(initiatives: Initiative[]): DiagnosticResult[] {
  if (initiatives.length < 5) return [];

  const inProgress = initiatives.filter(i => i.status === 'in_progress').length;
  const done = initiatives.filter(i => i.status === 'done').length;
  const total = initiatives.length;

  // Warn if many are in progress but few completed (ratio > 3:1)
  if (inProgress >= 5 && (done === 0 || inProgress / Math.max(done, 1) > 3)) {
    return [{
      type: 'absorption_warning',
      severity: 'warning',
      count: inProgress,
      message: `${inProgress} av ${total} initiativer pågår, men bare ${done} er fullført. Organisasjonen kan ha kapasitetsproblemer — vurder om dere har tatt på dere for mye samtidig.`,
    }];
  }

  return [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/strategicDiagnostics.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/strategicDiagnostics.ts src/lib/__tests__/strategicDiagnostics.test.ts
git commit -m "feat: add absorption capacity warning"
```

---

### Task 4: Create combined diagnostics function and wire into insights

**Files:**
- Modify: `src/lib/strategicDiagnostics.ts`
- Modify: `src/lib/insights.ts`
- Modify: `src/lib/__tests__/strategicDiagnostics.test.ts`

- [ ] **Step 1: Write the failing test for combined function**

Add to test file:

```typescript
import { computeStrategicDiagnostics } from '../strategicDiagnostics';

describe('computeStrategicDiagnostics', () => {
  it('combines all diagnostics', () => {
    const frame: StrategicFrame = {
      direction: 'Datadrevet',
      themes: [{ id: 'st_1', name: 'Kundedata', description: 'Samle data' }],
    };
    const initiatives = [
      { ...makeInit('1', 'Ny kantineløsning', 'virksomhet'), status: 'in_progress' as const },
      { ...makeInit('2', 'Kantineoppgradering', 'virksomhet'), status: 'in_progress' as const },
      { ...makeInit('3', 'Kantine-app', 'teknologi'), status: 'in_progress' as const },
      { ...makeInit('4', 'Kantineutvidelse', 'virksomhet'), status: 'in_progress' as const },
      { ...makeInit('5', 'Kantineservice', 'organisasjon'), status: 'in_progress' as const },
    ];
    const effects: Effect[] = [{
      id: 'e1', name: 'Bedre mat', description: '', type: 'quality',
      capabilities: [], initiatives: ['1', '2'],
    }];

    const results = computeStrategicDiagnostics(initiatives, effects, frame);
    // Should have at least: unaddressed theme (Kundedata has no match) + unaligned initiatives
    expect(results.length).toBeGreaterThan(0);
  });

  it('works without strategic frame', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'in_progress' as const },
    ];
    const results = computeStrategicDiagnostics(initiatives, [], undefined);
    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/strategicDiagnostics.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement computeStrategicDiagnostics**

Add to `src/lib/strategicDiagnostics.ts`:

```typescript
export function computeStrategicDiagnostics(
  initiatives: Initiative[],
  effects: Effect[],
  frame: StrategicFrame | undefined
): DiagnosticResult[] {
  // Diagnostics only run when a strategic frame is set — without a frame,
  // there's no stated direction to measure against.
  if (!frame) return [];

  return [
    ...detectStrategicDrift(initiatives, frame),
    ...assessEffectFeasibility(initiatives, effects),
    ...detectAbsorptionIssues(initiatives),
  ];
}
```

- [ ] **Step 4: Wire diagnostics into computeInsights**

In `src/lib/insights.ts`:

1. Import: `import { computeStrategicDiagnostics } from './strategicDiagnostics';`
2. Import: `import type { StrategicFrame } from '../types';`
3. Add optional `strategicFrame` parameter to `computeInsights`:

```typescript
export function computeInsights(
  initiatives: Initiative[],
  capabilities: Capability[],
  effects: Effect[] = [],
  strategicFrame?: StrategicFrame
): Insight[] {
```

4. At the end of the function (before `return insights;`), add:

```typescript
  // Strategic diagnostics (when frame is present)
  const diagnostics = computeStrategicDiagnostics(initiatives, effects, strategicFrame);
  for (const diag of diagnostics) {
    insights.push({ type: diag.severity, message: diag.message });
  }
```

- [ ] **Step 5: Update InsightsBar to pass strategic frame**

In `src/components/insights/InsightsBar.tsx`, add:

```typescript
const strategicFrame = useStore(s => s.strategicFrame);
```

Update the `computeInsights` call to pass it:

```typescript
const insights = useMemo(
  () => computeInsights(initiatives, capabilities, effects, strategicFrame),
  [initiatives, capabilities, effects, strategicFrame, i18n.language]
);
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/strategicDiagnostics.ts src/lib/__tests__/strategicDiagnostics.test.ts src/lib/insights.ts src/components/insights/InsightsBar.tsx
git commit -m "feat: wire strategic diagnostics into insights engine"
```

---

### Task 5: Update AI system prompt with strategic frame context

**Files:**
- Modify: `src/lib/ai/prompts.ts`

- [ ] **Step 1: Read the current prompts.ts**

Read `src/lib/ai/prompts.ts` to understand `serializeContext()` and `buildChatSystemPrompt()`.

- [ ] **Step 2: Add strategic frame to serialized context**

In `serializeContext()`, add before the first `lines.push(...)` call (after the variable declarations on lines 5-8):

```typescript
  // Strategic Frame
  if (state.strategicFrame) {
    lines.push(`## Strategisk retning`);
    lines.push(state.strategicFrame.direction);
    if (state.strategicFrame.themes.length > 0) {
      lines.push(`\n### Strategiske temaer`);
      for (const theme of state.strategicFrame.themes) {
        lines.push(`- ${theme.name}: ${theme.description}`);
      }
    }
    lines.push('');
  }
```

- [ ] **Step 3: Update AI system prompt to include diagnostics context**

At the **top of the file** `src/lib/ai/prompts.ts` (with the other imports), add:

```typescript
import { computeStrategicDiagnostics } from '../strategicDiagnostics';
```

Then in `buildChatSystemPrompt()`, after the action instructions block, add diagnostics summary:

```typescript
  const scenario = state.scenarioStates[state.activeScenario];
  const diagnostics = computeStrategicDiagnostics(
    scenario?.initiatives || [],
    state.effects,
    state.strategicFrame
  );

  let diagnosticsSection = '';
  if (diagnostics.length > 0) {
    diagnosticsSection = `\n\n## Strategisk diagnostikk\nFølgende observasjoner er gjort:\n${diagnostics.map(d => `- ${d.message}`).join('\n')}`;
  }
```

Include `diagnosticsSection` in the returned prompt string.

- [ ] **Step 4: Update status values in prompt**

Update the hardcoded status values in the action instructions to include `"stopped"` and `"changed_direction"`.

- [ ] **Step 5: Run tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/prompts.ts
git commit -m "feat: include strategic frame and diagnostics in AI context"
```

---

### Task 6: Add narrative engine signals for strategic frame

**Files:**
- Modify: `src/lib/narrativeEngine.ts`

- [ ] **Step 1: Read current narrativeEngine.ts**

Read `src/lib/narrativeEngine.ts` to understand the signal architecture and `generateNarrative()`.

- [ ] **Step 2: Add strategic frame drift signal**

Import `initiativeMatchesTheme` from the diagnostics module (exported in Task 1) and `StrategicFrame` from types:

```typescript
import { initiativeMatchesTheme } from './strategicDiagnostics';
import type { StrategicFrame } from '../types';
```

Add a new signal function (reuses the shared matching logic):

```typescript
function strategicFrameSignal(
  initiatives: Initiative[],
  frame?: StrategicFrame
): NarrativeSignal | null {
  if (!frame || frame.themes.length === 0 || initiatives.length < 3) return null;

  const aligned = initiatives.filter(i =>
    frame.themes.some(t => initiativeMatchesTheme(i, t))
  );

  const pct = Math.round((aligned.length / initiatives.length) * 100);

  if (pct < 50) {
    return {
      priority: 0,
      text: `Only ${pct}% of initiatives align with the stated strategic themes. The organization may be drifting from its intended direction — or an emergent strategy is forming that the frame doesn't yet reflect.`,
    };
  }

  return null;
}
```

- [ ] **Step 3: Update generateNarrative to accept and use strategic frame**

Add `frame?: StrategicFrame` parameter to `generateNarrative()`. Add the new signal to the signals array. Import `StrategicFrame` from types.

- [ ] **Step 4: Update all callers of generateNarrative**

Search for all callers with `grep -r "generateNarrative" src/` and pass `strategicFrame` from the store. The four known callers are:

- `src/components/presentation/PresentationMode.tsx`
- `src/components/meeting/NarrativeOpening.tsx`
- `src/components/board/BoardView.tsx`
- `src/components/dashboard/Dashboard.tsx`

For each: add `const strategicFrame = useStore(s => s.strategicFrame);` (if not already present) and pass it as the new last argument to `generateNarrative()`.

Since `frame` is optional, callers that don't pass it will still compile — but for completeness, update all four.

- [ ] **Step 5: Run tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/narrativeEngine.ts src/components/presentation/PresentationMode.tsx src/components/meeting/NarrativeOpening.tsx src/components/board/BoardView.tsx src/components/dashboard/Dashboard.tsx
git commit -m "feat: add strategic frame signal to narrative engine"
```
