import type { Property } from '../types';

export const INITIAL_PROPERTIES: Property[] = [
  { id: 0, name: 'GO', type: 'corner', group: 'special', houses: 0, isMortgaged: false },

  // Brown
  { id: 1, name: 'Gdynia', type: 'street', group: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, houses: 0, isMortgaged: false },
  { id: 2, name: 'Community Chest', type: 'chest', group: 'special', houses: 0, isMortgaged: false },
  { id: 3, name: 'Taipei', type: 'street', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, houses: 0, isMortgaged: false },

  // Tax
  { id: 4, name: 'Income Tax', type: 'tax', group: 'special', houses: 0, isMortgaged: false },

  // Rail 1
  { id: 5, name: 'Monopoly Rail', type: 'railroad', group: 'railroad', price: 200, rent: [25, 50, 100, 200], houses: 0, isMortgaged: false },

  // Light Blue (Blue triple)
  { id: 6, name: 'Tokyo', type: 'street', group: 'lightBlue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, houses: 0, isMortgaged: false },
  { id: 7, name: 'Chance', type: 'chance', group: 'special', houses: 0, isMortgaged: false },
  { id: 8, name: 'Barcelona', type: 'street', group: 'lightBlue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, houses: 0, isMortgaged: false },
  { id: 9, name: 'Athens', type: 'street', group: 'lightBlue', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, houses: 0, isMortgaged: false },

  // Jail
  { id: 10, name: 'In Jail/Just Visiting', type: 'corner', group: 'special', houses: 0, isMortgaged: false },

  // Pink
  { id: 11, name: 'Istanbul', type: 'street', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, houses: 0, isMortgaged: false },
  { id: 12, name: 'Solar Energy', type: 'utility', group: 'utility', price: 150, houses: 0, isMortgaged: false },
  { id: 13, name: 'Kyiv', type: 'street', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, houses: 0, isMortgaged: false },
  { id: 14, name: 'Toronto', type: 'street', group: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, houses: 0, isMortgaged: false },

  // Rail 2
  { id: 15, name: 'Monopoly Air', type: 'railroad', group: 'railroad', price: 200, rent: [25, 50, 100, 200], houses: 0, isMortgaged: false },

  // Orange
  { id: 16, name: 'Rome', type: 'street', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, houses: 0, isMortgaged: false },
  { id: 17, name: 'Community Chest', type: 'chest', group: 'special', houses: 0, isMortgaged: false },
  { id: 18, name: 'Shanghai', type: 'street', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, houses: 0, isMortgaged: false },
  { id: 19, name: 'Vancouver', type: 'street', group: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, houses: 0, isMortgaged: false },

  // Free Parking
  { id: 20, name: 'Free Parking', type: 'corner', group: 'special', houses: 0, isMortgaged: false },

  // Red
  { id: 21, name: 'Sydney', type: 'street', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, houses: 0, isMortgaged: false },
  { id: 22, name: 'Chance', type: 'chance', group: 'special', houses: 0, isMortgaged: false },
  { id: 23, name: 'New York', type: 'street', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, houses: 0, isMortgaged: false },
  { id: 24, name: 'London', type: 'street', group: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, houses: 0, isMortgaged: false },

  // Rail 3
  { id: 25, name: 'Monopoly Cruise', type: 'railroad', group: 'railroad', price: 200, rent: [25, 50, 100, 200], houses: 0, isMortgaged: false },

  // Yellow
  { id: 26, name: 'Beijing', type: 'street', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, houses: 0, isMortgaged: false },
  { id: 27, name: 'Hong Kong', type: 'street', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, houses: 0, isMortgaged: false },
  { id: 28, name: 'Wind Energy', type: 'utility', group: 'utility', price: 150, houses: 0, isMortgaged: false },
  { id: 29, name: 'Jerusalem', type: 'street', group: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, houses: 0, isMortgaged: false },

  // Go To Jail
  { id: 30, name: 'Go To Jail', type: 'corner', group: 'special', houses: 0, isMortgaged: false },

  // Green
  { id: 31, name: 'Paris', type: 'street', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, houses: 0, isMortgaged: false },
  { id: 32, name: 'Belgrade', type: 'street', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, houses: 0, isMortgaged: false },
  { id: 33, name: 'Community Chest', type: 'chest', group: 'special', houses: 0, isMortgaged: false },
  { id: 34, name: 'Cape Town', type: 'street', group: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, houses: 0, isMortgaged: false },

  // Rail 4
  { id: 35, name: 'Monopoly Space', type: 'railroad', group: 'railroad', price: 200, rent: [25, 50, 100, 200], houses: 0, isMortgaged: false },

  // Final row
  { id: 36, name: 'Chance', type: 'chance', group: 'special', houses: 0, isMortgaged: false },
  { id: 37, name: 'Riga', type: 'street', group: 'darkBlue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, houses: 0, isMortgaged: false },
  { id: 38, name: 'Super Tax', type: 'tax', group: 'special', houses: 0, isMortgaged: false },
  { id: 39, name: 'Montreal', type: 'street', group: 'darkBlue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, houses: 0, isMortgaged: false },
];
