import React from 'react';
import { useGameStore } from '../store/gameStore';
import { INITIAL_PROPERTIES } from '../data/properties';
import { X } from 'lucide-react';
import { getTokenById } from '../data/tokens';

interface BoardMapProps {
  isOpen: boolean;
  onClose?: () => void;
  isSpectator?: boolean;
}

export const BoardMap: React.FC<BoardMapProps> = ({ isOpen, onClose, isSpectator = false }) => {
  const { players, properties } = useGameStore();

  if (!isOpen) return null;

  // Helper to get grid position
  const getGridStyle = (index: number) => {
    let row = 1;
    let col = 1;

    if (index === 0) { // GO
      row = 11; col = 11;
    } else if (index < 10) { // Bottom
      row = 11; col = 11 - index;
    } else if (index === 10) { // Jail
      row = 11; col = 1;
    } else if (index < 20) { // Left
      row = 11 - (index - 10); col = 1;
    } else if (index === 20) { // Free Parking
      row = 1; col = 1;
    } else if (index < 30) { // Top
      row = 1; col = 1 + (index - 20);
    } else if (index === 30) { // Go To Jail
      row = 1; col = 11;
    } else { // Right
      row = 1 + (index - 30); col = 11;
    }

    return {
      gridRow: row,
      gridColumn: col,
    };
  };

  const getPropertyColor = (group: string) => {
    switch (group) {
      case 'brown': return 'bg-[#8B4513]';
      case 'lightBlue': return 'bg-[#87CEEB]';
      case 'pink': return 'bg-[#FF69B4]';
      case 'orange': return 'bg-[#FFA500]';
      case 'red': return 'bg-[#FF0000]';
      case 'yellow': return 'bg-[#FFD700]';
      case 'green': return 'bg-[#008000]';
      case 'darkBlue': return 'bg-[#00008B]';
      default: return 'bg-slate-200';
    }
  };

  return (
    <div className={`${isSpectator ? 'fixed inset-0 bg-slate-100 z-50 flex flex-col' : 'fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-auto'}`}>
      <div className={`${isSpectator ? 'w-full h-full flex flex-col' : 'bg-white rounded-xl shadow-2xl w-full max-w-5xl aspect-square max-h-[90vh] overflow-hidden flex flex-col'}`}>
        {!isSpectator && (
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">Game Board</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        )}
        
        <div className="flex-1 p-4 overflow-auto bg-slate-100 flex items-center justify-center">
          <div className="grid grid-cols-11 grid-rows-11 gap-1 bg-slate-300 p-1 w-full max-w-[800px] aspect-square border-4 border-slate-800 shadow-xl">
            
            {/* Center Board (Logo area) */}
            <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-[#CEE6D0] flex flex-col items-center justify-center relative">
               <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-widest -rotate-45 opacity-20 select-none">MONOPOLY</h1>
               {/* Legend or other info could go here */}
            </div>

            {INITIAL_PROPERTIES.map((prop) => {
              const playersHere = players.filter(p => p.position === prop.id);
              const owner = properties.find(p => p.id === prop.id)?.ownerId;
              const ownerPlayer = players.find(p => p.id === owner);
              const isCorner = prop.type === 'corner';
              
              return (
                <div 
                  key={prop.id}
                  style={getGridStyle(prop.id)}
                  className={`relative bg-white flex flex-col border border-slate-800 text-[8px] sm:text-[10px] select-none ${isCorner ? 'font-bold' : ''}`}
                >
                  {/* Color Bar for Streets */}
                  {prop.type === 'street' && (
                     <div className={`h-[20%] w-full border-b border-slate-800 ${getPropertyColor(prop.group)}`} />
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 flex flex-col items-center justify-center p-0.5 text-center leading-tight overflow-hidden">
                    <span className="truncate w-full">{prop.name}</span>
                    {prop.price && <span className="mt-0.5">${prop.price}</span>}
                    {ownerPlayer && (
                      <div 
                        className="w-full h-1 mt-0.5" 
                        style={{ backgroundColor: ownerPlayer.color }} 
                        title={`Owned by ${ownerPlayer.name}`}
                      />
                    )}
                  </div>

                  {/* Player Tokens */}
                  {playersHere.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center gap-1 pointer-events-none">
                      {playersHere.map(p => {
                        const token = getTokenById(p.token || 'dog');
                        return (
                          <div 
                            key={p.id}
                            className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-md transform hover:scale-150 transition-transform z-10 bg-white flex items-center justify-center"
                            style={{ borderColor: p.color }}
                            title={`${p.name} ($${p.balance})`}
                          >
                            <span className="text-[10px] sm:text-xs leading-none select-none">
                              {token?.emoji}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
