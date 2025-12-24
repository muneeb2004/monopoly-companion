import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UndoHistoryModal } from '../components/UndoHistoryModal';
import { useGameStore } from '../store/gameStore';

describe('UndoHistoryModal', () => {
  it('renders entries and allows revert (local-only)', async () => {
    useGameStore.setState({ 
      players: [{ id: 'p1', name: 'P1', color: '#000', token: 'dog', balance: 1500, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }],
      undoEntries: [{ id: 1, playerId: 'p1', description: 'Test move', prevPosition: 0, newPosition: 3, prevIsJailed: false, newIsJailed: false, passGoAwarded: 0, createdAt: Date.now(), reverted: false }]
    });

    render(<UndoHistoryModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Test move')).toBeTruthy();
    // Directly call revert to simulate local revert
    await act(async () => {
      await useGameStore.getState().revertUndoEntry(1, 'TEST');
    });

    expect(useGameStore.getState().undoEntries?.[0].reverted).toBe(true);
  });
});