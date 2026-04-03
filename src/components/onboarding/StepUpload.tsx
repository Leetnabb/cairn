import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { extractTextFromFile } from '../../lib/documentParser';
import { generateStrategicPicture } from '../../lib/ai/generateStrategicPicture';
import { getApiKey, setApiKey } from '../../lib/ai/claude';
import { useAuth } from '../../providers/AuthProvider';

export function StepUpload() {
  const { t } = useTranslation();
  const { isAuthenticated, session } = useAuth();
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

  const [isDragging, setIsDragging] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [persistKey, setPersistKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFilesProcess(e.dataTransfer.files);
  }, [handleFilesProcess]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFilesProcess(e.target.files);
  }, [handleFilesProcess]);

  const handleGenerate = async () => {
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

    let key: string | undefined;
    if (!isAuthenticated) {
      key = getApiKey() ?? undefined;
      if (!key) {
        if (!apiKeyInput.trim()) {
          setGenerationError(t('onboarding.upload.needApiKey'));
          return;
        }
        key = apiKeyInput.trim();
        setApiKey(key, persistKey);
      }
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      let token = isAuthenticated ? session?.access_token : undefined;
      // Fallback: if session from context is stale, try getting it directly
      if (isAuthenticated && !token) {
        const { supabase } = await import('../../lib/supabase');
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = data.session?.access_token;
        }
      }
      const result = await generateStrategicPicture(input, token ?? key, undefined, !!token);
      setGeneratedPicture(result);
      nextStep();
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMIT') {
        setGenerationError(t('auth.rateLimitExceeded'));
      } else {
        setGenerationError(err instanceof Error ? err.message : t('onboarding.upload.error'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const hasInput = uploadedFiles.length > 0 || orgDescription.trim().length > 0;
  const totalChars = uploadedFiles.reduce((sum, f) => sum + f.text.length, 0) + orgDescription.length;
  const hasApiKey = isAuthenticated || !!getApiKey() || apiKeyInput.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold text-text-primary">{t('onboarding.upload.title')}</h2>
        <p className="text-[12px] text-text-secondary mt-1">{t('onboarding.upload.subtitle')}</p>
      </div>

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

      {/* API key input (shown if no key stored) */}
      {!isAuthenticated && !getApiKey() && (
        <div className="space-y-2">
          <label className="text-[10px] text-text-tertiary uppercase font-medium">
            {t('onboarding.upload.needApiKey')}
          </label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={t('onboarding.upload.apiKeyPlaceholder')}
            className="w-full px-3 py-2 text-[12px] border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary placeholder:text-text-tertiary"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={persistKey}
              onChange={(e) => setPersistKey(e.target.checked)}
              className="w-3 h-3 accent-primary"
            />
            <span className="text-[10px] text-text-tertiary">{t('onboarding.upload.persistKey')}</span>
          </label>
        </div>
      )}

      {/* Error message */}
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
          disabled={isGenerating || !hasInput || !hasApiKey}
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
            t('onboarding.upload.generate')
          )}
        </button>
      </div>
    </div>
  );
}
