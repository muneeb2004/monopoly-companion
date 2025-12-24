import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionCenter } from '../components/ActionCenter';
import { useGameStore } from '../store/gameStore';

describe('ActionCenter End & Restart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      players: [{ id: 'p1', name: 'A', color: '#fff', token: 'dog', balance: 1500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }],
      currentPlayerIndex: 0,
      endAndRestart: vi.fn(async () => {}) as any
    });
  });

  it('shows confirmation and calls endAndRestart on confirm', async () => {
    render(<ActionCenter />);

    const btn = screen.getByRole('button', { name: /End Game/i });
    fireEvent.click(btn);

    expect(screen.getByText('End Game & Restart')).toBeTruthy();

    // Click confirm
    fireEvent.click(screen.getByText('End & Restart'));

    expect(useGameStore.getState().endAndRestart).toHaveBeenCalled();
  });
});