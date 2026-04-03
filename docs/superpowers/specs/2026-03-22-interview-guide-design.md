# Interview Guide + Continuous Advisor

**Date:** 2026-03-22
**Status:** Draft
**Phase:** 2 of 3 (Auth ✅ → Interview guide → Data collection)

## Problem

The current onboarding generates a strategic picture in one shot from uploaded documents. The results are generic because:
1. Documents contain strategic vision but rarely the tactical layer (initiatives, effects, operational reality)
2. The AI has no way to ask for clarification — it guesses when uncertain
3. There is no quality gate — the AI generates everything regardless of confidence

This destroys trust on first impression. Since the onboarding IS the product demo, it must produce results specific enough that users recognize their own organization.

## Solution

Two-part design:
1. **Interview guide in onboarding** — adaptive questions that fill gaps in the uploaded documents, generating only what the AI is confident about
2. **Continuous advisor** — diagnostic questions that surface insights over time as the user works with the tool

These are separate features with different implementation timelines, but share the same AI framework.

## Research Foundation

Design informed by:
- **Donald Sull (MIT):** The bottleneck is cross-functional coordination, not vertical alignment
- **Roger Martin (Rotman):** Strategy and execution are inseparable — choices happen at every level
- **Rita McGrath (Columbia):** Build initiatives around testable assumptions, not fixed goals
- **Planview 2025:** Organizations that outperform build "systematic adaptability" — proactive adjustment through established processes
- **McKinsey 2025:** 20-30% of strategic potential lost due to operating model misalignment
- **CADAP Framework (2024):** Five dimensions — Capability, Agility, Design, Alignment, People

Key insight: The value is not in listing initiatives and effects — it's in surfacing patterns the user hasn't articulated: dimension imbalance, missing coordination, untested assumptions, capacity vs. absorption gaps.

---

## Part 1: Interview Guide in Onboarding

### Flow

**Step 1: Input (unchanged, with better guidance)**

Upload documents and/or write a description. Drop zone shows document guidance:

> **Documents that give the best results:**
> Strategy plans, business plans, board presentations, annual reports, initiative lists

Plus two new dropdown fields (not in codebase today — must be added to `StepUpload.tsx` and `useOnboardingStore.ts`):
- **Industry/sector:** offentlig forvaltning, helse, finans, teknologi, industri/produksjon, handel/retail, utdanning, annet (fritekst)
- **Size:** <50, 50-200, 200-1000, 1000-5000, 5000+

**Step 2: Analysis (new — first AI call)**

AI reads all input and returns:
- Summary of what it found: "We identified 7 possible initiatives and 3 effect targets"
- Confidence assessment per finding (internal — drives question selection)
- 1-3 follow-up questions, only where the AI cannot produce recognizable results
- Progress indicator: "3 questions will significantly improve the result"

The AI applies a **recognizability test**: "Is what I'm about to generate specific enough that the user will recognize their organization?" If not — ask rather than guess.

Questions are multiple choice with context-adapted alternatives, plus a free-text option. Example:

> "You mention digitalization — is this primarily about:
> a) Citizen-facing services (applications, self-service)
> b) Internal processes (case management, archive)
> c) Health and care services
> d) Something else"

The user can skip: "Generate now" is always available.

**Step 3: Generation (focused — second AI call)**

AI generates **only initiatives and effects** — not the full framework. Capabilities, strategies, and scenarios come later inside the tool.

Each element is visually marked with confidence:
- Full opacity = based on documents/answers (the AI is confident)
- Reduced opacity + dashed border = suggested, needs confirmation

The user reviews, confirms, edits, or removes elements.

**Step 4: Enter the tool**

User completes onboarding. Cairn suggests next step: "Shall we suggest capabilities based on your initiatives?"

### What the analysis AI call must do

The first AI call receives all input (documents + description + industry + size) and must:

1. **Extract** initiatives and effects it finds in the documents
2. **Assess confidence** per finding — is this specific or generic?
3. **Apply the recognizability test** — would a person from this organization recognize this?
4. **Identify gaps** — what's missing that's needed for a credible result?
5. **Generate questions** — only for gaps, maximum 3, multiple choice with context-adapted alternatives
6. **Summarize** what it found for the user

Returns a structured JSON response:

