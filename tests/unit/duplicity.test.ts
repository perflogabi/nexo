import { describe, expect, it } from 'vitest';
import {
  DEFAULT_JACCARD_THRESHOLD,
  findDuplicateOrReopenCandidate,
  jaccardSimilarity,
  tokenizeTitle,
  type DuplicateCandidateTicket,
} from '@/domain/duplicity';
import { zonedTimeToUtc } from '@/domain/sla';

const NOW = zonedTimeToUtc({
  year: 2026,
  month: 3,
  day: 20,
  hour: 10,
  minute: 0,
  second: 0,
});

function ticket(
  partial: Partial<DuplicateCandidateTicket> &
    Pick<DuplicateCandidateTicket, 'id' | 'title' | 'status'>,
): DuplicateCandidateTicket {
  return {
    ownerEmployeeId: 'emp-a',
    category: 'REDE_VPN',
    type: 'INC',
    updatedAt: NOW,
    resolvedAt: null,
    ...partial,
  };
}

describe('jaccardSimilarity', () => {
  it('returns 1 for identical titles', () => {
    expect(jaccardSimilarity('VPN não conecta erro 809', 'VPN não conecta erro 809')).toBe(1);
  });

  it('handles empty titles', () => {
    expect(jaccardSimilarity('', '')).toBe(1);
    expect(jaccardSimilarity('   ', '')).toBe(1);
    expect(jaccardSimilarity('', 'vpn 809')).toBe(0);
  });

  it('scores paraphrases with high overlap above hypothesis threshold', () => {
    const score = jaccardSimilarity('VPN não conecta erro 809', 'Erro 809 VPN notebook');
    expect(score).toBeGreaterThanOrEqual(DEFAULT_JACCARD_THRESHOLD);
  });

  it('scores distinct problems below threshold (false positive guard)', () => {
    const score = jaccardSimilarity('VPN 809', 'Mouse quebrado');
    expect(score).toBeLessThan(DEFAULT_JACCARD_THRESHOLD);
  });

  it('drops tokens with length <= 2', () => {
    expect([...tokenizeTitle('VPN no PC')].sort()).toEqual(['vpn']);
  });
});

describe('findDuplicateOrReopenCandidate', () => {
  it('matches open ticket for UPDATE when Jaccard >= threshold (H)', () => {
    const match = findDuplicateOrReopenCandidate(
      {
        ownerEmployeeId: 'emp-a',
        category: 'REDE_VPN',
        type: 'INC',
        title: 'Erro 809 VPN notebook',
      },
      [
        ticket({
          id: 't1',
          status: 'OPEN',
          title: 'VPN não conecta erro 809',
        }),
      ],
      { now: NOW },
    );
    expect(match).toEqual({ ticketId: 't1', kind: 'UPDATE', score: expect.any(Number) });
    expect(match!.score).toBeGreaterThanOrEqual(DEFAULT_JACCARD_THRESHOLD);
  });

  it('never matches another owner even with identical title', () => {
    const match = findDuplicateOrReopenCandidate(
      {
        ownerEmployeeId: 'emp-a',
        category: 'REDE_VPN',
        title: 'VPN erro 809',
      },
      [
        ticket({
          id: 'other',
          ownerEmployeeId: 'emp-b',
          status: 'OPEN',
          title: 'VPN erro 809',
        }),
      ],
      { now: NOW },
    );
    expect(match).toBeNull();
  });

  it('suggests REOPEN within 7 days and rejects outside window', () => {
    const fourDaysAgo = new Date(NOW.getTime() - 4 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(NOW.getTime() - 8 * 24 * 60 * 60 * 1000);

    const within = findDuplicateOrReopenCandidate(
      { ownerEmployeeId: 'emp-a', category: 'REDE_VPN', title: 'VPN erro 809' },
      [
        ticket({
          id: 'reopen-ok',
          status: 'RESOLVED',
          title: 'VPN erro 809',
          resolvedAt: fourDaysAgo,
        }),
      ],
      { now: NOW },
    );
    expect(within?.kind).toBe('REOPEN');

    const outside = findDuplicateOrReopenCandidate(
      { ownerEmployeeId: 'emp-a', category: 'REDE_VPN', title: 'VPN erro 809' },
      [
        ticket({
          id: 'reopen-no',
          status: 'RESOLVED',
          title: 'VPN erro 809',
          resolvedAt: eightDaysAgo,
        }),
      ],
      { now: NOW },
    );
    expect(outside).toBeNull();
  });

  it('does not reopen APPROVED by default (hypothesis H)', () => {
    const match = findDuplicateOrReopenCandidate(
      { ownerEmployeeId: 'emp-a', category: 'SOFTWARE', title: 'Acesso SAP liberado' },
      [
        ticket({
          id: 'approved',
          category: 'SOFTWARE',
          type: 'REQ',
          status: 'APPROVED',
          title: 'Acesso SAP liberado',
          resolvedAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000),
        }),
      ],
      { now: NOW },
    );
    expect(match).toBeNull();
  });

  it('prefers higher Jaccard then most recently updated', () => {
    const older = new Date(NOW.getTime() - 60_000);
    const match = findDuplicateOrReopenCandidate(
      { ownerEmployeeId: 'emp-a', category: 'REDE_VPN', title: 'vpn erro 809 notebook' },
      [
        ticket({
          id: 'low',
          status: 'OPEN',
          title: 'vpn erro 809',
          updatedAt: NOW,
        }),
        ticket({
          id: 'high-old',
          status: 'OPEN',
          title: 'vpn erro 809 notebook',
          updatedAt: older,
        }),
        ticket({
          id: 'high-new',
          status: 'OPEN',
          title: 'vpn erro 809 notebook',
          updatedAt: NOW,
        }),
      ],
      { now: NOW },
    );
    expect(match?.ticketId).toBe('high-new');
  });
});
