# Multi-file Upload Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow uploading multiple files and an optional text description in the onboarding wizard, combining all sources as AI input.

**Architecture:** Replace the single `uploadedText: string` in the onboarding store with an `uploadedFiles` array. Update StepUpload to handle multiple files with a file list UI, remove the "ELLER" divider, and concatenate all sources into one AI input string.

**Tech Stack:** React, Zustand, TypeScript, react-i18next

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/stores/useOnboardingStore.ts` | Modify | Replace `uploadedText` with `uploadedFiles` array + new methods |
| `src/components/onboarding/StepUpload.tsx` | Modify | Multi-file drop/select, file list UI, input assembly, soft warning |
| `src/i18n/locales/nb.json` | Modify | Add new Norwegian i18n keys |
| `src/i18n/locales/en.json` | Modify | Add new English i18n keys |

---

### Task 1: Update onboarding store

**Files:**
- Modify: `src/stores/useOnboardingStore.ts`

- [ ] **Step 1: Replace `uploadedText` with `uploadedFiles` in the interface**

In `OnboardingState` interface (line 4-25), replace:
```typescript
  uploadedText: string;
```
with:
```typescript
  uploadedFiles: Array<{ name: string; text: string }>;
```

Replace:
```typescript
  setUploadedText: (text: string) => void;
```
with:
```typescript
  addUploadedFiles: (files: Array<{ name: string; text: string }>) => void;
  removeUploadedFile: (name: string) => void;
```

- [ ] **Step 2: Update the store implementation**

Replace initial state `uploadedText: '',` (line 31) with:
```typescript
  uploadedFiles: [],
```

Replace `setUploadedText: (uploadedText) => set({ uploadedText }),` (line 42) with:
```typescript
  addUploadedFiles: (files) => set((s) => {
    const updated = [...s.uploadedFiles];
    for (const file of files) {
      const idx = updated.findIndex(f => f.name === file.name);
      if (idx >= 0) {
        updated[idx] = file;
      } else {
        updated.push(file);
      }
    }
    return { uploadedFiles: updated };
  }),
  removeUploadedFile: (name) => set((s) => ({
    uploadedFiles: s.uploadedFiles.filter(f => f.name !== name),
  })),
```

In `reset()` (line 50-53), replace `uploadedText: '',` with `uploadedFiles: [],`.

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | head -30`

Expected: TypeScript errors in StepUpload.tsx (references old `uploadedText`/`setUploadedText`). This is expected — we fix it in Task 2.

---

### Task 2: Add i18n keys

**Files:**
- Modify: `src/i18n/locales/nb.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Add Norwegian keys**

In `nb.json`, inside the `"onboarding" > "upload"` object, add these keys and remove the now-unused `"orDescribe"` and `"preview"` keys:
```json
"additionalDescription": "Tilleggsbeskrivelse (valgfritt)",
"tooMuchText": "Mye tekst — AI-en kan gi mindre fokuserte resultater.",
"removeFile": "Fjern fil",
"fileError": "Kunne ikke lese {{filename}}",
"tooManyFiles": "Maks 10 filer"
```

- [ ] **Step 2: Add English keys**

In `en.json`, inside the `"onboarding" > "upload"` object, add these keys and remove the now-unused `"orDescribe"` and `"preview"` keys:
```json
"additionalDescription": "Additional description (optional)",
"tooMuchText": "A lot of text — results may be less focused.",
"removeFile": "Remove file",
"fileError": "Could not read {{filename}}",
"tooManyFiles": "Maximum 10 files"
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/useOnboardingStore.ts src/i18n/locales/nb.json src/i18n/locales/en.json
git commit -m "feat: update onboarding store for multi-file upload and add i18n keys"
```

---

### Task 3: Update StepUpload component

**Files:**
- Modify: `src/components/onboarding/StepUpload.tsx`

- [ ] **Step 1: Update store bindings**

Replace the store destructuring (lines 10-22):
```typescript
  const {
    orgDescription,
    uploadedText,
    isGenerating,
    generationError,
    setOrgDescription,
    setUploadedText,
    setGeneratedPicture,
    setIsGenerating,
    setGenerationError,
    nextStep,
    prevStep,
  } = useOnboardingStore();
```
with:
```typescript
  const {
    orgDescription,
    uploadedFiles,
    isGenerating,
    generationError,
    setOrgDescription,
    addUploadedFiles,
    removeUploadedFile,
    setGeneratedPicture,
    setIsGenerating,
    setGenerationError,
    nextStep,
    prevStep,
  } = useOnboardingStore();
```

- [ ] **Step 2: Remove `fileName` state and update file processing**

Remove line 25:
```typescript
  const [fileName, setFileName] = useState<string | null>(null);
