import { describe, it, expect } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Settings behavior', () => {
  it('applySettingsToProperties updates property prices and rents based on multipliers', () => {
    // reset
    useGameStore.setState({ priceMultiplier: 1, rentMultiplier: 1, properties: useGameStore.getState().properties });

    const original = useGameStore.getState().properties.find(p => p.id === 1);
    expect(original).toBeTruthy();
    const origPrice = original?.price ?? 0;
    const origRent = original?.rent ? original.rent[0] : 0;

    // set multipliers
    useGameStore.getState().setMultipliers(1.5, 2);
    useGameStore.getState().applySettingsToProperties();

    const updated = useGameStore.getState().properties.find(p => p.id === 1);
    expect(updated).toBeTruthy();
    expect(updated?.price).toEqual(Math.round((origPrice as number) * 1.5));
    if (origRent) {
      expect(updated?.rent && updated.rent[0]).toEqual(Math.round(origRent * 2));
    }
  });
});