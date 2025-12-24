import React, { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTokenById } from '../data/tokens';
import { ArrowRight, Briefcase, Building2, Landmark, ArrowRightLeft, Calculator } from 'lucide-react';
import { TransferModal } from './TransferModal';
import { LoanModal } from './LoanModal';
import { TradeModal } from './TradeModal';
import { CalculatorModal } from './CalculatorModal';
import { DiceRoller } from './DiceRoller';

const ActionCenterComponent: React.FC = () => {
  const players = useGameStore(state => state.players);
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex);
  const nextTurn = useGameStore(state => state.nextTurn);
  const updateBalance = useGameStore(state => state.updateBalance);
  const toggleJail = useGameStore(state => state.toggleJail);
  const incrementJailTurns = useGameStore(state => state.incrementJailTurns);
  const jailBailAmount = useGameStore(state => state.jailBailAmount ?? 50);
  const currentPlayer = players[currentPlayerIndex];

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'PAY' | 'RECEIVE'>('PAY');
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [calcModalOpen, setCalcModalOpen] = useState(false);

  const bank = useGameStore(state => state.bankTotal ?? 100000);
  const showBankLowWarning = useGameStore(state => state.showBankLowWarning ?? true);
  const bankLow = showBankLowWarning && (bank < 10000);

  // Manual Pass GO backup (hidden in UI but accessible if needed via other means? No, let's keep it simple)
  // We will replace the button with DiceRoller

  const openPayModal = useCallback(() => {
    setModalType('PAY');
    setModalOpen(true);
  }, []);
  
  const openReceiveModal = useCallback(() => {
    setModalType('RECEIVE');
    setModalOpen(true);
  }, []);

  const handlePayBail = async () => {
    await updateBalance(currentPlayer.id, -jailBailAmount, 'OTHER', 'Paid Bail');
    await toggleJail(currentPlayer.id);
    await nextTurn();
  };

  const handleSkipTurn = async () => {
    await incrementJailTurns(currentPlayer.id);
    await nextTurn();
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
           <div className="flex gap-2 items-center">
             {currentPlayer.loans > 0 && (
               <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">Debt: ${currentPlayer.loans}</span>
             )}
             {currentPlayer.isJailed && (
               <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">
                 In Jail (Turn {currentPlayer.jailTurns || 0}/3)
               </span>
             )}
             {/* Bank low indicator */}
             {bankLow && (
               <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-xs border border-red-200">
                 <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                 Bank Low: ${bank}
               </div>
             )}
           </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:pb-0 no-scrollbar">
          
          {/* Jail Actions or Dice Roller */}
          {currentPlayer.isJailed ? (
            <>
               <button 
                onClick={handlePayBail}
                className="col-span-1 min-w-[100px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 hover:bg-red-100 active:scale-95 transition-all"
              >
                <div className="font-bold text-[10px]">PAY ${jailBailAmount}</div>
                <div className="text-[9px] opacity-75">Get Out Now</div>
              </button>
              
              <button 
                onClick={handleSkipTurn}
                className="col-span-1 min-w-[100px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-200 active:scale-95 transition-all"
              >
                <div className="font-bold text-[10px]">SKIP TURN</div>
                <div className="text-[9px] opacity-75">Serve Time</div>
              </button>
            </>
          ) : (
            <div className="min-w-[70px] sm:min-w-0">
               <DiceRoller onRollComplete={(pos) => console.log('Landed on', pos)} />
            </div>
          )}

          {!currentPlayer.isJailed && (
            <>
              <button 
                onClick={openPayModal}
                className="min-w-[70px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 hover:bg-red-100 active:scale-95 transition-all"
              >
                <Briefcase className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">Pay</span>
              </button>
              
              <button 
                onClick={openReceiveModal}
                className="min-w-[70px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 hover:bg-blue-100 active:scale-95 transition-all"
              >
                <Building2 className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">Receive</span>
              </button>
            </>
          )}

          <button 
             onClick={() => setLoanModalOpen(true)}
             className="min-w-[70px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 hover:bg-amber-100 active:scale-95 transition-all"
          >
            <Landmark className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Loan</span>
          </button>

          <button 
             onClick={() => setTradeModalOpen(true)}
             className="min-w-[70px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200 hover:bg-purple-100 active:scale-95 transition-all"
          >
            <ArrowRightLeft className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Trade</span>
          </button>

          <button 
             onClick={() => setCalcModalOpen(true)}
             className="min-w-[70px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-200 active:scale-95 transition-all lg:hidden"
          >
            <Calculator className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Calc</span>
          </button>

          <button 
            onClick={nextTurn}
            className="min-w-[70px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
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

export const ActionCenter = React.memo(ActionCenterComponent);
