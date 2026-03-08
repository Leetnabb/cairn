import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { getTemplateById } from '../../data/templates';
import { useStore } from '../../stores/useStore';

export function StepReview() {
  const selectedTemplateId = useOnboardingStore(s => s.selectedTemplateId);
  const suggestedCapabilities = useOnboardingStore(s => s.suggestedCapabilities);
  const completeOnboarding = useOnboardingStore(s => s.completeOnboarding);
  const prevStep = useOnboardingStore(s => s.prevStep);
  const loadTemplate = useStore(s => s.loadTemplate);
  const addCapabilities = useStore(s => s.addCapabilities);

  const template = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;
  const selectedSuggestions = suggestedCapabilities.filter(c => c.selected);

  // Build tree structure for display
  const allCaps = [
    ...(template?.capabilities ?? []),
    ...selectedSuggestions,
  ];
  const l1Caps = allCaps.filter(c => c.level === 1);
  const getChildren = (parentId: string) => allCaps.filter(c => c.level === 2 && c.parent === parentId);

  const handleComplete = () => {
    if (template) {
      loadTemplate(template);
    }
    if (selectedSuggestions.length > 0) {
      // Strip the 'reasoning' and 'selected' fields before adding
      const capsToAdd = selectedSuggestions.map(({ reasoning: _r, selected: _s, ...cap }) => cap);
      addCapabilities(capsToAdd);
    }
    completeOnboarding();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-primary">Gjennomgang</h2>
        <p className="text-[12px] text-text-secondary mt-1">
          Her er det komplette kapabilitetskartet som vil bli opprettet.
          Trykk &laquo;Fullfør&raquo; for å starte.
        </p>
      </div>

      {template && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">{template.icon}</span>
            <div>
              <span className="text-[12px] font-semibold text-primary">{template.name}</span>
              <span className="text-[10px] text-text-tertiary ml-2">
                {template.capabilities.length} kapabiliteter + {template.sampleInitiatives.length} initiativer
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedSuggestions.length > 0 && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <span className="text-[11px] font-medium text-green-800">
            + {selectedSuggestions.length} AI-foreslåtte kapabiliteter
          </span>
        </div>
      )}

      <div className="max-h-[250px] overflow-y-auto space-y-1">
        {l1Caps.map(l1 => {
          const children = getChildren(l1.id);
          const isAISuggested = selectedSuggestions.some(s => s.id === l1.id);
          return (
            <div key={l1.id}>
              <div className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                isAISuggested ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <span className="text-[11px] font-semibold text-text-primary">{l1.name}</span>
                {isAISuggested && (
                  <span className="text-[8px] px-1 py-0.5 bg-green-200 text-green-800 rounded">AI</span>
                )}
                <span className="text-[9px] text-text-tertiary ml-auto">
                  M:{l1.maturity} R:{l1.risk}
                </span>
              </div>
              {children.length > 0 && (
                <div className="ml-4 space-y-0.5 mt-0.5">
                  {children.map(child => {
                    const isChildAI = selectedSuggestions.some(s => s.id === child.id);
                    return (
                      <div key={child.id} className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] ${
                        isChildAI ? 'bg-green-50 text-green-800' : 'text-text-secondary'
                      }`}>
                        <span className="text-text-tertiary">&mdash;</span>
                        <span>{child.name}</span>
                        {isChildAI && (
                          <span className="text-[8px] px-1 py-0.5 bg-green-200 text-green-800 rounded">AI</span>
                        )}
                        <span className="text-[9px] text-text-tertiary ml-auto">
                          M:{child.maturity} R:{child.risk}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-4 py-2 text-[11px] font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
        >
          &larr; Tilbake
        </button>
        <button
          onClick={handleComplete}
          disabled={!template}
          className="px-6 py-2 text-[12px] font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
        >
          Fullfør
        </button>
      </div>
    </div>
  );
}