```typescript
interface AnalysisResult {
  summary: string; // "We found 7 initiatives and 3 effect targets in your documents"
  findings: Finding[];
  questions: Question[];
  readiness: number; // 0-100, how ready we are to generate
}

interface Finding {
  text: string; // "Digitalisering av innbyggertjenester"
  type: 'initiative' | 'effect' | 'strategy';
  confidence: 'high' | 'medium' | 'low';
  source: string; // "strategiplan.pdf, side 12" or "user description"
}

interface Question {
  id: string;
  text: string; // The question
  context: string; // Why we're asking — what we found that triggered this
  options: string[]; // Multiple choice alternatives
  allowFreeText: boolean;
}
```

### What the generation AI call must do

The second AI call receives: original input + analysis findings + user answers to questions (if any — user may have skipped). It must:

1. Generate initiatives with effect linkages
2. Distribute across dimensions (ledelse, virksomhet, organisasjon, teknologi)
3. Mark each element with confidence level
4. Only generate what it's confident about — leave gaps rather than guess
5. Provide brief reasoning for each element (traceable to source)

Returns a focused type (replaces the current `GeneratedStrategicPicture` for onboarding):

```typescript
interface OnboardingResult {
  initiatives: Array<{
    name: string;
    dimension: DimensionKey;
    horizon: 'near' | 'far';
    description: string;
    confidence: 'high' | 'low';
    reasoning: string; // "Based on strategy document section 3.2"
    effectNames: string[]; // Links to effects by name
  }>;
  effects: Array<{
    name: string;
    type: EffectType;
    description: string;
    confidence: 'high' | 'low';
  }>;
  insights: string[]; // 2-4 observations in Norwegian
}
```

**Downstream impact:** `convertToAppState()` in `OnboardingWizard.tsx` must be updated to work with `OnboardingResult` instead of `GeneratedStrategicPicture`. It will create a minimal AppState with initiatives and effects only. Strategies and capabilities are empty — the tool will prompt the user to build them after onboarding.

**StepGenerated.tsx** must be updated to only show initiatives and effects (not strategies/capabilities sections). The confidence field drives the opacity/dashed-border visualization.

**StepInsights.tsx** continues to work — it shows dimension distribution (still relevant with initiatives only) and AI insights. Capability count is removed or replaced with "Next step: build your capability map."

### AI framework for question generation

The AI is guided by a framework with clear rules:

**Information layer (what to extract):**
- Strategic direction: what are the overarching goals?
- Tactical initiatives: what binds strategy to operations?
- Desired effects: what should the initiatives achieve?

**Quality gates (when to ask):**
- Recognizability: "Could this be any organization?" → ask for specifics
- Coverage: "Only technology initiatives found" → ask about other dimensions
- Consistency: "Effect doesn't match initiative" → ask for clarification
- Completeness: "Fewer than 5 initiatives found" → ask what else is happening

**Rules:**
- Never guess. All uncertainty becomes a question.
- Maximum 3 questions per round. Prioritize by impact on result quality.
- Multiple choice preferred. Free-text as last option.
- Questions must reference what was found in the documents — never generic.

---

## Part 2: Continuous Advisor (future feature, architecture now)

### Concept

After onboarding, a diagnostic engine observes the data and surfaces insights contextually. Never intrusive — one insight at a time, always relevant.

### Diagnostic dimensions (from research)

1. **Dimension balance** — are initiatives distributed across leadership, business, organization, technology?
2. **Cross-functional coordination** (Sull) — do initiatives cross silos? Who coordinates?
3. **Absorption capacity** — can the organization absorb the change it's planning?
4. **Prioritization** — what has been stopped/deprioritized? Is there too much in flight?
5. **Assumptions** (McGrath) — what untested assumptions underpin the strategy?
6. **Operating model fit** (McKinsey) — does the structure support or fight the strategy?

### Presentation

- Appears as a subtle insight notification in the tool
- User clicks, sees an observation + one question
- The answer improves the data and may trigger new insights
- Never more than one active at a time
- Each insight references specific data in the user's strategic picture

### Example triggers

- "9 of 10 initiatives are technology. Who owns the organizational changes needed for adoption?"
- "3 initiatives have no linked effects. What are they meant to achieve?"
- "You have 14 parallel initiatives. What have you stopped in the last year to make room?"
- "4 initiatives cross business areas. Who coordinates across the silos?"
- "The digitalization initiative assumes the organization can absorb the change. Have you assessed readiness?"

