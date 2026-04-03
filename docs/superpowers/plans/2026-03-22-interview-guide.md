# Interview Guide Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-shot AI generation in onboarding with a two-step adaptive process: analyze input first (extract findings, generate targeted questions), then generate only initiatives and effects with confidence markers.

**Architecture:** Two AI calls via Supabase Edge Functions. First call analyzes uploaded documents + metadata to extract findings and generate follow-up questions. Second call uses findings + user answers to generate initiatives and effects with confidence levels. System prompts live server-side to protect IP. New `StepAnalysis` component inserted between Upload and Generated steps.

**Tech Stack:** React 19, Zustand 5, Supabase Edge Functions (Deno), TypeScript, react-i18next

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/ai/frameworks/onboardingFramework.ts` | Create | TypeScript interfaces: AnalysisResult, Finding, Question, OnboardingResult |
| `src/lib/ai/analyzeInput.ts` | Create | Client function: call analyze-input Edge Function |
| `supabase/functions/analyze-input/index.ts` | Create | Edge Function: analysis with server-side prompt |
| `supabase/functions/generate-strategic-picture/index.ts` | Modify | Accept analysis context + answers, return OnboardingResult |
| `src/components/onboarding/StepAnalysis.tsx` | Create | New step: shows findings summary + follow-up questions |
| `src/stores/useOnboardingStore.ts` | Modify | Add industry, orgSize, analysisResult, analysisAnswers; update step bounds |
| `src/components/onboarding/StepUpload.tsx` | Modify | Add industry/size dropdowns, trigger analysis instead of generation |
| `src/components/onboarding/StepGenerated.tsx` | Modify | Show only initiatives + effects with confidence visualization |
| `src/components/onboarding/StepInsights.tsx` | Modify | Remove capability count, add "next step" prompt |
| `src/components/onboarding/OnboardingWizard.tsx` | Modify | Add step 2 (Analysis), update convertToAppState for OnboardingResult |
| `src/i18n/locales/nb.json` | Modify | Analysis step + industry/size i18n keys |
| `src/i18n/locales/en.json` | Modify | Analysis step + industry/size i18n keys |

---

### Task 1: Types and interfaces

**Files:**
- Create: `src/lib/ai/frameworks/onboardingFramework.ts`

- [ ] **Step 1: Create the framework types file**

Create `src/lib/ai/frameworks/onboardingFramework.ts`:

```typescript
import type { DimensionKey, EffectType } from '../../../types';

// --- Analysis (first AI call) ---

export interface AnalysisResult {
  summary: string;
  findings: Finding[];
  questions: Question[];
  readiness: number; // 0-100
}

