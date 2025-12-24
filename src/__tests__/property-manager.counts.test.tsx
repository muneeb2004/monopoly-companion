import { render, screen } from '@testing-library/react';
import { describe, it, beforeEach, expect } from 'vitest';
import { PropertyManager } from '../components/PropertyManager';
import { useGameStore } from '../store/gameStore';

describe('PropertyManager counts', () => {
  beforeEach(() => {
    useGameStore.setState({
      properties: [
        { id: 1, name: 'A', group: 'brown', price: 100, ownerId: 'p1', houses: 0, isMortgaged: false },
        { id: 2, name: 'B', group: 'brown', price: 120, ownerId: null, houses: 0, isMortgaged: false },
        { id: 3, name: 'C', group: 'utility', price: 150, ownerId: null, houses: 0, isMortgaged: false },
        { id: 4, name: 'D', group: 'special', price: null, ownerId: null, houses: 0, isMortgaged: false }
      ],
      players: [{ id: 'p1', name: 'A', color: '#fff', token: 'dog', balance: 1500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }]
    } as any);
  });

  it('displays owned/unowned counts correctly', () => {
    render(<PropertyManager isOpen={true} onClose={() => {}} />);

    expect(screen.getByRole('button', { name: /All \(3\)/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Owned \(1\)/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Unowned \(2\)/ })).toBeTruthy();
  });
});