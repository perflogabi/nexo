import { describe, expect, it } from 'vitest';
import { AgentLlmConfigError, resolveAgentLlmMode, resolveNexoRuntimeEnv } from '@/agent/llm-mode';

describe('resolveNexoRuntimeEnv', () => {
  it('respeita NEXO_ENV', () => {
    expect(resolveNexoRuntimeEnv({ NEXO_ENV: 'demo' })).toBe('demo');
    expect(resolveNexoRuntimeEnv({ NEXO_ENV: 'e2e' })).toBe('e2e');
  });

  it('NODE_ENV=production sem NEXO_ENV → production', () => {
    expect(resolveNexoRuntimeEnv({ NODE_ENV: 'production' })).toBe('production');
  });
});

describe('resolveAgentLlmMode', () => {
  it('força mock em demo/dev/e2e', () => {
    expect(resolveAgentLlmMode({ NEXO_ENV: 'demo', AGENT_LLM: 'mock', GEMINI_API_KEY: 'x' })).toBe(
      'mock',
    );
    expect(resolveAgentLlmMode({ NEXO_ENV: 'e2e', AGENT_LLM: 'mock' })).toBe('mock');
  });

  it('força gemini em development com chave', () => {
    expect(
      resolveAgentLlmMode({ NEXO_ENV: 'development', AGENT_LLM: 'gemini', GEMINI_API_KEY: 'x' }),
    ).toBe('gemini');
  });

  it('CI em ambiente test → mock mesmo com chave', () => {
    expect(resolveAgentLlmMode({ NEXO_ENV: 'test', CI: 'true', GEMINI_API_KEY: 'x' })).toBe('mock');
  });

  it('sem chave em development → mock', () => {
    expect(resolveAgentLlmMode({ NEXO_ENV: 'development' })).toBe('mock');
  });

  it('com chave e development → gemini', () => {
    expect(resolveAgentLlmMode({ NEXO_ENV: 'development', GEMINI_API_KEY: 'secret' })).toBe(
      'gemini',
    );
  });

  it('produção rejeita mock', () => {
    expect(() =>
      resolveAgentLlmMode({ NEXO_ENV: 'production', AGENT_LLM: 'mock', GEMINI_API_KEY: 'x' }),
    ).toThrow(AgentLlmConfigError);
  });

  it('produção exige chave para gemini', () => {
    expect(() => resolveAgentLlmMode({ NEXO_ENV: 'production', AGENT_LLM: 'gemini' })).toThrow(
      AgentLlmConfigError,
    );
  });

  it('produção com chave → gemini', () => {
    expect(resolveAgentLlmMode({ NEXO_ENV: 'production', GEMINI_API_KEY: 'secret' })).toBe(
      'gemini',
    );
  });
});
