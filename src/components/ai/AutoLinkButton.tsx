import { useState } from 'react';
import { getApiKey, AIError } from '../../lib/ai/claude';
import { suggestCapabilityLinks, type CapabilityLinkSuggestion } from '../../lib/ai/autolink';
import { CapabilitySuggestionChips } from './CapabilitySuggestionChips';
import type { Capability } from '../../types';

interface Props {
  initiativeName: string;
  initiativeDescription: string;
  capabilities: Capability[];
  selectedCapIds: string[];
  onToggleCapability: (capId: string) => void;
}

export function AutoLinkButton({
  initiativeName,
  initiativeDescription,
  capabilities,
  selectedCapIds,
  onToggleCapability,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CapabilityLinkSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const apiKey = getApiKey();

  const handleSuggest = async () => {
    if (!apiKey || !initiativeName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await suggestCapabilityLinks(
        initiativeName,
        initiativeDescription,
        capabilities,
        apiKey,
      );
      // Filter to only existing capability IDs
      const validCapIds = new Set(capabilities.map(c => c.id));
      const validResults = results.filter(r => validCapIds.has(r.capabilityId));
      setSuggestions(validResults);

      // Auto-select high-confidence suggestions
      for (const s of validResults) {
        if (s.confidence >= 0.7 && !selectedCapIds.includes(s.capabilityId)) {
          onToggleCapability(s.capabilityId);
        }
      }
    } catch (err) {
      if (err instanceof AIError) {
        if (err.status === 401) setError('Ugyldig API-nøkkel');
        else if (err.status === 429) setError('For mange forespørsler');
        else setError('Kunne ikke hente forslag');
      } else {
        setError('Nettverksfeil');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSuggest}
          disabled={!apiKey || loading || !initiativeName.trim()}
          title={!apiKey ? 'Konfigurer API-nøkkel for AI-forslag' : undefined}
          className="px-2 py-1 text-[9px] font-medium rounded border border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              Henter...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M12 2a4 4 0 014 4c0 1.1-.9 2-2 2h-4a2 2 0 01-2-2 4 4 0 014-4zM8 8v2a6 6 0 0012 0V8" />
              </svg>
              Foreslå kapabiliteter
            </span>
          )}
        </button>
        {error && <span className="text-[9px] text-red-600">{error}</span>}
      </div>

      <CapabilitySuggestionChips
        suggestions={suggestions}
        selectedIds={selectedCapIds}
        onToggle={onToggleCapability}
      />
    </div>
  );
}
