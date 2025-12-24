import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

vi.mock('../lib/supabase', () => {
  // We'll capture calls to insert
  const insertMock = vi.fn(async (payload: any) => ({ data: payload }));
  const updateMock = vi.fn(() => ({ eq: vi.fn(async () => ({ data: true })) }));
  return { supabase: { from: (table: string) => ({ insert: insertMock, update: updateMock }) } };
});

describe('startGame persistence', () => {
  beforeEach(() => {
    // reset minimal store state
    useGameStore.setState({
      gameId: 'test-game',
      properties: [
        { id: 1, name: 'P1', type: 'street', group: 'brown', price: 100, rent: [2,10], houses: 0, isMortgaged: false, priceOverride: 150, rentOverride: [5,20] },
        { id: 2, name: 'P2', type: 'street', group: 'brown', price: 60, rent: [2,10], houses: 0, isMortgaged: false }
      ] as any
    });
  });

  it('inserts game_properties with price_override and rent_override when starting', async () => {
    const { supabase } = await import('../lib/supabase');
    const insertSpy = (supabase as any).from('game_properties').insert;

    await useGameStore.getState().startGame('DIGITAL');

    expect(insertSpy).toHaveBeenCalledTimes(1);
    const arg = insertSpy.mock.calls[0][0];
    // ensure first property includes overrides
    const p1 = arg.find((x: any) => x.property_index === 1);
    expect(p1.price_override).toBe(150);
    expect(p1.rent_override).toEqual([5,20]);

    // ensure second property has null overrides when not set
    const p2 = arg.find((x: any) => x.property_index === 2);
    expect(p2.price_override).toBeNull();
    expect(p2.rent_override).toBeNull();
  });
});
