import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActionCenter } from '../components/ActionCenter';
import { useGameStore } from '../store/gameStore';

describe('ActionCenter undo manual move', () => {
  it('undoes pass GO award and restores position', async () => {
    useGameStore.setState({
      players: [{ id: 'p1', name: 'P1', color: '#000', token: 'dog', balance: 1500, position: 39, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }],
      currentPlayerIndex: 0,
      properties: []
    });

    render(<ActionCenter />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '3' } });
    const forwardBtn = screen.getByTitle('Move Forward');

    await act(async () => {
      fireEvent.click(forwardBtn);
      await new Promise(res => setTimeout(res, 100));
    });

    expect(useGameStore.getState().players[0].position).toBe(2);
    expect(useGameStore.getState().players[0].balance).toBe(1700);

    // click undo
    await act(async () => {
      const undoBtn = screen.getByTitle('Undo');
      fireEvent.click(undoBtn);
      await new Promise(res => setTimeout(res, 100));
    });

    expect(useGameStore.getState().players[0].position).toBe(39);
    expect(useGameStore.getState().players[0].balance).toBe(1500);

    // verify UNDO transaction recorded
    const tx = useGameStore.getState().transactions.find(t => t.type === 'UNDO');
    expect(tx).toBeTruthy();
    expect(tx?.description).toContain('Undo manual move');
  });

  it('undoes chance go to jail', async () => {
    useGameStore.setState({
      players: [{ id: 'p1', name: 'P1', color: '#000', token: 'dog', balance: 1500, position: 5, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }],
      currentPlayerIndex: 0,
      properties: []
    });

    render(<ActionCenter />);
    const jailBtn = screen.getByText('Chance: Jail');

    await act(async () => {
      fireEvent.click(jailBtn);
      await new Promise(res => setTimeout(res, 100));
    });

    expect(useGameStore.getState().players[0].position).toBe(10);
    expect(useGameStore.getState().players[0].isJailed).toBe(true);

    await act(async () => {
      const undoBtn = screen.getByTitle('Undo');
      fireEvent.click(undoBtn);
      await new Promise(res => setTimeout(res, 100));
    });

    expect(useGameStore.getState().players[0].position).toBe(5);
    expect(useGameStore.getState().players[0].isJailed).toBe(false);
  });
});