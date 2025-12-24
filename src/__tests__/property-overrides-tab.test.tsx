import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PropertyOverridesTab from '../components/PropertyOverridesTab';
import { useGameStore } from '../store/gameStore';

describe('PropertyOverridesTab', () => {
  it('renders property inputs and allows setting override', () => {
    // Ensure initial properties are present
    const p = useGameStore.getState().properties.find(pr => pr.type === 'street');
    expect(p).toBeTruthy();

    render(<PropertyOverridesTab />);

    // Find the first street property's input by aria-label
    const input = screen.getByLabelText(`price-${p!.id}`) as HTMLInputElement;
    expect(input).toBeTruthy();

    // Set a new override
    fireEvent.change(input, { target: { value: '999' } });

    // Confirm store updated (priceOverride is set)
    const updated = useGameStore.getState().properties.find(pr => pr.id === p!.id);
    expect(updated?.priceOverride).toBe(999);

    // Clear the override
    fireEvent.change(input, { target: { value: '' } });
    const cleared = useGameStore.getState().properties.find(pr => pr.id === p!.id);
    expect(cleared?.priceOverride).toBeUndefined();
  });
});
