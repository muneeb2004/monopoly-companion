import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Delete, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';

export const SideCalculator: React.FC = () => {
  const players = useGameStore(state => state.players);
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex);
  const updateBalance = useGameStore(state => state.updateBalance);
  
  const [isOpen, setIsOpen] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [value, setValue] = useState<string>('0');
  
  // Update selected player when current player changes
  useEffect(() => {
    if (players.length > 0) {
      setSelectedPlayerId(players[currentPlayerIndex].id);
    }
  }, [currentPlayerIndex, players]);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleNumberClick(e.key);
      }
      // Backspace
      else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
      // Clear (Escape or Delete or c/C)
      else if (e.key === 'Escape' || e.key === 'Delete' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
      // Enter (Trigger Add)
      else if (e.key === 'Enter') {
         e.preventDefault();
         executeTransaction('ADD');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, value, selectedPlayerId]);

  const handleNumberClick = (num: string) => {
    setValue(prev => {
      if (prev === '0') return num;
      if (prev.length >= 9) return prev;
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
    setValue('0');
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <div className={cn(
      "fixed right-0 z-60 transition-all duration-300 flex",
      // Small screens: sit above bottom action card; Large screens: center vertically
      "bottom-20 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto",
      isOpen ? "translate-x-0" : "translate-x-[calc(100%-24px)]"
    )}>
      {/* Toggle Tab */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 bg-slate-800 text-white p-2 rounded-l-xl shadow-lg hover:bg-slate-700 flex flex-col items-center gap-2 py-4 border-r border-slate-700"
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        <Calculator size={20} />
      </button>

      {/* Calculator Body */}
      <div className="bg-white border-l border-y border-slate-200 shadow-2xl rounded-l-2xl w-80 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-700 text-sm">Quick Banker</span>
        </div>

        {/* Player Selector */}
        <div className="p-2 border-b border-slate-100 overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {players.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all whitespace-nowrap min-w-[80px]",
                  selectedPlayerId === p.id 
                    ? "border-slate-800 bg-slate-800 text-white" 
                    : "border-slate-100 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full border border-white/50" 
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-xs font-bold truncate max-w-[60px]">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="p-4 bg-slate-900 text-white text-right">
          <div className="text-xs text-slate-400 font-medium mb-1 truncate">
             {selectedPlayer ? `${selectedPlayer.name}` : 'Select Player'}
          </div>
          <div className="text-3xl font-mono tracking-tight font-bold">
            {parseInt(value).toLocaleString()}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-3 grid grid-cols-3 gap-3 bg-slate-50 flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-16 rounded-xl bg-white shadow-sm border border-slate-200 text-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
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
            className="h-16 rounded-xl bg-white shadow-sm border border-slate-200 text-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-16 rounded-xl bg-slate-100 shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className="p-3 grid grid-cols-2 gap-3 bg-white border-t border-slate-100">
          <button
            onClick={() => executeTransaction('DEDUCT')}
            disabled={value === '0' || !selectedPlayerId}
            className="h-14 rounded-xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            - Deduct
          </button>
          <button
            onClick={() => executeTransaction('ADD')}
            disabled={value === '0' || !selectedPlayerId}
            className="h-14 rounded-xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
};
