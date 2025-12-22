import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SetupScreen } from '../components/SetupScreen';
import { useGameStore } from '../store/gameStore';

describe('SetupScreen render behavior', () => {
  it('does not re-render on unrelated state updates and re-renders when players change', () => {
    // Initialize store
    useGameStore.setState({ players: [] });

    const { container } = render(<SetupScreen />);
    const root = container.querySelector('[data-render-count]');
    expect(root).toBeTruthy();

    const initial = Number(root?.getAttribute('data-render-count'));
    expect(initial).toBeGreaterThan(0);

    // Unrelated update: turnCount
    act(() => {
      useGameStore.setState({ turnCount: (useGameStore.getState().turnCount || 1) + 1 });
    });

    const after = Number(root?.getAttribute('data-render-count'));
    expect(after).toEqual(initial);

    // Related update: add a player
    act(() => {
      useGameStore.setState({ players: [{ id: 'p1', name: 'Test', color: '#000', token: 'dog', balance: 1500 }] });
    });

    const afterPlayers = Number(root?.getAttribute('data-render-count'));
    expect(afterPlayers).toBeGreaterThan(initial);
  });
});