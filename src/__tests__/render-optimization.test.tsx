import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PropertyManager } from '../components/PropertyManager';
import { useGameStore } from '../store/gameStore';

describe('Render optimization', () => {
  it('PropertyManager does not re-render on unrelated state changes', () => {
    // Setup initial store
    useGameStore.setState({
      players: [{ id: 'p1', name: 'Alice', color: '#f00', token: 'dog', balance: 1500 }],
      properties: [{ id: 1, name: 'Mediterranean', type: 'street', group: 'brown', price: 60, houses: 0, isMortgaged: false }]
    });

    const { container } = render(<PropertyManager isOpen={true} onClose={() => {}} />);

    const root = container.querySelector('[data-render-count]');
    expect(root).toBeTruthy();

    const initial = Number(root?.getAttribute('data-render-count'));
    expect(initial).toBeGreaterThan(0);

    // Trigger unrelated state change
    act(() => {
      useGameStore.setState({ turnCount: (useGameStore.getState().turnCount || 1) + 1 });
    });

    const after = Number(root?.getAttribute('data-render-count'));
    // Should not have re-rendered (render count unchanged)
    expect(after).toEqual(initial);

    // Now change a related state (properties) and expect a re-render
    act(() => {
      useGameStore.setState({ properties: [...useGameStore.getState().properties, { id: 2, name: 'Baltic', type: 'street', group: 'brown', price: 80, houses: 0, isMortgaged: false }] });
    });

    const afterProps = Number(root?.getAttribute('data-render-count'));
    expect(afterProps).toBeGreaterThanOrEqual(initial + 1);
  });
});