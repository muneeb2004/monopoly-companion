import { render, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SetupScreen } from '../components/SetupScreen';
import { useGameStore } from '../store/gameStore';

describe('SetupScreen render behavior', () => {
  it('does not re-render on unrelated state updates and re-renders when players change', () => {
    // Initialize store
    useGameStore.setState({ players: [], properties: [] });

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
      useGameStore.setState({ players: [{ id: 'p1', name: 'Test', color: '#000', token: 'dog', balance: 1500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }] });
    });

    const afterPlayers = Number(root?.getAttribute('data-render-count'));
    expect(afterPlayers).toBeGreaterThan(initial);
  });

  it('renders token grid with mobile-friendly columns (3 columns default)', () => {
    useGameStore.setState({ players: [], properties: [] });
    const { container } = render(<SetupScreen />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
    // Mobile-first: we expect the default column utility to be 3 columns
    expect(grid?.className).toContain('grid-cols-3');
  });

  it('shows confirmation before starting game and calls startGame on confirm', () => {
    const mockStart = vi.fn(async () => {});
    useGameStore.setState({ players: [
      { id: 'p1', name: 'A', token: 'dog', color: '#000', balance: 1500, position:0, isJailed:false, jailTurns:0, getOutOfJailCards:0, loans:0 },
      { id: 'p2', name: 'B', token: 'car', color: '#111', balance: 1500, position:0, isJailed:false, jailTurns:0, getOutOfJailCards:0, loans:0 }
    ], startGame: mockStart });

    const { getByText } = render(<SetupScreen />);
    const startBtn = getByText('Start Game');
    act(() => { startBtn.click(); });

    // Confirmation should appear
    expect(getByText(/Property overrides will be applied/i)).toBeTruthy();

    const confirmBtn = getByText('Confirm Start');
    act(() => { confirmBtn.click(); });

    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});