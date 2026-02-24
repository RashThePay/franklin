import { describe, it, expect } from 'vitest';
import { spreadDisease } from './humanLogic';
import type { Officer } from './types';

describe('Human Logic', () => {
  it('should not spread disease if no one is ill', () => {
    const mockOfficer: Officer = {
      id: 'o1', name: 'Off', health: 10, morale: 10, belief: 'OPTIMISTIC',
      isIll: false, isDepressed: false, isResting: false, currentTask: null,
      illnessDepth: 0, isCaptain: true,
      crew: [
        { id: 'c1', name: 'C1', health: 10, morale: 10, belief: 'OPTIMISTIC', isIll: false, isDepressed: false, isResting: false, currentTask: null, illnessDepth: 0 }
      ]
    };

    const result = spreadDisease([mockOfficer]);
    expect(result[0].isIll).toBe(false);
    expect(result[0].crew[0].isIll).toBe(false);
  });

  it('should potentially spread disease if someone is ill', () => {
    // We can't easily test randomness without mocking Math.random
    // but we can check if it stays the same when we have 0% chance or similar (if we could control it)
    // For now, let's just ensure the structure remains.
    const mockOfficer: Officer = {
        id: 'o1', name: 'Off', health: 10, morale: 10, belief: 'OPTIMISTIC',
        isIll: true, isDepressed: false, isResting: false, currentTask: null,
        illnessDepth: 0, isCaptain: true,
        crew: [
          { id: 'c1', name: 'C1', health: 10, morale: 10, belief: 'OPTIMISTIC', isIll: false, isDepressed: false, isResting: false, currentTask: null, illnessDepth: 0 }
        ]
      };

      const result = spreadDisease([mockOfficer]);
      expect(result[0].isIll).toBe(true); // Should remain ill
  });
});
