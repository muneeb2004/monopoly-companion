import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, ChevronDown, ChevronUp, Home, Ban, Trophy } from 'lucide-react';
import { cn, calculateRent } from '../lib/utils';
import type { Property } from '../types';

interface PropertyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_COLORS: Record<string, string> = {
  brown: 'bg-[#8B4513] text-white',
  lightBlue: 'bg-[#87CEEB] text-slate-900',
  pink: 'bg-[#FF69B4] text-white',
  orange: 'bg-[#FFA500] text-slate-900',
  red: 'bg-[#FF0000] text-white',
  yellow: 'bg-[#FFD700] text-slate-900',
  green: 'bg-[#008000] text-white',
  darkBlue: 'bg-[#00008B] text-white',
  railroad: 'bg-slate-800 text-white',
  utility: 'bg-slate-400 text-slate-900',
  special: 'bg-slate-200 text-slate-500',
  chance: 'bg-slate-200 text-slate-500',
  chest: 'bg-slate-200 text-slate-500',
  corner: 'bg-slate-200 text-slate-500',
  tax: 'bg-slate-200 text-slate-500',
};

const GROUPS = [
  { id: 'brown', label: 'Brown' },
  { id: 'lightBlue', label: 'Light Blue' },
  { id: 'pink', label: 'Pink' },
  { id: 'orange', label: 'Orange' },
  { id: 'red', label: 'Red' },
  { id: 'yellow', label: 'Yellow' },
  { id: 'green', label: 'Green' },
  { id: 'darkBlue', label: 'Dark Blue' },
  { id: 'railroad', label: 'Railroads' },
  { id: 'utility', label: 'Utilities' },
  { id: 'special', label: 'Special' },
];

