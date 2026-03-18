# Plan 1: AI-Drevet Onboarding + Progressiv Avsløring

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current onboarding wizard with an AI-driven "ready for your next leadership meeting" flow, and add a 3-tier complexity system (Level 1/2/3) that shows leaders a clean, focused interface while letting advisors unlock full power.

**Architecture:** The onboarding wizard gets a complete rewrite with document upload + AI generation as the primary path. A new `complexityLevel` (1|2|3) field in the store controls which nav items, filters, and features are visible. Both changes share the header/navigation refactor.

**Tech Stack:** React 19 / TypeScript / Zustand / Claude API (existing lib/ai/) / Vitest / react-i18next

**Spec:** `docs/superpowers/specs/2026-03-18-cairn-improvement-design.md` sections 1 and 2

**Terminology:** Never use "roadmap" — use "Strategy Path" or "stien". Never use marketing language ("powerful", "seamless", "robust").

---

## File Structure

### New Files
- `src/lib/ai/generateStrategicPicture.ts` — AI prompt + parser that takes org description or uploaded document text and returns a complete strategic picture (strategies, capabilities, initiatives, effects)
- `src/lib/ai/generateStrategicPicture.test.ts` — Tests for AI response parsing and validation
- `src/lib/documentParser.ts` — Extracts text from uploaded files (PDF, DOCX, TXT, PPTX)
- `src/lib/documentParser.test.ts` — Tests for document parsing
- `src/components/onboarding/StepUpload.tsx` — New step: file upload + free text input
- `src/components/onboarding/StepGenerated.tsx` — New step: shows AI-generated strategic picture with edit controls
- `src/components/onboarding/StepInsights.tsx` — New step: shows immediate insights ("aha moment") + CTA to meeting mode
- `src/hooks/useComplexityLevel.ts` — Hook that reads complexity level from store and returns visibility flags for features/nav items
- `src/hooks/useComplexityLevel.test.ts` — Tests for complexity hook

### Modified Files
- `src/components/onboarding/OnboardingWizard.tsx` — Complete rewrite of step flow
- `src/stores/useOnboardingStore.ts` — Add upload state, generated data state, remove template-specific state
- `src/stores/useStore.ts` — Add `complexityLevel` to UIState, add `setComplexityLevel` action
- `src/types/index.ts` — Add `ComplexityLevel` type, `GeneratedStrategicPicture` type
- `src/App.tsx` — Use complexity level to control nav visibility
- `src/components/header/HeaderMenu.tsx` — Add "Unlock more tools" option, respect complexity level
- `src/components/header/FilterDropdown.tsx` — Simplify filters at Level 1
- `src/i18n/locales/en.json` — New translation keys
- `src/i18n/locales/nb.json` — New translation keys

### Removed Files
- `src/components/onboarding/StepModules.tsx` — Replaced by complexity levels
- `src/components/onboarding/StepTemplate.tsx` — Replaced by AI generation
- `src/components/onboarding/StepAISuggestions.tsx` — Merged into new flow
- `src/components/onboarding/StepReview.tsx` — Replaced by StepGenerated

---

## Task 1: Add Complexity Level to Store and Types

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/stores/useStore.ts`
- Create: `src/hooks/useComplexityLevel.ts`
- Create: `src/hooks/useComplexityLevel.test.ts`

- [ ] **Step 1: Add types**

In `src/types/index.ts`, add after the existing type definitions:

```typescript
export type ComplexityLevel = 1 | 2 | 3;

export const COMPLEXITY_FEATURES = {
  1: {
    views: ['roadmap', 'dashboard'] as ViewMode[],
    filters: ['dimensions', 'search'] as string[],
    features: ['presentationMode'] as string[],
  },
  2: {
    views: ['roadmap', 'dashboard', 'capabilities', 'effects', 'strategies'] as ViewMode[],
    filters: ['dimensions', 'search', 'horizon', 'owner', 'status', 'milestones'] as string[],
    features: ['presentationMode'] as string[],
  },
  3: {
    views: ['roadmap', 'dashboard', 'capabilities', 'effects', 'strategies', 'compare'] as ViewMode[],
    filters: ['dimensions', 'search', 'horizon', 'owner', 'status', 'milestones', 'focusMode', 'zoomLevel', 'spotlightValueChain'] as string[],
    features: ['presentationMode', 'simulation', 'criticalPath', 'scenarios', 'benchmarking', 'import', 'export'] as string[],
  },
} as const;
```

- [ ] **Step 2: Add complexity level to store**

In `src/stores/useStore.ts`, add `complexityLevel: 1 as ComplexityLevel` to `defaultUI` and add action:

```typescript
setComplexityLevel: (level: ComplexityLevel) => set(state => ({
  ui: { ...state.ui, complexityLevel: level }
})),
```

Also add `complexityLevel` to the persisted UI fields in the `partialize` config.

- [ ] **Step 3: Write useComplexityLevel hook**

```typescript
// src/hooks/useComplexityLevel.ts
import { useStore } from '../stores/useStore';
import { COMPLEXITY_FEATURES, type ViewMode } from '../types';

