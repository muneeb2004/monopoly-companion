import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { GameState, Transaction, TransactionType, Player, Property, Trade, TradeStatus } from '../types';
import { INITIAL_PROPERTIES } from '../data/properties';
import { supabase } from '../lib/supabase';

interface GameStore extends GameState {
  gameId: string | null;
  gameStatus: 'SETUP' | 'ACTIVE' | 'COMPLETED' | null;
  isLoading: boolean;
  error: string | null;
  
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

  // Trade Actions
  createTrade: (receiverId: string, offeredMoney: number, requestedMoney: number, offeredProperties: number[], requestedProperties: number[]) => Promise<void>;
  respondToTrade: (tradeId: string, status: TradeStatus) => Promise<void>;
  cancelTrade: (tradeId: string) => Promise<void>;

  // Property Actions
  toggleMortgage: (propertyId: number) => Promise<void>;
  improveProperty: (propertyId: number, action: 'buy' | 'sell') => Promise<void>;
}

const INITIAL_STATE: Omit<GameStore, 'createNewGame' | 'joinGame' | 'leaveGame' | 'addPlayer' | 'startGame' | 'nextTurn' | 'updateBalance' | 'transferMoney' | 'assignProperty' | 'movePlayer' | 'toggleJail' | 'takeLoan' | 'repayLoan' | 'resetGame' | 'createTrade' | 'respondToTrade' | 'cancelTrade' | 'toggleMortgage' | 'improveProperty'> = {
  gameId: null,
  gameStatus: null,
  isLoading: false,
  error: null,
  players: [],
  properties: INITIAL_PROPERTIES,
  currentPlayerIndex: 0,
  transactions: [],
  trades: [],
  turnCount: 1,
  diceMode: 'DIGITAL',
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  createNewGame: async () => {
    if (!supabase) return null;
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('games')
        .insert({ status: 'SETUP', dice_mode: 'DIGITAL' })
        .select()
        .single();
        
      if (error) throw error;
      
      const gameId = data.id;
      set({ gameId, gameStatus: 'SETUP', diceMode: 'DIGITAL', isLoading: false });
      get().joinGame(gameId); // Subscribe
      return gameId;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  joinGame: async (gameId: string) => {
    if (!supabase) return false;
    set({ isLoading: true, error: null });

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

      // Merge properties
      const dynamicProps = propsRes.data || [];
      const mergedProperties = INITIAL_PROPERTIES.map(p => {
        const dynamic = dynamicProps.find((dp: any) => dp.property_index === p.id);
        return dynamic ? { 
          ...p, 
          id: p.id,
          ownerId: dynamic.owner_id,
          houses: dynamic.houses,
          isMortgaged: dynamic.is_mortgaged
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
        properties: mergedProperties,
        transactions,
        trades,
        isLoading: false
      });

      // Setup Realtime Subscription
      supabase.channel(`game:${gameId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload: any) => {
          if (payload.new) {
            set({ 
              gameStatus: payload.new.status,
              diceMode: payload.new.dice_mode,
              turnCount: payload.new.turn_count,
              currentPlayerIndex: payload.new.current_player_index
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
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  leaveGame: () => {
    if (!supabase) return;
    const { gameId } = get();
    if (gameId) {
      supabase.channel(`game:${gameId}`).unsubscribe();
    }
    set(INITIAL_STATE);
  },

  addPlayer: async (name, color, token) => {
    const { gameId } = get();
    if (!supabase || !gameId) return;
    
    await supabase.from('players').insert({
      game_id: gameId,
      name,
      color,
      token,
      balance: 1500
    });
  },

  startGame: async (mode) => {
    const { gameId } = get();
    if (!supabase || !gameId) return;

    // Initialize all properties for the game
    const propertyInserts = INITIAL_PROPERTIES.map(p => ({
      game_id: gameId,
      property_index: p.id,
      owner_id: null,
      houses: 0,
      is_mortgaged: false
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
    if (!supabase || !gameId) return;
    
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const absAmount = Math.abs(amount);
    
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
    const { gameId } = get();
    if (!supabase || !gameId) return;
    
    await supabase.from('players').update({ position }).eq('id', playerId);
  },

  toggleJail: async (playerId) => {
    const { gameId, players } = get();
    if (!supabase || !gameId) return;
    
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    await supabase.from('players').update({ 
      is_jailed: !player.isJailed,
      jail_turns: 0 
    }).eq('id', playerId);
  },

  takeLoan: async (playerId, amount) => {
    const { gameId, players } = get();
    if (!supabase || !gameId) return;
    
    const player = players.find(p => p.id === playerId);
    if (!player) return;

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
  },

  repayLoan: async (playerId, amount) => {
    const { gameId, players } = get();
    if (!supabase || !gameId) return;

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const interest = Math.ceil(amount * 0.1);
    const totalToPay = amount + interest;

    await supabase.from('transactions').insert({
      game_id: gameId,
      type: 'OTHER',
      amount: totalToPay,
      from_id: playerId,
      to_id: 'BANK',
      description: `Repaid $${amount} loan (+$${interest} interest)`,
      timestamp: Date.now()
    });

    await supabase.from('players').update({
      balance: player.balance - totalToPay,
      loans: Math.max(0, player.loans - amount)
    }).eq('id', playerId);
  },

  resetGame: async () => {
    get().leaveGame();
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