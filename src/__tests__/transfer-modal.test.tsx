import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransferModal } from '../components/TransferModal';

describe('TransferModal numeric hint', () => {
  it('shows formatted hint when typing amount', () => {
    const onClose = () => {};
    const { container } = render(<TransferModal isOpen={true} onClose={onClose} type="PAY" />);
    const amount = container.querySelector('input[placeholder="0"]') as HTMLInputElement;
    fireEvent.change(amount, { target: { value: '1500' } });
    expect(container.textContent).toContain('Formatted:');
  });
});
