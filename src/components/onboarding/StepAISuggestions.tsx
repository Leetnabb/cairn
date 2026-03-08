import { useEffect } from 'react';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { getTemplateById } from '../../data/templates';
import { getApiKey } from '../../lib/ai/claude';
import { suggestCapabilities } from '../../lib/ai/onboarding';

export function StepAISuggestions() {
  const orgDescription = useOnboardingStore(s => s.orgDescription);
  const selectedTemplateId = useOnboardingStore(s => s.selectedTemplateId);
  const suggestedCapabilities = useOnboardingStore(s => s.suggestedCapabilities);
  const toggleSuggestedCapability = useOnboardingStore(s => s.toggleSuggestedCapability);
  const setSuggestedCapabilities = useOnboardingStore(s => s.setSuggestedCapabilities);
  const isLoadingSuggestions = useOnboardingStore(s => s.isLoadingSuggestions);
  const setIsLoadingSuggestions = useOnboardingStore(s => s.setIsLoadingSuggestions);
  const suggestionError = useOnboardingStore(s => s.suggestionError);
  const setSuggestionError = useOnboardingStore(s => s.setSuggestionError);
  const nextStep = useOnboardingStore(s => s.nextStep);
  const prevStep = useOnboardingStore(s => s.prevStep);

  const apiKey = getApiKey();
  const template = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;

  useEffect(() => {
    if (!apiKey || !orgDescription.trim() || !template || suggestedCapabilities.length > 0) return;

    let cancelled = false;
    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      setSuggestionError(null);
      try {
        const suggestions = await suggestCapabilities(orgDescription, template.capabilities, apiKey);
        if (!cancelled) {
          setSuggestedCapabilities(suggestions.map(s => ({ ...s, selected: true })));
        }
      } catch (err) {
        if (!cancelled) {
          setSuggestionError(err instanceof Error ? err.message : 'Kunne ikke hente forslag');
        }
      } finally {
        if (!cancelled) setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [apiKey, orgDescription, template, suggestedCapabilities.length, setIsLoadingSuggestions, setSuggestionError, setSuggestedCapabilities]);

  const selectedCount = suggestedCapabilities.filter(c => c.selected).length;

  if (!apiKey) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-primary">AI-forslag</h2>
          <p className="text-[12px] text-text-secondary mt-1">
            Konfigurer en Claude API-nokkel for å få AI-foreslåtte kapabiliteter tilpasset din organisasjon.
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-border text-center">
          <p className="text-[11px] text-text-secondary">
            Ingen API-nøkkel konfigurert. Du kan legge til en i AI-assistenten senere.
          </p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={prevStep}
            className="px-4 py-2 text-[11px] font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
          >
            &larr; Tilbake
          </button>
          <button
            onClick={nextStep}
            className="px-4 py-2 text-[11px] font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Hopp over &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-primary">AI-foreslåtte kapabiliteter</h2>
        <p className="text-[12px] text-text-secondary mt-1">
          Basert på din beskrivelse foreslår vi disse tilleggskapabilitetene.
          Huk av de du vil inkludere.
        </p>
      </div>

      {isLoadingSuggestions && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] text-text-secondary">Henter AI-forslag...</span>
          </div>
        </div>
      )}

      {suggestionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-[11px] text-red-700">{suggestionError}</p>
        </div>
      )}

      {!isLoadingSuggestions && suggestedCapabilities.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {suggestedCapabilities.map(cap => (
            <button
              key={cap.id}
              onClick={() => toggleSuggestedCapability(cap.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                cap.selected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                  cap.selected ? 'border-primary bg-primary' : 'border-gray-300'
                }`}>
                  {cap.selected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-text-primary">{cap.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-text-tertiary rounded">
                      L{cap.level}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-0.5">{cap.description}</p>
                  {cap.reasoning && (
                    <p className="text-[9px] text-primary/70 mt-1 italic">{cap.reasoning}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isLoadingSuggestions && suggestedCapabilities.length === 0 && !suggestionError && (
        <div className="p-4 bg-gray-50 rounded-lg border border-border text-center">
          <p className="text-[11px] text-text-secondary">
            {orgDescription.trim()
              ? 'Ingen tilleggsforslag generert.'
              : 'Gå tilbake og skriv en organisasjonsbeskrivelse for å få AI-forslag.'}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={prevStep}
          className="px-4 py-2 text-[11px] font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
        >
          &larr; Tilbake
        </button>
        <div className="flex items-center gap-3">
          {suggestedCapabilities.length > 0 && (
            <span className="text-[10px] text-text-tertiary">{selectedCount} valgt</span>
          )}
          <button
            onClick={nextStep}
            className="px-4 py-2 text-[11px] font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            {suggestedCapabilities.length > 0 ? 'Neste' : 'Hopp over'} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
