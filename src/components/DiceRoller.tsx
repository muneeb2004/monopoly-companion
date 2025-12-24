import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { calculateRent } from '../lib/utils';
import { cn } from '../lib/utils';
import { Dices, MapPin, ArrowRight, Settings2 } from 'lucide-react';

interface DiceRollerProps {
  onRollComplete: (landedPropertyId: number) => void;
}

const DiceRollerComponent: React.FC<DiceRollerProps> = ({ onRollComplete }) => {
  const players = useGameStore(state => state.players);
  const properties = useGameStore(state => state.properties);
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex);
  const movePlayer = useGameStore(state => state.movePlayer);
  const updateBalance = useGameStore(state => state.updateBalance);
  const diceMode = useGameStore(state => state.diceMode);
  const setDiceMode = useGameStore(state => state.setDiceMode);
  const currentPlayer = players[currentPlayerIndex];

  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [showResult, setShowResult] = useState(false);
  
  // Physical Mode State
  const [manualValue, setManualValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
      const [landedInfo, setLandedInfo] = useState<{
      name: string;
      rent?: number;
      ownerName?: string;
      isOwn?: boolean;
      canBuy?: boolean;
      price?: number;
      taxAmount?: number;
    } | null>(null);
  
    // Focus input when switching to physical mode
    useEffect(() => {
    if (diceMode === 'PHYSICAL' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [diceMode]);

  const toggleMode = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent clicks if any
    const newMode = diceMode === 'DIGITAL' ? 'PHYSICAL' : 'DIGITAL';
    await setDiceMode(newMode);
  }, [diceMode, setDiceMode]);

  const startDigitalRoll = () => {
    if (rolling || showResult) return;
    
    setRolling(true);
    setShowResult(false);
    setLandedInfo(null);
    
    let count = 0;
    const interval = setInterval(() => {
      setDice([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
      count++;
      if (count > 10) {
        clearInterval(interval);
        finishDigitalRoll();
      }
    }, 100);
  };

  const finishDigitalRoll = async () => {
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    setDice([d1, d2]);
    setRolling(false);
    await processMove(d1 + d2);
  };

  const handleManualSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = parseInt(manualValue, 10);
    if (!val || val < 1 || val > 12) return;
    
    // Set visual dice for result screen
    const d1 = Math.ceil(val / 2);
    const d2 = val - d1;
    setDice([d1, d2]); 
    
    await processMove(val);
    setManualValue('');
  };

  const processMove = async (total: number) => {
    const currentPos = currentPlayer.position || 0;
    let newPos = (currentPos + total) % 40;
    
    // Pass GO logic
    if (newPos < currentPos) {
       await updateBalance(currentPlayer.id, 200, 'PASS_GO', 'Passed GO');
    }

    // Go To Jail Logic
    if (newPos === 30) {
      await movePlayer(currentPlayer.id, 10);
      await useGameStore.getState().toggleJail(currentPlayer.id);
      onRollComplete(10);
      setLandedInfo({
        name: 'Sent to Jail',
        isOwn: false,
        canBuy: false,
      });
      setShowResult(true);
      return;
    }

    await movePlayer(currentPlayer.id, newPos);
    
    analyzeLanding(newPos, total);
    onRollComplete(newPos);
    setShowResult(true);
  };

  const analyzeLanding = (pos: number, rollTotal: number) => {
    const property = properties.find(p => p.id === pos);
    if (!property) return;

    const rent = calculateRent(property, properties, rollTotal);
    const owner = players.find(p => p.id === property.ownerId);

    // Tax Logic
    let taxAmount = 0;
    if (property.name === 'Income Tax') taxAmount = 200;
    if (property.name === 'Luxury Tax') taxAmount = 100;

    setLandedInfo({
      name: property.name,
      rent: rent > 0 ? rent : undefined,
      ownerName: owner ? owner.name : undefined,
      isOwn: property.ownerId === currentPlayer.id,
      canBuy: !property.ownerId && property.price ? true : false,
      price: property.price,
      taxAmount: taxAmount > 0 ? taxAmount : undefined
    });
  };

  const handlePayRent = async () => {
    if (!landedInfo?.rent) return;
    const property = properties.find(p => p.name === landedInfo.name);
    if (!property || !property.ownerId) return;

    await updateBalance(currentPlayer.id, -landedInfo.rent, 'RENT', `Paid Rent for ${property.name}`, property.ownerId);
    setShowResult(false);
  };

  const handlePayTax = async () => {
    if (!landedInfo?.taxAmount) return;
    await updateBalance(currentPlayer.id, -landedInfo.taxAmount, 'TAX', `Paid ${landedInfo.name}`);
    setShowResult(false);
  };

  const handleBuy = async () => {
    if (!landedInfo?.price) return;
    const property = properties.find(p => p.name === landedInfo.name);
    if (!property) return;
    
    if (currentPlayer.balance < landedInfo.price) return;

    await updateBalance(currentPlayer.id, -landedInfo.price, 'BUY_PROPERTY', `Bought ${property.name}`);
    useGameStore.getState().assignProperty(property.id, currentPlayer.id);
    setShowResult(false);
  };

  return (
    <div className="relative h-full">
      {diceMode === 'DIGITAL' ? (
        <button 
          onClick={startDigitalRoll}
          disabled={rolling || showResult}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl border transition-all w-full h-full relative group",
            showResult ? "bg-slate-100 border-slate-300 text-slate-400" : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 active:scale-95"
          )}
        >
          <Dices className={cn("w-6 h-6 mb-1", rolling && "animate-spin")} />
          <span className="text-[10px] font-bold">{rolling ? 'Rolling' : 'Roll Dice'}</span>
          
          {/* Mode Switcher */}
          <div 
            onClick={toggleMode}
            className="absolute top-1 right-1 p-1 rounded-full text-indigo-300 hover:bg-indigo-200 hover:text-indigo-600 transition-colors"
            title="Switch to Physical Dice"
          >
            <Settings2 size={12} />
          </div>
        </button>
      ) : (
        <form 
          onSubmit={handleManualSubmit}
          className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-white w-full h-full relative"
        >
          <div className="flex items-center gap-1 w-full justify-center mb-1">
             <input
               ref={inputRef}
               type="number"
               min="1"
               max="12"
               value={manualValue}
               onChange={(e) => setManualValue(e.target.value)}
               placeholder="#"
               className="w-8 h-8 text-center border-b-2 border-slate-200 focus:border-slate-800 outline-none font-bold text-lg p-0 bg-transparent"
             />
          </div>
          <button 
             type="submit"
             disabled={!manualValue}
             className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5 hover:text-blue-600 disabled:opacity-50"
          >
             MOVE <ArrowRight size={10} />
          </button>

          {/* Mode Switcher */}
          <div 
            onClick={toggleMode}
            className="absolute top-1 right-1 p-1 rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Switch to Digital Dice"
          >
            <Settings2 size={12} />
          </div>
        </form>
      )}

      {/* Result Popover */}
      {showResult && landedInfo && (
        <div className="absolute bottom-full left-0 mb-4 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-bottom-5 z-[100]">
          <div className="flex justify-between items-start mb-3">
             <div className="flex gap-2">
               <div className={cn("p-2 rounded-lg bg-slate-100 font-bold text-lg border border-slate-200")}>{dice[0]}</div>
               {dice[1] > 0 && (
                 <div className={cn("p-2 rounded-lg bg-slate-100 font-bold text-lg border border-slate-200")}>{dice[1]}</div>
               )}
               <div className="flex flex-col justify-center ml-2">
                 <span className="text-xs text-slate-400 uppercase font-bold">Total</span>
                 <span className="text-xl font-bold text-slate-800 leading-none">{dice[0] + dice[1]}</span>
               </div>
             </div>
             <button onClick={() => setShowResult(false)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
          
          <div className="mb-3">
            <div className="text-xs text-slate-500 font-bold uppercase">Landed On</div>
            <div className="font-bold text-slate-900 text-lg flex items-center gap-1">
              <MapPin size={16} /> {landedInfo.name}
            </div>
          </div>

          {landedInfo.isOwn && (
             <div className="bg-green-50 text-green-700 p-2 rounded text-xs font-bold text-center">
               You own this property.
             </div>
          )}

          {landedInfo.ownerName && !landedInfo.isOwn && landedInfo.rent !== undefined && (
            <div className="space-y-2">
              <div className="text-sm">
                Owned by <span className="font-bold">{landedInfo.ownerName}</span>.
                <div className="text-red-600 font-bold">Rent: ${landedInfo.rent}</div>
              </div>
              <button 
                onClick={handlePayRent}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700"
              >
                Pay Rent
              </button>
            </div>
          )}

          {landedInfo.canBuy && landedInfo.price && (
            <div className="space-y-2">
              <div className="text-sm">
                Unowned. <span className="font-bold text-green-600">Price: ${landedInfo.price}</span>
              </div>
              <button 
                onClick={handleBuy}
                disabled={currentPlayer.balance < landedInfo.price}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Buy Property
              </button>
            </div>
          )}

          {landedInfo.taxAmount && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-bold text-red-600">Tax Due: ${landedInfo.taxAmount}</span>
              </div>
              <button 
                onClick={handlePayTax}
                disabled={currentPlayer.balance < landedInfo.taxAmount}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Pay Tax
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DiceRoller = React.memo(DiceRollerComponent);