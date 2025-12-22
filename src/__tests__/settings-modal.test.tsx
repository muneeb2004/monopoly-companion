import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { SettingsModal } from '../components/SettingsModal';
import { useGameStore } from '../store/gameStore';

describe('SettingsModal UI', () => {
  it('shows saving indicator and applies overrides', async () => {
    useGameStore.setState({ properties: [{ id: 1, name: 'P1', price: 100, rent: [10], houses:0, isMortgaged:false }] });

    const onClose = vi.fn();

    const { container } = render(<SettingsModal isOpen={true} onClose={onClose} />);

    // open advanced and set overrides
    const showBtn = screen.getByText(/Show property overrides/i);
    fireEvent.click(showBtn);

    // find price input
    const priceInput = container.querySelector('input[placeholder="Price override"]') as HTMLInputElement;
    fireEvent.change(priceInput, { target: { value: '250' } });

    const saveBtn = screen.getByText('Save');
    await act(async () => {
      fireEvent.click(saveBtn);
      await new Promise(res => setTimeout(res, 900));
    });

    expect(screen.queryByText('Saving...')).toBeNull();
    // verify state updated
    const p = useGameStore.getState().properties.find(p => p.id === 1);
    expect(p?.priceOverride).toBe(250);
  });
});