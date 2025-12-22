import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Player, Property } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateNetWorth(player: Player, properties: Property[]): number {
  let netWorth = player.balance;

  const ownedProperties = properties.filter(p => p.ownerId === player.id);

  ownedProperties.forEach(p => {
    if (p.isMortgaged) {
      netWorth += (p.price || 0) / 2;
    } else {
      netWorth += (p.price || 0);
      netWorth += (p.houses || 0) * (p.houseCost || 0);
    }
  });

  return netWorth;
}

export function calculateRent(targetProperty: Property, allProperties: Property[], diceRoll: number = 7): number {
  if (!targetProperty.ownerId || targetProperty.isMortgaged) return 0;

  const ownerId = targetProperty.ownerId;
  const ownerProperties = allProperties.filter(p => p.ownerId === ownerId);

  switch (targetProperty.type) {
    case 'street': {
      const groupProperties = allProperties.filter(p => p.group === targetProperty.group);
      const hasMonopoly = groupProperties.every(p => p.ownerId === ownerId);
      
      if (targetProperty.houses > 0) {
        return targetProperty.rent ? targetProperty.rent[targetProperty.houses] : 0;
      }
      
      // Base rent (doubled if monopoly)
      const baseRent = targetProperty.rent ? targetProperty.rent[0] : 0;
      return hasMonopoly ? baseRent * 2 : baseRent;
    }

    case 'railroad': {
      const railroadCount = ownerProperties.filter(p => p.type === 'railroad').length;
      return 25 * Math.pow(2, Math.max(0, railroadCount - 1));
    }

    case 'utility': {
      const utilityCount = ownerProperties.filter(p => p.type === 'utility').length;
      return utilityCount === 2 ? diceRoll * 10 : diceRoll * 4;
    }

    default:
      return 0;
  }
}
