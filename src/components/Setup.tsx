import React, { useState } from 'react';
import type { GameState, WinterPattern, PassageDistance, Officer } from '../types';
import { HISTORICAL_OFFICERS, CREW_NAMES, WINTER_PATTERNS } from '../constants';

interface SetupProps {
  onStart: (state: GameState) => void;
}

const Setup: React.FC<SetupProps> = ({ onStart }) => {
  const [playerCount, setPlayerCount] = useState(6);
  const [winterPattern, setWinterPattern] = useState<WinterPattern>('LONG_SUMMER');
  const [passageDistance, setPassageDistance] = useState<PassageDistance>('NEAR');

  const handleStart = () => {
    const selectedOfficers: Officer[] = [];
    const availableCrew = [...CREW_NAMES].sort(() => 0.5 - Math.random());
    const availableOffNames = [...HISTORICAL_OFFICERS].sort(() => 0.5 - Math.random());

    for (let i = 0; i < playerCount; i++) {
      const officerCrew = [
        {
          id: `c-${i}-1`,
          name: availableCrew.pop()!,
          health: 9 + Math.floor(Math.random() * 2),
          morale: 8 + Math.floor(Math.random() * 3),
          belief: 'OPTIMISTIC' as const,
          isIll: false,
          isDepressed: false,
          isResting: false,
          currentTask: null,
          illnessDepth: 0,
        },
        {
          id: `c-${i}-2`,
          name: availableCrew.pop()!,
          health: 9 + Math.floor(Math.random() * 2),
          morale: 8 + Math.floor(Math.random() * 3),
          belief: 'DOUBTING' as const,
          isIll: false,
          isDepressed: false,
          isResting: false,
          currentTask: null,
          illnessDepth: 0,
        },
        {
          id: `c-${i}-3`,
          name: availableCrew.pop()!,
          health: 9 + Math.floor(Math.random() * 2),
          morale: 8 + Math.floor(Math.random() * 3),
          belief: 'PESSIMISTIC' as const,
          isIll: false,
          isDepressed: false,
          isResting: false,
          currentTask: null,
          illnessDepth: 0,
        },
      ];

      selectedOfficers.push({
        id: `o-${i}`,
        name: availableOffNames[i],
        health: 10,
        morale: 10,
        belief: 'OPTIMISTIC',
        isIll: false,
        isDepressed: false,
        isResting: false,
        currentTask: null,
        illnessDepth: 0,
        isCaptain: i === 0,
        crew: officerCrew,
      });
    }

    const initialState: GameState = {
      round: 1,
      ship: {
        hullDamage: 0,
        position: 0,
        provisions: playerCount * 4 * 100,
        maxProvisions: playerCount * 4 * 100,
      },
      officers: selectedOfficers,
      winterPattern,
      passageDistance,
      currentPhenomenon: null,
      phenomenonDuration: 0,
      isFrozen: false,
      logs: [{ round: 0, message: 'بازی آغاز شد. سفر به سمت شمال شروع می‌شود.', type: 'INFO' }],
      scoutingGroups: [],
      captainAbilitiesUsed: {
        longSummer: false,
        longSummerRound: null,
        passageNear: false,
        passageNearRound: null,
        passageNearStartPos: null,
      },
    };

    onStart(initialState);
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-lg border border-ice-800 shadow-xl">
      <h2 className="text-2xl font-bold text-ice-400 mb-6">تنظیمات اولیه بازی</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">تعداد افسران (بازیکنان)</label>
          <div className="flex gap-4">
            {[6, 7, 8].map(n => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`px-4 py-2 rounded ${playerCount === n ? 'bg-ice-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {n} نفر
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">الگوی زمستان</label>
          <select
            value={winterPattern}
            onChange={(e) => setWinterPattern(e.target.value as WinterPattern)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2"
          >
            {Object.entries(WINTER_PATTERNS).map(([key, val]) => (
              <option key={key} value={key}>{val.name} ({val.description})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">فاصله تا گذرگاه</label>
          <select
            value={passageDistance}
            onChange={(e) => setPassageDistance(e.target.value as PassageDistance)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2"
          >
            <option value="NEAR">نزدیک (۴۰-۶۰ مایل)</option>
            <option value="FAR">دور (۷۰-۹۰ مایل)</option>
            <option value="NONE">گذرگاهی وجود ندارد</option>
          </select>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-ice-600 hover:bg-ice-500 text-white font-bold py-3 rounded-lg transition-colors mt-8"
        >
          شروع ماموریت
        </button>
      </div>
    </div>
  );
};

export default Setup;
