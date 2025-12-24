import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, Landmark } from 'lucide-react';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoanModal: React.FC<LoanModalProps> = ({ isOpen, onClose }) => {
  const { players, currentPlayerIndex, takeLoan, repayLoan, bankTotal } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];
  const bank = bankTotal ?? 100000;
  
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'BORROW' | 'REPAY'>('BORROW');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) return;

    if (mode === 'BORROW') {
      if (val > bank) {
        alert('Bank has insufficient funds for this loan');
        return;
      }
      takeLoan(currentPlayer.id, val);
    } else {
      if (val > currentPlayer.loans) {
        alert('You cannot repay more than your outstanding loan!');
        return;
      }
      repayLoan(currentPlayer.id, val);
    }
    
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="text-amber-600" />
            Bank Loans
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl mb-6 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Current Debt</div>
              <div className="text-2xl font-black text-red-600">${currentPlayer.loans}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Bank Total</div>
              <div className="text-2xl font-black text-slate-800">${bank}</div>
            </div>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
          <button 
            onClick={() => setMode('BORROW')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'BORROW' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Borrow
          </button>
          <button 
            onClick={() => setMode('REPAY')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'REPAY' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Repay
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {mode === 'BORROW' ? 'Amount to Borrow' : 'Amount to Repay'}
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full text-2xl font-bold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-center"
              placeholder="0"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-white transition-colors mt-2 ${mode === 'BORROW' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {mode === 'BORROW' ? 'Take Loan' : 'Repay Loan'}
          </button>
        </form>
      </div>
    </div>
  );
};
