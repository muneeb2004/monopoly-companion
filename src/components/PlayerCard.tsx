import React from 'react';
import type { Player } from '../types';
import { cn, calculateNetWorth } from '../lib/utils';
import { useGameStore } from '../store/gameStore';
import { getTokenById } from '../data/tokens';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  propertyCount: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, isCurrentTurn, propertyCount }) => {
  const properties = useGameStore((state) => state.properties);
  const netWorth = calculateNetWorth(player, properties);
  const token = getTokenById(player.token || 'dog');

  return (
    <div 
      className={cn(
        "relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden",
        isCurrentTurn 
          ? "bg-white border-blue-500 shadow-xl scale-105 z-10" 
          : "bg-white border-slate-100 shadow-sm hover:border-slate-300"
      )}
    >
      {/* Background Color Strip */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 opacity-80" 
        style={{ backgroundColor: player.color }}
      />

      {isCurrentTurn && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap z-20">
          Current Turn
        </div>
      )}

      <div className="flex items-start justify-between mb-3 mt-1">
        <div className="flex items-center gap-3">
           <div 
             className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-50 border border-slate-100 shadow-sm"
           >
             {token?.emoji}
           </div>
           <div className="flex flex-col min-w-0">
             <span className="font-bold text-slate-800 truncate max-w-[80px] sm:max-w-[100px] leading-tight" title={player.name}>
               {player.name}
             </span>
             <span className="text-[10px] text-slate-400 font-medium truncate">{token?.label}</span>
           </div>
        </div>
        {player.isJailed && <span className="text-xl" title="In Jail">⛓️</span>}
      </div>

      <div className="mt-auto space-y-1">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Balance</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ${player.balance.toLocaleString()}
          </span>
        </div>
        
        <div className="flex flex-col pt-1 border-t border-slate-100">
           <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Net Worth</span>
           <span className="text-sm font-bold text-slate-600">
             ${netWorth.toLocaleString()}
           </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span className="font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{propertyCount} Props</span>
          {player.loans > 0 && (
            <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">-${player.loans}</span>
          )}
        </div>
      </div>
    </div>
  );
};