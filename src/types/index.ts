export type PropertyType = 'street' | 'railroad' | 'utility' | 'tax' | 'chance' | 'chest' | 'corner';

export type PropertyGroup = 'brown' | 'lightBlue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'darkBlue' | 'railroad' | 'utility' | 'special';

export interface Property {
  id: number;
  name: string;
  type: PropertyType;
  group: PropertyGroup;
  price?: number;
  rent?: number[]; // [base, 1 house, 2, 3, 4, hotel]
  houseCost?: number;
  ownerId?: string | null;
  houses: number; // 0-4 houses, 5 = hotel
  isMortgaged: boolean;
  priceOverride?: number;
  rentOverride?: number[];
}

export interface Player {
  id: string;
  name: string;
  color: string; // Hex code
  token: string; // Token ID (e.g. 'dog', 'car')
  balance: number;
  position: number;
  isJailed: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  loans: number; // Total amount borrowed
}

export type TransactionType = 'RENT' | 'BUY_PROPERTY' | 'PASS_GO' | 'TAX' | 'TRADE' | 'SALARY' | 'UNDO' | 'OTHER';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromId: string | 'BANK';
  toId: string | 'BANK';
  description: string;
  timestamp: number;
}

export type TradeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface Trade {
  id: string;
  senderId: string;
  receiverId: string;
  offeredMoney: number;
  requestedMoney: number;
  offeredProperties: number[]; // Array of property indices
  requestedProperties: number[]; // Array of property indices
  status: TradeStatus;
  createdAt: number;
}

export interface UndoEntry {
  id?: number; // assigned by DB when persisted
  playerId: string;
  performedBy?: string | null;
  description?: string | null;
  prevPosition: number;
  newPosition: number;
  prevIsJailed: boolean;
  newIsJailed: boolean;
  passGoAwarded: number;
  createdAt?: number;
  reverted?: boolean;
  revertedAt?: number | null;
  revertedBy?: string | null;
}

export interface GameState {
  players: Player[];
  properties: Property[];
  currentPlayerIndex: number;
  transactions: Transaction[];
  trades?: Trade[]; // Optional for backward compatibility during migration
  turnCount: number;
  diceMode: 'DIGITAL' | 'PHYSICAL';
  // Undo entries persisted/loaded for audit
  undoEntries?: UndoEntry[];


  // Game settings
  startingMoney?: number;
  priceMultiplier?: number; // multiply base price by this
  rentMultiplier?: number;  // multiply base rent by this
  jailBailAmount?: number;
  // New rent mode setting: 'standard' = per-property houses (Monopoly default), 'groupTotal' = rent determined by total houses across color group
  groupHouseRentMode?: 'standard' | 'groupTotal';
  // Whether the board shows combined house totals for monopolies
  showGroupHouseTotals?: boolean;
  // Bank settings
  bankTotal?: number;
  bankLowThreshold?: number;
  showBankLowWarning?: boolean;
} 
