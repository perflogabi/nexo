import { describe, expect, it } from 'vitest';
import {
  canAnalystAccessConversation,
  canAnalystAccessTicket,
  canEmployeeAccessTicket,
} from '@/domain/authorization-scope';
import { isInTiScope, isTiCategory } from '@/domain/ti-scope';

describe('canEmployeeAccessTicket', () => {
  it('allows owner and denies non-owner', () => {
    expect(canEmployeeAccessTicket({ employeeId: 'a', ownerEmployeeId: 'a' })).toBe(true);
    expect(canEmployeeAccessTicket({ employeeId: 'a', ownerEmployeeId: 'b' })).toBe(false);
  });

  it('does not grant access via affectedEmployeeId', () => {
    expect(
      canEmployeeAccessTicket({
        employeeId: 'a',
        ownerEmployeeId: 'b',
        affectedEmployeeId: 'a',
      }),
    ).toBe(false);
  });
});

describe('canAnalystAccessConversation / Ticket', () => {
  it('allows queue WAITING_ANALYST', () => {
    expect(
      canAnalystAccessConversation({
        analystId: 'an1',
        role: 'ANALYST',
        status: 'WAITING_ANALYST',
        assignedAnalystId: null,
      }),
    ).toBe(true);
  });

  it('allows only assignee on WITH_ANALYST', () => {
    expect(
      canAnalystAccessConversation({
        analystId: 'an1',
        role: 'ANALYST',
        status: 'WITH_ANALYST',
        assignedAnalystId: 'an1',
      }),
    ).toBe(true);
    expect(
      canAnalystAccessConversation({
        analystId: 'an1',
        role: 'ANALYST',
        status: 'WITH_ANALYST',
        assignedAnalystId: 'an2',
      }),
    ).toBe(false);
  });

  it('denies employee role pretending to be analyst', () => {
    expect(
      canAnalystAccessConversation({
        analystId: 'emp',
        role: 'EMPLOYEE',
        status: 'WAITING_ANALYST',
        assignedAnalystId: null,
      }),
    ).toBe(false);
  });

  it('allows read-only console views for WITH_AGENT and CLOSED', () => {
    expect(
      canAnalystAccessConversation({
        analystId: 'an1',
        role: 'ANALYST',
        status: 'WITH_AGENT',
        assignedAnalystId: null,
      }),
    ).toBe(true);
    expect(
      canAnalystAccessConversation({
        analystId: 'an1',
        role: 'ANALYST',
        status: 'CLOSED',
        assignedAnalystId: null,
      }),
    ).toBe(true);
  });

  it('scopes tickets to conversation employee only', () => {
    expect(
      canAnalystAccessTicket({
        analystId: 'an1',
        role: 'ANALYST',
        conversationEmployeeId: 'emp-e',
        conversationStatus: 'WITH_ANALYST',
        assignedAnalystId: 'an1',
        ticketOwnerEmployeeId: 'emp-e',
      }),
    ).toBe(true);

    expect(
      canAnalystAccessTicket({
        analystId: 'an1',
        role: 'ANALYST',
        conversationEmployeeId: 'emp-e',
        conversationStatus: 'WITH_ANALYST',
        assignedAnalystId: 'an1',
        ticketOwnerEmployeeId: 'emp-f',
      }),
    ).toBe(false);

    expect(
      canAnalystAccessTicket({
        analystId: 'an1',
        role: 'ANALYST',
        conversationEmployeeId: null,
        conversationStatus: 'WAITING_ANALYST',
        assignedAnalystId: null,
        ticketOwnerEmployeeId: 'emp-e',
      }),
    ).toBe(false);
  });
});

describe('isInTiScope', () => {
  it('allows TI and rejects RH/financeiro/facilities', () => {
    expect(isInTiScope('TI')).toBe(true);
    expect(isInTiScope('RH')).toBe(false);
    expect(isInTiScope('FINANCEIRO')).toBe(false);
    expect(isInTiScope('FACILITIES')).toBe(false);
    expect(isTiCategory('REDE_VPN')).toBe(true);
  });
});
