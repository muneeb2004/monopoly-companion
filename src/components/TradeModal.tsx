import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, ArrowRightLeft, DollarSign, Home } from 'lucide-react';
import { cn } from '../lib/utils';


interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose }) => {
  const { players, properties, currentPlayerIndex, createTrade } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];
  
  const [receiverId, setReceiverId] = useState<string>('');
  const [offeredMoney, setOfferedMoney] = useState<number>(0);
  const [requestedMoney, setRequestedMoney] = useState<number>(0);
  const [offeredPropIds, setOfferedPropIds] = useState<number[]>([]);
  const [requestedPropIds, setRequestedPropIds] = useState<number[]>([]);
  const [step, setStep] = useState<1 | 2>(1); // 1 = Select Player/Cash, 2 = Select Properties

  const otherPlayers = useMemo(() => players.filter(p => p.id !== currentPlayer.id), [players, currentPlayer]);
  
  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setReceiverId(otherPlayers[0]?.id || '');
      setOfferedMoney(0);
      setRequestedMoney(0);
      setOfferedPropIds([]);
      setRequestedPropIds([]);
    }
  }, [isOpen, otherPlayers]);

  if (!isOpen) return null;

  const currentPlayerProperties = properties.filter(p => p.ownerId === currentPlayer.id);
  const receiverProperties = properties.filter(p => p.ownerId === receiverId);

  const handleSubmit = async () => {
    if (!receiverId) return;
    await createTrade(receiverId, offeredMoney, requestedMoney, offeredPropIds, requestedPropIds);
    onClose();
  };

  const toggleProperty = (id: number, type: 'OFFER' | 'REQUEST') => {
    if (type === 'OFFER') {
      setOfferedPropIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    } else {
      setRequestedPropIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="text-slate-700" />
            Propose Trade
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 ? (
            <div className="space-y-6">
              {/* Select Partner */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Trade With</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {otherPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setReceiverId(p.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border-2 transition-all",
                        receiverId === p.id 
                          ? "border-blue-600 bg-blue-50" 
                          : "border-slate-100 hover:border-slate-300"
                      )}
                    >
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-bold text-slate-700 text-sm truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Money Exchange */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                     <DollarSign size={16} className="text-red-500"/> You Offer
                   </label>
                   <input
                     type="number"
                     value={offeredMoney || ''}
                     onChange={e => setOfferedMoney(Math.max(0, Number(e.target.value)))}
                     className="w-full text-xl font-bold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-200 outline-none"
                     placeholder="0"
                   />
                   <div className="text-xs text-slate-400 mt-1">Max: ${currentPlayer.balance}</div>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                     <DollarSign size={16} className="text-green-500"/> You Request
                   </label>
                   <input
                     type="number"
                     value={requestedMoney || ''}
                     onChange={e => setRequestedMoney(Math.max(0, Number(e.target.value)))}
                     className="w-full text-xl font-bold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 outline-none"
                     placeholder="0"
                   />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Your Properties */}
              <div className="flex flex-col h-full">
                 <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                   <Home size={16} className="text-red-500"/> Your Properties
                 </h4>
                 <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-2 bg-slate-50">
                    {currentPlayerProperties.length === 0 && <div className="text-xs text-slate-400 p-2 italic">No properties owned</div>}
                    {currentPlayerProperties.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleProperty(p.id, 'OFFER')}
                        className={cn(
                          "w-full text-left p-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2",
                          offeredPropIds.includes(p.id) ? "bg-red-100 border-red-300 text-red-900" : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                         <div className={`w-3 h-3 rounded-full shrink-0 property-group-${p.group}`} />
                         <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                 </div>
              </div>

              {/* Their Properties */}
              <div className="flex flex-col h-full">
                 <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                   <Home size={16} className="text-green-500"/> Their Properties
                 </h4>
                 <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-2 bg-slate-50">
                    {receiverProperties.length === 0 && <div className="text-xs text-slate-400 p-2 italic">No properties owned</div>}
                    {receiverProperties.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleProperty(p.id, 'REQUEST')}
                        className={cn(
                          "w-full text-left p-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2",
                          requestedPropIds.includes(p.id) ? "bg-green-100 border-green-300 text-green-900" : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                         <div className={`w-3 h-3 rounded-full shrink-0 property-group-${p.group}`} />
                         <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => step === 1 ? setStep(2) : handleSubmit()}
            disabled={!receiverId}
            className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {step === 1 ? 'Next: Select Properties' : 'Propose Trade'}
          </button>
        </div>
      </div>
    </div>
  );
};
