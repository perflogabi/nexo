import { describe, expect, it } from 'vitest';
import { normalizeTransferReasonCode } from '@/domain/transfer-reason-normalize';
import { isAddInfoRequest, isAnalystRequest } from '@/agent/chat-followups';

describe('normalizeTransferReasonCode', () => {
  it('maps Gemini inventado → USER_REQUEST', () => {
    expect(normalizeTransferReasonCode('FUNCIONARIO_SOLICITOU_ANALISTA')).toBe('USER_REQUEST');
  });

  it('preserves valid enums', () => {
    expect(normalizeTransferReasonCode('CRITICAL')).toBe('CRITICAL');
    expect(normalizeTransferReasonCode('OVERDUE')).toBe('OVERDUE');
    expect(normalizeTransferReasonCode('LOW_CONFIDENCE')).toBe('LOW_CONFIDENCE');
  });
});

describe('quick replies', () => {
  it('detecta Falar com um analista e Adicionar informação', () => {
    expect(isAnalystRequest('Falar com um analista')).toBe(true);
    expect(isAddInfoRequest('Adicionar informação')).toBe(true);
    expect(isAnalystRequest('Adicionar informação')).toBe(false);
  });
});
