import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { extractTextFromFile } from '../../lib/documentParser';
import { generateStrategicPicture } from '../../lib/ai/generateStrategicPicture';
import { getApiKey, setApiKey } from '../../lib/ai/claude';

export function StepUpload() {
  const { t } = useTranslation();
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

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [persistKey, setPersistKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = useCallback(async (file: File) => {
    try {
      const text = await extractTextFromFile(file);
      setUploadedText(text);
      setFileName(file.name);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Failed to read file');
    }
  }, [setUploadedText, setGenerationError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileProcess(file);
  }, [handleFileProcess]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  }, [handleFileProcess]);

  const handleGenerate = async () => {
    const input = uploadedText || orgDescription;
    if (!input.trim()) return;

    let key = getApiKey();
    if (!key) {
      if (!apiKeyInput.trim()) {
        setGenerationError(t('onboarding.upload.needApiKey'));
        return;
      }
      key = apiKeyInput.trim();
      setApiKey(key, persistKey);
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateStrategicPicture(input, key);
      setGeneratedPicture(result);
      nextStep();
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : t('onboarding.upload.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const hasInput = (uploadedText || orgDescription).trim().length > 0;
  const hasApiKey = !!getApiKey() || apiKeyInput.trim().length > 0;

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
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {fileName ? (
            <div>
              <p className="text-[12px] font-medium text-primary">{fileName}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">
                {uploadedText.slice(0, 60)}...
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[12px] text-text-secondary">{t('onboarding.upload.dropzone')}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">{t('onboarding.upload.supported')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Text preview */}
      {uploadedText && (
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-[10px] text-text-tertiary uppercase font-medium mb-1">Forhåndsvisning</p>
          <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-4">
            {uploadedText.slice(0, 500)}{uploadedText.length > 500 ? '…' : ''}
          </p>
        </div>
      )}

      {/* OR divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-text-tertiary uppercase">{t('onboarding.upload.orDescribe')}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Free text input */}
      <textarea
        value={orgDescription}
        onChange={(e) => setOrgDescription(e.target.value)}
        placeholder="Vi er en offentlig etat med 500 ansatte som jobber med..."
        rows={3}
        className="w-full px-3 py-2 text-[12px] border border-border rounded-lg focus:outline-none focus:border-primary resize-none bg-surface text-text-primary placeholder:text-text-tertiary"
      />

      {/* API key input (shown if no key stored) */}
      {!getApiKey() && (
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
            <span className="text-[10px] text-text-tertiary">Husk API-nøkkel mellom sesjoner</span>
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
