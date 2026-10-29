import { describe, expect, it } from 'vitest';
import { resolveAgentLlmMode } from '@/agent/llm-mode';

describe('resolveAgentLlmMode', () => {
  it('força mock', () => {
    expect(resolveAgentLlmMode({ AGENT_LLM: 'mock', GEMINI_API_KEY: 'x' })).toBe('mock');
  });

  it('força gemini', () => {
    expect(resolveAgentLlmMode({ AGENT_LLM: 'gemini', GEMINI_API_KEY: 'x' })).toBe('gemini');
  });

  it('CI sempre mock mesmo com chave', () => {
    expect(resolveAgentLlmMode({ CI: 'true', GEMINI_API_KEY: 'x' })).toBe('mock');
  });

  it('sem chave → mock', () => {
    expect(resolveAgentLlmMode({})).toBe('mock');
  });

  it('com chave e sem CI → gemini', () => {
    expect(resolveAgentLlmMode({ GEMINI_API_KEY: 'secret' })).toBe('gemini');
  });
});
