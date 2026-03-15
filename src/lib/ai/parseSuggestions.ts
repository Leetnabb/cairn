export interface AISuggestion {
  type: 'initiative' | 'capability';
  name: string;
  description?: string;
  // Action type (defaults to 'create' if missing)
  action?: 'create' | 'update' | 'delete';
  targetName?: string;
  updates?: Record<string, unknown>;
  // Initiative fields
  dimension?: string;
  horizon?: string;
  owner?: string;
  notes?: string;
  suggestedCapabilities?: string[];
  // Capability fields
  level?: number;
  suggestedParent?: string;
  maturity?: number;
  risk?: number;
}

export function parseSuggestions(text: string): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const regex = /```json:suggestion\s*\n([\s\S]*?)```/g;
  let match;

  // exec() with a global regex returns null when no more matches remain – condition is intentional
  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && typeof parsed === 'object') {
        // For update/delete, targetName is required; for create, name is required
        if (parsed.action === 'update' || parsed.action === 'delete') {
          if (parsed.targetName) {
            suggestions.push(parsed as AISuggestion);
          }
        } else if (parsed.name) {
          suggestions.push(parsed as AISuggestion);
        }
      }
    } catch (parseErr) {
      // Malformed JSON in suggestion block – expected when AI output is imperfect
      if (import.meta.env.DEV) {
        console.warn('[parseSuggestions] Invalid JSON block skipped:', parseErr);
      }
    }
  }

  return suggestions;
}
