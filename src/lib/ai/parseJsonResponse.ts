import { AIError } from './claude';

const JSON_BLOCK_RE = /```(?:json)?\s*\n?([\s\S]*?)\n?```/;

/**
 * Parses a JSON array from an AI response text.
 * Tries direct JSON.parse first, then extracts from a markdown code block.
 * Throws AIError if neither succeeds.
 */
function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function parseJsonArrayFromAI<T>(text: string): T[] {
  const direct = tryParse(text);
  if (Array.isArray(direct)) return direct as T[];

  const match = text.match(JSON_BLOCK_RE);
  if (match) {
    const fenced = tryParse(match[1]);
    if (Array.isArray(fenced)) return fenced as T[];
  }
  throw new AIError('Kunne ikke tolke AI-responsen som JSON', 0);
}

/**
 * Parses a JSON object from an AI response text.
 * Tries direct JSON.parse first, then extracts from a markdown code block.
 * Throws AIError if the result is not a JSON object.
 */
export function parseJsonObjectFromAI(text: string): Record<string, unknown> {
  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

  const direct = tryParse(text);
  if (isObject(direct)) return direct;

  const match = text.match(JSON_BLOCK_RE);
  if (match) {
    const fenced = tryParse(match[1]);
    if (isObject(fenced)) return fenced;
  }
  throw new AIError('Kunne ikke tolke AI-responsen som JSON', 0);
}
