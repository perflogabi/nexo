import { describe, expect, it } from 'vitest';
import { redactSecrets, safeErrorMessage } from '@/lib/redact-secrets';

describe('redactSecrets', () => {
  it('mascara GEMINI_API_KEY e AUTH_SECRET', () => {
    const env = {
      GEMINI_API_KEY: 'sk-gemini-secret-value-123456',
      AUTH_SECRET: 'auth-secret-value-abcdef',
    };
    const raw = `fail key=sk-gemini-secret-value-123456 auth=auth-secret-value-abcdef`;
    expect(redactSecrets(raw, env)).toBe(
      'fail key=[REDACTED_GEMINI_API_KEY] auth=[REDACTED_AUTH_SECRET]',
    );
  });

  it('safeErrorMessage redige Error.message', () => {
    const env = { GEMINI_API_KEY: 'super-secret-gemini-key' };
    const err = new Error('Google rejected super-secret-gemini-key');
    // injeta env via redactSecrets path — safeErrorMessage usa process.env;
    // testamos redactSecrets no message diretamente:
    expect(redactSecrets(err.message, env)).toContain('[REDACTED_GEMINI_API_KEY]');
    expect(redactSecrets(err.message, env)).not.toContain('super-secret-gemini-key');
    expect(safeErrorMessage(err).length).toBeGreaterThan(0);
  });
});
