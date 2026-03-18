# Plan 3: Levende Møtemodus

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the slide-based presentation mode with a live, interactive meeting mode optimized for large screens and leadership group discussions. Three navigable "lenses" (Path, Capabilities, Effects) with a narrative opening.

**Architecture:** The existing `PresentationMode` component is refactored into a new `MeetingMode` component with three lens views instead of 8 slides. The narrative engine provides the opening. PowerPoint export is preserved as a secondary action. The old slide-based mode is replaced, not kept alongside.

**Tech Stack:** React 19 / TypeScript / Zustand / react-i18next

**Spec:** `docs/superpowers/specs/2026-03-18-cairn-improvement-design.md` section 4

**Depends on:** Plan 2 (narrative engine enhancements) — but can start independently using existing narrative engine.

---

## File Structure

### New Files
- `src/components/meeting/MeetingMode.tsx` — Main meeting mode container with lens navigation
- `src/components/meeting/MeetingNav.tsx` — Bottom or top nav bar for lens switching
- `src/components/meeting/NarrativeOpening.tsx` — Auto-generated strategic reading as meeting opener
- `src/components/meeting/LensPath.tsx` — Strategy Path lens (simplified, large-format)
- `src/components/meeting/LensCapabilities.tsx` — Capabilities lens (maturity overview, large cards)
- `src/components/meeting/LensEffects.tsx` — Effects lens (effect chain visualization)

### Modified Files
- `src/stores/useStore.ts` — Replace `presentationMode` + `presentationSlide` with `meetingMode` + `meetingLens`
- `src/types/index.ts` — Add `MeetingLens` type
- `src/App.tsx` — Replace PresentationMode rendering with MeetingMode
- `src/components/header/HeaderMenu.tsx` — Update presentation button to "Meeting mode"
- `src/i18n/locales/en.json` — New keys
- `src/i18n/locales/nb.json` — New keys

### Preserved (not deleted)
- `src/components/presentation/PresentationMode.tsx` — Keep as fallback, but not default. Can be removed later.
- `src/lib/exportPptx.ts` — PowerPoint export stays, moved to secondary action in settings/export

---

