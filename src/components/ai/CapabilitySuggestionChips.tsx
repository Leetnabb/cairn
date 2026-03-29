import type { CapabilityLinkSuggestion } from '../../lib/ai/autolink';

interface Props {
  suggestions: CapabilityLinkSuggestion[];
  selectedIds: string[];
  onToggle: (capabilityId: string) => void;
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'border-green-400 bg-green-50 text-green-800';
  if (confidence >= 0.5) return 'border-yellow-400 bg-yellow-50 text-yellow-800';
  return 'border-border bg-[var(--bg-lane)] text-text-primary';
}

export function CapabilitySuggestionChips({ suggestions, selectedIds, onToggle }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-1">
      <span className="text-[9px] text-text-tertiary uppercase">AI-forslag</span>
      <div className="flex flex-wrap gap-1">
        {suggestions.map(s => {
          const isSelected = selectedIds.includes(s.capabilityId);
          const baseColor = confidenceColor(s.confidence);
          return (
            <button
              key={s.capabilityId}
              onClick={() => onToggle(s.capabilityId)}
              title={`${s.reasoning} (${Math.round(s.confidence * 100)}% konfidens)`}
              className={`px-1.5 py-0.5 text-[9px] rounded border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : baseColor
              }`}
            >
              {s.capabilityName}
              <span className="ml-1 opacity-60">{Math.round(s.confidence * 100)}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