```

Replace `handleFileProcess` (lines 30-38) with:
```typescript
  const handleFilesProcess = useCallback(async (files: FileList) => {
    setGenerationError(null);
    const maxFiles = 10;
    const currentCount = useOnboardingStore.getState().uploadedFiles.length;
    const allowed = Array.from(files).slice(0, maxFiles - currentCount);

    if (allowed.length < files.length) {
      setGenerationError(t('onboarding.upload.tooManyFiles'));
    }

    const parsed: Array<{ name: string; text: string }> = [];
    const failed: string[] = [];

    for (const file of allowed) {
      try {
        const text = await extractTextFromFile(file);
        parsed.push({ name: file.name, text });
      } catch {
        failed.push(file.name);
      }
    }

    if (parsed.length > 0) {
      addUploadedFiles(parsed);
    }
    if (failed.length > 0) {
      setGenerationError(failed.map(f => t('onboarding.upload.fileError', { filename: f })).join(', '));
    }
  }, [addUploadedFiles, setGenerationError, t]);
```

- [ ] **Step 3: Update drop and file change handlers**

Replace `handleDrop` (lines 40-45) with:
```typescript
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFilesProcess(e.dataTransfer.files);
  }, [handleFilesProcess]);
```

Replace `handleFileChange` (lines 47-50) with:
```typescript
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFilesProcess(e.target.files);
  }, [handleFilesProcess]);
```

- [ ] **Step 4: Update `handleGenerate` input assembly**

Replace the input assembly in `handleGenerate` (lines 52-54):
```typescript
  const handleGenerate = async () => {
    const input = uploadedText || orgDescription;
    if (!input.trim()) return;
```
with:
```typescript
  const handleGenerate = async () => {
    const fileParts = uploadedFiles
      .map(f => `--- [${f.name}] ---\n${f.text}`)
      .join('\n\n');
    const descPart = orgDescription.trim()
      ? `--- Organisasjonsbeskrivelse ---\n${orgDescription.trim()}`
      : '';
    const input = [fileParts, descPart].filter(Boolean).join('\n\n');
    if (!input.trim()) return;
```

- [ ] **Step 5: Update `hasInput` check**

Replace line 80:
```typescript
  const hasInput = (uploadedText || orgDescription).trim().length > 0;
```
with:
```typescript
  const hasInput = uploadedFiles.length > 0 || orgDescription.trim().length > 0;
  const totalChars = uploadedFiles.reduce((sum, f) => sum + f.text.length, 0) + orgDescription.length;
```

- [ ] **Step 6: Update the JSX — drop zone, file list, textarea**

Replace everything from `{/* File drop zone */}` through `{/* Free text input */}` textarea (lines 90-155) with:

```tsx
      {/* File drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-surface-hover'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx,.pptx,.json,.csv"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>
            <p className="text-[12px] text-text-secondary">{t('onboarding.upload.dropzone')}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">{t('onboarding.upload.supported')}</p>
          </div>
        </div>
      </div>

      {/* Uploaded file list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-1">
          {uploadedFiles.map(f => (
            <div key={f.name} className="flex items-center justify-between bg-surface-hover rounded px-3 py-1.5">
              <span className="text-[11px] text-text-secondary truncate">{f.name}</span>
              <button
                onClick={() => removeUploadedFile(f.name)}
                className="ml-2 p-0.5 text-text-tertiary hover:text-red-500 transition-colors shrink-0"
                aria-label={t('onboarding.upload.removeFile')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Soft warning for large input */}
      {totalChars > 30000 && (
        <p className="text-[10px] text-amber-600">{t('onboarding.upload.tooMuchText')}</p>
      )}

      {/* Additional description */}
      <div>
        <label className="text-[10px] text-text-tertiary font-medium mb-1 block">
          {t('onboarding.upload.additionalDescription')}
        </label>
        <textarea
          value={orgDescription}
          onChange={(e) => setOrgDescription(e.target.value)}
          placeholder="Vi er en offentlig etat med 500 ansatte som jobber med..."
          rows={3}
          className="w-full px-3 py-2 text-[12px] border border-border rounded-lg focus:outline-none focus:border-primary resize-none bg-surface text-text-primary placeholder:text-text-tertiary"
        />
      </div>
```

This removes:
- The single-file name/preview inside the drop zone (always shows upload prompt now)
- The text preview block (`{/* Text preview */}`)
- The "ELLER" divider (`{/* OR divider */}`)

And adds:
- `multiple` on the file input
- File list with remove buttons
- Soft warning for >30k chars
- Label on the textarea

- [ ] **Step 7: Build and verify**

Run: `npm run build`

Expected: Clean build, no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/onboarding/StepUpload.tsx
git commit -m "feat: support multiple file uploads in onboarding wizard"
```

---

## Verification Checklist

After implementation, manually verify:

1. Upload multiple files via click → all appear in file list
2. Upload multiple files via drag-and-drop → all appear in file list
3. Remove a file via X button → disappears from list
4. Upload 11th file → "Maks 10 filer" error shown
5. Upload file with same name → replaces existing entry
6. Upload files + add description → both sent to AI
7. Upload >30k chars total → amber warning shown
8. Generate with files only → works
9. Generate with description only → works
10. `npm run build` → clean
