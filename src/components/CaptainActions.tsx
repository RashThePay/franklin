import React, { useState } from 'react';
import type { GameState, Officer, Crew } from '../types';
import { Anchor, Zap, Map, Compass, X } from 'lucide-react';

interface CaptainActionsProps {
  state: GameState;
  onUpdate: (newState: GameState) => void;
}

const CaptainActions: React.FC<CaptainActionsProps> = ({ state, onUpdate }) => {
  const [isScoutingOpen, setIsScoutingOpen] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [target, setTarget] = useState<'BOOTH_POINT' | 'FORT_PROVIDENCE'>('BOOTH_POINT');

  const handleSummerLong = () => {
      const newState = JSON.parse(JSON.stringify(state)) as GameState;
      newState.captainAbilitiesUsed.longSummer = true;
      newState.captainAbilitiesUsed.longSummerRound = state.round;

      newState.officers.forEach((o: Officer) => {
          const updateBelief = (p: any) => {
              if (p.morale >= 3) {
                  if (p.belief === 'DOUBTING') p.belief = 'OPTIMISTIC';
                  else if (p.belief === 'PESSIMISTIC') p.belief = 'DOUBTING';
              }
          };
          updateBelief(o);
          o.crew.forEach(updateBelief);
      });

      newState.logs.push({
          round: state.round,
          message: 'کاپیتان اعلام کرد: "تابستان طولانی است". روحیه و باورها تغییر کرد.',
          type: 'SUCCESS'
      });
      onUpdate(newState);
  };

  const handlePassageNear = () => {
      const newState = JSON.parse(JSON.stringify(state)) as GameState;
      newState.captainAbilitiesUsed.passageNear = true;
      newState.captainAbilitiesUsed.passageNearRound = state.round;
      newState.captainAbilitiesUsed.passageNearStartPos = state.ship.position;

      newState.officers.forEach((o: Officer) => {
          const updateBelief = (p: any) => {
              if (p.morale >= 3) {
                  if (p.belief === 'DOUBTING') p.belief = 'OPTIMISTIC';
                  else if (p.belief === 'PESSIMISTIC') p.belief = 'DOUBTING';
              }
          };
          updateBelief(o);
          o.crew.forEach(updateBelief);
      });

      newState.logs.push({
          round: state.round,
          message: 'کاپیتان اعلام کرد: "گذرگاه نزدیک است". امید در کشتی زنده شد.',
          type: 'SUCCESS'
      });
      onUpdate(newState);
  };

  const sendScouts = () => {
      if (selectedCrew.length < 2 || selectedCrew.length > 4) {
          alert("تعداد گروه جستجو باید بین ۲ تا ۴ نفر باشد.");
          return;
      }

      const newState = JSON.parse(JSON.stringify(state)) as GameState;

      newState.officers.forEach((o: Officer) => {
          if (o.belief === 'OPTIMISTIC') o.morale = Math.max(0, o.morale - 1);
          o.crew.forEach((c: Crew) => {
              if (c.belief === 'OPTIMISTIC') c.morale = Math.max(0, c.morale - 1);
          });
      });

      newState.scoutingGroups.push({
          target,
          weeksLeft: target === 'BOOTH_POINT' ? 2 : 3,
          members: [...selectedCrew],
          isReturned: false
      });

      newState.logs.push({
          round: state.round,
          message: `گروه جستجوی ${selectedCrew.length} نفره به سمت ${target === 'BOOTH_POINT' ? 'بوث پوینت' : 'فورت پراویدنس'} اعزام شد.`,
          type: 'INFO'
      });

      onUpdate(newState);
      setIsScoutingOpen(false);
      setSelectedCrew([]);
  };

  const toggleCrewSelection = (id: string) => {
      if (selectedCrew.includes(id)) {
          setSelectedCrew(selectedCrew.filter(i => i !== id));
      } else if (selectedCrew.length < 4) {
          setSelectedCrew([...selectedCrew, id]);
      }
  };

  return (
    <div className="bg-slate-900 p-4 rounded-lg border border-ice-900/30 space-y-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
            <Anchor size={18} className="text-ice-400" />
            فرمان‌های کاپیتان
        </h3>
        <div className="grid grid-cols-1 gap-2">
            <button
                disabled={state.captainAbilitiesUsed.longSummer}
                onClick={handleSummerLong}
                className="flex items-center justify-between p-2 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-30 text-right text-xs"
            >
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-yellow-400" />
                    <span>اعلام «تابستان طولانی است»</span>
                </div>
                <span className="text-[10px] text-slate-500">یک‌بار</span>
            </button>

            <button
                disabled={state.captainAbilitiesUsed.passageNear}
                onClick={handlePassageNear}
                className="flex items-center justify-between p-2 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-30 text-right text-xs"
            >
                <div className="flex items-center gap-2">
                    <Map size={14} className="text-blue-400" />
                    <span>اعلام «گذرگاه نزدیک است»</span>
                </div>
                <span className="text-[10px] text-slate-500">یک‌بار</span>
            </button>

            <button
                onClick={() => setIsScoutingOpen(true)}
                className="flex items-center justify-between p-2 bg-slate-800 rounded hover:bg-slate-700 text-right text-xs"
            >
                <div className="flex items-center gap-2">
                    <Compass size={14} className="text-green-400" />
                    <span>اعزام گروه جستجو به جنوب</span>
                </div>
            </button>
        </div>

        {isScoutingOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-ice-800 w-full max-w-md p-6 rounded-xl shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold">اعزام گروه جستجو</h4>
                        <button onClick={() => setIsScoutingOpen(false)}><X/></button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm mb-2 text-slate-400">مقصد جستجو:</label>
                        <select
                            value={target}
                            onChange={e => setTarget(e.target.value as any)}
                            className="w-full bg-slate-800 border border-slate-700 p-2 rounded"
                        >
                            <option value="BOOTH_POINT">اردوگاه بوث پوینت (۲ هفته)</option>
                            <option value="FORT_PROVIDENCE">اردوگاه فورت پراویدنس (۳ هفته)</option>
                        </select>
                    </div>

                    <label className="block text-sm mb-2 text-slate-400">انتخاب خدمه (۲ تا ۴ نفر):</label>
                    <div className="max-h-60 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-800 mb-6">
                        {state.officers.map(o => (
                            <div key={o.id} className="mb-2">
                                {o.crew.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => toggleCrewSelection(c.id)}
                                        className={`flex justify-between p-2 rounded cursor-pointer mb-1 text-xs ${selectedCrew.includes(c.id) ? 'bg-ice-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                                    >
                                        <span>{c.name}</span>
                                        <span>❤️ {c.health.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={sendScouts}
                        className="w-full bg-green-700 hover:bg-green-600 py-3 rounded-lg font-bold"
                    >
                        اعزام گروه
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default CaptainActions;
