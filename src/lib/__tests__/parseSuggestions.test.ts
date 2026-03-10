import { describe, it, expect } from 'vitest';
import { parseSuggestions } from '../ai/parseSuggestions';

describe('parseSuggestions', () => {
  it('returnerer tom array for tekst uten suggestion-blokker', () => {
    expect(parseSuggestions('Ingen forslag her.')).toEqual([]);
  });

  it('parser én suggestion-blokk korrekt', () => {
    const text = '```json:suggestion\n{"type":"initiative","name":"Test"}\n```';
    const result = parseSuggestions(text);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
    expect(result[0].type).toBe('initiative');
  });

  it('parser flere suggestion-blokker', () => {
    const text = [
      '```json:suggestion\n{"type":"initiative","name":"Første"}\n```',
      'litt tekst',
      '```json:suggestion\n{"type":"capability","name":"Andre"}\n```',
    ].join('\n');
    const result = parseSuggestions(text);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Første');
    expect(result[1].name).toBe('Andre');
  });

  it('hopper over ugyldig JSON', () => {
    const text = '```json:suggestion\n{ikke gyldig JSON\n```';
    expect(parseSuggestions(text)).toEqual([]);
  });

  it('hopper over blokk uten name (for create-action)', () => {
    const text = '```json:suggestion\n{"type":"initiative"}\n```';
    expect(parseSuggestions(text)).toEqual([]);
  });

  it('aksepterer update-action med targetName', () => {
    const text = '```json:suggestion\n{"type":"initiative","action":"update","targetName":"Gammel","updates":{"name":"Ny"}}\n```';
    const result = parseSuggestions(text);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('update');
    expect(result[0].targetName).toBe('Gammel');
  });

  it('hopper over update-action uten targetName', () => {
    const text = '```json:suggestion\n{"type":"initiative","action":"update","updates":{"name":"Ny"}}\n```';
    expect(parseSuggestions(text)).toEqual([]);
  });

  it('aksepterer delete-action med targetName', () => {
    const text = '```json:suggestion\n{"type":"capability","action":"delete","targetName":"GammelKap"}\n```';
    const result = parseSuggestions(text);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('delete');
  });
});
