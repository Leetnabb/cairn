import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { templates } from '../../data/templates';

export function StepTemplate() {
  const selectedTemplateId = useOnboardingStore(s => s.selectedTemplateId);
  const setSelectedTemplateId = useOnboardingStore(s => s.setSelectedTemplateId);
  const nextStep = useOnboardingStore(s => s.nextStep);
  const prevStep = useOnboardingStore(s => s.prevStep);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-primary">Velg bransjemal</h2>
        <p className="text-[12px] text-text-secondary mt-1">
          Velg en mal som passer din organisasjon. Malen gir deg et ferdig kapabilitetskart
          med relevante initiativer som utgangspunkt.
        </p>
      </div>

      <div className="grid gap-3">
        {templates.map(template => {
          const isSelected = selectedTemplateId === template.id;
          const l1Count = template.capabilities.filter(c => c.level === 1).length;
          const l2Count = template.capabilities.filter(c => c.level === 2).length;
          return (
            <button
              key={template.id}
              onClick={() => setSelectedTemplateId(template.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-primary">{template.name}</span>
                    {isSelected && (
                      <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-medium">Valgt</span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5">{template.description}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[9px] text-text-tertiary">
                      {l1Count} domener, {l2Count} underkapabiliteter
                    </span>
                    <span className="text-[9px] text-text-tertiary">
                      {template.sampleInitiatives.length} eksempelinitiativer
                    </span>
                  </div>
                </div>
              </div>
            </button>
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
          onClick={nextStep}
          disabled={!selectedTemplateId}
          className="px-4 py-2 text-[11px] font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
        >
          Neste &rarr;
        </button>
      </div>
    </div>
  );
}
