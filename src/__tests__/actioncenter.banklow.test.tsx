import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { ActionCenter } from '../components/ActionCenter';

describe('ActionCenter bank low indicator', () => {
  it('shows bank low indicator when bank is low and warning enabled', () => {
    useGameStore.setState({ bankTotal: 5000, showBankLowWarning: true, players: [{ id: 'p1', name: 'A', color: '#fff', token: 'dog', balance: 1000, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }], currentPlayerIndex: 0 });

    render(<ActionCenter />);
    expect(screen.getByText(/Bank Low:/)).toBeTruthy();
  });

  it('does not show indicator when warning disabled', () => {
    useGameStore.setState({ bankTotal: 5000, showBankLowWarning: false, players: [{ id: 'p1', name: 'A', color: '#fff', token: 'dog', balance: 1000, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }], currentPlayerIndex: 0 });
    render(<ActionCenter />);
    expect(screen.queryByText(/Bank Low:/)).toBeNull();
  });
});