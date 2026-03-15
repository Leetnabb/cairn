import { AIError } from './claude';

const JSON_BLOCK_RE = /```(?:json)?\s*\n?([\s\S]*?)\n?```/;

/**
 * Parses a JSON array from an AI response text.
 * Tries direct JSON.parse first, then extracts from a markdown code block.
 * Throws AIError if neither succeeds.
 */
export function parseJsonArrayFromAI<T>(text: string): T[] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed as T[];
    throw new Error('Not an array');
  } catch {
    const match = text.match(JSON_BLOCK_RE);
    if (match) {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) return parsed as T[];
    }
    throw new AIError('Kunne ikke tolke AI-responsen som JSON', 0);
  }
}

/**
 * Parses a JSON object from an AI response text.
 * Tries direct JSON.parse first, then extracts from a markdown code block.
 * Throws AIError if neither succeeds.
 */
export function parseJsonObjectFromAI(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(JSON_BLOCK_RE);
    if (match) return JSON.parse(match[1]);
    throw new AIError('Kunne ikke tolke AI-responsen som JSON', 0);
  }
}
