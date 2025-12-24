import { create } from 'zustand';
import type { GameState, Transaction, TransactionType, Player, Trade, TradeStatus } from '../types';
import { INITIAL_PROPERTIES } from '../data/properties';
import { supabase } from '../lib/supabase';

interface GameStore extends GameState {
  gameId: string | null;
  gameStatus: 'SETUP' | 'ACTIVE' | 'COMPLETED' | null;
  isLoading: boolean;
  error: string | null;
  // Transient UI
  toastMessage: string | null;
  setToast: (message: string | null, duration?: number) => void;
  
  // Session Actions
  createNewGame: () => Promise<string | null>;
  joinGame: (gameId: string) => Promise<boolean>;
  leaveGame: () => void;
  
  // Game Actions
  addPlayer: (name: string, color: string, token: string) => Promise<void>;
  startGame: (mode: 'DIGITAL' | 'PHYSICAL') => Promise<void>;
  setDiceMode: (mode: 'DIGITAL' | 'PHYSICAL') => Promise<void>;
  nextTurn: () => Promise<void>;
  updateBalance: (playerId: string, amount: number, type: TransactionType, description: string, toId?: string) => Promise<void>;
  transferMoney: (fromId: string, toId: string, amount: number, description: string) => Promise<void>;
  assignProperty: (propertyId: number, playerId: string | null) => Promise<void>;
  movePlayer: (playerId: string, position: number) => Promise<void>;
  toggleJail: (playerId: string) => Promise<void>;
  takeLoan: (playerId: string, amount: number) => Promise<void>;
  repayLoan: (playerId: string, amount: number) => Promise<void>;
  resetGame: () => Promise<void>;
  // End the current game and return to setup with players preserved for editing
  endAndRestart: () => Promise<void>;

  // Trade Actions
  createTrade: (receiverId: string, offeredMoney: number, requestedMoney: number, offeredProperties: number[], requestedProperties: number[]) => Promise<void>;
  respondToTrade: (tradeId: string, status: TradeStatus) => Promise<void>;
  cancelTrade: (tradeId: string) => Promise<void>;

  // Property Actions
  toggleMortgage: (propertyId: number) => Promise<void>;
  improveProperty: (propertyId: number, action: 'buy' | 'sell') => Promise<void>;

  // Settings
  setStartingMoney: (amount: number) => Promise<void>;
  setJailBailAmount: (amount: number) => Promise<void>;
  setBankTotal: (amount: number) => Promise<void>;
  setShowBankLowWarning: (enabled: boolean) => void;
  setBankLowThreshold: (amount: number) => Promise<void>;
  setMultipliers: (priceMultiplier: number, rentMultiplier: number) => Promise<void>;
  setGroupHouseRentMode: (mode: 'standard' | 'groupTotal') => Promise<void>;
  setShowGroupHouseTotals: (enabled: boolean) => Promise<void>;
  setPropertyOverride: (propertyId: number, priceOverride?: number | null, rentOverride?: number[] | null) => Promise<void>;
  // Persist base property defaults (price/rent) into DB
  setBaseProperty: (propertyId: number, price?: number | null, rent?: number[] | null) => Promise<void>;
  applySettingsToProperties: () => void;
  resetSettings: () => Promise<void>;
  recordUndo: (playerId: string, description: string) => Promise<void>;
  addUndoEntry: (entry: import('../types').UndoEntry) => Promise<void>;
  fetchUndoEntries: () => Promise<void>;
  revertUndoEntry: (entryId: number, actorId?: string | null) => Promise<boolean>;
  incrementJailTurns: (playerId: string) => Promise<void>;
} 

