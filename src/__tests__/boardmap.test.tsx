import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BoardMap } from '../components/BoardMap';
import { useGameStore } from '../store/gameStore';

describe('BoardMap visual indicator', () => {
  it('shows group total badge when monopoly and setting enabled', () => {
    // Set up a small monopoly group: two properties, both owned by p1, houses total 3
    useGameStore.setState({
      players: [{ id: 'p1', name: 'P1', color: '#000', token: 'dog', balance: 1500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }],
      properties: [
        { id: 1, name: 'A', type: 'street', group: 'brown', price: 60, rent: [2,10,30,90,160,250], houseCost: 50, houses: 1, ownerId: 'p1', isMortgaged: false },
        { id: 3, name: 'B', type: 'street', group: 'brown', price: 60, rent: [4,20,60,180,320,450], houseCost: 50, houses: 2, ownerId: 'p1', isMortgaged: false }
      ],
      showGroupHouseTotals: true
    });

    render(<BoardMap isOpen={true} isSpectator={true} />);

    // The badge text should show total houses (1+2=3)
    const badge = screen.getAllByText('3');
    expect(badge.length).toBeGreaterThan(0);
  });
});