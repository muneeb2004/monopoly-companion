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

export type TransactionType = 'RENT' | 'BUY_PROPERTY' | 'PASS_GO' | 'TAX' | 'TRADE' | 'SALARY' | 'OTHER';

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

export interface GameState {
  players: Player[];
  properties: Property[];
  currentPlayerIndex: number;
  transactions: Transaction[];
  trades?: Trade[]; // Optional for backward compatibility during migration
  turnCount: number;
  diceMode: 'DIGITAL' | 'PHYSICAL';
}
