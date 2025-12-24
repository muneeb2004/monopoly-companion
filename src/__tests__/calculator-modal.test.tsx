import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CalculatorModal } from '../components/CalculatorModal';
import { useGameStore } from '../store/gameStore';

describe('CalculatorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Alice', color: '#fff', token: 'dog', balance: 1000, position: 0, isJailed: false, jailTurns: 0, getOutOfJailCards: 0, loans: 0 }
      ],
      currentPlayerIndex: 0
    });
  });

  it('does not render when isOpen is false', () => {
    render(<CalculatorModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Quick Calculator')).toBeNull();
  });

  it('renders when isOpen is true', async () => {
    render(<CalculatorModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Quick Calculator')).toBeTruthy();
  });

  it('calls onClose after performing an add transaction', async () => {
    const mockClose = vi.fn();
    const mockUpdate = vi.fn(async () => {});
    useGameStore.setState({ updateBalance: mockUpdate as any });

    render(<CalculatorModal isOpen={true} onClose={mockClose} />);

    // Allow the modal's open-effect to set the selected player
    await waitFor(() => expect(screen.getByText("Adjusting Alice's Balance")).toBeTruthy());

    // Click a number and then + Add
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('+ Add'));

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });
});
