import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatNumberInput } from '../lib/utils';

export const PropertyOverridesTab: React.FC = () => {
  const properties = useGameStore(state => state.properties);
  const setPropertyOverride = useGameStore(state => state.setPropertyOverride);

  const [errors, setErrors] = useState<Record<number, string[] | undefined>>({});

  const visible = properties.filter(p => p.type === 'street' || p.type === 'railroad' || p.type === 'utility');

  const handleRentChange = (id: number, rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed === '') {
      // clear rent-specific errors but keep price errors
      setErrors(prev => ({ ...prev, [id]: (prev[id] || []).filter(Boolean).filter(m => !m.startsWith('Rents')) }));
      setPropertyOverride(id, useGameStore.getState().properties.find(pr => pr.id === id)?.priceOverride ?? null, null);
      return;
    }

    const parts = trimmed.split(',').map(s => s.trim());
    const parsed: number[] = [];
    for (const p of parts) {
      if (p === '') continue;
      const n = Number(p);
      if (!Number.isFinite(n) || n < 0) {
        setErrors(prev => ({ ...prev, [id]: [...(prev[id] || []).filter(m => !m.startsWith('Rents')), 'Rents must be non-negative numbers, comma-separated.'] }));
        return;
      }
      parsed.push(n);
    }

    // Valid: remove rent-specific messages
    setErrors(prev => ({ ...prev, [id]: (prev[id] || []).filter(m => !m.startsWith('Rents')) }));
    setPropertyOverride(id, useGameStore.getState().properties.find(pr => pr.id === id)?.priceOverride ?? null, parsed.length ? parsed : null);
  };

  const handlePriceChange = (id: number, rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed === '') {
      // clear price-specific errors but keep rent errors
      setErrors(prev => ({ ...prev, [id]: (prev[id] || []).filter(m => !m.startsWith('Price')) }));
      setPropertyOverride(id, null, useGameStore.getState().properties.find(pr => pr.id === id)?.rentOverride ?? null);
      return;
    }

    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      setErrors(prev => ({ ...prev, [id]: [...(prev[id] || []).filter(m => !m.startsWith('Price')), 'Price must be a non-negative integer.'] }));
      return;
    }

    // Valid: remove price-specific messages
    setErrors(prev => ({ ...prev, [id]: (prev[id] || []).filter(m => !m.startsWith('Price')) }));
    setPropertyOverride(id, n, useGameStore.getState().properties.find(pr => pr.id === id)?.rentOverride ?? null);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">Set custom property prices & rents (leave blank to use defaults). You can also "Apply as default" to persist changes for future games.</div>
      <div className="max-h-96 overflow-y-auto border border-slate-100 rounded p-3 bg-white">
        <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:items-center md:mb-2 text-xs text-slate-500 font-medium">
          <div>Property</div>
          <div className="text-right">Purchase Price</div>
          <div className="text-right">Rent (comma-separated)</div>
        </div>
        <div className="space-y-2">
        {visible.map(p => (
          <div key={p.id} className="flex flex-col md:flex-row md:items-center md:gap-3 p-2 rounded hover:bg-slate-50">
            <div className="flex-1 md:flex-none md:w-1/3">
              <div className="font-medium text-slate-700">{p.name}</div>
              <div className="text-xs text-slate-400">Default: {p.price ? `$${formatNumberInput(String(p.price))}` : '—'} · Rent: {p.rent ? p.rent.join(', ') : '—'}</div>
            </div>

            <div className="mt-2 md:mt-0 md:flex-1 md:w-1/3 md:text-right">
              <input
                aria-label={`price-${p.id}`}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={p.price ? String(p.price) : ''}
                value={p.priceOverride ?? ''}
                onChange={(e) => handlePriceChange(p.id, e.target.value)}
                className="w-full md:inline-block md:w-36 px-3 py-2 border rounded text-right"
              />
              {p.priceOverride !== undefined && p.price !== undefined && (
                <div className="text-xs text-slate-400 mt-1">Formatted: ${formatNumberInput(String(p.priceOverride))}</div>
              )}
            </div>

            <div className="mt-2 md:mt-0 md:flex-1 md:w-1/3 md:text-right">
              <input
                aria-label={`rent-${p.id}`}
                type="text"
                placeholder={p.rent ? p.rent.join(',') : ''}
                value={p.rentOverride ? p.rentOverride.join(',') : ''}
                onChange={(e) => handleRentChange(p.id, e.target.value)}
                className="w-full md:inline-block md:w-60 px-3 py-2 border rounded text-right"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button onClick={() => useGameStore.getState().setBaseProperty(p.id, p.priceOverride ?? p.price ?? null, (p.rentOverride ?? p.rent) ?? null)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Apply as default</button>
              </div>

              {errors[p.id] && errors[p.id]!.length > 0 && (
                <div className="flex flex-col text-xs text-red-600 mt-1">
                  {errors[p.id]!.map((m, i) => <div key={i}>{m}</div>)}
                </div>
              )}

            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyOverridesTab;
