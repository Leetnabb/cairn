import { describe, it, expect } from 'vitest';
import { extractTextFromFile, getSupportedExtensions } from './documentParser';

describe('documentParser', () => {
  it('extracts text from plain text file', async () => {
    const file = new File(['Strategy document content'], 'strategy.txt', { type: 'text/plain' });
    const result = await extractTextFromFile(file);
    expect(result).toBe('Strategy document content');
  });

  it('returns supported extensions', () => {
    const ext = getSupportedExtensions();
    expect(ext).toContain('.txt');
    expect(ext).toContain('.pdf');
    expect(ext).toContain('.json');
  });

  it('throws on unsupported file type', async () => {
    const file = new File(['data'], 'image.png', { type: 'image/png' });
    await expect(extractTextFromFile(file)).rejects.toThrow();
  });

  it('handles empty file gracefully', async () => {
    const file = new File([''], 'empty.txt', { type: 'text/plain' });
    const result = await extractTextFromFile(file);
    expect(result).toBe('');
  });
});
