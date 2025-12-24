import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

// Mock supabase for this test suite
vi.mock('../lib/supabase', () => {
  const mockEq = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockFrom = vi.fn(() => ({ update: mockUpdate, insert: mockInsert }));
  return { supabase: { from: mockFrom } };
});
import { supabase } from '../lib/supabase';

describe('Bank settings and loan behavior (with supabase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      gameId: 'game-1',
      gameStatus: 'SETUP',
      bankTotal: 1000,
      players: [
        { id: 'p1', name: 'A', color: '#fff', token: 'dog', balance: 500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }
      ]
    });
  });

  it('setBankTotal updates store and calls supabase', async () => {
    await useGameStore.getState().setBankTotal(800);

    const state = useGameStore.getState();
    expect(state.bankTotal).toBe(800);

    expect((supabase.from as unknown as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    expect((supabase.from as unknown as jest.Mock).mock.calls.some(c => c[0] === 'games')).toBe(true);
  });

  it('takeLoan reduces bank and increases player balance when bank has funds', async () => {
    await useGameStore.getState().takeLoan('p1', 200);

    const state = useGameStore.getState();
    const p = state.players.find(x => x.id === 'p1');
    expect(p?.balance).toBe(700);
    expect(p?.loans).toBe(200);
    expect(state.bankTotal).toBe(800);

    // Ensure DB calls were made (transactions, players, games updates)
    const fromCalls = (supabase.from as unknown as jest.Mock).mock.calls.map(c => c[0]);
    expect(fromCalls).toContain('transactions');
    expect(fromCalls).toContain('players');
    expect(fromCalls).toContain('games');
  });

  it('takeLoan is blocked when bank lacks funds', async () => {
    // Set bank low
    useGameStore.setState({ bankTotal: 100 });

    await useGameStore.getState().takeLoan('p1', 200);
    const state = useGameStore.getState();
    const p = state.players.find(x => x.id === 'p1');
    expect(p?.balance).toBe(500);
    expect(p?.loans).toBe(0);
    expect(state.bankTotal).toBe(100);
  });

  it('repayLoan decreases player loans and increases bank', async () => {
    // Prepopulate a loan
    useGameStore.setState({ players: [{ id: 'p1', name: 'A', color: '#fff', token: 'dog', balance: 500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 300 }], bankTotal: 700 });

    await useGameStore.getState().repayLoan('p1', 100);

    const state = useGameStore.getState();
    expect(state.bankTotal).toBe(800);
    const p = state.players.find(x => x.id === 'p1');
    expect(p?.loans).toBe(200);
  });
});
