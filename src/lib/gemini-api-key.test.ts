import { describe, expect, it } from 'vitest';
import { assertGeminiApiKey, getGeminiApiKey } from '@/lib/gemini-api-key';

describe('gemini-api-key', () => {
  it('retorna null sem chave', () => {
    expect(getGeminiApiKey({})).toBeNull();
    expect(getGeminiApiKey({ GEMINI_API_KEY: '   ' })).toBeNull();
  });

  it('retorna chave trimada', () => {
    expect(getGeminiApiKey({ GEMINI_API_KEY: '  abc  ' })).toBe('abc');
  });

  it('assert lança sem chave', () => {
    expect(() => assertGeminiApiKey({})).toThrow(/GEMINI_API_KEY required/);
  });
});
