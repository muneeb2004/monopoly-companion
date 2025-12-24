import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatNumberInput } from '../lib/utils';

export const PropertyOverridesTab: React.FC = () => {
  const properties = useGameStore(state => state.properties);
  const setPropertyOverride = useGameStore(state => state.setPropertyOverride);

  const visible = properties.filter(p => p.type === 'street' || p.type === 'railroad' || p.type === 'utility');

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">Set custom property prices (leave blank to use defaults)</div>
      <div className="max-h-72 overflow-y-auto border border-slate-100 rounded p-2 bg-white">
        {visible.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
            <div className="flex-1">
              <div className="font-medium text-slate-700">{p.name}</div>
              <div className="text-xs text-slate-400">Default: {p.price ? `$${formatNumberInput(String(p.price))}` : '—'}</div>
            </div>
            <div className="w-40">
              <input
                aria-label={`price-${p.id}`}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={p.price ? String(p.price) : ''}
                value={p.priceOverride ?? ''}
                onChange={(e) => {
                  const v = e.target.value === '' ? null : Number(e.target.value);
                  setPropertyOverride(p.id, v === null ? null : v, p.rentOverride ?? null);
                }}
                className="w-full px-3 py-2 border rounded text-right"
              />
              {p.priceOverride !== undefined && p.price !== undefined && (
                <div className="text-xs text-slate-400 mt-1">Formatted: ${formatNumberInput(String(p.priceOverride))}</div>
              )}
              {p.priceOverride === undefined && p.price && (
                <div className="text-xs text-slate-400 mt-1">Using default: ${formatNumberInput(String(p.price))}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyOverridesTab;
