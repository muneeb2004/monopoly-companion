import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Plus, Play, Users, Dices, Keyboard, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { GAME_TOKENS, getTokenById } from '../data/tokens';
import { SettingsModal } from './SettingsModal';
import PropertyOverridesTab from './PropertyOverridesTab';

const SetupScreenComponent: React.FC = () => {
  const players = useGameStore(state => state.players);
  const addPlayer = useGameStore(state => state.addPlayer);
  const startGame = useGameStore(state => state.startGame);
  const [newName, setNewName] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState(GAME_TOKENS[0].id);
  const [diceMode, setDiceMode] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'players' | 'properties'>('players');

  // Render counter for tests
  const renderRef = React.useRef(1);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  // Increment render counter after render and write it to the root element to avoid reading refs during render
  React.useEffect(() => { renderRef.current++; if (rootRef.current) rootRef.current.setAttribute('data-render-count', String(renderRef.current)); });

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const token = getTokenById(selectedTokenId);
    if (newName.trim() && players.length < 8 && token) {
      addPlayer(newName.trim(), token.color, token.id);
      setNewName('');
      // Pick next available token
      const nextToken = GAME_TOKENS.find(t => !players.some(p => p.token === t.id) && t.id !== token.id);
      if (nextToken) setSelectedTokenId(nextToken.id);
    }
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-slate-50 flex items-start sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md sm:max-w-lg mt-6 sm:mt-0 border border-slate-200">
        <div className="text-center mb-8 relative">
          <div className="absolute right-2 top-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Game Settings"
            >
              <Settings2 size={20} />
            </button>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Monopoly Tracker</h1>
          <p className="text-slate-500 mt-2">Add players to begin the game</p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 border rounded-lg overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('players')}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium",
                activeTab === 'players' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
              )}
            >Players</button>
            <button
              type="button"
              onClick={() => setActiveTab('properties')}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium",
                activeTab === 'properties' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
              )}
            >Properties</button>
          </div>

          {activeTab === 'players' ? (
            <form onSubmit={handleAddPlayer} className="mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Player Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter name (e.g. John)"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Token</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {GAME_TOKENS.map((token) => {
                      const isTaken = players.some(p => p.token === token.id);
                      const isSelected = selectedTokenId === token.id;

                      return (
                        <button
                          key={token.id}
                          type="button"
                          disabled={isTaken}
                          onClick={() => setSelectedTokenId(token.id)}
                          className={cn(
                            "aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all relative overflow-hidden",
                            isSelected 
                              ? "border-slate-800 bg-slate-50 shadow-md scale-105 z-10" 
                              : "border-slate-100 bg-white hover:border-slate-300",
                            isTaken && "opacity-40 cursor-not-allowed bg-slate-100 grayscale border-slate-100 hover:border-slate-100"
                          )}
                        >
                          <div className="text-2xl mb-1">{token.emoji}</div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate w-full px-1 text-center">
                            {token.label}
                          </div>
                          {/* Color Strip */}
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-1" 
                            style={{ backgroundColor: token.color }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newName.trim() || players.length >= 8}
                  className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Player
                </button>
              </div>
            </form>
          ) : (
            <PropertyOverridesTab />
          )}
        </div>

        <div className="space-y-3 mb-8">
          {players.map((player) => {
            const token = getTokenById(player.token || 'dog'); // Fallback
            return (
              <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-white border border-slate-200 shadow-sm"
                  >
                    {token?.emoji}
                  </div>
                  <span className="font-medium text-slate-700">{player.name}</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: player.color }} />
                   <span className="text-slate-400 text-sm">${player.balance.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
          {players.length === 0 && (
            <div className="text-center text-slate-400 py-4 text-sm italic">
              No players added yet
            </div>
          )}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">Dice Mode</label>
          <div className="grid grid-cols-2 gap-3">
             <button
               onClick={() => setDiceMode('DIGITAL')}
               className={cn(
                 "p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                 diceMode === 'DIGITAL' 
                   ? "border-blue-600 bg-blue-50 text-blue-700" 
                   : "border-slate-100 hover:border-slate-300 text-slate-500"
               )}
             >
               <Dices size={24} />
               <div className="text-center">
                 <div className="font-bold text-sm">Digital Dice</div>
                 <div className="text-[10px] opacity-75">Auto-roll & Move</div>
               </div>
             </button>
             <button
               onClick={() => setDiceMode('PHYSICAL')}
               className={cn(
                 "p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                 diceMode === 'PHYSICAL' 
                   ? "border-blue-600 bg-blue-50 text-blue-700" 
                   : "border-slate-100 hover:border-slate-300 text-slate-500"
               )}
             >
               <Keyboard size={24} />
               <div className="text-center">
                 <div className="font-bold text-sm">Physical Dice</div>
                 <div className="text-[10px] opacity-75">Manual Entry</div>
               </div>
             </button>
          </div>
        </div>

        <button
          onClick={() => startGame(diceMode)}
          disabled={players.length < 2}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
        >
          <Play size={24} fill="currentColor" />
          Start Game
        </button>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export const SetupScreen = React.memo(SetupScreenComponent);
