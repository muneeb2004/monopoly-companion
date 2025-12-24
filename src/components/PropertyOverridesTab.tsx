import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatNumberInput, cn } from '../lib/utils';
import { Search, Filter, DollarSign, AlertCircle, Check, Building2, Zap, Train } from 'lucide-react';
import type { Property } from '../types';

const PROPERTY_COLORS: Record<string, string> = {
  brown: 'bg-[#8B4513]',
  lightBlue: 'bg-[#87CEEB]',
  pink: 'bg-[#FF69B4]',
  orange: 'bg-[#FFA500]',
  red: 'bg-[#FF0000]',
  yellow: 'bg-[#FFD700]',
  green: 'bg-[#008000]',
  darkBlue: 'bg-[#00008B]',
  railroad: 'bg-slate-800',
  utility: 'bg-slate-400',
};

const PROPERTY_LABELS: Record<string, string> = {
  brown: 'Brown',
  lightBlue: 'Light Blue',
  pink: 'Pink',
  orange: 'Orange',
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  darkBlue: 'Dark Blue',
  railroad: 'Railroads',
  utility: 'Utilities',
};

export const PropertyOverridesTab: React.FC = () => {
  const properties = useGameStore(state => state.properties);
  const setPropertyOverride = useGameStore(state => state.setPropertyOverride);
  
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [errors, setErrors] = useState<Record<number, string[] | undefined>>({});

  const visibleProperties = useMemo(() => {
    return properties.filter(p => {
      if (p.type !== 'street' && p.type !== 'railroad' && p.type !== 'utility') return false;
      
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesGroup = filterGroup === 'all' || p.group === filterGroup;
      
      return matchesSearch && matchesGroup;
    });
  }, [properties, search, filterGroup]);

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

  const applyDefault = (p: Property) => {
    useGameStore.getState().setBaseProperty(p.id, p.priceOverride ?? p.price ?? null, (p.rentOverride ?? p.rent) ?? null);
  };

  const clearAllOverrides = () => {
    if (window.confirm('Are you sure you want to clear all property overrides?')) {
        properties.forEach(p => {
             if (p.priceOverride !== undefined || p.rentOverride !== undefined) {
                 setPropertyOverride(p.id, null, null);
             }
        });
    }
  };

  const getGroupIcon = (group: string) => {
      if (group === 'railroad') return <Train size={16} className="text-slate-100" />;
      if (group === 'utility') return <Zap size={16} className="text-slate-100" />;
      return <Building2 size={16} className="text-white/90" />;
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search properties..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
            </div>
            <div className="relative min-w-[160px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    value={filterGroup} 
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none appearance-none bg-white"
                >
                    <option value="all">All Groups</option>
                    {Object.keys(PROPERTY_LABELS).map(key => (
                        <option key={key} value={key}>{PROPERTY_LABELS[key]}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>
        </div>
        <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
                Found {visibleProperties.length} properties
            </p>
            <button 
                onClick={clearAllOverrides}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
            >
                Clear all overrides
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-3 max-h-[500px]">
        {visibleProperties.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
                <p>No properties found matching your criteria.</p>
            </div>
        ) : (
            visibleProperties.map(p => {
                const hasError = errors[p.id] && errors[p.id]!.length > 0;
                const isModified = p.priceOverride !== undefined || p.rentOverride !== undefined;

                return (
                    <div 
                        key={p.id} 
                        className={cn(
                            "bg-white rounded-xl border transition-all duration-200 overflow-hidden group",
                            hasError ? "border-red-300 ring-1 ring-red-100" : isModified ? "border-blue-300 shadow-sm" : "border-slate-200 hover:border-slate-300"
                        )}
                    >
                        <div className="flex flex-col sm:flex-row">
                            {/* Header / Color Strip */}
                            <div className={cn(
                                "sm:w-32 p-3 flex sm:flex-col items-center sm:items-start sm:justify-center gap-3",
                                PROPERTY_COLORS[p.group] || 'bg-slate-200'
                            )}>
                                <div className="text-white/90 p-1.5 bg-black/10 rounded-lg">
                                    {getGroupIcon(p.group)}
                                </div>
                                <div className="font-bold text-white text-sm sm:text-base leading-tight drop-shadow-sm truncate w-full sm:whitespace-normal">
                                    {p.name}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Price Input */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                                            Price
                                            {p.price && <span className="font-normal normal-case opacity-70">Default: ${formatNumberInput(String(p.price))}</span>}
                                        </label>
                                        <div className="relative group/input">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={16} />
                                            <input
                                                aria-label={`price-${p.id}`}
                                                type="number"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder={p.price ? String(p.price) : ''}
                                                value={p.priceOverride ?? ''}
                                                onChange={(e) => handlePriceChange(p.id, e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Rent Input */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                                            Rent <span className="normal-case opacity-60 font-normal">(comma sep.)</span>
                                        </label>
                                        <div className="relative group/input">
                                            <input
                                                aria-label={`rent-${p.id}`}
                                                type="text"
                                                placeholder={p.rent ? p.rent.join(',') : ''}
                                                value={p.rentOverride ? p.rentOverride.join(',') : ''}
                                                onChange={(e) => handleRentChange(p.id, e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Errors & Actions */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                    <div className="flex-1 min-w-0 mr-4">
                                        {hasError && (
                                            <div className="flex items-start gap-1.5 text-xs text-red-600 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                                <div className="flex flex-col">
                                                    {errors[p.id]!.map((m, i) => <span key={i}>{m}</span>)}
                                                </div>
                                            </div>
                                        )}
                                        {!hasError && isModified && (
                                            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                Modified
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => applyDefault(p)}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium transition-colors"
                                        title="Save current values as the new default for this property"
                                    >
                                        <Check size={14} />
                                        Set as Default
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default PropertyOverridesTab;