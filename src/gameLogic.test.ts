import { describe, it, expect } from 'vitest';
import { calculateShipMovement, getTaskResult } from './gameLogic';

describe('Game Logic', () => {
  it('should correctly calculate task results', () => {
    expect(getTaskResult(6, 6)).toBe('FULL');
    expect(getTaskResult(4, 6)).toBe('PARTIAL');
    expect(getTaskResult(2, 6)).toBe('FAILED');
  });

  it('should correctly calculate movement North', () => {
    const movement = calculateShipMovement(
      'NORTH',
      'FULL',
      'FULL',
      6,
      6,
      0,
      0
    );
    expect(movement.miles).toBe(10);
    expect(movement.damage).toBe(10);
  });

  it('should penalize movement for ill crew', () => {
    const movement = calculateShipMovement(
      'NORTH',
      'FULL',
      'FULL',
      6,
      6,
      2, // 2 ill crew
      0
    );
    expect(movement.miles).toBe(6); // 10 - (2 * 2)
  });
});