const INITIAL_STATE = {
  gameId: null,
  gameStatus: null,
  isLoading: false,
  error: null,
  // Toast for transient messages
  toastMessage: null,
  players: [],
  properties: INITIAL_PROPERTIES,
  currentPlayerIndex: 0,
  transactions: [],
  trades: [],
  turnCount: 1,
  diceMode: 'DIGITAL' as const,
  startingMoney: 1500,
  jailBailAmount: 50,
  bankTotal: 100000,
  showBankLowWarning: true,
  bankLowThreshold: 10000,
  priceMultiplier: 1,
  rentMultiplier: 1,
  groupHouseRentMode: 'standard' as const,
  showGroupHouseTotals: false,
  undoEntries: []
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  // Toast setter
  setToast: (message, duration = 3000) => {
    set({ toastMessage: message });
    if (message && duration > 0) {
      setTimeout(() => set({ toastMessage: null }), duration);
      // No cleanup needed for this simple impl; subsequent toasts overwrite message
    }
  },

  createNewGame: async () => {
    if (!supabase) return null;
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('games')
        .insert({ 
          status: 'SETUP', 
          dice_mode: 'DIGITAL', 
          starting_money: get().startingMoney, 
          jail_bail_amount: get().jailBailAmount,
          bank_total: get().bankTotal,
          bank_low_threshold: get().bankLowThreshold,
          price_multiplier: get().priceMultiplier, 
          rent_multiplier: get().rentMultiplier 
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const gameId = data.id;
      localStorage.setItem('monopoly_game_id', gameId);
      set({ gameId, gameStatus: 'SETUP', diceMode: 'DIGITAL', isLoading: false });
      get().joinGame(gameId); // Subscribe
      return gameId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg, isLoading: false });
      return null;
    }
  },

  joinGame: async (gameId: string) => {
    if (!supabase) return false;
    set({ isLoading: true, error: null });

    // Supabase payloads are loosely typed - allow 'any' in this block
    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {
      // Fetch initial state
      const [gameRes, playersRes, propsRes, txsRes, tradesRes] = await Promise.all([
        supabase.from('games').select('*').eq('id', gameId).single(),
        supabase.from('players').select('*').eq('game_id', gameId).order('created_at', { ascending: true }),
        supabase.from('game_properties').select('*').eq('game_id', gameId),
        supabase.from('transactions').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(50),
        supabase.from('trades').select('*').eq('game_id', gameId).order('created_at', { ascending: false })
      ]);

      if (gameRes.error) throw gameRes.error;

      // Merge properties: prefer 'properties' table if it exists so the board is dynamic/persistent
      type GamePropertyRow = { property_index: number; owner_id?: string | null; houses?: number; is_mortgaged?: boolean; price_override?: number | null; rent_override?: number[] | null };
      const dynamicProps = (propsRes.data || []) as GamePropertyRow[];

      // Attempt to read base properties from 'properties' table which holds canonical board definitions
      let baseProps = INITIAL_PROPERTIES;
      try {
        const baseRes = await supabase.from('properties').select('*').order('property_index');
        if (baseRes.data && baseRes.data.length > 0) {
          baseProps = baseRes.data.map((bp: any) => ({
            id: bp.property_index,
            name: bp.name,
            type: bp.type,
            group: bp.group,
            price: bp.price ?? undefined,
            rent: bp.rent ?? undefined,
            houseCost: bp.house_cost ?? undefined,
            houses: 0,
            isMortgaged: false
          }));
        }
      } catch (e) {
        // If fetching base props fails, fallback to INITIAL_PROPERTIES
      }

      const mergedProperties = baseProps.map(p => {
        const dynamic = dynamicProps.find((dp) => dp.property_index === p.id);
        return dynamic ? { 
          ...p, 
          id: p.id,
          ownerId: dynamic.owner_id,
          houses: dynamic.houses ?? p.houses ?? 0,
          isMortgaged: dynamic.is_mortgaged ?? p.isMortgaged ?? false,
          priceOverride: dynamic.price_override === null ? undefined : dynamic.price_override,
          rentOverride: dynamic.rent_override === null ? undefined : dynamic.rent_override
        } : p;
      });

      // Map players
      const players = (playersRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        token: p.token || 'dog',
        balance: p.balance,
        position: p.position,
        isJailed: p.is_jailed,
        jailTurns: p.jail_turns,
        getOutOfJailCards: p.get_out_of_jail_cards,
        loans: p.loans
      }));

      // Map transactions
      const transactions = (txsRes.data || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        fromId: t.from_id || 'BANK',
        toId: t.to_id || 'BANK',
        description: t.description,
        timestamp: new Date(t.created_at).getTime()
      }));

      // Map trades
      const trades = (tradesRes.data || []).map((t: any) => ({
        id: t.id,
        senderId: t.sender_id,
        receiverId: t.receiver_id,
        offeredMoney: t.offered_money,
        requestedMoney: t.requested_money,
        offeredProperties: t.offered_properties,
        requestedProperties: t.requested_properties,
        status: t.status,
        createdAt: new Date(t.created_at).getTime()
      }));

      set({
        gameId,
        gameStatus: gameRes.data.status,
        diceMode: gameRes.data.dice_mode || 'DIGITAL',
        turnCount: gameRes.data.turn_count,
        currentPlayerIndex: gameRes.data.current_player_index,
        players,
        properties: mergedProperties.map(mp => {
          // merge override fields from DB (propsRes) and ensure required fields are present
          const dp = dynamicProps.find((d: any) => d.property_index === mp.id);
          return {
            id: mp.id,
            name: mp.name,
            type: mp.type,
            group: mp.group,
            price: mp.price,
            rent: mp.rent,
            houseCost: mp.houseCost,
            ownerId: dp?.owner_id ?? mp.ownerId ?? null,
            houses: dp?.houses ?? mp.houses ?? 0,
            isMortgaged: dp?.is_mortgaged ?? mp.isMortgaged ?? false,
            priceOverride: dp ? dp.price_override ?? undefined : mp.priceOverride ?? undefined,
            rentOverride: dp ? (dp.rent_override || undefined) : mp.rentOverride ?? undefined
          };
        }),
        transactions,
        trades,
        startingMoney: gameRes.data.starting_money ?? get().startingMoney,
        jailBailAmount: gameRes.data.jail_bail_amount ?? get().jailBailAmount,
        bankTotal: gameRes.data.bank_total ?? get().bankTotal,
        bankLowThreshold: gameRes.data.bank_low_threshold ?? get().bankLowThreshold,
        // Coerce group_house_rent_mode to the expected union type safely
        groupHouseRentMode: (gameRes.data.group_house_rent_mode === 'groupTotal' ? 'groupTotal' : (gameRes.data.group_house_rent_mode === 'standard' ? 'standard' : get().groupHouseRentMode)),
        showGroupHouseTotals: (typeof gameRes.data.show_group_house_totals === 'boolean') ? gameRes.data.show_group_house_totals : get().showGroupHouseTotals,
        // load undo entries for the game
        undoEntries: (await (async () => {
          try {
            const u = await (supabase ? supabase.from('undo_history').select('*').eq('game_id', gameId).order('created_at', { ascending: false }) : Promise.resolve({ data: [] } as any));
            return (u.data || []).map((row: any) => ({
              id: row.id,
              playerId: row.player_id,
              performedBy: row.performed_by,
              description: row.description,
              prevPosition: row.prev_position,
              newPosition: row.new_position,
              prevIsJailed: row.prev_is_jailed,
              newIsJailed: row.new_is_jailed,
              passGoAwarded: row.pass_go_awarded,
              createdAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
              reverted: row.reverted,
              revertedAt: row.reverted_at ? new Date(row.reverted_at).getTime() : undefined,
              revertedBy: row.reverted_by
            }));
          } catch (e) {
            return [];
          }
        })()),
        isLoading: false
      });

      // Apply settings to calculate correct prices/rents based on loaded multipliers/overrides
      get().applySettingsToProperties();

      localStorage.setItem('monopoly_game_id', gameId);

      supabase.channel(`game:${gameId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload: any) => {
          if (payload.new) {
            set({ 
              gameStatus: payload.new.status,
              diceMode: payload.new.dice_mode,
              turnCount: payload.new.turn_count,
              currentPlayerIndex: payload.new.current_player_index,
              jailBailAmount: payload.new.jail_bail_amount ?? get().jailBailAmount,
              bankTotal: payload.new.bank_total ?? get().bankTotal,
              bankLowThreshold: payload.new.bank_low_threshold ?? get().bankLowThreshold
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, (payload: any) => {
          const currentPlayers = get().players;
          if (payload.eventType === 'INSERT') {
            const p = payload.new;
            const newPlayer: Player = {
              id: p.id, name: p.name, color: p.color, token: p.token || 'dog', balance: p.balance, position: p.position,
              isJailed: p.is_jailed, jailTurns: p.jail_turns, getOutOfJailCards: p.get_out_of_jail_cards, loans: p.loans
            };
            // Prevent duplicate players (simple check)
            if (!currentPlayers.some(cp => cp.id === newPlayer.id)) {
              set({ players: [...currentPlayers, newPlayer] });
            }
          } else if (payload.eventType === 'UPDATE') {
             const p = payload.new;
             set({ players: currentPlayers.map(cp => cp.id === p.id ? {
              ...cp, 
              balance: p.balance, 
              position: p.position, 
              isJailed: p.is_jailed, 
              jailTurns: p.jail_turns, 
              getOutOfJailCards: p.get_out_of_jail_cards, 
              loans: p.loans,
              token: p.token || cp.token
             } : cp) });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_properties', filter: `game_id=eq.${gameId}` }, (payload: any) => {
           const currentProps = get().properties;
           if (payload.new) {
             const np = payload.new;
             set({ properties: currentProps.map(cp => cp.id === np.property_index ? {
               ...cp, 
               ownerId: np.owner_id, 
               houses: np.houses, 
               isMortgaged: np.is_mortgaged
             } : cp) });
           }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `game_id=eq.${gameId}` }, (payload: any) => {
           const t = payload.new;
           const newTx: Transaction = {
             id: t.id, type: t.type, amount: t.amount, fromId: t.from_id || 'BANK', 
             toId: t.to_id || 'BANK', description: t.description, timestamp: new Date(t.created_at).getTime()
           };
           // Prevent duplicate transactions
           if (!get().transactions.some(existing => existing.id === newTx.id)) {
             set({ transactions: [newTx, ...get().transactions].slice(0, 50) });
           }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `game_id=eq.${gameId}` }, (payload: any) => {
           const currentTrades = get().trades || [];
           const t = payload.new;
           const trade: Trade = {
             id: t.id,
             senderId: t.sender_id,
             receiverId: t.receiver_id,
             offeredMoney: t.offered_money,
             requestedMoney: t.requested_money,
             offeredProperties: t.offered_properties,
             requestedProperties: t.requested_properties,
             status: t.status,
             createdAt: new Date(t.created_at).getTime()
           };

           if (payload.eventType === 'INSERT') {
             set({ trades: [trade, ...currentTrades] });
           } else if (payload.eventType === 'UPDATE') {
             set({ trades: currentTrades.map(ct => ct.id === trade.id ? trade : ct) });
           }
        })
        .subscribe();

      return true;
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg, isLoading: false });
      return false;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  },

  leaveGame: () => {
    if (!supabase) return;
    const { gameId } = get();
    if (gameId) {
      supabase.channel(`game:${gameId}`).unsubscribe();
    }
    localStorage.removeItem('monopoly_game_id');
    set(INITIAL_STATE);
  },

  addPlayer: async (name, color, token) => {
    const { gameId, startingMoney } = get();
    if (!supabase || !gameId) return;
    
    await supabase.from('players').insert({
      game_id: gameId,
      name,
      color,
      token,
      balance: startingMoney ?? 1500
    });
  },

  startGame: async (mode) => {
    const { gameId } = get();
    if (!supabase || !gameId) return;

    // Initialize all properties for the game using current properties (respect settings and overrides)
    const currentProps = get().properties;
    const propertyInserts = currentProps.map(p => ({
      game_id: gameId,
      property_index: p.id,
      owner_id: null,
      houses: 0,
      is_mortgaged: false,
      price_override: (p.priceOverride === undefined ? null : p.priceOverride),
      rent_override: (p.rentOverride === undefined ? null : p.rentOverride)
    }));

    await supabase.from('game_properties').insert(propertyInserts);
    await supabase.from('games').update({ 
      status: 'ACTIVE',
      dice_mode: mode 
    }).eq('id', gameId);
    
    set({ diceMode: mode });
  },

  setDiceMode: async (mode) => {
    const { gameId } = get();
    if (!supabase || !gameId) return;

    await supabase.from('games').update({ dice_mode: mode }).eq('id', gameId);
    set({ diceMode: mode });
  },

  // Settings
  setStartingMoney: async (amount) => {
    const { gameId, gameStatus, players } = get();
    if (gameId && supabase) {
      await supabase.from('games').update({ starting_money: amount }).eq('id', gameId);
      
      // If in setup mode, update existing players' balance to match new starting money
      if (gameStatus === 'SETUP') {
        const client = supabase!;
        const updates = players.map(p => 
          client.from('players').update({ balance: amount }).eq('id', p.id)
        );
        await Promise.all(updates);
        // Local state update handled by subscription usually, but we can do it optimistically
        set({ 
          startingMoney: amount,
          players: players.map(p => ({ ...p, balance: amount }))
        });
        return;
      }
    }
    set({ startingMoney: amount });
  },

  setJailBailAmount: async (amount) => {
    const { gameId } = get();
    if (gameId && supabase) {
      await supabase.from('games').update({ jail_bail_amount: amount }).eq('id', gameId);
    }
    set({ jailBailAmount: amount });
  },

  setBankTotal: async (amount) => {
    const { gameId } = get();
    if (gameId && supabase) {
      await supabase.from('games').update({ bank_total: amount }).eq('id', gameId);
    }
    set({ bankTotal: amount });
  },

  setShowBankLowWarning: (enabled) => {
    set({ showBankLowWarning: Boolean(enabled) });
  },

  setBankLowThreshold: async (amount) => {
    const { gameId } = get();
    if (gameId && supabase) {
      await supabase.from('games').update({ bank_low_threshold: amount }).eq('id', gameId);
    }
    set({ bankLowThreshold: amount });
  },

  setMultipliers: async (priceMultiplier, rentMultiplier) => {
    const { gameId } = get();
    if (gameId && supabase) {
      await supabase.from('games').update({ price_multiplier: priceMultiplier, rent_multiplier: rentMultiplier }).eq('id', gameId);
    }
    set({ priceMultiplier, rentMultiplier });
  },

  setGroupHouseRentMode: async (mode) => {
    const { gameId } = get();
    if (gameId && supabase) {
      await supabase.from('games').update({ group_house_rent_mode: mode }).eq('id', gameId);
    }
    set({ groupHouseRentMode: mode });
  },

  setShowGroupHouseTotals: async (enabled) => {
    const { gameId } = get();
    if (gameId && supabase) {
      await supabase.from('games').update({ show_group_house_totals: enabled }).eq('id', gameId);
    }
    set({ showGroupHouseTotals: Boolean(enabled) });
  },

  setPropertyOverride: async (propertyId, priceOverride = null, rentOverride = null) => {
    const { gameId, properties } = get();

    // sanitize values
    const sanitizedPrice = (typeof priceOverride === 'number' && Number.isFinite(priceOverride)) ? priceOverride : null;
    const sanitizedRent = Array.isArray(rentOverride) ? rentOverride.map(Number).filter(n => Number.isFinite(n)) : null;

    // Update DB (use null to clear)
    if (gameId && supabase) {
      await supabase.from('game_properties').update({ price_override: sanitizedPrice, rent_override: sanitizedRent }).match({ game_id: gameId, property_index: propertyId });
    }

    // Update local state (use undefined to mean no override)
    set({ properties: properties.map(p => p.id === propertyId ? { ...p, priceOverride: sanitizedPrice === null ? undefined : sanitizedPrice, rentOverride: sanitizedRent === null ? undefined : sanitizedRent } : p) });
  },

  setBaseProperty: async (propertyId, price = undefined, rent = undefined) => {
    // Persist base property defaults into 'properties' table. If supabase isn't available, update local state.
    if (supabase) {
      try {
        const upsertObj: any = { property_index: propertyId };
        if (price !== undefined) upsertObj.price = price;
        if (rent !== undefined) upsertObj.rent = rent;

        await supabase.from('properties').upsert(upsertObj, { onConflict: 'property_index' });
      } catch (e) {
        // ignore DB errors but still update local state
      }

      // Update local state regardless to keep UI responsive
      set({ properties: get().properties.map(p => p.id === propertyId ? { ...p, price: price ?? p.price, rent: rent ?? p.rent } : p) });
      return;
    }

    // Local-only fallback
    set({ properties: get().properties.map(p => p.id === propertyId ? { ...p, price: price ?? p.price, rent: rent ?? p.rent } : p) });
  },

  applySettingsToProperties: () => {
    const priceMul = get().priceMultiplier ?? 1;
    const rentMul = get().rentMultiplier ?? 1;
    const currentProps = get().properties;

    // Create a map of current state to preserve
    const currentStateMap = currentProps.reduce<Record<number, Partial<import('../types').Property>>>((acc, p) => {
      acc[p.id] = { 
        priceOverride: p.priceOverride, 
        rentOverride: p.rentOverride,
        ownerId: p.ownerId,
        houses: p.houses,
        isMortgaged: p.isMortgaged
      };
      return acc;
    }, {});

    const merged = currentProps.map(p => {
      const state = currentStateMap[p.id] || {};
      const basePrice = p.price ? Math.round((p.price as number) * priceMul) : undefined;
      const finalPrice = state.priceOverride ?? basePrice;
      const baseRent = p.rent ? p.rent.map(r => Math.round(r * rentMul)) : undefined;
      const finalRent = state.rentOverride ?? baseRent;

      return {
        ...p,
        price: finalPrice,
        rent: finalRent,
        priceOverride: state.priceOverride,
        rentOverride: state.rentOverride,
        houses: state.houses || 0,
        isMortgaged: state.isMortgaged || false,
        ownerId: state.ownerId || null
      };
    });

    set({ properties: merged });
  },

  resetSettings: async () => {
    const { gameId } = get();
    if (gameId && supabase) {
      await supabase.from('games').update({ starting_money: 1500, jail_bail_amount: 50, price_multiplier: 1, rent_multiplier: 1, bank_total: 100000, group_house_rent_mode: 'standard', show_group_house_totals: false }).eq('id', gameId);
      await supabase.from('game_properties').update({ price_override: null, rent_override: null }).eq('game_id', gameId);
    }
    set({ startingMoney: 1500, jailBailAmount: 50, bankTotal: 100000, showBankLowWarning: true, priceMultiplier: 1, rentMultiplier: 1, groupHouseRentMode: 'standard', showGroupHouseTotals: false, properties: INITIAL_PROPERTIES });
  },

  incrementJailTurns: async (playerId) => {
     const { gameId, players } = get();
     if (!supabase || !gameId) return;

     const player = players.find(p => p.id === playerId);
     if (!player) return;

     const newTurns = (player.jailTurns || 0) + 1;
     
     // Check if turns >= 3, then unjail
     const shouldRelease = newTurns >= 3;

     await supabase.from('players').update({ 
       jail_turns: shouldRelease ? 0 : newTurns,
       is_jailed: !shouldRelease 
     }).eq('id', playerId);

     if (shouldRelease) {
       // Log release
       await supabase.from('transactions').insert({
         game_id: gameId,
         type: 'OTHER',
         amount: 0,
         from_id: 'BANK',
         to_id: playerId,
         description: 'Released from Jail (Time served)'
       });
     }
  },

  nextTurn: async () => {
    const { gameId, currentPlayerIndex, players, turnCount } = get();
    if (!supabase || !gameId) return;

    const nextIndex = (currentPlayerIndex + 1) % players.length;
    const nextTurnCount = nextIndex === 0 ? turnCount + 1 : turnCount;

    await supabase.from('games').update({
      current_player_index: nextIndex,
      turn_count: nextTurnCount
    }).eq('id', gameId);
  },

  updateBalance: async (playerId, amount, type, description, toId) => {
    const { gameId, players } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const absAmount = Math.abs(amount);

    if (!supabase || !gameId) {
      // Local-only fallback: update player balance optimistically and record a simple transaction
      set({ players: players.map(p => p.id === playerId ? { ...p, balance: p.balance + amount } : p), transactions: [{ id: `local-${Date.now()}`, type, amount: absAmount, fromId: amount < 0 ? playerId : 'BANK', toId: amount > 0 ? (toId || playerId) : 'BANK', description, timestamp: Date.now() }, ...get().transactions].slice(0, 50) });
      return;
    }

    // Create transaction
    await supabase.from('transactions').insert({
      game_id: gameId,
      type,
      amount: absAmount,
      from_id: amount < 0 ? playerId : null,
      to_id: amount > 0 ? (toId || playerId) : null,
      description
    });

    // Update player balance
    await supabase.from('players').update({
      balance: player.balance + amount
    }).eq('id', playerId);
  },

  transferMoney: async (fromId, toId, amount, description) => {
    const { gameId, players } = get();
    if (!supabase || !gameId) return;

    const fromPlayer = players.find(p => p.id === fromId);
    const toPlayer = players.find(p => p.id === toId);
    
    if (!fromPlayer || !toPlayer) return;

    await supabase.from('transactions').insert({
      game_id: gameId,
      type: 'TRADE',
      amount,
      from_id: fromId,
      to_id: toId,
      description
    });

    await supabase.from('players').update({ balance: fromPlayer.balance - amount }).eq('id', fromId);
    await supabase.from('players').update({ balance: toPlayer.balance + amount }).eq('id', toId);
  },

  assignProperty: async (propertyId, playerId) => {
    const { gameId } = get();
    if (!supabase || !gameId) return;

    await supabase.from('game_properties').update({
      owner_id: playerId
    }).match({ game_id: gameId, property_index: propertyId });
  },

  movePlayer: async (playerId, position) => {
    const { gameId, players } = get();
    if (!supabase || !gameId) {
      // Local-only fallback for testability and local mode
      set({ players: players.map(p => p.id === playerId ? { ...p, position } : p) });
      return;
    }
    
    await supabase.from('players').update({ position }).eq('id', playerId);
  },

  toggleJail: async (playerId) => {
    const { gameId, players } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    if (!supabase || !gameId) {
      // Local-only fallback
      set({ players: players.map(p => p.id === playerId ? { ...p, isJailed: !p.isJailed, jailTurns: 0 } : p) });
      return;
    }

    await supabase.from('players').update({ 
      is_jailed: !player.isJailed,
      jail_turns: 0 
    }).eq('id', playerId);
  },

  takeLoan: async (playerId, amount) => {
    const { gameId, players } = get();
    if (!gameId) return;

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const bank = get().bankTotal ?? 0;
    // Prevent loans if bank doesn't have enough funds
    if (bank < amount) return;

    if (supabase) {
      await supabase.from('transactions').insert({
        game_id: gameId,
        type: 'OTHER',
        amount,
        from_id: 'BANK',
        to_id: playerId,
        description: `Took a $${amount} loan`,
        timestamp: Date.now()
      });

      await supabase.from('players').update({
        balance: player.balance + amount,
        loans: player.loans + amount
      }).eq('id', playerId);

      // Deduct from bank total
      await supabase.from('games').update({ bank_total: bank - amount }).eq('id', gameId);

      // Optimistically update local state
      set({ players: players.map(p => p.id === playerId ? { ...p, balance: p.balance + amount, loans: p.loans + amount } : p), bankTotal: bank - amount });
    } else {
      // Local-only fallback
      set({ players: players.map(p => p.id === playerId ? { ...p, balance: p.balance + amount, loans: p.loans + amount } : p), bankTotal: bank - amount });
    }
  },

  recordUndo: async (playerId, description) => {
    const { gameId } = get();
    const timestamp = Date.now();

    if (!supabase || !gameId) {
      // Local-only fallback: record a zero-amount UNDO transaction so it's visible in history
      set({ transactions: [{ id: `local-undo-${timestamp}`, type: 'UNDO' as TransactionType, amount: 0, fromId: playerId, toId: 'BANK', description, timestamp } as Transaction, ...(get().transactions || [])].slice(0, 50) });
      return;
    }

    await supabase.from('transactions').insert({
      game_id: gameId,
      type: 'UNDO',
      amount: 0,
      from_id: playerId,
      to_id: 'BANK',
      description,
      timestamp
    });

    // Also persist a small audit to undo_history for richer context
    try {
      await supabase.from('undo_history').insert({ game_id: gameId, player_id: playerId, performed_by: null, description, prev_position: 0, new_position: 0, prev_is_jailed: false, new_is_jailed: false, pass_go_awarded: 0 });
    } catch (e) {
      // ignore errors
    }
  },

  addUndoEntry: async (entry) => {
    const { gameId } = get();
    if (!gameId) return;

    if (!supabase) {
      // local-only push
      set({ undoEntries: [{ ...entry, createdAt: Date.now(), id: Math.floor(Math.random() * 1000000) }, ...(get().undoEntries || [])] });
      return;
    }

    try {
      const payload: any = {
        game_id: gameId,
        player_id: entry.playerId,
        performed_by: entry.performedBy ?? null,
        description: entry.description ?? null,
        prev_position: entry.prevPosition,
        new_position: entry.newPosition,
        prev_is_jailed: entry.prevIsJailed,
        new_is_jailed: entry.newIsJailed,
        pass_go_awarded: entry.passGoAwarded ?? 0
      };
      const res = await supabase.from('undo_history').insert(payload).select().single();
      if (res.data) {
        const row = res.data as any;
        const mapped = { id: row.id, playerId: row.player_id, performedBy: row.performed_by, description: row.description, prevPosition: row.prev_position, newPosition: row.new_position, prevIsJailed: row.prev_is_jailed, newIsJailed: row.new_is_jailed, passGoAwarded: row.pass_go_awarded, createdAt: new Date(row.created_at).getTime(), reverted: row.reverted };
        set({ undoEntries: [mapped, ...(get().undoEntries || [])] });
      }
    } catch (e) {
      // ignore errors
    }
  },

  fetchUndoEntries: async () => {
    const { gameId } = get();
    if (!gameId) return;
    if (!supabase) return;
    try {
      const res = await supabase.from('undo_history').select('*').eq('game_id', gameId).order('created_at', { ascending: false });
      const entries = (res.data || []).map((row: any) => ({ id: row.id, playerId: row.player_id, performedBy: row.performed_by, description: row.description, prevPosition: row.prev_position, newPosition: row.new_position, prevIsJailed: row.prev_is_jailed, newIsJailed: row.new_is_jailed, passGoAwarded: row.pass_go_awarded, createdAt: row.created_at ? new Date(row.created_at).getTime() : undefined, reverted: row.reverted, revertedAt: row.reverted_at ? new Date(row.reverted_at).getTime() : undefined, revertedBy: row.reverted_by }));
      set({ undoEntries: entries });
    } catch (e) {
      // ignore
    }
  },

  revertUndoEntry: async (entryId, actorId = null) => {
    const entry = (get().undoEntries || []).find(e => e.id === entryId);
    if (!entry) return false;
    if (entry.reverted) return false;

    // apply revert locally first (if player exists)
    const player = get().players.find(p => p.id === entry.playerId);
    if (player) {
      // restore position
      await get().movePlayer(entry.playerId, entry.prevPosition);
      // restore jailed state if differs
      if ((get().players.find(p => p.id === entry.playerId)?.isJailed) !== entry.prevIsJailed) {
        await get().toggleJail(entry.playerId);
      }

      // reverse pass GO award if any
      if (entry.passGoAwarded && entry.passGoAwarded > 0) {
        await get().updateBalance(entry.playerId, -entry.passGoAwarded, 'UNDO', `Revert Pass GO from undo #${entryId}`);
      }
    } else {
      // Player not found (local-only scenarios); still allow marking entry reverted for audit
    }

    // mark reverted in DB and local state
    const timestamp = new Date().toISOString();
    if (supabase) {
      try {
        await supabase.from('undo_history').update({ reverted: true, reverted_at: timestamp, reverted_by: actorId }).eq('id', entryId);
      } catch (e) {
        // ignore
      }
    }

    // local mark
    set({ undoEntries: (get().undoEntries || []).map(u => u.id === entryId ? { ...u, reverted: true, revertedAt: Date.now(), revertedBy: actorId } : u) });

    // record transaction audit
    await get().recordUndo(entry.playerId, `Reverted undo #${entryId} by ${actorId ?? 'local'}`);

    return true;
  },

  repayLoan: async (playerId, amount) => {
    const { gameId, players } = get();
    if (!gameId) return;

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // No interest - just repay principal
    const totalToPay = amount;

    if (supabase) {
      await supabase.from('transactions').insert({
        game_id: gameId,
        type: 'OTHER',
        amount: totalToPay,
        from_id: playerId,
        to_id: 'BANK',
        description: `Repaid $${amount} loan`,
        timestamp: Date.now()
      });

      await supabase.from('players').update({
        balance: player.balance - totalToPay,
        loans: Math.max(0, player.loans - amount)
      }).eq('id', playerId);

      // Increase bank total
      const bank = get().bankTotal ?? 0;
      await supabase.from('games').update({ bank_total: bank + amount }).eq('id', gameId);

      // Optimistic local update
      set({ players: players.map(p => p.id === playerId ? { ...p, balance: p.balance - totalToPay, loans: Math.max(0, p.loans - amount) } : p), bankTotal: (get().bankTotal ?? 0) + amount });
    } else {
      // Local-only fallback
      set({ players: players.map(p => p.id === playerId ? { ...p, balance: p.balance - totalToPay, loans: Math.max(0, p.loans - amount) } : p), bankTotal: (get().bankTotal ?? 0) + amount });
    }
  },

  resetGame: async () => {
    get().leaveGame();
  },

  endAndRestart: async () => {
    // Preserve current players, but reset balances and game-specific flags so they can be edited in Setup
    const prevPlayers = get().players || [];
    const startingMoney = get().startingMoney ?? 1500;

    const resetPlayers = prevPlayers.map(p => ({
      ...p,
      balance: startingMoney,
      position: 0,
      isJailed: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      loans: 0
    }));

    // Unsubscribe and clear long-lived session state
    get().leaveGame();

    // Move to SETUP with preserved players (now editable) and reset other game state
    set({
      ...INITIAL_STATE,
      players: resetPlayers,
      gameStatus: 'SETUP'
    });

    // Notify the user
    set({ toastMessage: 'Game ended — edit players to start again' });
  },

  createTrade: async (receiverId, offeredMoney, requestedMoney, offeredProperties, requestedProperties) => {
    const { gameId, players } = get();
    if (!supabase || !gameId) return;

    const senderId = players[get().currentPlayerIndex].id; // Assumption: current player initiates

    await supabase.from('trades').insert({
      game_id: gameId,
      sender_id: senderId,
      receiver_id: receiverId,
      offered_money: offeredMoney,
      requested_money: requestedMoney,
      offered_properties: offeredProperties,
      requested_properties: requestedProperties,
      status: 'PENDING'
    });
  },

  respondToTrade: async (tradeId, status) => {
    const { gameId, trades, players } = get();
    if (!supabase || !gameId) return;

    const trade = trades?.find(t => t.id === tradeId);
    if (!trade) return;

    if (status === 'ACCEPTED') {
      // Execute Transfer
      const sender = players.find(p => p.id === trade.senderId);
      const receiver = players.find(p => p.id === trade.receiverId);
      
      if (!sender || !receiver) return;

      // Money Transfer
      if (trade.offeredMoney > 0) {
        await supabase.from('players').update({ balance: sender.balance - trade.offeredMoney }).eq('id', sender.id);
        await supabase.from('players').update({ balance: receiver.balance + trade.offeredMoney }).eq('id', receiver.id);
      }
      if (trade.requestedMoney > 0) {
        await supabase.from('players').update({ balance: receiver.balance - trade.requestedMoney }).eq('id', receiver.id);
        await supabase.from('players').update({ balance: sender.balance + trade.requestedMoney }).eq('id', sender.id);
      }

      // Property Transfer
      for (const propId of trade.offeredProperties) {
         await supabase.from('game_properties').update({ owner_id: receiver.id }).match({ game_id: gameId, property_index: propId });
      }
      for (const propId of trade.requestedProperties) {
         await supabase.from('game_properties').update({ owner_id: sender.id }).match({ game_id: gameId, property_index: propId });
      }

      // Log Transaction
      await supabase.from('transactions').insert({
        game_id: gameId,
        type: 'TRADE',
        amount: 0,
        from_id: sender.id,
        to_id: receiver.id,
        description: 'Completed a trade'
      });
    }

    await supabase.from('trades').update({ status }).eq('id', tradeId);
  },

  cancelTrade: async (tradeId) => {
     if (!supabase) return;
     await supabase.from('trades').update({ status: 'CANCELLED' }).eq('id', tradeId);
  },

  toggleMortgage: async (propertyId) => {
    const { gameId, players, properties } = get();
    if (!supabase || !gameId) return;

    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.ownerId) return;

    const player = players.find(p => p.id === property.ownerId);
    if (!player) return;

    const mortgageValue = Math.floor((property.price || 0) * 0.5);
    const newIsMortgaged = !property.isMortgaged;

    // Financial adjustment: 
    // If mortgaging (becoming true) -> Get Money (+value)
    // If unmortgaging (becoming false) -> Pay Money (-value - 10% interest usually, keeping it simple -value for now)
    const balanceChange = newIsMortgaged ? mortgageValue : -Math.ceil(mortgageValue * 1.1); // 10% interest on unmortgage

    if (!newIsMortgaged && player.balance < Math.abs(balanceChange)) {
      // Check if player has enough to unmortgage
      return; // Or throw error
    }

    // Update Property
    await supabase.from('game_properties').update({ 
      is_mortgaged: newIsMortgaged 
    }).match({ game_id: gameId, property_index: propertyId });

    // Update Player Balance
    await supabase.from('players').update({
      balance: player.balance + balanceChange
    }).eq('id', player.id);

    // Log Transaction
    await supabase.from('transactions').insert({
      game_id: gameId,
      type: 'OTHER',
      amount: Math.abs(balanceChange),
      from_id: newIsMortgaged ? 'BANK' : player.id,
      to_id: newIsMortgaged ? player.id : 'BANK',
      description: newIsMortgaged ? `Mortgaged ${property.name}` : `Unmortgaged ${property.name}`
    });
  },

  improveProperty: async (propertyId, action) => {
    const { gameId, players, properties } = get();
    if (!supabase || !gameId) return;

    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.ownerId || !property.houseCost) return;

    const player = players.find(p => p.id === property.ownerId);
    if (!player) return;

    if (action === 'buy') {
      if (property.houses >= 5) return; // Max Hotel
      if (player.balance < property.houseCost) return;

      // Enforce Monopoly Rule
      if (property.type === 'street') {
        const groupProperties = properties.filter(p => p.group === property.group);
        const hasMonopoly = groupProperties.every(p => p.ownerId === player.id);
        if (!hasMonopoly) return; // Cannot build without monopoly
      }

      await supabase.from('game_properties').update({
        houses: property.houses + 1
      }).match({ game_id: gameId, property_index: propertyId });

      await supabase.from('players').update({
        balance: player.balance - property.houseCost
      }).eq('id', player.id);

       await supabase.from('transactions').insert({
        game_id: gameId,
        type: 'BUY_PROPERTY',
        amount: property.houseCost,
        from_id: player.id,
        to_id: 'BANK',
        description: `Built house/hotel on ${property.name}`
      });

    } else {
      if (property.houses <= 0) return;

      const refund = Math.floor(property.houseCost * 0.5); // Sell for half price

      await supabase.from('game_properties').update({
        houses: property.houses - 1
      }).match({ game_id: gameId, property_index: propertyId });

      await supabase.from('players').update({
        balance: player.balance + refund
      }).eq('id', player.id);

      await supabase.from('transactions').insert({
        game_id: gameId,
        type: 'OTHER',
        amount: refund,
        from_id: 'BANK',
        to_id: player.id,
        description: `Sold house/hotel on ${property.name}`
      });
    }
  }
}));