import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SideCalculator } from '../components/SideCalculator';
import { useGameStore } from '../store/gameStore';
import type { TransactionType } from '../types';

describe('SideCalculator keyboard behavior when inputs are focused', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Put store in a predictable state
    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Alice', color: '#fff', token: 'dog', balance: 1000, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }
      ],
      currentPlayerIndex: 0
    });
  });

  it('does not react to number/enter keys when an input is focused, but works when not focused', () => {
    const mockUpdate = vi.fn(async () => {});
    type UpdateBalance = (playerId: string, amount: number, type: TransactionType, description: string, toId?: string) => Promise<void>;
    useGameStore.setState({ updateBalance: mockUpdate as unknown as UpdateBalance });

    render(
      <div>
        <input data-testid="external-input" />
        <SideCalculator />
      </div>
    );

    const input = screen.getByTestId('external-input') as HTMLInputElement;

    // Focus the external input
    input.focus();
    expect(document.activeElement).toBe(input);

    // Press '1' - calculator should ignore since input is focused
    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByTestId('side-calculator-display').textContent).toBe('0');

    // Press Enter - calculator should not trigger updateBalance
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockUpdate).not.toHaveBeenCalled();

    // Blur input and press number -> should update display
    input.blur();
    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByTestId('side-calculator-display').textContent).toBe('1');

    // Press Enter -> should trigger updateBalance
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockUpdate).toHaveBeenCalled();
  });
});
