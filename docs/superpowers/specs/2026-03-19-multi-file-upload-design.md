# Multi-file Upload in Onboarding

**Date:** 2026-03-19
**Status:** Draft

## Problem

The onboarding wizard's "Get started" step accepts only a single file OR a text description. Users with multiple source documents (e.g. strategy doc + org chart + budget) must choose one. This limits the AI's ability to generate a complete, organisation-specific strategic picture.

## Design

### Summary

Allow uploading multiple files **and** an optional text description. All sources are concatenated into a single AI input string. A soft warning appears when total text is large.

### Store changes (`useOnboardingStore.ts`)

Replace `uploadedText: string` with:

```typescript
uploadedFiles: Array<{ name: string; text: string }>
```

Replace `setUploadedText` with:

```typescript
addUploadedFiles: (files: Array<{ name: string; text: string }>) => void
removeUploadedFile: (name: string) => void
```

- `addUploadedFiles` appends to the array (supports both drop and click-to-add). If a file with the same name already exists, it is replaced (deduplicated).
- `removeUploadedFile` removes by filename (deduplication on add ensures names are unique)
- `reset()` clears `uploadedFiles` to `[]`
- `orgDescription` remains unchanged
- Remove the `fileName` local state variable from `StepUpload.tsx` — no longer needed since the file list comes from the store.

### UI changes (`StepUpload.tsx`)

**Drop zone:**
- Add `multiple` attribute to the file input
- `handleDrop` iterates all files in `e.dataTransfer.files`
- `handleFileChange` iterates all files in `e.target.files`
- Each file is parsed via `extractTextFromFile()` and added to the store
- Drop zone always shows the upload prompt (no single-file preview replacing it)
- Maximum 10 files. If the user tries to add more, show an error. Individual file size is not capped (browser memory is the natural limit for the supported document types).
- **Partial failure handling:** If some files in a batch fail to parse, add the successful ones and show an error naming the failed file(s), e.g. "Kunne ikke lese budget.pptx".

**File list:**
- Rendered below the drop zone when `uploadedFiles.length > 0`
- Each entry: filename + remove button (X)
- Simple list, no individual text previews

**Remove the "ELLER" divider.** The textarea sits below the file list with a label: "Tilleggsbeskrivelse (valgfritt)".

**Soft warning:**
- When total character count across all files + orgDescription exceeds 30 000 characters, show an inline warning: "Mye tekst — AI-en kan gi mindre fokuserte resultater."
- Warning is informational only, does not block generation.

**Remove the text preview block** (the `uploadedText && (...)` section showing first 500 chars). The file list replaces this.

### Input assembly (`StepUpload.tsx` → `handleGenerate`)

**Behavioral change:** Previously, `uploadedText || orgDescription` meant only one source was sent. Now **all sources are combined** — files and description are additive, not alternatives. This gives the AI richer context.

Build a single string from all sources:

```
--- [filename1.pdf] ---
<extracted text from file 1>

--- [filename2.docx] ---
<extracted text from file 2>

--- Organisasjonsbeskrivelse ---
<org description text>
```

Sections with empty content are omitted. The `orgDescription` section is only included if non-empty.

### Enable condition

Generate button enabled when: at least one file uploaded OR orgDescription is non-empty (same logic as today, adapted for array).

### What doesn't change

- `documentParser.ts` — called per file, no changes needed
- `generateStrategicPicture.ts` — receives a single string, no changes
- `OnboardingWizard.tsx` / `convertToAppState()` — no changes
- `StepGenerated.tsx` / `StepInsights.tsx` — no changes

## Files to modify

| File | Change |
|------|--------|
| `src/stores/useOnboardingStore.ts` | Replace `uploadedText` with `uploadedFiles` array + new methods |
| `src/components/onboarding/StepUpload.tsx` | Multi-file handling, file list UI, remove divider, soft warning |

## i18n keys to add

- `onboarding.upload.additionalDescription` — "Tilleggsbeskrivelse (valgfritt)"
- `onboarding.upload.tooMuchText` — soft warning message
- `onboarding.upload.removeFile` — aria label for remove button
- `onboarding.upload.fileError` — per-file parse error, e.g. "Kunne ikke lese {{filename}}"
- `onboarding.upload.tooManyFiles` — max file count reached

## Verification

1. Upload multiple files → all appear in file list
2. Remove a file → disappears from list
3. Upload files + add description → both included in AI input
4. Upload >30k chars of text → soft warning shown
5. Generate with files only → works
6. Generate with description only → works
7. `npx tsc -b` → clean build