## Task 1: Add Meeting Mode Types and Store

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/stores/useStore.ts`

- [ ] **Step 1: Add types**

In `src/types/index.ts`:

```typescript
export type MeetingLens = 'narrative' | 'path' | 'capabilities' | 'effects';
```

- [ ] **Step 2: Update store**

In `src/stores/useStore.ts`, add to `UIState`:

```typescript
meetingMode: boolean;
meetingLens: MeetingLens;
```

Default values:
```typescript
meetingMode: false,
meetingLens: 'narrative',
```

Add actions:
```typescript
enterMeetingMode: () => set(state => ({
  ui: { ...state.ui, meetingMode: true, meetingLens: 'narrative' }
})),
exitMeetingMode: () => set(state => ({
  ui: { ...state.ui, meetingMode: false }
})),
setMeetingLens: (lens: MeetingLens) => set(state => ({
  ui: { ...state.ui, meetingLens: lens }
})),
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/stores/useStore.ts
git commit -m "feat: add meeting mode types and store actions"
```

---

## Task 2: Narrative Opening Component

**Files:**
- Create: `src/components/meeting/NarrativeOpening.tsx`

- [ ] **Step 1: Implement NarrativeOpening**

```typescript
// src/components/meeting/NarrativeOpening.tsx
// Full-screen opening slide for meetings
// Shows:
//   - Cairn logo (subtle, top-left)
//   - Auto-generated narrative from narrativeEngine (large serif text, centered)
//   - Supporting stats bar at bottom: Initiatives | Near/Far | Capabilities | Dimensions
//   - "Since last snapshot" delta indicators if snapshot exists
//   - Subtle "Click anywhere or press → to continue" hint
//
// Styling:
//   - Dark background (#0f172a)
//   - Large text (24-32px, Instrument Serif)
//   - Narrative split into sentences, each on its own line
//   - Stats in smaller sans-serif at bottom
//   - Readable from 3+ meters
```

Uses `generateNarrative()` from `src/lib/narrativeEngine.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/components/meeting/NarrativeOpening.tsx
git commit -m "feat: add narrative opening component for meeting mode"
```

---

## Task 3: Lens Components

**Files:**
- Create: `src/components/meeting/LensPath.tsx`
- Create: `src/components/meeting/LensCapabilities.tsx`
- Create: `src/components/meeting/LensEffects.tsx`

- [ ] **Step 1: Implement LensPath**

```typescript
// src/components/meeting/LensPath.tsx
// Simplified Strategy Path view for large screens
// Based on existing Roadmap component but:
//   - No drag-and-drop (read-only)
//   - No edit buttons, no add buttons
//   - Larger cards (text readable at 3m)
//   - Click an initiative → highlight its dependencies and capability links
//   - Simple dimension filter (4 color buttons at top)
//   - No horizon toggle — show both near and far
//   - Dimension colors more saturated/contrastive
```

Reuse data selectors from existing Roadmap but render in simplified layout.

- [ ] **Step 2: Implement LensCapabilities**

```typescript
// src/components/meeting/LensCapabilities.tsx
// Large-format capability overview
// Based on CapabilityLandscape but:
//   - Read-only (no drag, no edit)
//   - Larger cards with clear maturity indicators
//   - Color-coded: green (3), yellow (2), red (1)
//   - Show linked initiative count per capability
//   - Click capability → show linked initiatives in a panel
//   - Simple layout: 2-3 columns of L1 domains, L2 nested below
```

- [ ] **Step 3: Implement LensEffects**

```typescript
// src/components/meeting/LensEffects.tsx
// Effect chain visualization for meetings
// Shows:
//   - Effects grouped by type (cost, quality, speed, compliance, strategic)
//   - Each effect shows: name, linked initiatives count, baseline → target
//   - Visual connection lines: initiative → capability → effect
//   - Click an effect → highlight its chain
//   - Large cards, dark theme, readable at distance
```

- [ ] **Step 4: Commit**

```bash
git add src/components/meeting/LensPath.tsx src/components/meeting/LensCapabilities.tsx src/components/meeting/LensEffects.tsx
git commit -m "feat: add three lens components for meeting mode"
```

---

## Task 4: Meeting Navigation Bar

**Files:**
- Create: `src/components/meeting/MeetingNav.tsx`

- [ ] **Step 1: Implement MeetingNav**

```typescript
// src/components/meeting/MeetingNav.tsx
// Fixed bottom bar for lens switching in meeting mode
// Layout:
//   - Left: Cairn logo + "Meeting Mode" label
//   - Center: 4 lens buttons (Narrative | Path | Capabilities | Effects)
//     - Active lens has accent indicator (indigo underline)
//     - Each button: icon + short label
//   - Right: Exit button (×) + secondary "Export" dropdown
//
// Keyboard navigation:
//   - ← → arrows: switch between lenses
//   - Escape: exit meeting mode
//   - 1/2/3/4: jump to specific lens
//
// Styling:
//   - Semi-transparent dark background with blur
//   - Large touch targets (48px min)
//   - Auto-hide after 5 seconds of inactivity, show on mouse move
```

- [ ] **Step 2: Commit**

```bash
git add src/components/meeting/MeetingNav.tsx
git commit -m "feat: add meeting navigation bar with lens switching"
```

---

## Task 5: Main MeetingMode Container

**Files:**
- Create: `src/components/meeting/MeetingMode.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/header/HeaderMenu.tsx`

- [ ] **Step 1: Implement MeetingMode**

```typescript
// src/components/meeting/MeetingMode.tsx
// Full-screen overlay that replaces the normal app view
// Renders current lens based on store.ui.meetingLens:
//   'narrative' → NarrativeOpening
//   'path' → LensPath
//   'capabilities' → LensCapabilities
//   'effects' → LensEffects
// Fixed MeetingNav at bottom
// Keyboard event listener for navigation
// CSS: position fixed, inset 0, z-index 50, dark background
```

- [ ] **Step 2: Update App.tsx**

In `src/App.tsx`, add meeting mode rendering:

```typescript
const meetingMode = useStore(s => s.ui.meetingMode);

// At top level, before normal content:
{meetingMode && <MeetingMode />}
```

- [ ] **Step 3: Update header button**

In the header area of `App.tsx` or `HeaderMenu.tsx`, change the presentation mode button:

```typescript
// Replace:
onClick={() => setPresentationMode(true)}
// With:
onClick={() => enterMeetingMode()}
```

Keep old presentation mode accessible from HeaderMenu as "Classic slides" or similar.

- [ ] **Step 4: Add translations**

```json
"meeting": {
  "title": "Meeting Mode",
  "narrative": "Strategic Reading",
  "path": "The Path",
  "capabilities": "Capabilities",
  "effects": "Effects",
  "exit": "Exit",
  "export": "Export to PowerPoint",
  "autoHideHint": "Move mouse to show navigation"
}
```

Norwegian:
```json
"meeting": {
  "title": "Møtemodus",
  "narrative": "Strategisk lesning",
  "path": "Stien",
  "capabilities": "Evnene",
  "effects": "Effektene",
  "exit": "Avslutt",
  "export": "Eksporter til PowerPoint",
  "autoHideHint": "Beveg musen for å vise navigasjon"
}
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Build succeeds

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/components/meeting/ src/App.tsx src/components/header/HeaderMenu.tsx src/i18n/locales/en.json src/i18n/locales/nb.json
git commit -m "feat: add complete meeting mode with narrative opening and three lenses"
```
