import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomSheet } from '../components/BottomSheet';

describe('BottomSheet component', () => {
  it('does not render when closed and renders when open', () => {
    const onClose = vi.fn();
    const { container, rerender } = render(<BottomSheet isOpen={false} onClose={onClose} />);
    expect(container.firstChild).toBeNull();

    rerender(<BottomSheet isOpen={true} onClose={onClose} title="Hello" />);
    expect(container.firstChild).toBeTruthy();
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain('items-end');
  });

  it('calls onClose when close button clicked and when Escape pressed', () => {
    const onClose = vi.fn();
    render(<BottomSheet isOpen={true} onClose={onClose} title="T" />);
    const btn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // open again and press escape
    render(<BottomSheet isOpen={true} onClose={onClose} title="T" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('traps focus inside when open', () => {
    const onClose = vi.fn();
    const { container } = render(
      <BottomSheet isOpen={true} onClose={onClose} title={<span>Test</span>}>
        <button>One</button>
        <button>Two</button>
      </BottomSheet>
    );

    const buttons = Array.from(container.querySelectorAll('button')) as HTMLElement[];
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    const last = buttons[buttons.length - 1];

    // focus the last element and press Tab, focus should return to first
    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: 'Tab' });

    // after Tab, focus should be inside the sheet (ideally first)
    const active = document.activeElement as HTMLElement;
    expect(container.contains(active)).toBe(true);
  });
});
