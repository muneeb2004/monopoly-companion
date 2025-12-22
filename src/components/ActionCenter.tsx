import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTokenById } from '../data/tokens';
import { ArrowRight, Briefcase, Building2, Landmark, ArrowRightLeft, Calculator } from 'lucide-react';
import { TransferModal } from './TransferModal';
import { LoanModal } from './LoanModal';
import { TradeModal } from './TradeModal';
import { CalculatorModal } from './CalculatorModal';
import { DiceRoller } from './DiceRoller';

export const ActionCenter: React.FC = () => {
  const { players, currentPlayerIndex, nextTurn, updateBalance, toggleJail } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'PAY' | 'RECEIVE'>('PAY');
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [calcModalOpen, setCalcModalOpen] = useState(false);

  // Manual Pass GO backup (hidden in UI but accessible if needed via other means? No, let's keep it simple)
  // We will replace the button with DiceRoller

  const openPayModal = () => {
    setModalType('PAY');
    setModalOpen(true);
  };
  
  const openReceiveModal = () => {
    setModalType('RECEIVE');
    setModalOpen(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        
        {/* Current Player Info Bar */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-lg shadow-sm relative">
                {getTokenById(currentPlayer.token || 'dog')?.emoji}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white" style={{ backgroundColor: currentPlayer.color }} />
             </div>
             <span className="font-bold text-slate-800">{currentPlayer.name}'s Turn</span>
           </div>
           <div className="flex gap-2">
             {currentPlayer.loans > 0 && (
               <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">Debt: ${currentPlayer.loans}</span>
             )}
             {currentPlayer.isJailed && (
               <button 
                 onClick={() => {
                   updateBalance(currentPlayer.id, -50, 'OTHER', 'Paid Bail');
                   toggleJail(currentPlayer.id);
                 }}
                 className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium hover:bg-red-200"
               >
                 Pay $50 Bail
               </button>
             )}
           </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Slot 1: Dice Roller (Replaces simple Pass GO) */}
          <DiceRoller onRollComplete={(pos) => console.log('Landed on', pos)} />

          <button 
             onClick={openPayModal}
             className="flex flex-col items-center justify-center p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 hover:bg-red-100 active:scale-95 transition-all"
          >
            <Briefcase className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Pay</span>
          </button>
          
           <button 
             onClick={openReceiveModal}
             className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 hover:bg-blue-100 active:scale-95 transition-all"
          >
            <Building2 className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Receive</span>
          </button>

          <button 
             onClick={() => setLoanModalOpen(true)}
             className="flex flex-col items-center justify-center p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 hover:bg-amber-100 active:scale-95 transition-all"
          >
            <Landmark className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Loan</span>
          </button>

          <button 
             onClick={() => setTradeModalOpen(true)}
             className="flex flex-col items-center justify-center p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200 hover:bg-purple-100 active:scale-95 transition-all"
          >
            <ArrowRightLeft className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Trade</span>
          </button>

          <button 
             onClick={() => setCalcModalOpen(true)}
             className="flex flex-col items-center justify-center p-3 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-200 active:scale-95 transition-all"
          >
            <Calculator className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Calc</span>
          </button>

          <button 
            onClick={nextTurn}
            className="flex flex-col items-center justify-center p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
          >
            <ArrowRight className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">End</span>
          </button>
        </div>
      </div>

      <TransferModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        type={modalType} 
      />
      
      <LoanModal
        isOpen={loanModalOpen}
        onClose={() => setLoanModalOpen(false)}
      />

      <TradeModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
      />

      <CalculatorModal
        isOpen={calcModalOpen}
        onClose={() => setCalcModalOpen(false)}
      />
    </div>
  );
};
