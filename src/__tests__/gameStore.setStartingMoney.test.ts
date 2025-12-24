import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

// Mock the supabase client used in the store so we can assert DB update calls
vi.mock('../lib/supabase', () => {
  const mockEq = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ update: mockUpdate }));
  return { supabase: { from: mockFrom } };
});

// Import the mocked supabase object
import { supabase } from '../lib/supabase';
const sb = supabase as unknown as { from: unknown }; // narrow for tests (mocked above)

describe('gameStore.setStartingMoney', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Put the store in a SETUP game with two players
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

  it('updates players balances and startingMoney when in SETUP and supabase is available', async () => {
    await useGameStore.getState().setStartingMoney(2000);

    const state = useGameStore.getState();
    expect(state.startingMoney).toBe(2000);
    expect(state.players.every(p => p.balance === 2000)).toBe(true);

    // Verify supabase calls: one for games and one per player for players update
    expect(sb.from).toHaveBeenCalledWith('games');
    expect(sb.from).toHaveBeenCalledWith('players');

    const mockFrom = sb.from as unknown as { mock?: { calls?: readonly unknown[]; results?: Array<{ value?: { update?: unknown } }> } };
    // There should be 1 + players.length calls to "from": one for games update and one per player
    expect(mockFrom.mock?.calls?.length).toBe(1 + state.players.length);

    // Access the returned object's update mock to inspect update calls
    const returned = mockFrom.mock?.results?.[0]?.value;
    const updateMock = returned?.update as unknown as { mock?: { calls?: readonly unknown[] } };

    // Ensure at least one update call used starting_money and at least one used balance
    const updateArgs = (updateMock.mock.calls || []).map((c: readonly unknown[]) => c[0] as Record<string, unknown>);
    expect(updateArgs.some(a => a && 'starting_money' in a && (a['starting_money'] as unknown) === 2000)).toBe(true);
    expect(updateArgs.some(a => a && 'balance' in a && (a['balance'] as unknown) === 2000)).toBe(true);
  });
});
