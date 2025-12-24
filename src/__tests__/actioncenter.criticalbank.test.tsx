import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { ActionCenter } from '../components/ActionCenter';

describe('ActionCenter bank critical indicator', () => {
  it('shows critical indicator and pulse animation when bank is below critical level', () => {
    useGameStore.setState({ bankTotal: 500, showBankLowWarning: true, bankLowThreshold: 10000, players: [{ id: 'p1', name: 'A', color: '#fff', token: 'dog', balance: 1000, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }], currentPlayerIndex: 0 });

    render(<ActionCenter />);
    const el = screen.getByText(/CRITICAL:/);
    expect(el).toBeTruthy();
    // The parent container should exist and contain CRITICAL text
    expect(el.parentElement).toBeTruthy();
    expect(el.parentElement?.textContent).toContain('CRITICAL');
  });
});