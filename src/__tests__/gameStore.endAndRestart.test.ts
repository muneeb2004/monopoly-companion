import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('endAndRestart', () => {
  beforeEach(() => {
    // reset store to known baseline
    useGameStore.setState({
      ...useGameStore.getState(),
      players: [
        { id: 'p1', name: 'Alice', color: '#fff', token: 'dog', balance: 500, position: 10, isJailed: true, jailTurns: 2, getOutOfJailCards: 0, loans: 100 },
        { id: 'p2', name: 'Bob', color: '#000', token: 'car', balance: 200, position: 5, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }
      ],
      startingMoney: 1500,
      gameStatus: 'ACTIVE',
      gameId: 'test-game-1'
    });
  });

  it('moves the app to SETUP and preserves players with reset balances', async () => {
    await useGameStore.getState().endAndRestart();

    const state = useGameStore.getState();
    expect(state.gameStatus).toBe('SETUP');
    expect(state.gameId).toBe(null);
    expect(state.players.length).toBe(2);
    expect(state.players[0].balance).toBe(1500);
    expect(state.players[0].position).toBe(0);
    expect(state.players[0].isJailed).toBe(false);
    expect(state.players[0].loans).toBe(0);
    expect(state.toastMessage).toBe('Game ended — edit players to start again');
  });
});
