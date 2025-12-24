import React, { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTokenById } from '../data/tokens';
import { ArrowRight, Briefcase, Building2, Landmark, ArrowRightLeft, Calculator } from 'lucide-react';
import { TransferModal } from './TransferModal';
import { LoanModal } from './LoanModal';
import { TradeModal } from './TradeModal';
import { CalculatorModal } from './CalculatorModal';
import { DiceRoller } from './DiceRoller';
import { calculateRent } from '../lib/utils';
import { UndoHistoryModal } from './UndoHistoryModal';

const ActionCenterComponent: React.FC = () => {
  const players = useGameStore(state => state.players);
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex);
  const nextTurn = useGameStore(state => state.nextTurn);
  const updateBalance = useGameStore(state => state.updateBalance);
  const movePlayer = useGameStore(state => state.movePlayer);
  const toggleJail = useGameStore(state => state.toggleJail);
  const incrementJailTurns = useGameStore(state => state.incrementJailTurns);
  const jailBailAmount = useGameStore(state => state.jailBailAmount ?? 50);
  const currentPlayer = players[currentPlayerIndex];

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'PAY' | 'RECEIVE'>('PAY');
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [calcModalOpen, setCalcModalOpen] = useState(false);

  // Manual move controls
  const [manualSteps, setManualSteps] = useState<number>(1);
  const [landedInfo, setLandedInfo] = useState<{ name: string; rent?: number; ownerName?: string; isOwn?: boolean; canBuy?: boolean; price?: number; taxAmount?: number } | null>(null);
  const [showManualResult, setShowManualResult] = useState(false);
  // Undo history for manual moves: stack of previous states
  const [moveHistory, setMoveHistory] = useState<Array<{ prevPos: number; prevIsJailed: boolean; passGoAwarded: number }>>([]);

  // End & Restart confirmation
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showUndoHistory, setShowUndoHistory] = useState(false);
  const endAndRestart = useGameStore(state => state.endAndRestart);

  const bank = useGameStore(state => state.bankTotal ?? 100000);
  const showBankLowWarning = useGameStore(state => state.showBankLowWarning ?? true);
  const bankLowThreshold = useGameStore(state => state.bankLowThreshold ?? 10000);
  const bankLow = showBankLowWarning && (bank < bankLowThreshold);
  const critical = bank < 1000;

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

  const analyzeLanding = async (pos: number, rollTotal: number) => {
    const property = (useGameStore.getState().properties || []).find(p => p.id === pos);
    if (!property) return null;

    const rent = calculateRent(property, useGameStore.getState().properties || [], rollTotal, useGameStore.getState().groupHouseRentMode ?? 'standard');
    const owner = (useGameStore.getState().players || []).find(p => p.id === property.ownerId);

    let taxAmount = 0;
    if (property.type === 'tax') {
      if ((property.name || '').includes('Income')) taxAmount = 200;
      else taxAmount = 100;
    }

    const info = {
      name: property.name,
      rent: rent > 0 ? rent : undefined,
      ownerName: owner ? owner.name : undefined,
      isOwn: property.ownerId === currentPlayer.id,
      canBuy: !property.ownerId && property.price ? true : false,
      price: property.price,
      taxAmount: taxAmount > 0 ? taxAmount : undefined
    };

    setLandedInfo(info);
    setShowManualResult(true);
    return info;
  };

  const moveBy = async (steps: number) => {
    const currentPos = currentPlayer.position || 0;
    const newPos = ((currentPos + steps) % 40 + 40) % 40;

    // Determine pass GO award
    const passGoAwarded = newPos < currentPos ? 200 : 0;

    // Push previous state to history for undo
    setMoveHistory(prev => [{ prevPos: currentPos, prevIsJailed: currentPlayer.isJailed, passGoAwarded }, ...prev]);

    // Pass GO
    if (passGoAwarded > 0) {
      await updateBalance(currentPlayer.id, passGoAwarded, 'PASS_GO', 'Passed GO');
    }

    await movePlayer(currentPlayer.id, newPos);
    await analyzeLanding(newPos, Math.abs(steps));
  };

  const handleMoveForward = async () => {
    await moveBy(Math.max(1, Math.floor(manualSteps)));
  };

  const handleMoveBack = async () => {
    await moveBy(-Math.max(1, Math.floor(manualSteps)));
  };

  const handleChanceAction = async (action: 'goToJail' | 'advanceGo' | 'back3' | 'move5') => {
    const currentPos = currentPlayer.position || 0;

    if (action === 'goToJail') {
      // save history
      setMoveHistory(prev => [{ prevPos: currentPos, prevIsJailed: currentPlayer.isJailed, passGoAwarded: 0 }, ...prev]);
      await movePlayer(currentPlayer.id, 10);
      // ensure jailed state set
      if (!currentPlayer.isJailed) await toggleJail(currentPlayer.id);
      setLandedInfo({ name: 'Sent to Jail', isOwn: false, canBuy: false });
      setShowManualResult(true);
      return;
    }
    if (action === 'advanceGo') {
      const newPos = 0;
      const passGoAwarded = newPos < currentPos ? 200 : 0;
      setMoveHistory(prev => [{ prevPos: currentPos, prevIsJailed: currentPlayer.isJailed, passGoAwarded }, ...prev]);
      if (passGoAwarded > 0) await updateBalance(currentPlayer.id, passGoAwarded, 'PASS_GO', 'Passed GO');
      await movePlayer(currentPlayer.id, newPos);
      await analyzeLanding(newPos, 0);
      return;
    }
    if (action === 'back3') {
      await moveBy(-3);
      return;
    }
    if (action === 'move5') {
      await moveBy(5);
      return;
    }
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
               <div className={"flex items-center gap-1 px-2 py-0.5 rounded font-bold text-xs border " + (critical ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-red-100 text-red-700 border-red-200') }>
                 <svg className={"w-3 h-3 " + (critical ? 'text-white' : '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                 {critical ? `CRITICAL: $${bank}` : `Bank Low: $${bank}`}
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

          {/* Manual Move / Chance Actions */}
          <div className="col-span-1 min-w-[70px] sm:min-w-0 flex gap-2 items-center">
            <input type="number" min={1} value={manualSteps} onChange={(e) => setManualSteps(Number(e.target.value))} className="w-12 p-2 border rounded text-sm" />
            <button onClick={handleMoveBack} title="Move Back" className="p-2 bg-slate-100 rounded">◀</button>
            <button onClick={handleMoveForward} title="Move Forward" className="p-2 bg-slate-900 text-white rounded">▶</button>
            <button onClick={async () => {
              const entry = moveHistory[0];
              if (!entry) return;
              // Undo: restore position, reverse pass GO award, restore jail state
              await movePlayer(currentPlayer.id, entry.prevPos);
              if ((useGameStore.getState().players.find(p => p.id === currentPlayer.id)?.isJailed) !== entry.prevIsJailed) {
                await toggleJail(currentPlayer.id);
              }
              if (entry.passGoAwarded && entry.passGoAwarded > 0) {
                await updateBalance(currentPlayer.id, -entry.passGoAwarded, 'OTHER', 'Undo Pass GO');
              }

              // Record UNDO action in transactions so it's visible server-side
              await useGameStore.getState().recordUndo(currentPlayer.id, `Undo manual move (restored to ${entry.prevPos})`);

              // pop history
              setMoveHistory(prev => prev.slice(1));
              setShowManualResult(false);
            }} title="Undo" className="relative p-2 bg-yellow-100 rounded">
              ↶
              {moveHistory.length > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold">{moveHistory.length}</span>
              )}
            </button>
          </div>

          <div className="col-span-1 min-w-[70px] sm:min-w-0">
            <div className="flex gap-1">
              <button onClick={() => handleChanceAction('goToJail')} className="p-2 bg-red-600 text-white rounded text-xs">Chance: Jail</button>
              <button onClick={() => handleChanceAction('back3')} className="p-2 bg-slate-100 rounded text-xs">Back 3</button>
              <button onClick={() => handleChanceAction('advanceGo')} className="p-2 bg-slate-100 rounded text-xs">Advance GO</button>
            </div>
          </div>

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
            onClick={() => setShowEndConfirm(true)}
            className="min-w-[70px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 active:scale-95 transition-all"
            title="End Game & Restart"
          >
            <ArrowRight className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">End Game</span>
          </button>
          <button onClick={() => setShowUndoHistory(true)} className="min-w-[70px] sm:min-w-0 flex flex-col items-center justify-center p-3 bg-slate-700 text-white rounded-xl shadow hover:bg-slate-800">
            <span className="text-[10px] font-bold">Undo History</span>
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

      {/* Manual Move Result Popover */}
      {showManualResult && landedInfo && (
        <div className="absolute bottom-24 left-4 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 w-72 z-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold">Landed On</div>
              <div className="font-bold text-slate-900">{landedInfo.name}</div>
            </div>
            <button onClick={() => setShowManualResult(false)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
          {landedInfo.price && <div className="text-sm">Price: ${landedInfo.price}</div>}
          {landedInfo.rent && <div className="text-sm">Rent: ${landedInfo.rent}</div>}
          {landedInfo.taxAmount && <div className="text-sm">Tax: ${landedInfo.taxAmount}</div>}
          {landedInfo.canBuy && (
            <button onClick={async () => {
              const p = (useGameStore.getState().properties || []).find(pp => pp.name === landedInfo.name);
              if (!p) return;
              if ((useGameStore.getState().players || []).find(pl => pl.id === p.ownerId)) return; // already owned
              if ((useGameStore.getState().players || []).find(pl => pl.id === useGameStore.getState().players[useGameStore.getState().currentPlayerIndex].id)?.balance || 0 < (p.price || 0)) return;
              await useGameStore.getState().updateBalance(useGameStore.getState().players[useGameStore.getState().currentPlayerIndex].id, -(p.price || 0), 'BUY_PROPERTY', `Bought ${p.name}`);
              await useGameStore.getState().assignProperty(p.id, useGameStore.getState().players[useGameStore.getState().currentPlayerIndex].id);
              setShowManualResult(false);
            }} className="mt-2 w-full bg-indigo-600 text-white p-2 rounded">Buy</button>
          )}
        </div>
      )}
      
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

      {/* End & Restart confirmation */}
      {showEndConfirm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2 text-red-700">End Game & Restart</h3>
            <p className="text-sm text-slate-600 mb-4">This will end the current game and return you to the setup screen where players will be preserved and ready for editing. Continue?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowEndConfirm(false)} className="flex-1 px-4 py-2 rounded bg-slate-100">Cancel</button>
              <button onClick={async () => { if (typeof endAndRestart === 'function') await endAndRestart(); setShowEndConfirm(false); }} className="flex-1 px-4 py-2 rounded bg-red-600 text-white">End & Restart</button>
            </div>
          </div>
        </div>
      )}

      <UndoHistoryModal isOpen={showUndoHistory} onClose={() => setShowUndoHistory(false)} />
    </div>
  );
};

export const ActionCenter = React.memo(ActionCenterComponent);
