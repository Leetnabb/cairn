import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAuth } from '../../providers/AuthProvider';
import type { OnboardingResult } from '../../lib/ai/frameworks/onboardingFramework';
import { parseJsonObjectFromAI } from '../../lib/ai/parseJsonResponse';
import { buildOnboardingInput } from '../../lib/ai/analyzeInput';

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
      let token = session?.access_token;
      if (!token) {
        const { supabase } = await import('../../lib/supabase');
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = data.session?.access_token;
        }
      }
      if (!token) throw new Error('Not authenticated');

      const input = buildOnboardingInput(uploadedFiles, orgDescription);

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
