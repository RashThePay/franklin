export type Belief = 'OPTIMISTIC' | 'DOUBTING' | 'PESSIMISTIC';

export type TaskResult = 'FULL' | 'PARTIAL' | 'FAILED';

export interface Crew {
  id: string;
  name: string;
  health: number;
  morale: number;
  belief: Belief;
  isIll: boolean;
  isDepressed: boolean;
  isResting: boolean;
  currentTask: string | null;
  illnessDepth: number; // For tracking daily health loss
}

export interface Officer extends Crew {
  isCaptain: boolean;
  crew: Crew[];
}

export interface Ship {
  hullDamage: number;
  position: number; // Miles North (negative for South)
  provisions: number;
  maxProvisions: number;
}

export type WinterPattern = 'LONG_SUMMER' | 'UNSTABLE_AUTUMN' | 'EARLY_WINTER';
export type PassageDistance = 'NEAR' | 'FAR' | 'NONE';

export interface GameEvent {
  round: number;
  message: string;
  type: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
}

export interface GameState {
  round: number;
  ship: Ship;
  officers: Officer[];
  winterPattern: WinterPattern;
  passageDistance: PassageDistance;
  currentPhenomenon: string | null;
  phenomenonDuration: number;
  isFrozen: boolean;
  logs: GameEvent[];
  scoutingGroups: {
    target: 'BOOTH_POINT' | 'FORT_PROVIDENCE';
    weeksLeft: number;
    members: string[]; // IDs
    isReturned: boolean;
  }[];
  captainAbilitiesUsed: {
    longSummer: boolean;
    longSummerRound: number | null;
    passageNear: boolean;
    passageNearRound: number | null;
    passageNearStartPos: number | null;
  };
}
