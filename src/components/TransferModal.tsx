import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, ArrowRightLeft } from 'lucide-react';
import { formatNumberInput } from '../lib/utils';
interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'PAY' | 'RECEIVE'; // PAY = Pay someone (or Bank), RECEIVE = Get from Bank (usually)
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, type }) => {
  const { players, currentPlayerIndex, updateBalance, transferMoney } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];
  
  const [amount, setAmount] = useState('');
  const [targetId, setTargetId] = useState<string>('BANK');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) return;

    if (type === 'PAY') {
      if (targetId === 'BANK') {
        updateBalance(currentPlayer.id, -val, 'OTHER', description || 'Paid Bank');
      } else {
        transferMoney(currentPlayer.id, targetId, val, description || 'Paid Player');
      }
    } else {
       // Receive usually from Bank in this simple modal
       // If we wanted to "Request" from player, it's a bit different, sticking to Bank for Receive for now
       updateBalance(currentPlayer.id, val, 'OTHER', description || 'Received from Bank');
    }
    
    setAmount('');
    setDescription('');
    onClose();
  };

  const otherPlayers = players.filter(p => p.id !== currentPlayer.id);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="text-blue-600" />
            {type === 'PAY' ? 'Make Payment' : 'Receive Funds'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full text-2xl font-bold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center"
              placeholder="0"
              autoFocus
            />
            {amount !== '' && <div className="text-xs text-slate-400 mt-1">Formatted: {formatNumberInput(amount)}</div>}
          </div>

          {type === 'PAY' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pay To</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="BANK">The Bank</option>
                {otherPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
             <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder={type === 'PAY' ? "Rent, Tax, Buying..." : "Salary, Reward..."}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors mt-2"
          >
            Confirm Transaction
          </button>
        </form>
      </div>
    </div>
  );
};
