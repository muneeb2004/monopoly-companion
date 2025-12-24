import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsModal } from '../components/SettingsModal';
import { useGameStore } from '../store/gameStore';

describe('SettingsModal UI', () => {
  it('shows saving indicator and applies overrides', async () => {
    useGameStore.setState({ properties: [{ id: 1, name: 'P1', type: 'street', group: 'brown', price: 100, rent: [10], houses:0, isMortgaged:false }] });

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
      await new Promise(res => setTimeout(res, 1500));
    });

    expect(screen.queryByText('Saving...')).toBeNull();
    // verify state updated
    const p = useGameStore.getState().properties.find(p => p.id === 1);
    expect(p?.priceOverride).toBe(250);
  });

  it('shows formatted hint for starting money input', () => {
    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);

    const smInput = screen.getByLabelText('Starting Money') as HTMLInputElement;
    fireEvent.change(smInput, { target: { value: '2000' } });

    // The formatted hint should be visible (at least one formatted hint present)
    expect(screen.queryAllByText(/Formatted:/).length).toBeGreaterThan(0);
  });

  it('stacks bank threshold inputs on mobile and aligns modal to bottom', () => {
    const onClose = vi.fn();
    const { container } = render(<SettingsModal isOpen={true} onClose={onClose} />);

    // Modal overlay should use mobile-friendly alignment classes
    const overlay = container.firstChild as HTMLElement;
    expect(overlay?.className).toContain('items-end');

    // The bank threshold area should stack on mobile (grid-cols-1 by default)
    const bankGrid = container.querySelector('.mt-3.grid');
    expect(bankGrid).toBeTruthy();
    expect(bankGrid?.className).toContain('grid-cols-1');
  });
});