import { describe, it, expect } from 'vitest';
import { parseJsonArrayFromAI, parseJsonObjectFromAI } from '../ai/parseJsonResponse';
import { AIError } from '../ai/claude';

describe('parseJsonResponse', () => {
  it('parses a direct JSON array', () => {
    expect(parseJsonArrayFromAI<number>('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('parses a direct JSON object', () => {
    expect(parseJsonObjectFromAI('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses JSON from a fenced code block', () => {
    expect(parseJsonObjectFromAI('Here:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJsonArrayFromAI('```\n[1,2]\n```')).toEqual([1, 2]);
  });

  it('throws AIError (not SyntaxError) on a malformed fenced block (M5)', () => {
    const bad = '```json\n{ not valid }\n```';
    expect(() => parseJsonObjectFromAI(bad)).toThrow(AIError);
    expect(() => parseJsonArrayFromAI(bad)).toThrow(AIError);
  });

  it('rejects a non-object for the object parser (M5)', () => {
    expect(() => parseJsonObjectFromAI('42')).toThrow(AIError);
    expect(() => parseJsonObjectFromAI('[1,2]')).toThrow(AIError);
  });

  it('rejects a non-array for the array parser', () => {
    expect(() => parseJsonArrayFromAI('{"a":1}')).toThrow(AIError);
  });
});
