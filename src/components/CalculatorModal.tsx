import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, Delete, User, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const { players, currentPlayerIndex, updateBalance } = useGameStore();
  
  // Default to current player
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [value, setValue] = useState<string>('0');
  
  // Update selected player when modal opens or current player changes
  React.useEffect(() => {
    if (isOpen && players.length > 0) {
      setSelectedPlayerId(players[currentPlayerIndex].id);
      setValue('0');
    }
  }, [isOpen, currentPlayerIndex, players]);

  if (!isOpen) return null;

  const handleNumberClick = (num: string) => {
    setValue(prev => {
      if (prev === '0') return num;
      if (prev.length >= 9) return prev; // Max length limit
      return prev + num;
    });
  };

  const handleBackspace = () => {
    setValue(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setValue('0');
  };

  const executeTransaction = (type: 'ADD' | 'DEDUCT') => {
    const amount = parseInt(value, 10);
    if (amount <= 0 || !selectedPlayerId) return;

    const finalAmount = type === 'ADD' ? amount : -amount;
    const description = type === 'ADD' ? 'Manual Deposit' : 'Manual Deduction';
    
    updateBalance(selectedPlayerId, finalAmount, 'OTHER', description);
    
    // Optional: Close on success or just reset value? 
    // Usually convenient to close, but for a "banker" mode maybe keeping open is better.
    // Let's close for now to be consistent with other modals.
    onClose();
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Calculator size={20} />
            <span>Quick Calculator</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Player Selector */}
        <div className="p-4 border-b border-slate-100 overflow-x-auto">
          <div className="flex gap-2">
            {players.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all whitespace-nowrap",
                  selectedPlayerId === p.id 
                    ? "border-slate-800 bg-slate-800 text-white" 
                    : "border-slate-100 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                <div 
                  className="w-3 h-3 rounded-full border border-white/50" 
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-sm font-bold">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="p-6 bg-slate-900 text-white text-right">
          <div className="text-sm text-slate-400 font-medium mb-1">
             {selectedPlayer ? `Adjusting ${selectedPlayer.name}'s Balance` : 'Select a Player'}
          </div>
          <div className="text-5xl font-mono tracking-tight font-bold">
            {parseInt(value).toLocaleString()}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 grid grid-cols-3 gap-3 bg-slate-50">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-16 rounded-xl bg-white shadow-sm border border-slate-200 text-2xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={handleClear}
            className="h-16 rounded-xl bg-red-50 shadow-sm border border-red-100 text-lg font-bold text-red-600 hover:bg-red-100 active:scale-95 transition-all"
          >
            C
          </button>
          
          <button
            onClick={() => handleNumberClick('0')}
            className="h-16 rounded-xl bg-white shadow-sm border border-slate-200 text-2xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-16 rounded-xl bg-slate-100 shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete size={24} />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 grid grid-cols-2 gap-4 bg-white border-t border-slate-100">
          <button
            onClick={() => executeTransaction('DEDUCT')}
            disabled={value === '0' || !selectedPlayerId}
            className="h-14 rounded-xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200"
          >
            - Deduct
          </button>
          <button
            onClick={() => executeTransaction('ADD')}
            disabled={value === '0' || !selectedPlayerId}
            className="h-14 rounded-xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
};