export interface Finding {
  text: string;
  type: 'initiative' | 'effect' | 'strategy';
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export interface Question {
  id: string;
  text: string;
  context: string;
  options: string[];
  allowFreeText: boolean;
}

// --- Generation (second AI call) ---

export interface OnboardingResult {
  initiatives: OnboardingInitiative[];
  effects: OnboardingEffect[];
  insights: string[];
}

export interface OnboardingInitiative {
  name: string;
  dimension: DimensionKey;
  horizon: 'near' | 'far';
  description: string;
  confidence: 'high' | 'low';
  reasoning: string;
  effectNames: string[];
}

export interface OnboardingEffect {
  name: string;
  type: EffectType;
  description: string;
  confidence: 'high' | 'low';
}

// --- Industry/Size options ---

export const INDUSTRY_OPTIONS = [
  'offentlig_forvaltning',
  'helse',
  'finans',
  'teknologi',
  'industri_produksjon',
  'handel_retail',
  'utdanning',
  'annet',
] as const;

export type IndustryKey = typeof INDUSTRY_OPTIONS[number];

export const SIZE_OPTIONS = [
  'under_50',
  '50_200',
  '200_1000',
  '1000_5000',
  'over_5000',
] as const;

export type SizeKey = typeof SIZE_OPTIONS[number];
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/frameworks/onboardingFramework.ts
git commit -m "feat: add TypeScript interfaces for interview guide framework"
```

---

### Task 2: Update onboarding store

**Files:**
- Modify: `src/stores/useOnboardingStore.ts`

- [ ] **Step 1: Add new state fields to the interface**

Add imports at top:
```typescript
import type { AnalysisResult, OnboardingResult, IndustryKey, SizeKey } from '../lib/ai/frameworks/onboardingFramework';
```

Add to `OnboardingState` interface (after `uploadedFiles`):
```typescript
  industry: IndustryKey | '';
  orgSize: SizeKey | '';
  analysisResult: AnalysisResult | null;
  analysisAnswers: Record<string, string>;
  isAnalyzing: boolean;
```

Replace `generatedPicture: GeneratedStrategicPicture | null` with:
```typescript
  onboardingResult: OnboardingResult | null;
```

Add new methods to interface:
```typescript
  setIndustry: (industry: IndustryKey | '') => void;
  setOrgSize: (size: SizeKey | '') => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setAnalysisAnswer: (questionId: string, answer: string) => void;
  setIsAnalyzing: (loading: boolean) => void;
  setOnboardingResult: (result: OnboardingResult) => void;
```

Remove from interface:
```typescript
  setGeneratedPicture: (picture: GeneratedStrategicPicture) => void;
```

- [ ] **Step 2: Update the store implementation**

Add initial state values:
```typescript
  industry: '',
  orgSize: '',
  analysisResult: null,
  analysisAnswers: {},
  isAnalyzing: false,
  onboardingResult: null,
```

Remove:
```typescript
  generatedPicture: null,
```

Add method implementations:
```typescript
  setIndustry: (industry) => set({ industry }),
  setOrgSize: (orgSize) => set({ orgSize }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setAnalysisAnswer: (questionId, answer) => set((s) => ({
    analysisAnswers: { ...s.analysisAnswers, [questionId]: answer },
  })),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setOnboardingResult: (onboardingResult) => set({ onboardingResult }),
```

Replace:
```typescript
  setGeneratedPicture: (generatedPicture) => set({ generatedPicture }),
```

Update `nextStep` bound:
```typescript
  nextStep: () => set(s => ({ step: Math.min(s.step + 1, 4) })),
```

Update `reset()` to include new fields:
```typescript
  reset: () => set({
    step: 0, orgDescription: '', uploadedFiles: [],
    industry: '', orgSize: '',
    analysisResult: null, analysisAnswers: {}, isAnalyzing: false,
    onboardingResult: null, isGenerating: false, generationError: null,
  }),
```

Remove the `GeneratedStrategicPicture` import and add the new imports.

- [ ] **Step 3: Fix all references to `generatedPicture` in other files**

Search for all references:
```bash
grep -rn "generatedPicture\|setGeneratedPicture" src/ --include="*.ts" --include="*.tsx"
```

These will be fixed in subsequent tasks (StepUpload, StepGenerated, StepInsights, OnboardingWizard). The build will have errors until those are updated — that's expected.

- [ ] **Step 4: Commit**

```bash
git add src/stores/useOnboardingStore.ts
git commit -m "feat: update onboarding store for interview guide (analysis + generation)"
```

---

### Task 3: i18n keys

**Files:**
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Add Norwegian keys**

Add inside `"onboarding"` object, a new `"analysis"` section and `"industry"` / `"size"` sections in `"upload"`:

In `"upload"` section, add:
```json
"documentGuidance": "Dokumenter som gir best resultat: strategiplaner, virksomhetsplaner, styrepresentasjoner, årsrapporter",
"industry": "Bransje / sektor",
"orgSize": "Organisasjonens størrelse",
"industryOptions": {
  "offentlig_forvaltning": "Offentlig forvaltning",
  "helse": "Helse",
  "finans": "Finans",
  "teknologi": "Teknologi",
  "industri_produksjon": "Industri / Produksjon",
  "handel_retail": "Handel / Retail",
  "utdanning": "Utdanning",
  "annet": "Annet"
},
"sizeOptions": {
  "under_50": "Under 50 ansatte",
  "50_200": "50–200 ansatte",
  "200_1000": "200–1 000 ansatte",
  "1000_5000": "1 000–5 000 ansatte",
  "over_5000": "Over 5 000 ansatte"
},
"analyze": "Analyser"
```

Add new `"analysis"` section at same level as `"upload"`:
```json
"analysis": {
  "title": "Analyse av dokumentene",
  "subtitle": "Vi har gjennomgått dokumentene dine og har noen oppfølgingsspørsmål",
  "foundSummary": "Vi fant {{initiatives}} mulige initiativer og {{effects}} effektmål",
  "questionsIntro": "{{count}} spørsmål vil gi et vesentlig bedre resultat",
  "generateNow": "Generer nå",
  "analyzing": "Analyserer dokumentene...",
  "noFindings": "Vi kunne ikke trekke ut spesifikke initiativer fra dokumentene. Legg til en beskrivelse eller gå videre for forslag basert på bransje.",
  "skipToGenerate": "Gå videre",
  "retryAnalysis": "Prøv igjen",
  "error": "Analysen feilet. Du kan prøve igjen eller gå direkte til generering."
}
```

Update `"generated"` section, add:
```json
"confident": "Basert på dokumentene",
"suggested": "Foreslått — trenger bekreftelse",
"nextStepCapabilities": "Neste steg: Bygg kapabilitetskartet basert på initiativene dine"
```

- [ ] **Step 2: Add English keys**

Same structure in `en.json`:

In `"upload"`:
```json
"documentGuidance": "Documents that give the best results: strategy plans, business plans, board presentations, annual reports",
"industry": "Industry / sector",
"orgSize": "Organization size",
"industryOptions": {
  "offentlig_forvaltning": "Public administration",
  "helse": "Healthcare",
  "finans": "Finance",
  "teknologi": "Technology",
  "industri_produksjon": "Manufacturing / Production",
  "handel_retail": "Retail / Commerce",
  "utdanning": "Education",
  "annet": "Other"
},
"sizeOptions": {
  "under_50": "Under 50 employees",
  "50_200": "50–200 employees",
  "200_1000": "200–1,000 employees",
  "1000_5000": "1,000–5,000 employees",
  "over_5000": "Over 5,000 employees"
},
"analyze": "Analyze"
```

New `"analysis"` section:
```json
"analysis": {
  "title": "Document analysis",
  "subtitle": "We've reviewed your documents and have some follow-up questions",
  "foundSummary": "We found {{initiatives}} possible initiatives and {{effects}} effect targets",
  "questionsIntro": "{{count}} questions will significantly improve the result",
  "generateNow": "Generate now",
  "analyzing": "Analyzing documents...",
  "noFindings": "We couldn't extract specific initiatives from the documents. Add a description or proceed for suggestions based on your industry.",
  "skipToGenerate": "Proceed",
  "retryAnalysis": "Try again",
  "error": "Analysis failed. You can try again or go directly to generation."
}
```

In `"generated"`:
```json
"confident": "Based on documents",
"suggested": "Suggested — needs confirmation",
"nextStepCapabilities": "Next step: Build the capability map based on your initiatives"
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/nb.json src/i18n/locales/en.json
git commit -m "feat: add i18n keys for interview guide (analysis, industry, size)"
```

---

### Task 4: Edge Function — analyze-input

**Files:**
- Create: `supabase/functions/analyze-input/index.ts`

- [ ] **Step 1: Create the analysis Edge Function**

Create `supabase/functions/analyze-input/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANALYSIS_PROMPT = `You are a strategic advisor analyzing organizational documents.

Your task is to ANALYZE the input and extract strategic findings. Do NOT generate new content — only identify what exists in the documents.

For each finding, assess:
- Is this specific to THIS organization, or could it be any organization?
- What is the source (which document/section)?
- Confidence: high (explicitly stated), medium (implied), low (inferred)

Then identify GAPS — what's missing for a complete strategic picture:
- Are initiatives distributed across dimensions (leadership, business, organization, technology)?
- Are there clear effect/outcome targets?
- Is the information specific enough to be recognizable?

Generate 0-3 follow-up questions ONLY for critical gaps. Each question must:
- Reference something specific found in the documents
- Provide 3-4 multiple choice options adapted to the organization's context
- Never be generic — always grounded in what was found

Respond with ONLY valid JSON:
{
  "summary": "Norwegian summary of what was found",
  "findings": [
    { "text": "name of finding", "type": "initiative|effect|strategy", "confidence": "high|medium|low", "source": "document reference" }
  ],
  "questions": [
    { "id": "q1", "text": "question in Norwegian", "context": "why we ask — what triggered this", "options": ["option a", "option b", "option c", "annet"], "allowFreeText": true }
  ],
  "readiness": 0-100
}

Rules:
- Write all user-facing text in Norwegian
- Never guess. If uncertain, generate a question instead.
- Maximum 3 questions. Prioritize by impact on result quality.
- readiness: 80-100 = few/no questions needed, 40-79 = questions will help significantly, 0-39 = very little found`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { input, industry, orgSize } = await req.json();
    if (!input || typeof input !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contextPrefix = [
      industry ? `Bransje: ${industry}` : '',
      orgSize ? `Størrelse: ${orgSize}` : '',
    ].filter(Boolean).join('\n');

    const userMessage = contextPrefix
      ? `${contextPrefix}\n\n${input}`
      : input;

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: ANALYSIS_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({ error: `AI request failed: ${aiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const text = aiData.content[0].text;

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Deploy the Edge Function**

```bash
npx supabase functions deploy analyze-input
```

Then in Supabase Dashboard → Edge Functions → analyze-input → Settings → turn OFF "Verify JWT with legacy secret".

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/analyze-input/index.ts
git commit -m "feat: add analyze-input Edge Function with server-side prompt"
```

---

### Task 5: Update generate-strategic-picture Edge Function

**Files:**
- Modify: `supabase/functions/generate-strategic-picture/index.ts`

- [ ] **Step 1: Update the Edge Function to accept analysis context**

Replace the system prompt and input handling. The Edge Function now:
- Accepts `input`, `industry`, `orgSize`, `findings`, `answers` in the request body
- Uses a new system prompt focused on initiatives + effects only
- Incorporates findings and answers into the user message

Read the current file, then replace the `systemPrompt` usage and request body parsing. The new system prompt should be:

```typescript
const GENERATION_PROMPT = `You are a strategic advisor generating a strategic initiative overview.

Based on the analysis findings and user answers provided, generate SPECIFIC initiatives and effects for this organization.

Rules:
- Generate ONLY initiatives and effects. No strategies, no capabilities.
- Each initiative MUST have a confidence level:
  - "high" = directly based on documents or user answers
  - "low" = suggested/inferred, needs user confirmation
- Each initiative must link to 1-3 effects by name
- Distribute initiatives across ALL FOUR dimensions: ledelse, virksomhet, organisasjon, teknologi
- Never generate generic content. If it could be any organization, don't include it.
- Provide reasoning for each initiative (what source/answer it's based on)
- 2-4 insights in Norwegian — observations about dimension balance, gaps, or risks
- Write all user-facing text in Norwegian

Respond with ONLY valid JSON:
{
  "initiatives": [{ "name": "", "dimension": "ledelse|virksomhet|organisasjon|teknologi", "horizon": "near|far", "description": "", "confidence": "high|low", "reasoning": "", "effectNames": ["effect name"] }],
  "effects": [{ "name": "", "type": "cost|quality|speed|compliance|strategic", "description": "", "confidence": "high|low" }],
  "insights": ["string"]
}`;
```

Update the request body parsing to accept analysis context:
```typescript
const { input, industry, orgSize, findings, answers } = await req.json();
```

Build the user message including findings and answers:
```typescript
const parts = [];
if (industry) parts.push(`Bransje: ${industry}`);
if (orgSize) parts.push(`Størrelse: ${orgSize}`);
if (findings?.length) {
  parts.push('Analysefunn:\n' + findings.map((f: { text: string; type: string; confidence: string }) =>
    `- [${f.type}/${f.confidence}] ${f.text}`
  ).join('\n'));
}
if (answers && Object.keys(answers).length > 0) {
  parts.push('Brukerens svar:\n' + Object.entries(answers).map(([q, a]) =>
    `- ${q}: ${a}`
  ).join('\n'));
}
parts.push(input);
const userMessage = parts.join('\n\n');
```

Use `GENERATION_PROMPT` instead of the client-sent `systemPrompt`.

- [ ] **Step 2: Deploy**

```bash
npx supabase functions deploy generate-strategic-picture
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/generate-strategic-picture/index.ts
git commit -m "feat: update generation Edge Function for initiative-focused output with analysis context"
```

---

### Task 6: Frontend analysis client

**Files:**
- Create: `src/lib/ai/analyzeInput.ts`

- [ ] **Step 1: Create the analysis client function**

Create `src/lib/ai/analyzeInput.ts`:

```typescript
import { parseJsonObjectFromAI } from './parseJsonResponse';
import type { AnalysisResult } from './frameworks/onboardingFramework';

export async function analyzeInput(
  input: string,
  accessToken: string,
  industry?: string,
  orgSize?: string,
  signal?: AbortSignal,
): Promise<AnalysisResult> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-input`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ input, industry, orgSize }),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status}`);
  }

  const data = await response.json();
  const parsed = parseJsonObjectFromAI(data.text) as unknown as AnalysisResult;

  if (!parsed.findings || !Array.isArray(parsed.findings)) {
    throw new Error('Invalid analysis response');
  }

  return parsed;
}
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: Errors in other files referencing old store fields — that's expected.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/analyzeInput.ts
git commit -m "feat: add analyzeInput client function for document analysis"
```

---

### Task 7: Update StepUpload — add dropdowns, trigger analysis

**Files:**
- Modify: `src/components/onboarding/StepUpload.tsx`

- [ ] **Step 1: Add industry and size dropdowns and switch from generation to analysis**

Read the current `StepUpload.tsx`. Make these changes:

1. Update store destructuring — replace `generatedPicture`-related fields with analysis fields:
```typescript
const {
  orgDescription,
  uploadedFiles,
  industry,
  orgSize,
  isAnalyzing,
  generationError,
  setOrgDescription,
  addUploadedFiles,
  removeUploadedFile,
  setIndustry,
  setOrgSize,
  setAnalysisResult,
  setIsAnalyzing,
  setGenerationError,
  nextStep,
  prevStep,
} = useOnboardingStore();
```

2. Replace `handleGenerate` with `handleAnalyze`:
```typescript
const handleAnalyze = async () => {
  const totalBudget = 150_000;
  const descText = orgDescription.trim();
  const descBudget = Math.min(descText.length, 10_000);
  const fileBudget = uploadedFiles.length > 0
    ? Math.floor((totalBudget - descBudget) / uploadedFiles.length)
    : 0;

  const fileParts = uploadedFiles
    .map(f => `--- [${f.name}] ---\n${f.text.slice(0, fileBudget)}`)
    .join('\n\n');
  const descPart = descText
    ? `--- Organisasjonsbeskrivelse ---\n${descText.slice(0, descBudget)}`
    : '';
  const input = [fileParts, descPart].filter(Boolean).join('\n\n');
  if (!input.trim()) return;

  setIsAnalyzing(true);
  setGenerationError(null);

  try {
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const result = await analyzeInput(input, token, industry, orgSize);
    setAnalysisResult(result);
    nextStep();
  } catch (err) {
    setGenerationError(err instanceof Error ? err.message : t('onboarding.analysis.error'));
  } finally {
    setIsAnalyzing(false);
  }
};
```

3. Add import for `analyzeInput`:
```typescript
import { analyzeInput } from '../../lib/ai/analyzeInput';
```

4. Add industry and size dropdowns in the JSX, between the file list/textarea and the API key section:
```tsx
{/* Industry and size */}
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="text-[10px] text-text-tertiary font-medium mb-1 block">
      {t('onboarding.upload.industry')}
    </label>
    <select
      value={industry}
      onChange={(e) => setIndustry(e.target.value as IndustryKey | '')}
      className="w-full px-3 py-2 text-[12px] border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary"
    >
      <option value="">{t('common.select')}</option>
      {INDUSTRY_OPTIONS.map(key => (
        <option key={key} value={key}>{t(`onboarding.upload.industryOptions.${key}`)}</option>
      ))}
    </select>
  </div>
  <div>
    <label className="text-[10px] text-text-tertiary font-medium mb-1 block">
      {t('onboarding.upload.orgSize')}
    </label>
    <select
      value={orgSize}
      onChange={(e) => setOrgSize(e.target.value as SizeKey | '')}
      className="w-full px-3 py-2 text-[12px] border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary"
    >
      <option value="">{t('common.select')}</option>
      {SIZE_OPTIONS.map(key => (
        <option key={key} value={key}>{t(`onboarding.upload.sizeOptions.${key}`)}</option>
      ))}
    </select>
  </div>
</div>
```

5. Add document guidance text above the drop zone:
```tsx
<p className="text-[10px] text-text-tertiary italic mb-2">
  {t('onboarding.upload.documentGuidance')}
</p>
```

6. Change the generate button to analyze:
- Replace button text from `t('onboarding.upload.generate')` to `t('onboarding.upload.analyze')`
- Replace `isGenerating` with `isAnalyzing` in disabled/spinner logic
- Replace `handleGenerate` with `handleAnalyze`
- Replace generating text from `t('onboarding.upload.generating')` to `t('onboarding.analysis.analyzing')`

7. Add imports for types:
```typescript
import { INDUSTRY_OPTIONS, SIZE_OPTIONS } from '../../lib/ai/frameworks/onboardingFramework';
import type { IndustryKey, SizeKey } from '../../lib/ai/frameworks/onboardingFramework';
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: Errors in StepGenerated, StepInsights, OnboardingWizard — they still reference old store fields. Fixed in next tasks.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/StepUpload.tsx
git commit -m "feat: add industry/size dropdowns and switch to analysis in StepUpload"
```

---

### Task 8: StepAnalysis component (new)

**Files:**
- Create: `src/components/onboarding/StepAnalysis.tsx`

- [ ] **Step 1: Create the analysis step component**

Create `src/components/onboarding/StepAnalysis.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAuth } from '../../providers/AuthProvider';
import { generateStrategicPicture } from '../../lib/ai/generateStrategicPicture';
import type { OnboardingResult } from '../../lib/ai/frameworks/onboardingFramework';
import { parseJsonObjectFromAI } from '../../lib/ai/parseJsonResponse';

export function StepAnalysis() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const {
    analysisResult,
    analysisAnswers,
    uploadedFiles,
    orgDescription,
    industry,
    orgSize,
    isGenerating,
    generationError,
    setAnalysisAnswer,
    setOnboardingResult,
    setIsGenerating,
    setGenerationError,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const [freeTextValues, setFreeTextValues] = useState<Record<string, string>>({});

  if (!analysisResult) return null;

  const initiativeCount = analysisResult.findings.filter(f => f.type === 'initiative').length;
  const effectCount = analysisResult.findings.filter(f => f.type === 'effect').length;
  const unansweredQuestions = analysisResult.questions.filter(q => !analysisAnswers[q.id]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      // Build input same as StepUpload
      const totalBudget = 150_000;
      const descText = orgDescription.trim();
      const descBudget = Math.min(descText.length, 10_000);
      const fileBudget = uploadedFiles.length > 0
        ? Math.floor((totalBudget - descBudget) / uploadedFiles.length)
        : 0;
      const fileParts = uploadedFiles
        .map(f => `--- [${f.name}] ---\n${f.text.slice(0, fileBudget)}`)
        .join('\n\n');
      const descPart = descText
        ? `--- Organisasjonsbeskrivelse ---\n${descText.slice(0, descBudget)}`
        : '';
      const input = [fileParts, descPart].filter(Boolean).join('\n\n');

      // Call generation with analysis context
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-strategic-picture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            input,
            industry,
            orgSize,
            findings: analysisResult.findings,
            answers: analysisAnswers,
          }),
        }
      );

      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      const parsed = parseJsonObjectFromAI(data.text) as unknown as OnboardingResult;
      setOnboardingResult(parsed);
      nextStep();
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMIT') {
        setGenerationError(t('auth.rateLimitExceeded'));
      } else {
        setGenerationError(err instanceof Error ? err.message : t('onboarding.analysis.error'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold text-text-primary">{t('onboarding.analysis.title')}</h2>
        <p className="text-[12px] text-text-secondary mt-1">{t('onboarding.analysis.subtitle')}</p>
      </div>

      {/* Summary */}
      <div className="bg-primary/5 rounded-lg p-4">
        <p className="text-[12px] text-text-primary font-medium">
          {t('onboarding.analysis.foundSummary', { initiatives: initiativeCount, effects: effectCount })}
        </p>
        {analysisResult.readiness < 80 && unansweredQuestions.length > 0 && (
          <p className="text-[10px] text-text-secondary mt-1">
            {t('onboarding.analysis.questionsIntro', { count: unansweredQuestions.length })}
          </p>
        )}
      </div>

      {/* No findings */}
      {analysisResult.findings.length === 0 && (
        <p className="text-[11px] text-text-secondary">{t('onboarding.analysis.noFindings')}</p>
      )}

      {/* Questions */}
      {analysisResult.questions.length > 0 && (
        <div className="space-y-4">
          {analysisResult.questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <p className="text-[12px] text-text-primary font-medium">{q.text}</p>
              <p className="text-[10px] text-text-tertiary italic">{q.context}</p>
              <div className="space-y-1">
                {q.options.map((option, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      value={option}
                      checked={analysisAnswers[q.id] === option}
                      onChange={() => setAnalysisAnswer(q.id, option)}
                      className="w-3 h-3 accent-primary"
                    />
                    <span className="text-[11px] text-text-secondary">{option}</span>
                  </label>
                ))}
                {q.allowFreeText && (
                  <input
                    type="text"
                    placeholder="Annet..."
                    value={freeTextValues[q.id] ?? ''}
                    onChange={(e) => {
                      setFreeTextValues(prev => ({ ...prev, [q.id]: e.target.value }));
                      if (e.target.value.trim()) {
                        setAnalysisAnswer(q.id, e.target.value.trim());
                      }
                    }}
                    className="w-full px-3 py-1.5 text-[11px] border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary placeholder:text-text-tertiary mt-1"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {generationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[11px] text-red-700">{generationError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={prevStep}
          className="px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          &larr; {t('common.back')}
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {t('onboarding.upload.generating')}
            </>
          ) : (
            analysisResult.questions.length > 0 ? t('onboarding.analysis.generateNow') : t('onboarding.upload.generate')
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/StepAnalysis.tsx
git commit -m "feat: add StepAnalysis component with findings summary and follow-up questions"
```

---

### Task 9: Update StepGenerated — initiatives + effects only with confidence

**Files:**
- Modify: `src/components/onboarding/StepGenerated.tsx`

- [ ] **Step 1: Update to use OnboardingResult and show confidence**

Read the current file. Make these changes:

1. Replace `generatedPicture` references with `onboardingResult` from the store
2. Remove the strategies and capabilities sections entirely
3. Keep initiatives (grouped by dimension) and effects sections
4. Add confidence visualization: items with `confidence: 'low'` get `opacity-50` and `border-dashed` classes
5. Update the `handleNext` function to write back `onboardingResult` (filtered by included items) instead of `generatedPicture`

For confidence styling on each `EditableRow` or list item, add conditional classes:
```tsx
className={`... ${item.confidence === 'low' ? 'opacity-60 border-dashed' : ''}`}
```

Update `handleNext` to rebuild `OnboardingResult` from the edited state. The `useEditableList` hook tracks which items are included. Map the included items back to `OnboardingResult` format:

```typescript
const handleNext = () => {
  const filteredResult: OnboardingResult = {
    initiatives: initiativeItems
      .filter(i => i.included)
      .map(i => ({
        name: i.name,
        dimension: i.dimension,
        horizon: i.horizon,
        description: i.description,
        confidence: i.confidence,
        reasoning: i.reasoning,
        effectNames: i.effectNames,
      })),
    effects: effectItems
      .filter(e => e.included)
      .map(e => ({
        name: e.name,
        type: e.type,
        description: e.description,
        confidence: e.confidence,
      })),
    insights: onboardingResult?.insights ?? [],
  };
  setOnboardingResult(filteredResult);
  nextStep();
};
```

The `useEditableList` items need to carry the extra fields (`confidence`, `reasoning`, `effectNames` for initiatives; `confidence` for effects). The simplest approach: pass the full `OnboardingInitiative`/`OnboardingEffect` objects to `useEditableList` and spread the extra fields back when rebuilding.

Add a legend at the top:
```tsx
<div className="flex items-center gap-4 text-[10px] text-text-tertiary mb-3">
  <span>{t('onboarding.generated.confident')}</span>
  <span className="opacity-60 border-b border-dashed border-text-tertiary">{t('onboarding.generated.suggested')}</span>
</div>
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/StepGenerated.tsx
git commit -m "feat: update StepGenerated for initiatives + effects only with confidence markers"
```

---

### Task 10: Update StepInsights

**Files:**
- Modify: `src/components/onboarding/StepInsights.tsx`

- [ ] **Step 1: Update to use OnboardingResult**

Read the current file. Changes:

1. Replace `generatedPicture` references with `onboardingResult` from the store
2. Remove the capabilities count stat block entirely (currently shows `capabilities.length`)
3. Adjust the stats grid from 3 columns to 2 (initiatives count + dimensions count)
4. Add a "Next step" prompt below the stats:
```tsx
<p className="text-[11px] text-primary font-medium mt-3">
  {t('onboarding.generated.nextStepCapabilities')}
</p>
```
5. Keep dimension distribution chart (works the same — uses `initiatives` which are in `OnboardingResult`)
6. Keep insights display (`OnboardingResult` still has `insights[]`)
7. Remove any references to `generatedPicture.capabilities` or `generatedPicture.strategies`

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/StepInsights.tsx
git commit -m "feat: update StepInsights for initiative-focused onboarding"
```

---

### Task 11: Update OnboardingWizard — new step + convertToAppState

**Files:**
- Modify: `src/components/onboarding/OnboardingWizard.tsx`

- [ ] **Step 1: Add StepAnalysis to wizard and update convertToAppState**

Read the current file. Changes:

1. Add import:
```typescript
import { StepAnalysis } from './StepAnalysis';
import type { OnboardingResult } from '../../lib/ai/frameworks/onboardingFramework';
```

2. Update `convertToAppState` to accept `OnboardingResult` instead of `GeneratedStrategicPicture`:
```typescript
function convertToAppState(result: OnboardingResult): Partial<AppState> {
  const scenarioId = crypto.randomUUID();

  const initiatives: Initiative[] = result.initiatives.map((init, order) => ({
    id: crypto.randomUUID(),
    name: init.name,
    dimension: init.dimension,
    horizon: init.horizon,
    order,
    description: init.description,
    capabilities: [],
    owner: '',
    dependsOn: [],
    maturityEffect: {},
    notes: '',
    valueChains: [],
  }));

  const effects: Effect[] = result.effects.map((e, order) => ({
    id: crypto.randomUUID(),
    name: e.name,
    description: e.description,
    type: e.type,
    capabilities: [],
    initiatives: [],
    order,
  }));

  const scenario: Scenario = {
    id: scenarioId,
    name: 'Hovedscenario',
    color: '#6366f1',
  };

  return {
    strategies: [],
    capabilities: [],
    scenarios: [scenario],
    scenarioStates: { [scenarioId]: { initiatives } },
    activeScenario: scenarioId,
    effects,
    milestones: [],
    valueChains: [],
    modules: { roadmap: true, capabilities: true, effects: true },
  };
}
```

3. Update `steps` array to include 5 steps:
```typescript
const steps = [
  { label: t('onboarding.stepWelcome') },
  { label: t('onboarding.upload.title') },
  { label: t('onboarding.analysis.title') },
  { label: t('onboarding.generated.title') },
  { label: t('onboarding.insights.title') },
];
```

4. Update `renderStep`:
```typescript
const renderStep = () => {
  switch (step) {
    case 0: return <StepWelcome />;
    case 1: return <StepUpload />;
    case 2: return <StepAnalysis />;
    case 3: return <StepGenerated />;
    case 4: return <StepInsights onComplete={handleComplete} />;
    default: return <StepWelcome />;
  }
};
```

5. Update `handleComplete` to use `onboardingResult`:
```typescript
const handleComplete = () => {
  if (onboardingResult) {
    const appState = convertToAppState(onboardingResult);
    importState(appState);
    setComplexityLevel(1);
    setModules({ roadmap: true, capabilities: true, effects: true });
  }
  completeOnboarding();
};
```

6. Update store destructuring to use `onboardingResult` instead of `generatedPicture`.

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: Clean build — all references to old store fields should now be resolved.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/OnboardingWizard.tsx
git commit -m "feat: add analysis step to wizard, update convertToAppState for OnboardingResult"
```

---

### Task 12: Cleanup and compatibility fixes

**Files:**
- Modify: `src/lib/ai/generateStrategicPicture.ts`
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Add missing `common.select` i18n key**

In `nb.json`, add to the `"common"` section:
```json
"select": "Velg"
```

In `en.json`, add to the `"common"` section:
```json
"select": "Select"
```

- [ ] **Step 2: Deprecate client-side `generateStrategicPicture` for onboarding**

The `generateStrategicPicture.ts` file's proxy mode is no longer used by onboarding (StepAnalysis calls the Edge Function directly). The file is still used by the direct API key mode and potentially other features.

Mark the old `GeneratedStrategicPicture` interface and `SYSTEM_PROMPT` as deprecated with comments. Do NOT delete them — they may be used by the direct API key fallback or chat features.

```typescript
/** @deprecated Use OnboardingResult for onboarding flow. Kept for direct API key mode. */
```

Remove the `systemPrompt` parameter from the proxy mode's request body (the Edge Function now uses its own server-side prompt):
```typescript
body: JSON.stringify({ input, industry, orgSize, findings, answers }),
```

- [ ] **Step 3: Remove API key UI from StepUpload**

Since the analysis and generation flow now requires authentication (Edge Functions), the API key input section in StepUpload is no longer needed. Remove the entire `{!isAuthenticated && !getApiKey() && (...)}` block and related state (`apiKeyInput`, `persistKey`).

Unauthenticated users are redirected to `/login` by `RequireAuth`, so they never reach StepUpload. The API key imports (`getApiKey`, `setApiKey`) can also be removed.

- [ ] **Step 4: Check for test files**

```bash
find src/ -name "*.test.*" | head -20
```

If `generateStrategicPicture.test.ts` or similar exists, update or remove it to match the new interfaces.

- [ ] **Step 5: Extract shared input-building logic**

The input-building logic (totalBudget, fileBudget, file parts assembly) is duplicated in StepUpload and StepAnalysis. Extract it into a shared utility:

Create or add to `src/lib/ai/analyzeInput.ts`:
```typescript
export function buildOnboardingInput(
  uploadedFiles: Array<{ name: string; text: string }>,
  orgDescription: string,
): string {
  const totalBudget = 150_000;
  const descText = orgDescription.trim();
  const descBudget = Math.min(descText.length, 10_000);
  const fileBudget = uploadedFiles.length > 0
    ? Math.floor((totalBudget - descBudget) / uploadedFiles.length)
    : 0;

  const fileParts = uploadedFiles
    .map(f => `--- [${f.name}] ---\n${f.text.slice(0, fileBudget)}`)
    .join('\n\n');
  const descPart = descText
    ? `--- Organisasjonsbeskrivelse ---\n${descText.slice(0, descBudget)}`
    : '';
  return [fileParts, descPart].filter(Boolean).join('\n\n');
}
```

Update both StepUpload and StepAnalysis to use `buildOnboardingInput(uploadedFiles, orgDescription)` instead of inline budget calculation.

- [ ] **Step 6: Build and verify**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix: cleanup deprecated interfaces, remove API key UI, extract shared utilities"
```

---

## Verification Checklist

After all tasks are complete:

1. `npm run build` → clean
2. Upload a strategy document → AI identifies initiatives and effects with confidence scores
3. AI asks 1-3 relevant follow-up questions based on gaps
4. User answers → generation produces more specific results than without answers
5. Skip questions → generation still works but with more "suggested" (low-confidence) elements
6. Generated elements show confidence visually (opacity + dashed border)
7. Industry/size dropdowns work and values are sent to AI
8. StepInsights shows dimension distribution and insights (no capability count)
9. Result is recognizably specific to the organization described
10. Deploy Edge Functions: `npx supabase functions deploy`
