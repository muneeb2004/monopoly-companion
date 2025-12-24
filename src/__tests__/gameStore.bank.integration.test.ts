import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

// Mock supabase globally for this integration-like test
vi.mock('../lib/supabase', () => {
  const mockEq = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockFrom = vi.fn((table: string) => {
    if (table === 'transactions') return { insert: mockInsert };
    if (table === 'players') return { update: mockUpdate };
    if (table === 'games') return { update: mockUpdate };
    return { insert: mockInsert, update: mockUpdate };
  });
  return { supabase: { from: mockFrom } };
});

import { supabase } from '../lib/supabase';

describe('Bank integration: borrow and repay sequence (mocked DB)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useGameStore.setState({
      gameId: 'game-1',
      gameStatus: 'ACTIVE',
      bankTotal: 1000,
      players: [{ id: 'p1', name: 'Tester', color: '#fff', token: 'dog', balance: 500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }],
      currentPlayerIndex: 0
    });
  });

  it('performs borrow then repay and updates DB & local state', async () => {
    const fromMock = (supabase.from as unknown as jest.Mock);
    const stateBefore = useGameStore.getState();
    expect(stateBefore.bankTotal).toBe(1000);

    // Borrow 300
    await useGameStore.getState().takeLoan('p1', 300);

    const afterBorrow = useGameStore.getState();
    const p = afterBorrow.players.find(x => x.id === 'p1');

    // Local optimistic updates should reflect immediately
    expect(p?.balance).toBe(800);
    expect(p?.loans).toBe(300);
    expect(afterBorrow.bankTotal).toBe(700);

    // Ensure DB calls were made
    const fromArgs = fromMock.mock.calls.map((c: any) => c[0]);
    expect(fromArgs).toContain('transactions');
    expect(fromArgs).toContain('players');
    expect(fromArgs).toContain('games');

    // Now repay 100
    await useGameStore.getState().repayLoan('p1', 100);
    const afterRepay = useGameStore.getState();
    const p2 = afterRepay.players.find(x => x.id === 'p1');

    expect(p2?.loans).toBe(200);
    // Balance decreased by 100
    expect(p2?.balance).toBe(700);
    // Bank increased by 100
    expect(afterRepay.bankTotal).toBe(800);

    // Ensure DB transactions were attempted for repayment as well
    const fromArgs2 = fromMock.mock.calls.map((c: any) => c[0]);
    expect(fromArgs2).toContain('transactions');
    expect(fromArgs2).toContain('players');
    expect(fromArgs2).toContain('games');
  });
});
