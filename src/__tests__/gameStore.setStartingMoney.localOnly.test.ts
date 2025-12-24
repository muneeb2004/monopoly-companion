import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock supabase as null to simulate local-only (no DB) environment
vi.mock('../lib/supabase', () => ({ supabase: null }));

import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

describe('gameStore.setStartingMoney (supabase null)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure clean state and two players
    useGameStore.setState({
      gameId: 'game-1',
      gameStatus: 'SETUP',
      startingMoney: 1500,
      players: [
        { id: 'p1', name: 'A', color: '#fff', token: 'dog', balance: 1500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 },
        { id: 'p2', name: 'B', color: '#000', token: 'car', balance: 1500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }
      ]
    });
  });

  it('updates only startingMoney locally and leaves player balances unchanged when supabase is null', async () => {
    // Sanity: supabase should be null
    expect(supabase).toBeNull();

    await useGameStore.getState().setStartingMoney(2000);

    const state = useGameStore.getState();
    expect(state.startingMoney).toBe(2000);
    // Players balances should remain unchanged (no DB updates performed)
    expect(state.players.every(p => p.balance === 1500)).toBe(true);
  });
});
