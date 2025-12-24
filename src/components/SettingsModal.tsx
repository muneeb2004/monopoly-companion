import React, { useState, useEffect } from 'react';
import { X, Settings2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const startingMoney = useGameStore(state => state.startingMoney ?? 1500);
  const jailBailAmount = useGameStore(state => state.jailBailAmount ?? 50);
  const priceMultiplier = useGameStore(state => state.priceMultiplier ?? 1);
  const rentMultiplier = useGameStore(state => state.rentMultiplier ?? 1);
  const setStartingMoney = useGameStore(state => state.setStartingMoney);
  const setJailBailAmount = useGameStore(state => state.setJailBailAmount);
  const setBankTotal = useGameStore(state => state.setBankTotal);
  const setMultipliers = useGameStore(state => state.setMultipliers);
  const applySettingsToProperties = useGameStore(state => state.applySettingsToProperties);
  const resetSettings = useGameStore(state => state.resetSettings);

  const bankTotal = useGameStore(state => state.bankTotal ?? 100000);

  const [sm, setSm] = useState<string>(String(startingMoney));
  const [jba, setJba] = useState<string>(String(jailBailAmount));
  const [bt, setBt] = useState<string>(String(bankTotal));
  const [pm, setPm] = useState<string>(String(priceMultiplier));
  const [rm, setRm] = useState<string>(String(rentMultiplier));

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [propOverrides, setPropOverrides] = useState(() => {
    const p = (useGameStore.getState().properties || []).map(pr => ({ id: pr.id, name: pr.name, priceOverride: pr.priceOverride ?? '', rentOverride: pr.rentOverride ? pr.rentOverride.join(',') : '' }));
    return p;
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setSm(String(startingMoney));
    setJba(String(jailBailAmount));
    setBt(String(bankTotal));
    setPm(String(priceMultiplier));
    setRm(String(rentMultiplier));
    setPropOverrides((useGameStore.getState().properties || []).map(pr => ({ id: pr.id, name: pr.name, priceOverride: pr.priceOverride ?? '', rentOverride: pr.rentOverride ? pr.rentOverride.join(',') : '' })));
  }, [isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      // Only call setters if they exist to be robust in tests
      if (typeof setStartingMoney === 'function') await setStartingMoney(Number(sm));
      if (typeof setJailBailAmount === 'function') await setJailBailAmount(Number(jba));
      if (typeof setMultipliers === 'function') await setMultipliers(Number(pm), Number(rm));
      if (typeof setBankTotal === 'function') await setBankTotal(Number(bt));

      // Persist per-property overrides (run regardless)
      for (const o of propOverrides) {
        const priceVal = o.priceOverride === '' ? null : Number(o.priceOverride);
        const rentVal = o.rentOverride === '' ? null : o.rentOverride.split(',').map(s => Number(s.trim()));
        await useGameStore.getState().setPropertyOverride(o.id, priceVal, rentVal);
      }

      applySettingsToProperties();
      setSaveMessage('Saved');
      // briefly show success then close
      setTimeout(() => {
        setSaving(false);
        setSaveMessage(null);
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
      setSaving(false);
      setSaveMessage('Failed to save');
    }
  };

  const reset = async () => {
    await resetSettings();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Settings2 size={20} />
            <span>Game Settings</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Advanced: Individual Property Overrides</label>
            <button onClick={() => setAdvancedOpen(prev => !prev)} className="mt-2 text-xs text-slate-500">{advancedOpen ? 'Hide' : 'Show'} property overrides</button>
            {advancedOpen && (
              <div className="mt-3 max-h-60 overflow-y-auto border border-slate-100 rounded p-2 bg-slate-50">
                {propOverrides.map(o => (
                  <div key={o.id} className="p-2 border-b last:border-b-0">
                    <div className="text-sm font-bold">{o.name}</div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <input placeholder="Price override" value={o.priceOverride} onChange={(e) => setPropOverrides(prev => prev.map(p => p.id === o.id ? { ...p, priceOverride: e.target.value } : p))} className="p-1 border rounded w-full sm:w-32" />
                      <input placeholder="Rent override (comma-separated)" value={o.rentOverride} onChange={(e) => setPropOverrides(prev => prev.map(p => p.id === o.id ? { ...p, rentOverride: e.target.value } : p))} className="p-1 border rounded flex-1 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Starting Money</label>
            <input type="number" value={sm} onChange={(e) => setSm(e.target.value)} className="w-full mt-2 p-2 border rounded" />
            <div className="text-xs text-slate-400 mt-1">Default balance assigned to new players (default: 1500)</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Jail Bail Amount</label>
            <input type="number" value={jba} onChange={(e) => setJba(e.target.value)} className="w-full mt-2 p-2 border rounded" />
            <div className="text-xs text-slate-400 mt-1">Cost to leave jail immediately (default: 50)</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Bank Total</label>
            <input type="number" value={bt} onChange={(e) => setBt(e.target.value)} className="w-full mt-2 p-2 border rounded" />
            <div className="text-xs text-slate-400 mt-1">Total funds available in the bank (default: 100000)</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Property Price Multiplier</label>
            <input type="number" step="0.1" value={pm} onChange={(e) => setPm(e.target.value)} className="w-full mt-2 p-2 border rounded" />
            <div className="text-xs text-slate-400 mt-1">Multiply base property prices (1 = no change)</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Rent Multiplier</label>
            <input type="number" step="0.1" value={rm} onChange={(e) => setRm(e.target.value)} className="w-full mt-2 p-2 border rounded" />
            <div className="text-xs text-slate-400 mt-1">Multiply base rent values (1 = no change)</div>
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 flex items-center gap-2">
          <button onClick={reset} disabled={saving} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold disabled:opacity-50">Reset</button>
          <div className="flex-1" />
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl bg-slate-100 disabled:opacity-50">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saveMessage && <div className={`text-sm font-medium ${saveMessage === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>{saveMessage}</div>}
        </div>
      </div>
    </div>
  );
};
