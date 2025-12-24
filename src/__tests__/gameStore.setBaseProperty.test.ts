import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('setBaseProperty', () => {
  beforeEach(() => {
    useGameStore.setState({ properties: [{ id: 1, name: 'A', type: 'street', group: 'brown', price: 100, rent: [10,20], houses: 0, isMortgaged: false }] as any });
  });

  it('updates local property price/rent when supabase not present', async () => {
    await useGameStore.getState().setBaseProperty(1, 250, [25,50]);
    const p = useGameStore.getState().properties.find((p: any) => p.id === 1);
    expect(p).toBeDefined();
    expect(p!.price).toBe(250);
    expect(p!.rent).toEqual([25,50]);
  });
});
