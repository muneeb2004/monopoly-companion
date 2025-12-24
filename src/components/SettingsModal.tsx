import React, { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { BottomSheet } from './BottomSheet';
import { formatNumberInput } from '../lib/utils';

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
  const setShowBankLowWarning = useGameStore(state => state.setShowBankLowWarning);
  const setBankLowThreshold = useGameStore(state => state.setBankLowThreshold);
  const setMultipliers = useGameStore(state => state.setMultipliers);
  const applySettingsToProperties = useGameStore(state => state.applySettingsToProperties);
  const resetSettings = useGameStore(state => state.resetSettings); 

  const bankTotal = useGameStore(state => state.bankTotal ?? 100000);

  const [sm, setSm] = useState<string>(String(startingMoney));
  const [jba, setJba] = useState<string>(String(jailBailAmount));
  const bankLowThreshold = useGameStore(state => state.bankLowThreshold ?? 10000);
  const [bt, setBt] = useState<string>(String(bankTotal));
  const [showBankWarn, setShowBankWarn] = useState<boolean>(Boolean(useGameStore.getState().showBankLowWarning));
  const [bth, setBth] = useState<string>(String(bankLowThreshold));
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
    setBth(String(useGameStore.getState().bankLowThreshold ?? 10000));
    setShowBankWarn(Boolean(useGameStore.getState().showBankLowWarning));
    setPm(String(priceMultiplier));
    setRm(String(rentMultiplier));
    setPropOverrides((useGameStore.getState().properties || []).map(pr => ({ id: pr.id, name: pr.name, priceOverride: pr.priceOverride ?? '', rentOverride: pr.rentOverride ? pr.rentOverride.join(',') : '' })));
  }, [isOpen, startingMoney, jailBailAmount, bankTotal, bankLowThreshold, priceMultiplier, rentMultiplier]);

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
      if (typeof setBankLowThreshold === 'function') await setBankLowThreshold(Number(bth));
      if (typeof setShowBankLowWarning === 'function') setShowBankLowWarning(Boolean(showBankWarn));

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

  const [showEndConfirm, setShowEndConfirm] = React.useState(false);
  const endAndRestart = useGameStore(state => state.endAndRestart);

  const handleEndAndRestart = async () => {
    if (typeof endAndRestart === 'function') await endAndRestart();
    setShowEndConfirm(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={<><Settings2 size={20} /><span>Game Settings</span></>}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Advanced: Individual Property Overrides</label>
          <button onClick={() => setAdvancedOpen(prev => !prev)} className="mt-2 text-xs text-slate-500">{advancedOpen ? 'Hide' : 'Show'} property overrides</button>
          {advancedOpen && (
            <div className="mt-3 max-h-60 overflow-y-auto border border-slate-100 rounded p-2 bg-slate-50">
              {propOverrides.map(o => (
                <div key={o.id} className="p-2 border-b last:border-b-0">
                  <div className="text-sm font-bold">{o.name}</div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <input placeholder="Price override" inputMode="numeric" pattern="[0-9]*" value={o.priceOverride} onChange={(e) => setPropOverrides(prev => prev.map(p => p.id === o.id ? { ...p, priceOverride: e.target.value } : p))} className="p-1 border rounded w-full sm:w-32" />
                      <input placeholder="Rent override (comma-separated)" inputMode="numeric" value={o.rentOverride} onChange={(e) => setPropOverrides(prev => prev.map(p => p.id === o.id ? { ...p, rentOverride: e.target.value } : p))} className="p-1 border rounded flex-1 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="starting-money" className="block text-sm font-medium text-slate-700">Starting Money</label>
          <input
            id="starting-money"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={sm}
            onChange={(e) => setSm(e.target.value)}
            className="w-full mt-2 p-2 border rounded"
          />
          <div className="text-xs text-slate-400 mt-1">Default balance assigned to new players (default: 1500)</div>
          {sm !== '' && (
            <div className="text-xs text-slate-400 mt-1">Formatted: {formatNumberInput(sm)}</div>
          )}
        </div>

        <div>
          <label htmlFor="jail-bail-amount" className="block text-sm font-medium text-slate-700">Jail Bail Amount</label>
            <input id="jail-bail-amount" type="number" inputMode="numeric" pattern="[0-9]*" value={jba} onChange={(e) => setJba(e.target.value)} className="w-full mt-2 p-2 border rounded" />
          <div className="text-xs text-slate-400 mt-1">Cost to leave jail immediately (default: 50)</div>
          {jba !== '' && <div className="text-xs text-slate-400 mt-1">Formatted: {formatNumberInput(jba)}</div>}
        </div>

        <div>
<label htmlFor="bank-total" className="block text-sm font-medium text-slate-700">Bank Total</label>
            <input id="bank-total" type="number" inputMode="numeric" pattern="[0-9]*" value={bt} onChange={(e) => setBt(e.target.value)} className="w-full mt-2 p-2 border rounded" />
            {bt !== '' && <div className="text-xs text-slate-400 mt-1">Formatted: {formatNumberInput(bt)}</div>}

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="low-bank-threshold" className="block text-sm font-medium text-slate-700">Low-bank threshold</label>
                <input id="low-bank-threshold" type="number" inputMode="numeric" pattern="[0-9]*" value={bth} onChange={(e) => setBth(e.target.value)} className="w-full mt-2 p-2 border rounded" />
              <div className="text-xs text-slate-400 mt-1">Below this amount the low-bank indicator will display (default: 10000)</div>
              {bth !== '' && <div className="text-xs text-slate-400 mt-1">Formatted: {formatNumberInput(bth)}</div>}
            </div>

            <div className="flex items-center gap-2">
              <input id="show-bank-warn" type="checkbox" checked={showBankWarn} onChange={(e) => setShowBankWarn(e.target.checked)} />
              <label htmlFor="show-bank-warn" className="text-sm text-slate-700">Show low-bank warning</label>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="property-price-multiplier" className="block text-sm font-medium text-slate-700">Property Price Multiplier</label>
            <input id="property-price-multiplier" type="number" step="0.1" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" value={pm} onChange={(e) => setPm(e.target.value)} className="w-full mt-2 p-2 border rounded" />
          <div className="text-xs text-slate-400 mt-1">Multiply base property prices (1 = no change)</div>
        </div>

        <div>
          <label htmlFor="rent-multiplier" className="block text-sm font-medium text-slate-700">Rent Multiplier</label>
            <input id="rent-multiplier" type="number" step="0.1" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" value={rm} onChange={(e) => setRm(e.target.value)} className="w-full mt-2 p-2 border rounded" />
          <div className="text-xs text-slate-400 mt-1">Multiply base rent values (1 = no change)</div>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center gap-2 sticky sm:static bottom-0 bg-white z-10">
          <button onClick={reset} disabled={saving} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold disabled:opacity-50">Reset</button>

          {/* End and restart button - opens a confirmation */}
          <button onClick={() => setShowEndConfirm(true)} disabled={saving} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">
            End Game & Restart
          </button>

          <div className="flex-1" />
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl bg-slate-100 disabled:opacity-50">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saveMessage && <div className={`text-sm font-medium ${saveMessage === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>{saveMessage}</div>}
        </div>

        {/* End & Restart confirmation */}
        {showEndConfirm && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold mb-2 text-red-700">End Game & Restart</h3>
              <p className="text-sm text-slate-600 mb-4">This will end the current game and return you to the setup screen where players will be preserved and ready for editing. Continue?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowEndConfirm(false)} className="flex-1 px-4 py-2 rounded bg-slate-100">Cancel</button>
                <button onClick={handleEndAndRestart} className="flex-1 px-4 py-2 rounded bg-red-600 text-white">End & Restart</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
