import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerCard } from './PlayerCard';
import { ActionCenter } from './ActionCenter';
import { History, Map as MapIcon, Bell, Building2, Settings2 } from 'lucide-react';
import { PropertyManager } from './PropertyManager';
import { BoardMap } from './BoardMap';
import { SettingsModal } from './SettingsModal';


const DashboardComponent: React.FC = () => {
  const players = useGameStore(state => state.players);
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex);
  const transactions = useGameStore(state => state.transactions);
  const properties = useGameStore(state => state.properties);
  const trades = useGameStore(state => state.trades);
  const respondToTrade = useGameStore(state => state.respondToTrade);
  const [showProperties, setShowProperties] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const renderRef = React.useRef(0);
  renderRef.current++;

  const currentPlayer = useMemo(() => players[currentPlayerIndex], [players, currentPlayerIndex]);

  const getPlayerPropertyCount = (playerId: string) => {
    return properties.filter(p => p.ownerId === playerId).length;
  };

  const pendingTrades = trades?.filter(t => t.status === 'PENDING' && (t.receiverId === currentPlayer.id || t.senderId === currentPlayer.id));

  return (
    <div data-render-count={process.env.NODE_ENV === 'test' ? renderRef.current : undefined} className="min-h-screen bg-slate-50 pb-24 lg:pb-32">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monopoly Tracker</h1>
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full hidden sm:block">
              Turn {useGameStore(state => state.turnCount)}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowMap(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
              aria-label="View Map"
              title="View Board Map"
            >
              <MapIcon size={20} />
            </button>
            <button 
              onClick={() => setShowProperties(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
              aria-label="Manage Properties"
              title="Manage Properties"
            >
              <Building2 size={20} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
              aria-label="Settings"
              title="Settings"
            >
              <Settings2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Pending Trades Notification */}
        {pendingTrades && pendingTrades.length > 0 && (
          <section className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
            <div className="flex items-center gap-2 mb-3 text-amber-600">
               <Bell size={16} />
               <h2 className="text-xs font-bold uppercase tracking-wider">Pending Trades</h2>
            </div>
            <div className="space-y-3">
               {pendingTrades.map(trade => {
                 const isIncoming = trade.receiverId === currentPlayer.id;
                 const sender = players.find(p => p.id === trade.senderId);
                 const receiver = players.find(p => p.id === trade.receiverId);
                 
                 return (
                   <div key={trade.id} className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <div className="flex justify-between items-start mb-2">
                         <span className="font-bold text-slate-800 text-sm">
                           {isIncoming ? `Request from ${sender?.name}` : `Sent to ${receiver?.name}`}
                         </span>
                         <span className="text-xs bg-white px-2 py-0.5 rounded text-slate-500 font-medium">
                           {new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                      
                      <div className="text-sm text-slate-600 mb-3 space-y-1">
                        <div className="flex justify-between">
                          <span>Sends:</span>
                          <span className="font-mono">
                            ${trade.offeredMoney} 
                            {trade.offeredProperties.length > 0 && ` + ${trade.offeredProperties.length} Props`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Receives:</span>
                          <span className="font-mono">
                             ${trade.requestedMoney}
                             {trade.requestedProperties.length > 0 && ` + ${trade.requestedProperties.length} Props`}
                          </span>
                        </div>
                      </div>

                      {isIncoming && (
                        <div className="flex gap-2">
                           <button 
                             onClick={() => respondToTrade(trade.id, 'ACCEPTED')}
                             className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded hover:bg-green-700"
                           >
                             Accept
                           </button>
                           <button 
                             onClick={() => respondToTrade(trade.id, 'REJECTED')}
                             className="flex-1 bg-red-100 text-red-700 text-xs font-bold py-2 rounded hover:bg-red-200"
                           >
                             Reject
                           </button>
                        </div>
                      )}
                      {!isIncoming && (
                        <div className="text-xs text-center text-slate-400 italic">Waiting for response...</div>
                      )}
                   </div>
                 );
               })}
            </div>
          </section>
        )}

        {/* Players Grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Players</h2>
             <div className="sm:hidden text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Turn {useGameStore(state => state.turnCount)}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {players.map((player, index) => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                isCurrentTurn={index === currentPlayerIndex}
                propertyCount={getPlayerPropertyCount(player.id)}
              />
            ))}
          </div>
        </section>

        {/* Transactions Log */}
        <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
           <div className="flex items-center gap-2 mb-4 text-slate-400">
             <History size={16} />
             <h2 className="text-xs font-bold uppercase tracking-wider">Recent Activity</h2>
           </div>
           <div className="space-y-3">
             {transactions.length === 0 ? (
               <div className="text-center text-slate-400 text-sm py-4 italic">No transactions yet</div>
             ) : (
               transactions.slice(0, 5).map((t) => {
                 const fromPlayer = players.find(p => p.id === t.fromId)?.name || 'Bank';
                 const toPlayer = players.find(p => p.id === t.toId)?.name || 'Bank';
                 const isPositive = t.toId !== 'BANK' && t.fromId === 'BANK'; // Simple heuristic for now
                 
                 return (
                   <div key={t.id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                     <div className="flex flex-col">
                       <span className="font-medium text-slate-700">{t.description}</span>
                       <span className="text-slate-400 text-xs">{fromPlayer} → {toPlayer}</span>
                     </div>
                     <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-slate-900'}`}>
                       ${t.amount}
                     </span>
                   </div>
                 );
               })
             )}
           </div>
        </section>
      </main>

      <ActionCenter />
      <PropertyManager isOpen={showProperties} onClose={() => setShowProperties(false)} />
      <BoardMap isOpen={showMap} onClose={() => setShowMap(false)} />
      <PropertyManager isOpen={showProperties} onClose={() => setShowProperties(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export const Dashboard = React.memo(DashboardComponent);
