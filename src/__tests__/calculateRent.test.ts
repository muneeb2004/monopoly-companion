import { describe, it, expect } from 'vitest';
import { calculateRent } from '../lib/utils';
import type { Property } from '../types';

const makeProperty = (id: number, group: string, rent: number[], ownerId: string | null, houses = 0): Property => ({
  id,
  name: `P${id}`,
  type: 'street',
  group: group as any,
  price: 100,
  rent,
  houseCost: 50,
  ownerId,
  houses,
  isMortgaged: false
});

describe('calculateRent', () => {
  it('standard mode: doubles base rent when monopoly and no houses', () => {
    const a = makeProperty(1, 'brown', [10,50,150,450,625,750], 'p1', 0);
    const b = makeProperty(2, 'brown', [20,60,180,500,700,900], 'p1', 0);
    const props = [a, b];
    const rent = calculateRent(a, props, 7, 'standard');
    expect(rent).toBe(20); // base 10 doubled -> 20
  });

  it('standard mode: uses per-property houses when present', () => {
    const a = makeProperty(1, 'brown', [10,50,150,450,625,750], 'p1', 2);
    const props = [a];
    const rent = calculateRent(a, props, 7, 'standard');
    expect(rent).toBe(150); // index 2
  });

  it('groupTotal mode: uses total houses across group when monopoly', () => {
    const a = makeProperty(1, 'pink', [10,50,150,450,625,750], 'p1', 0);
    const b = makeProperty(2, 'pink', [12,60,180,500,700,900], 'p1', 1);
    const c = makeProperty(3, 'pink', [14,70,200,550,750,950], 'p1', 2);
    const props = [a,b,c];

    // total houses = 3 -> should use rent[3] of target property
    const rent = calculateRent(a, props, 7, 'groupTotal');
    expect(rent).toBe(450);
  });

  it('groupTotal mode: caps total houses at 5 (hotel)', () => {
    const a = makeProperty(1, 'green', [26,130,390,900,1100,1275], 'p1', 0);
    const b = makeProperty(2, 'green', [26,130,390,900,1100,1275], 'p1', 5);
    const c = makeProperty(3, 'green', [26,130,390,900,1100,1275], 'p1', 3);
    const props = [a,b,c];

    // total = 8 => capped to 5 -> rent[5]
    const rent = calculateRent(a, props, 7, 'groupTotal');
    expect(rent).toBe(1275);
  });

  it('groupTotal mode: fallback to monopoly double when no houses built', () => {
    const a = makeProperty(1, 'orange', [14,70,200,550,750,950], 'p1', 0);
    const b = makeProperty(2, 'orange', [14,70,200,550,750,950], 'p1', 0);
    const c = makeProperty(3, 'orange', [16,80,220,600,800,1000], 'p1', 0);
    const props = [a,b,c];

    const rent = calculateRent(a, props, 7, 'groupTotal');
    expect(rent).toBe(28); // base 14 doubled
  });
});
