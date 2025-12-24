import React, { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { SetupScreen } from './components/SetupScreen';
import { Dashboard } from './components/Dashboard';
import { BoardMap } from './components/BoardMap';
import { Plus, Users, Loader2, ArrowRight, Eye } from 'lucide-react';

function App() {
  const { gameStatus, gameId, isLoading, error, createNewGame, joinGame } = useGameStore();
  const [joinId, setJoinId] = useState('');
  const [isSpectator, setIsSpectator] = useState(false);
  const [isRestoring, setIsRestoring] = useState(() => !!localStorage.getItem('monopoly_game_id'));

  useEffect(() => {
    const restoreSession = async () => {
      const savedGameId = localStorage.getItem('monopoly_game_id');
      if (savedGameId && !gameId) {
        setIsRestoring(true);
        await joinGame(savedGameId);
      }
      setIsRestoring(false);
    };
    restoreSession();
  }, [gameId, joinGame]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      joinGame(joinId.trim());
    }
  };

  const handleSpectate = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      setIsSpectator(true);
      joinGame(joinId.trim());
    }
  };

  if (isLoading || isRestoring) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Landing Screen
  if (!gameStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Monopoly Tracker</h1>
            <p className="text-slate-500 mt-2">Create a new session or join existing</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <button
              onClick={() => createNewGame()}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={24} />
              Create New Game
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or join existing</span>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder="Enter Game ID..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-24"
                />
                <div className="absolute right-2 top-2 bottom-2 flex gap-1">
                  <button 
                    type="button"
                    onClick={handleSpectate}
                    disabled={!joinId.trim()}
                    className="bg-slate-100 text-slate-600 px-3 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    title="Watch Game"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    type="submit"
                    disabled={!joinId.trim()}
                    className="bg-blue-100 text-blue-600 px-3 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Join Game"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Spectator View
  if (gameStatus && isSpectator) {
    return <BoardMap isOpen={true} isSpectator={true} />;
  }

  // Setup / Lobby Screen
  if (gameStatus === 'SETUP') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Game ID Banner */}
        <div className="bg-blue-600 text-white p-3 text-center shadow-md">
           <p className="text-sm opacity-90 mb-1">Share this Game ID with friends:</p>
           <div className="font-mono text-xl font-bold tracking-wider select-all bg-blue-700/50 inline-block px-3 py-1 rounded">
             {gameId}
           </div>
        </div>
        <SetupScreen />
      </div>
    );
  }

  // Active Dashboard
  return (
    <div className="antialiased text-slate-900">
      <Dashboard />
    </div>
  );
}

export default App;