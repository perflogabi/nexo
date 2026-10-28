import { describe, expect, it } from 'vitest';
import { isAgentPaused } from '@/domain/conversation-status';

describe('isAgentPaused', () => {
  it('is true for WAITING_ANALYST and WITH_ANALYST', () => {
    expect(isAgentPaused('WAITING_ANALYST')).toBe(true);
    expect(isAgentPaused('WITH_ANALYST')).toBe(true);
  });

  it('is false for WITH_AGENT and CLOSED', () => {
    expect(isAgentPaused('WITH_AGENT')).toBe(false);
    expect(isAgentPaused('CLOSED')).toBe(false);
  });
});
