import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActionCenter } from '../components/ActionCenter';
import { useGameStore } from '../store/gameStore';

describe('ActionCenter manual move and chance', () => {
  it('moves player forward by specified steps and shows landing info', async () => {
    useGameStore.setState({
      players: [{ id: 'p1', name: 'P1', color: '#000', token: 'dog', balance: 1500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }],
      currentPlayerIndex: 0,
      properties: [{ id: 3, name: 'Taipei', type: 'street', group: 'brown', price: 60, rent: [4,20,60,180,320,450], houseCost:50, houses:0, ownerId: null, isMortgaged:false }]
    });

    render(<ActionCenter />);

    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '3' } });
    const forwardBtn = screen.getByTitle('Move Forward');

    await act(async () => {
      fireEvent.click(forwardBtn);
      await new Promise(res => setTimeout(res, 100));
    });

    // Player should move to position 3
    expect(useGameStore.getState().players[0].position).toBe(3);

    // Landing popover should show property name
    expect(screen.getByText('Taipei')).toBeTruthy();
  });

  it('chance go to jail moves player to jail and marks jailed', async () => {
    useGameStore.setState({
      players: [{ id: 'p1', name: 'P1', color: '#000', token: 'dog', balance: 1500, position: 1, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }],
      currentPlayerIndex: 0
    });

    const { container } = render(<ActionCenter />);
    const jailBtn = screen.getByText('Chance: Jail');

    await act(async () => {
      fireEvent.click(jailBtn);
      await new Promise(res => setTimeout(res, 100));
    });

    expect(useGameStore.getState().players[0].position).toBe(10);
    expect(useGameStore.getState().players[0].isJailed).toBe(true);
    expect(screen.getByText('Sent to Jail')).toBeTruthy();
  });
});