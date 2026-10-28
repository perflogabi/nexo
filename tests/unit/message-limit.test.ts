import { describe, expect, it } from 'vitest';
import {
  canAcceptCountableMessage,
  countsTowardMessageLimit,
  MESSAGE_LIMIT_PER_CONVERSATION,
} from '@/domain/message-limit';

describe('message limit domain', () => {
  it('counts only EMPLOYEE and AGENT', () => {
    expect(countsTowardMessageLimit('EMPLOYEE')).toBe(true);
    expect(countsTowardMessageLimit('AGENT')).toBe(true);
    expect(countsTowardMessageLimit('ANALYST')).toBe(false);
    expect(countsTowardMessageLimit('SYSTEM')).toBe(false);
  });

  it('allows up to 30 countable messages', () => {
    expect(canAcceptCountableMessage(29)).toBe(true);
    expect(canAcceptCountableMessage(30)).toBe(false);
    expect(MESSAGE_LIMIT_PER_CONVERSATION).toBe(30);
  });
});