### Data model consideration

Insights and user responses should be stored for:
- Improving the diagnostic engine over time
- Anonymized research data (Phase 3, with consent)
- Tracking which questions produce the most valuable responses

---

## Implementation scope

### Build now (Phase 2)
- Interview guide in onboarding (Steps 1-4)
- Two AI calls (analysis + generation)
- Confidence visualization (opacity + dashed border)
- AI framework/prompt for question generation

### Build later
- Continuous advisor engine
- Diagnostic dimensions
- Insight storage and learning

### Architecture decisions
- The AI framework (prompt + rules) lives in a dedicated file, not inline in components — it's the product's IP and must be maintainable
- Analysis and generation are separate Edge Functions (not one combined call)
- Question/answer pairs are structured data, not free text — enables future analysis

## Wizard step changes

Current: 4 steps (0-3): Welcome → Upload → Generated → Insights
New: 5 steps (0-4): Welcome → Upload → **Analysis** → Generated → Insights

`useOnboardingStore.ts` must update:
- `nextStep`: change `Math.min(s.step + 1, 3)` to `Math.min(s.step + 1, 4)`
- `prevStep`: unchanged (already `Math.max(s.step - 1, 0)`)
- Step comment: update to reflect new numbering
- New state: `analysisResult: AnalysisResult | null`, `analysisAnswers: Record<string, string>`

## Rate limiting

The analysis call is lighter (shorter response, no generation) but still costs tokens. Strategy:
- Analysis call does NOT count against the 10/day generation limit
- Analysis call has its own limit: 20/day (allows experimentation with different documents)
- Only the generation call counts against `generation_log`

## Error handling for analysis step

- **Analysis call fails (network/timeout):** Show error with retry button. User can also skip directly to generation (falls back to current single-shot behavior).
- **Analysis returns zero findings:** Show message: "We couldn't extract specific initiatives from the documents. You can add a description to help, or proceed and we'll generate suggestions based on your industry." Proceed button goes to generation with low-confidence results.
- **Analysis times out (>30s):** Same as network failure — retry or skip.
- **User closes wizard during analysis:** State is preserved in store. Reopening resumes from the analysis step.

## System prompt location

The AI framework prompt should live server-side in the Edge Functions, not sent from the client. This protects the IP (prompt engineering is visible in network requests if sent from client). The client sends structured data (documents, industry, size, answers), and the Edge Function adds the system prompt.

## Files to create/modify

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/ai/analyzeInput.ts` | Create | First AI call: send input to Edge Function, parse response |
| `src/lib/ai/frameworks/onboardingFramework.ts` | Create | TypeScript interfaces for AnalysisResult, Finding, Question, OnboardingResult |
| `supabase/functions/analyze-input/index.ts` | Create | Edge Function for analysis (includes system prompt server-side) |
| `supabase/functions/generate-strategic-picture/index.ts` | Modify | Accept analysis context + answers, use OnboardingResult schema |
| `src/components/onboarding/StepAnalysis.tsx` | Create | New onboarding step: shows findings + questions |
| `src/components/onboarding/StepUpload.tsx` | Modify | Add industry/size dropdowns, remove inline generation, pass to analysis step |
| `src/components/onboarding/StepGenerated.tsx` | Modify | Show only initiatives + effects, add confidence visualization |
| `src/components/onboarding/StepInsights.tsx` | Modify | Remove capability count, add "next step: build capability map" |
| `src/components/onboarding/OnboardingWizard.tsx` | Modify | Add analysis step, update convertToAppState for OnboardingResult |
| `src/stores/useOnboardingStore.ts` | Modify | Add analysis state, update step bounds (max 4), add industry/orgSize |
| `src/i18n/locales/nb.json` | Modify | Add analysis step i18n keys |
| `src/i18n/locales/en.json` | Modify | Add analysis step i18n keys |

## Verification

1. Upload a strategy document → AI identifies initiatives and effects with confidence scores
2. AI asks 1-3 relevant follow-up questions based on gaps
3. User answers → generation produces more specific results than without answers
4. Skip questions → generation still works but with more "suggested" (low-confidence) elements
5. Generated elements show confidence visually (opacity)
6. Result is recognizably specific to the organization described
7. `npm run build` → clean