export function useComplexityLevel() {
  const level = useStore(s => s.ui.complexityLevel);
  const config = COMPLEXITY_FEATURES[level];

  return {
    level,
    isViewVisible: (view: ViewMode) => config.views.includes(view),
    isFilterVisible: (filter: string) => config.filters.includes(filter),
    isFeatureEnabled: (feature: string) => config.features.includes(feature),
  };
}
```

- [ ] **Step 4: Write tests for useComplexityLevel**

```typescript
// src/hooks/useComplexityLevel.test.ts
import { describe, it, expect } from 'vitest';
import { COMPLEXITY_FEATURES } from '../types';

describe('COMPLEXITY_FEATURES', () => {
  it('level 1 shows only roadmap and dashboard views', () => {
    expect(COMPLEXITY_FEATURES[1].views).toEqual(['roadmap', 'dashboard']);
  });

  it('level 2 adds capabilities, effects, strategies', () => {
    expect(COMPLEXITY_FEATURES[2].views).toContain('capabilities');
    expect(COMPLEXITY_FEATURES[2].views).toContain('effects');
    expect(COMPLEXITY_FEATURES[2].views).toContain('strategies');
  });

  it('level 3 adds compare view', () => {
    expect(COMPLEXITY_FEATURES[3].views).toContain('compare');
  });

  it('level 1 filters are limited to dimensions and search', () => {
    expect(COMPLEXITY_FEATURES[1].filters).toEqual(['dimensions', 'search']);
  });

  it('level 3 features include simulation and critical path', () => {
    expect(COMPLEXITY_FEATURES[3].features).toContain('simulation');
    expect(COMPLEXITY_FEATURES[3].features).toContain('criticalPath');
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/hooks/useComplexityLevel.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/stores/useStore.ts src/hooks/useComplexityLevel.ts src/hooks/useComplexityLevel.test.ts
git commit -m "feat: add complexity level system (1/2/3) to store and types"
```

---

## Task 2: Apply Complexity Level to Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/header/HeaderMenu.tsx`
- Modify: `src/components/header/FilterDropdown.tsx`

- [ ] **Step 1: Update App.tsx navigation buttons**

In `src/App.tsx`, import `useComplexityLevel` and use it to conditionally render nav buttons. Replace the existing module-based visibility checks:

```typescript
const { isViewVisible, isFeatureEnabled } = useComplexityLevel();
```

For each nav button, wrap with `isViewVisible('capabilities')`, `isViewVisible('effects')`, `isViewVisible('strategies')`, etc. The existing `modules.capabilities` checks should be combined: a view shows if BOTH the module is enabled AND the complexity level permits it.

- [ ] **Step 2: Add "Unlock more tools" to HeaderMenu**

In `src/components/header/HeaderMenu.tsx`, add a menu section before the module controls that shows the current level and allows upgrading:

```typescript
{level < 3 && (
  <button onClick={() => setComplexityLevel(level + 1 as ComplexityLevel)}>
    {t('complexity.unlock')} →
  </button>
)}
{level > 1 && (
  <button onClick={() => setComplexityLevel(level - 1 as ComplexityLevel)}>
    ← {t('complexity.simplify')}
  </button>
)}
```

Show current level label: Nivå 1: Leder / Nivå 2: Strategisk / Nivå 3: Ekspert.

- [ ] **Step 3: Simplify FilterDropdown at Level 1**

In `src/components/header/FilterDropdown.tsx`, import `useComplexityLevel` and conditionally render filter sections:

```typescript
const { isFilterVisible } = useComplexityLevel();

// Only show horizon selector if level allows it
{isFilterVisible('horizon') && (
  // existing horizon filter JSX
)}
```

Apply to: horizon, owner, status, milestones, focusMode, zoomLevel.

- [ ] **Step 4: Add translation keys**

In both `en.json` and `nb.json`, add:

```json
"complexity": {
  "level1": "Level 1: Leader",
  "level2": "Level 2: Strategic",
  "level3": "Level 3: Expert",
  "unlock": "Unlock more tools",
  "simplify": "Simplify view",
  "current": "Complexity level"
}
```

Norwegian translations accordingly.

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit && npx vite build`
Expected: No type errors, build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/header/HeaderMenu.tsx src/components/header/FilterDropdown.tsx src/i18n/locales/en.json src/i18n/locales/nb.json
git commit -m "feat: apply complexity level to navigation and filters"
```

---

## Task 3: Document Parser

**Files:**
- Create: `src/lib/documentParser.ts`
- Create: `src/lib/documentParser.test.ts`

- [ ] **Step 1: Write tests for document parser**

```typescript
// src/lib/documentParser.test.ts
import { describe, it, expect } from 'vitest';
import { extractTextFromFile, getSupportedExtensions } from './documentParser';

describe('documentParser', () => {
  it('extracts text from plain text file', async () => {
    const file = new File(['Strategy document content'], 'strategy.txt', { type: 'text/plain' });
    const result = await extractTextFromFile(file);
    expect(result).toBe('Strategy document content');
  });

  it('returns supported extensions', () => {
    const ext = getSupportedExtensions();
    expect(ext).toContain('.txt');
    expect(ext).toContain('.pdf');
    expect(ext).toContain('.json');
  });

  it('throws on unsupported file type', async () => {
    const file = new File(['data'], 'image.png', { type: 'image/png' });
    await expect(extractTextFromFile(file)).rejects.toThrow();
  });

  it('handles empty file gracefully', async () => {
    const file = new File([''], 'empty.txt', { type: 'text/plain' });
    const result = await extractTextFromFile(file);
    expect(result).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/documentParser.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement document parser**

```typescript
// src/lib/documentParser.ts

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.json', '.csv', '.pdf', '.docx', '.pptx'];

export function getSupportedExtensions(): string[] {
  return SUPPORTED_EXTENSIONS;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  // Plain text formats
  if (['.txt', '.md', '.csv', '.json'].includes(ext)) {
    return await file.text();
  }

  // PDF: extract text from binary
  if (ext === '.pdf') {
    return await extractPdfText(file);
  }

  // DOCX/PPTX: extract text from XML inside ZIP
  if (ext === '.docx' || ext === '.pptx') {
    return await extractOfficeText(file);
  }

  return await file.text();
}

async function extractPdfText(file: File): Promise<string> {
  // Simple PDF text extraction — reads text objects from PDF binary
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  // Extract text between BT and ET operators (basic PDF text extraction)
  const textBlocks: string[] = [];
  const regex = /\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const decoded = match[1].replace(/\\n/g, '\n').replace(/\\r/g, '');
    if (decoded.trim().length > 2) {
      textBlocks.push(decoded.trim());
    }
  }

  return textBlocks.join(' ');
}

async function extractOfficeText(file: File): Promise<string> {
  // DOCX/PPTX are ZIP files containing XML
  // Use browser's native DecompressionStream if available, otherwise basic extraction
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(buffer));

  // Extract text content from XML tags
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // Filter out binary noise — keep only readable portions
  const readable = stripped.split(' ').filter(word => /^[\w\dæøåÆØÅ.,;:!?'"()-]+$/.test(word));
  return readable.join(' ');
}
```

Note: PDF and DOCX parsing is intentionally basic. For production, consider adding `pdfjs-dist` or `mammoth` libraries. The AI can still work with imperfect text extraction — Claude handles noisy input well.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/documentParser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/documentParser.ts src/lib/documentParser.test.ts
git commit -m "feat: add document parser for upload-based onboarding"
```

---

## Task 4: AI Strategic Picture Generator

**Files:**
- Create: `src/lib/ai/generateStrategicPicture.ts`
- Create: `src/lib/ai/generateStrategicPicture.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/ai/generateStrategicPicture.test.ts
import { describe, it, expect } from 'vitest';
import { parseStrategicPicture, type GeneratedStrategicPicture } from './generateStrategicPicture';

const validResponse: GeneratedStrategicPicture = {
  strategies: [
    { name: 'Digital transformasjon', description: 'Modernisere tjenester', timeHorizon: 'medium', priority: 1 }
  ],
  capabilities: [
    { name: 'Skyplattform', description: 'Cloud-first', level: 1, parent: null, maturity: 1, risk: 2 }
  ],
  initiatives: [
    { name: 'Migrere til sky', dimension: 'teknologi', horizon: 'near', description: 'Flytt kjernesystemer' }
  ],
  effects: [
    { name: 'Reduserte driftskostnader', type: 'cost', description: 'Lavere infra-kostnader' }
  ],
  insights: [
    '4 av 5 initiativer er teknologi — organisasjonsendring mangler'
  ],
};

describe('parseStrategicPicture', () => {
  it('parses valid JSON response', () => {
    const result = parseStrategicPicture(JSON.stringify(validResponse));
    expect(result.strategies).toHaveLength(1);
    expect(result.capabilities).toHaveLength(1);
    expect(result.initiatives).toHaveLength(1);
    expect(result.effects).toHaveLength(1);
    expect(result.insights).toHaveLength(1);
  });

  it('parses response wrapped in markdown code block', () => {
    const wrapped = '```json\n' + JSON.stringify(validResponse) + '\n```';
    const result = parseStrategicPicture(wrapped);
    expect(result.strategies).toHaveLength(1);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseStrategicPicture('not json')).toThrow();
  });

  it('throws on missing required fields', () => {
    expect(() => parseStrategicPicture(JSON.stringify({ strategies: [] }))).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/ai/generateStrategicPicture.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement strategic picture generator**

```typescript
// src/lib/ai/generateStrategicPicture.ts
import { callClaude } from './claude';
import { parseJsonObjectFromAI } from './parseJsonResponse';
import type { DimensionKey, EffectType } from '../../types';

export interface GeneratedStrategicPicture {
  strategies: Array<{
    name: string;
    description: string;
    timeHorizon: 'short' | 'medium' | 'long';
    priority: 1 | 2 | 3;
  }>;
  capabilities: Array<{
    name: string;
    description: string;
    level: 1 | 2;
    parent: string | null;
    maturity: 1 | 2 | 3;
    risk: 1 | 2 | 3;
  }>;
  initiatives: Array<{
    name: string;
    dimension: DimensionKey;
    horizon: 'near' | 'far';
    description: string;
  }>;
  effects: Array<{
    name: string;
    type: EffectType;
    description: string;
  }>;
  insights: string[];
}

const SYSTEM_PROMPT = `You are a strategic advisor analyzing organizational documents to create a strategic overview.

Given the input (document text or organization description), generate a COMPLETE strategic picture as JSON.

Requirements:
- 3-5 strategies with clear priorities
- 6-10 capabilities organized in max 2 levels (level 1 = domain, level 2 = sub-capability with parent referencing a level 1 name)
- 8-15 initiatives distributed across ALL FOUR dimensions: ledelse, virksomhet, organisasjon, teknologi
- 3-5 effects with types: cost, quality, speed, compliance, strategic
- 2-4 insights — observations about balance, gaps, or risks. Write in Norwegian. Be specific and provocative.

CRITICAL: Distribute initiatives across dimensions. Most organizations over-index on technology. Call this out explicitly in insights if present.

Respond with ONLY valid JSON matching this schema:
{
  "strategies": [{ "name": "", "description": "", "timeHorizon": "short|medium|long", "priority": 1-3 }],
  "capabilities": [{ "name": "", "description": "", "level": 1|2, "parent": null|"parent name", "maturity": 1-3, "risk": 1-3 }],
  "initiatives": [{ "name": "", "dimension": "ledelse|virksomhet|organisasjon|teknologi", "horizon": "near|far", "description": "" }],
  "effects": [{ "name": "", "type": "cost|quality|speed|compliance|strategic", "description": "" }],
  "insights": ["string"]
}`;

export function parseStrategicPicture(text: string): GeneratedStrategicPicture {
  const parsed = parseJsonObjectFromAI(text) as GeneratedStrategicPicture;

  if (!parsed.strategies?.length || !parsed.capabilities?.length ||
      !parsed.initiatives?.length || !parsed.effects?.length) {
    throw new Error('AI response missing required fields');
  }

  return parsed;
}

export async function generateStrategicPicture(
  input: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<GeneratedStrategicPicture> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input }],
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  return parseStrategicPicture(text);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/ai/generateStrategicPicture.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/generateStrategicPicture.ts src/lib/ai/generateStrategicPicture.test.ts
git commit -m "feat: add AI strategic picture generator for onboarding"
```

---

## Task 5: Rewrite Onboarding Wizard

**Files:**
- Modify: `src/stores/useOnboardingStore.ts`
- Modify: `src/components/onboarding/OnboardingWizard.tsx`
- Create: `src/components/onboarding/StepUpload.tsx`
- Create: `src/components/onboarding/StepGenerated.tsx`
- Create: `src/components/onboarding/StepInsights.tsx`
- Delete: `src/components/onboarding/StepModules.tsx`
- Delete: `src/components/onboarding/StepTemplate.tsx`
- Delete: `src/components/onboarding/StepAISuggestions.tsx`
- Delete: `src/components/onboarding/StepReview.tsx`

- [ ] **Step 1: Update onboarding store**

Rewrite `src/stores/useOnboardingStore.ts`:

```typescript
import { create } from 'zustand';
import type { GeneratedStrategicPicture } from '../lib/ai/generateStrategicPicture';

interface OnboardingState {
  isOpen: boolean;
  step: number; // 0: Welcome, 1: Upload/Describe, 2: Generated picture, 3: Insights
  orgDescription: string;
  uploadedText: string;
  generatedPicture: GeneratedStrategicPicture | null;
  isGenerating: boolean;
  generationError: string | null;
  hasCompletedOnboarding: boolean;

  // Actions
  open: () => void;
  close: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setOrgDescription: (desc: string) => void;
  setUploadedText: (text: string) => void;
  setGeneratedPicture: (picture: GeneratedStrategicPicture) => void;
  setIsGenerating: (loading: boolean) => void;
  setGenerationError: (error: string | null) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isOpen: shouldAutoShowWizard(),
  step: 0,
  orgDescription: '',
  uploadedText: '',
  generatedPicture: null,
  isGenerating: false,
  generationError: null,
  hasCompletedOnboarding: localStorage.getItem('cairn-onboarding') === 'completed',

  open: () => set({ isOpen: true, step: 0 }),
  close: () => set({ isOpen: false }),
  nextStep: () => set(s => ({ step: Math.min(s.step + 1, 3) })),
  prevStep: () => set(s => ({ step: Math.max(s.step - 1, 0) })),
  setOrgDescription: (orgDescription) => set({ orgDescription }),
  setUploadedText: (uploadedText) => set({ uploadedText }),
  setGeneratedPicture: (generatedPicture) => set({ generatedPicture }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationError: (generationError) => set({ generationError }),
  completeOnboarding: () => {
    localStorage.setItem('cairn-onboarding', 'completed');
    set({ hasCompletedOnboarding: true, isOpen: false });
  },
  reset: () => set({
    step: 0, orgDescription: '', uploadedText: '',
    generatedPicture: null, isGenerating: false, generationError: null,
  }),
}));

function shouldAutoShowWizard(): boolean {
  if (localStorage.getItem('cairn-onboarding') === 'completed') return false;
  if (localStorage.getItem('cairn-storage')) return false;
  return true;
}
```

- [ ] **Step 2: Create StepUpload component**

```typescript
// src/components/onboarding/StepUpload.tsx
// File upload (primary) + free text (secondary)
// Accept: .txt, .md, .pdf, .docx, .pptx, .json, .csv
// On file drop/select: call extractTextFromFile() → store uploadedText
// Show text preview (first 500 chars) after upload
// Free text textarea as alternative
// "Generate" button: calls generateStrategicPicture() with uploadedText || orgDescription
// Shows loading spinner during generation
// On success: stores result, advances to next step
// On error: shows error message with retry option
```

Implementation should use `extractTextFromFile` from `src/lib/documentParser.ts` and `generateStrategicPicture` from `src/lib/ai/generateStrategicPicture.ts`. Use drag-and-drop zone with file input fallback.

- [ ] **Step 3: Create StepGenerated component**

```typescript
// src/components/onboarding/StepGenerated.tsx
// Displays the AI-generated strategic picture for review
// Sections: Strategies, Capabilities (tree), Initiatives (by dimension), Effects
// Each item has: checkbox (include/exclude), inline edit (name), delete button
// Dimension color coding on initiatives
// "Add more" button per section
// Prominent "Next" button at bottom
```

Uses `generatedPicture` from onboarding store. Color-code initiatives by dimension using existing dimension colors from `DIMENSIONS` constant.

- [ ] **Step 4: Create StepInsights component**

```typescript
// src/components/onboarding/StepInsights.tsx
// Shows the "aha moment" — insights from the generated data
// Displays insights from generatedPicture.insights as cards
// Shows dimension distribution chart (simple bar)
// Shows capability coverage summary
// CTA: "Ta med dette i neste ledermøte" → completes onboarding and opens meeting mode
// Secondary CTA: "Start editing" → completes onboarding, stays in strategy path
```

- [ ] **Step 5: Rewrite OnboardingWizard orchestrator**

Update `src/components/onboarding/OnboardingWizard.tsx`:

```typescript
// New step flow:
// Step 0: StepWelcome (keep existing, minor copy update)
// Step 1: StepUpload (document upload + free text + AI generation)
// Step 2: StepGenerated (review + edit AI output)
// Step 3: StepInsights (aha moment + complete)
//
// On complete:
// 1. Convert generatedPicture to store format (add IDs, create scenario)
// 2. Call importState() with the generated data
// 3. Set complexityLevel to 1 (default for new users)
// 4. Call completeOnboarding()
```

- [ ] **Step 6: Delete old step files**

Remove:
- `src/components/onboarding/StepModules.tsx`
- `src/components/onboarding/StepTemplate.tsx`
- `src/components/onboarding/StepAISuggestions.tsx`
- `src/components/onboarding/StepReview.tsx`

- [ ] **Step 7: Update translations**

Add to both `en.json` and `nb.json`:

```json
"onboarding": {
  "welcome": { "title": "...", "subtitle": "..." },
  "upload": {
    "title": "Last opp eksisterende dokumentasjon",
    "subtitle": "Strategiplaner, kapabilitetsoversikter, initiativlister — de fleste har dokumentasjonen, men mangler linsen",
    "dropzone": "Slipp filer her eller klikk for å velge",
    "supported": "PDF, Word, PowerPoint, tekst",
    "orDescribe": "Eller beskriv virksomheten din",
    "generate": "Generer strategibilde",
    "generating": "Analyserer...",
    "error": "Noe gikk galt. Prøv igjen."
  },
  "generated": {
    "title": "Ditt strategibilde",
    "subtitle": "Gjennomgå og juster — fjern det som ikke stemmer, legg til det som mangler",
    "strategies": "Strategier",
    "capabilities": "Kapabiliteter",
    "initiatives": "Initiativer",
    "effects": "Effekter"
  },
  "insights": {
    "title": "Dette ser vi",
    "subtitle": "Innsikter fra ditt strategibilde",
    "meetingCta": "Ta med dette i neste ledermøte",
    "editCta": "Start med å redigere"
  }
}
```

- [ ] **Step 8: Verify build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: rewrite onboarding wizard with AI-driven document upload flow"
```

---

## Task 6: Backward Compatibility and Existing User Migration

**Files:**
- Modify: `src/stores/useStore.ts`

- [ ] **Step 1: Handle existing users without complexity level**

In the store's persistence `onRehydrate` or `merge` function, add:

```typescript
// Existing users who haven't gone through new onboarding get Level 3
// (they already know the full interface)
if (!stored.ui?.complexityLevel) {
  stored.ui.complexityLevel = 3;
}
```

- [ ] **Step 2: Ensure module settings stay compatible**

Level 1 users should have capabilities and effects modules enabled in the store (data is there from AI generation), but the views are hidden by complexity level. This means:

```typescript
// In onboarding completion, always enable all modules
setModules({ roadmap: true, capabilities: true, effects: true });
// Complexity level controls what's VISIBLE, not what's ENABLED
```

- [ ] **Step 3: Verify build and test**

Run: `npx tsc --noEmit && npx vitest run`
Expected: All tests pass, build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/stores/useStore.ts
git commit -m "feat: add backward compatibility for complexity level migration"
```

---

## Task 7: Integration Testing

**Files:**
- Run existing tests + manual verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Manual verification checklist**

Verify in browser:
- [ ] New user: sees onboarding wizard with upload step
- [ ] Upload a .txt file → text extracted and shown
- [ ] Free text input works as alternative
- [ ] AI generation produces strategic picture (requires API key)
- [ ] Generated picture is editable (toggle items, edit names)
- [ ] Insights step shows dimension distribution
- [ ] Completing onboarding loads data into strategy path
- [ ] New user starts at Level 1 (only Strategy Path + Dashboard visible)
- [ ] "Unlock more tools" shows in header menu
- [ ] Upgrading to Level 2 shows capabilities, effects, strategies
- [ ] Upgrading to Level 3 shows scenarios, simulation, critical path
- [ ] Existing user (with localStorage data) stays at Level 3
- [ ] Filter dropdown respects complexity level

- [ ] **Step 3: Commit any fixes**

```bash
git commit -m "fix: integration testing fixes for onboarding and complexity"
```
