import { describe, it, expect } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Per-property override behavior', () => {
  it('applySettingsToProperties respects per-property overrides', () => {
    // Prepare a small INITIAL_PROPERTIES-like property in state
    useGameStore.setState({
      properties: [{ id: 1, name: 'Test Prop', type: 'street', group: 'brown', price: 100, rent: [10,20,30,40,50,60], houses: 0, isMortgaged: false, priceOverride: 250, rentOverride: [25,50] }]
    });

    // Call apply (priceMultiplier/rentMultiplier are 1)
    useGameStore.getState().applySettingsToProperties();

    const p = useGameStore.getState().properties.find(pp => pp.id === 1);
    expect(p).toBeTruthy();
    expect(p?.price).toEqual(250);
    expect(p?.rent && p.rent[0]).toEqual(25);
  });
});