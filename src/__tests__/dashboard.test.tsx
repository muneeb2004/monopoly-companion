import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Dashboard } from '../components/Dashboard';
import { useGameStore } from '../store/gameStore';

describe('Dashboard render behavior', () => {
  it('does not re-render on unrelated changes but re-renders on transactions change', () => {
    // initialize store
    useGameStore.setState({
      players: [{ id: 'p1', name: 'Alice', color: '#f00', token: 'dog', balance: 1500 }],
      currentPlayerIndex: 0,
      transactions: [],
      trades: [],
      properties: []
    });

    const { container } = render(<Dashboard />);
    const root = container.querySelector('[data-render-count]');
    expect(root).toBeTruthy();

    const initial = Number(root?.getAttribute('data-render-count'));
    expect(initial).toBeGreaterThan(0);

    // Unrelated change
    act(() => {
      useGameStore.setState({ diceMode: 'PHYSICAL' });
    });

    const after = Number(root?.getAttribute('data-render-count'));
    expect(after).toEqual(initial);

    // Related change: add a transaction
    act(() => {
      useGameStore.setState({ transactions: [{ id: 't1', type: 'OTHER', amount: 100, fromId: 'BANK', toId: 'p1', description: 'Test', timestamp: Date.now() }] });
    });

    const afterTx = Number(root?.getAttribute('data-render-count'));
    expect(afterTx).toBeGreaterThan(initial);
  });
});