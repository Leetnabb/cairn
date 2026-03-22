import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { extractTextFromFile } from '../../lib/documentParser';
import { analyzeInput, buildOnboardingInput } from '../../lib/ai/analyzeInput';
import { INDUSTRY_OPTIONS, SIZE_OPTIONS } from '../../lib/ai/frameworks/onboardingFramework';
import type { IndustryKey, SizeKey } from '../../lib/ai/frameworks/onboardingFramework';
import { useAuth } from '../../providers/AuthProvider';

export function StepUpload() {
  const { t } = useTranslation();
  const { isAuthenticated, session } = useAuth();
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

  const [isDragging, setIsDragging] = useState(false);
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

  const handleAnalyze = async () => {
    const input = buildOnboardingInput(uploadedFiles, orgDescription);
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

  const hasInput = uploadedFiles.length > 0 || orgDescription.trim().length > 0;
  const totalChars = uploadedFiles.reduce((sum, f) => sum + f.text.length, 0) + orgDescription.length;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold text-text-primary">{t('onboarding.upload.title')}</h2>
        <p className="text-[12px] text-text-secondary mt-1">{t('onboarding.upload.subtitle')}</p>
      </div>

      {/* Document guidance */}
      <p className="text-[10px] text-text-tertiary italic mb-2">
        {t('onboarding.upload.documentGuidance')}
      </p>

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

      {/* Industry and size dropdowns */}
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
          onClick={handleAnalyze}
          disabled={isAnalyzing || !hasInput || !isAuthenticated}
          className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {t('onboarding.analysis.analyzing')}
            </>
          ) : (
            t('onboarding.upload.analyze')
          )}
        </button>
      </div>
    </div>
  );
}
