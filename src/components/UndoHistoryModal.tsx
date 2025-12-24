import React from 'react';
import { BottomSheet } from './BottomSheet';
import { useGameStore } from '../store/gameStore';

export const UndoHistoryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const undoEntries = useGameStore(state => state.undoEntries || []);
  const fetchUndoEntries = useGameStore(state => state.fetchUndoEntries);
  const revertUndoEntry = useGameStore(state => state.revertUndoEntry);

  React.useEffect(() => {
    if (isOpen) fetchUndoEntries();
  }, [isOpen, fetchUndoEntries]);

  if (!isOpen) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={<span>Undo History</span>} className="max-w-2xl">
      <div className="space-y-4 p-4">
        {undoEntries.length === 0 && <div className="text-sm text-slate-500">No undo entries</div>}

        {undoEntries.map(e => (
          <div key={e.id} className="p-3 border rounded flex items-start justify-between">
            <div>
              <div className="text-sm font-bold">{e.description || 'Manual move'}</div>
              <div className="text-xs text-slate-500">Player: {e.playerId} &middot; At: {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}</div>
              <div className="text-xs mt-1">From {e.prevPosition} → {e.newPosition} {e.passGoAwarded ? `(Pass GO $${e.passGoAwarded})` : ''}</div>
              {e.reverted && <div className="text-xs text-amber-700 mt-1">Reverted by {e.revertedBy || '—'} at {e.revertedAt ? new Date(e.revertedAt).toLocaleString() : '-'}</div>}
            </div>
            <div className="flex flex-col gap-2">
              <button disabled={!!e.reverted} onClick={async () => { await revertUndoEntry(e.id!, 'SYSTEM'); await fetchUndoEntries(); }} className={`px-3 py-1 rounded ${e.reverted ? 'bg-slate-200' : 'bg-red-600 text-white'}`}>{e.reverted ? 'Reverted' : 'Revert'}</button>
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
};