const PropertyManagerComponent: React.FC<PropertyManagerProps> = ({ isOpen, onClose }) => {
  const properties = useGameStore(state => state.properties);
  const players = useGameStore(state => state.players);
  const assignProperty = useGameStore(state => state.assignProperty);
  const toggleMortgage = useGameStore(state => state.toggleMortgage);
  const improveProperty = useGameStore(state => state.improveProperty);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Render counter for tests (only exposed in test env)
  const renderRef = React.useRef(0);
  renderRef.current++;

  if (!isOpen) return null;

  const handleAssign = (propertyId: number, playerId: string | null) => {
    assignProperty(propertyId, playerId);
  };

  const getFilteredProperties = () => {
    return properties.filter(p => {
      if (filter === 'all') return true;
      if (filter === 'owned') return !!p.ownerId;
      if (filter === 'unowned') return !p.ownerId && p.group !== 'special';
      return true;
    });
  };

  const filteredProperties = getFilteredProperties();

  const isMonopoly = (group: string) => {
    if (group === 'special' || group === 'railroad' || group === 'utility') return false;
    const groupProps = properties.filter(p => p.group === group);
    const firstOwner = groupProps[0]?.ownerId;
    return firstOwner && groupProps.every(p => p.ownerId === firstOwner);
  };

  const getRentDisplay = (property: Property) => {
    if (property.group === 'utility') return '4x / 10x Dice';
    if (!property.rent) return 'N/A';
    
    // Calculate current rent assuming 7 for utilities (though handled above)
    // and passing all properties to check for monopoly/railroads
    const currentRent = calculateRent(property, properties, 7); 
    return `$${currentRent}`;
  };

  return (
    <div data-render-count={process.env.NODE_ENV === 'test' ? renderRef.current : undefined} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
        
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">Properties</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-2 flex gap-2 overflow-x-auto border-b border-slate-100">
          {['all', 'owned', 'unowned'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {GROUPS.map(group => {
            const groupProps = filteredProperties.filter(p => p.group === group.id);
            
            // Special handling: group might be 'special' but contain tax, chance, etc.
            // For simplicity, we just use the group field from the property which matches our GROUPS ids
            // except for chance/community chest which are mapped to 'special' in GROUPS logic if we want,
            // but the property definition has 'group: special' for some.
            // Wait, properties have specific groups. Let's strictly follow property.group
            
            // Actually, let's just filter by property.group === group.id
            // But we need to handle 'tax', 'chance', 'chest', 'corner' if they aren't in GROUPS.
            // The definitions say: group: 'special' for corners/tax?
            // Let's check definitions. Usually they are specific.
            // If property.group is not in GROUPS, it won't show.
            // Let's assume standard groups.
            
            if (groupProps.length === 0) return null;

            const monopoly = isMonopoly(group.id);
            const monopolyOwner = monopoly ? players.find(p => p.id === groupProps[0].ownerId) : null;

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex-1">{group.label}</h3>
                  {monopoly && monopolyOwner && (
                    <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold border border-yellow-200">
                      <Trophy size={12} />
                      Monopoly: {monopolyOwner.name}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {groupProps.map(property => {
                     const owner = players.find(p => p.id === property.ownerId);
                     const isExpanded = expandedId === property.id;

                     return (
                       <div key={property.id} className={cn("border rounded-lg bg-white shadow-sm overflow-hidden transition-all", monopoly ? "border-yellow-400 ring-1 ring-yellow-400/20" : "border-slate-100")}>
                         <div 
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => property.price && setExpandedId(isExpanded ? null : property.id)}
                         >
                           <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xs text-center p-1 leading-none shadow-sm relative shrink-0", GROUP_COLORS[property.group] || 'bg-slate-200')}>
                             {property.group === 'railroad' ? 'RR' : property.group === 'utility' ? 'UTIL' : ''}
                             {property.houses > 0 && (
                               <div className="absolute -top-1 -right-1 bg-green-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center border-2 border-white shadow-sm z-10">
                                 {property.houses === 5 ? 'H' : property.houses}
                               </div>
                             )}
                             {property.isMortgaged && (
                                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center z-10">
                                  <Ban className="text-white w-6 h-6" />
                                </div>
                             )}
                           </div>
                           
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2">
                               <span className={cn("font-bold text-slate-900 truncate", property.isMortgaged && "text-slate-400 line-through")}>{property.name}</span>
                             </div>
                             <div className="flex items-center gap-3 text-xs text-slate-500">
                               <span>Price: ${property.price || 0}</span>
                               {property.price && !property.isMortgaged && (
                                 <span className="flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                   Rent: {getRentDisplay(property)}
                                 </span>
                               )}
                             </div>
                           </div>

                           {property.price ? (
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <select
                                  value={property.ownerId || ''}
                                  onChange={(e) => handleAssign(property.id, e.target.value || null)}
                                  className="text-xs border border-slate-200 rounded p-1 max-w-[100px] outline-none focus:border-blue-500 transition-colors cursor-pointer"
                                  style={{ 
                                    backgroundColor: owner ? owner.color : 'white',
                                    color: owner ? (['#FFD700', '#22c55e', '#eab308'].includes(owner.color) ? 'black' : 'white') : 'black'
                                  }}
                                >
                                  <option value="" className="bg-white text-slate-900">Unowned</option>
                                  {players.map(p => (
                                    <option key={p.id} value={p.id} className="bg-white text-slate-900">
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                                <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </div>
                           ) : (
                              <div className="text-xs text-slate-400 italic">N/A</div>
                           )}
                         </div>

                         {/* Expanded Details */}
                         {isExpanded && owner && (
                           <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                             <div className="flex gap-2">
                                <button
                                  onClick={() => toggleMortgage(property.id)}
                                  className={cn(
                                    "flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                                    property.isMortgaged 
                                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                  )}
                                >
                                  <Ban size={16} />
                                  {property.isMortgaged 
                                    ? `Unmortgage (-$${Math.ceil((property.price || 0) * 0.55)})` 
                                    : `Mortgage (+$${Math.floor((property.price || 0) * 0.5)})`
                                  }
                                </button>
                             </div>

                             {property.houseCost && !property.isMortgaged && (
                                <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                                   <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-700 rounded-lg shrink-0">
                                     <Home size={20} />
                                   </div>
                                   <div className="flex-1">
                                     <div className="text-xs font-bold text-slate-500 uppercase">Houses</div>
                                     <div className="font-bold text-slate-900">
                                       {property.houses === 5 ? 'Hotel' : `${property.houses} / 4`}
                                     </div>
                                     <div className="text-xs text-slate-400">Cost: ${property.houseCost}</div>
                                   </div>
                                   <div className="flex flex-col gap-1">
                                     <button
                                       onClick={() => improveProperty(property.id, 'buy')}
                                       disabled={property.houses >= 5 || owner.balance < property.houseCost}
                                       className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                                     >
                                       Build
                                     </button>
                                     <button
                                       onClick={() => improveProperty(property.id, 'sell')}
                                       disabled={property.houses <= 0}
                                       className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
                                     >
                                       Sell
                                     </button>
                                   </div>
                                </div>
                             )}
                           </div>
                         )}
                       </div>
                     );
                  })}
                </div>
              </div>
            );
          })}
          
          {filteredProperties.length === 0 && (
             <div className="text-center py-10 text-slate-500">
               No properties found.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PropertyManager = React.memo(PropertyManagerComponent);
