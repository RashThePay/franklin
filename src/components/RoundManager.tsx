import React, { useState } from 'react';
import type { GameState, Officer, Crew } from '../types';
import { TASKS } from '../constants';
import { getTaskResult, calculateShipMovement, calculateRepair, calculateLogistics, generateSign } from '../gameLogic';
import { processSurvival, spreadDisease, applyDoctor } from '../humanLogic';
import { ShieldAlert } from 'lucide-react';

interface RoundManagerProps {
  state: GameState;
  onUpdate: (newState: GameState) => void;
}

const RoundManager: React.FC<RoundManagerProps> = ({ state, onUpdate }) => {
  const [direction, setDirection] = useState<'NORTH' | 'SOUTH'>('NORTH');
  const [vetoed, setVetoed] = useState(false);
  const [required, setRequired] = useState({
    ice: 7,
    nav: 6,
    lookout: 3,
    repair: 2,
    logistics: 3
  });

  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const handleTaskChange = (id: string, task: string) => {
    setAssignments(prev => ({ ...prev, [id]: task }));
  };

  const processRound = () => {
    const newState = JSON.parse(JSON.stringify(state)) as GameState;
    const round = state.round;

    let totalPossibleCrew = 0;
    newState.officers.forEach(o => {
        totalPossibleCrew += 1 + o.crew.length;
    });

    // 1. Count assignments
    const counts: Record<string, number> = {};
    const illInNav: string[] = [];
    const pessimisticInNav: string[] = [];
    const illInRepair: string[] = [];
    const illInLogistics: string[] = [];
    const mutinyParticipants: string[] = [];

    const allPeople: (Crew | Officer)[] = [];
    newState.officers.forEach(o => {
        allPeople.push(o);
        o.crew.forEach(c => allPeople.push(c));
    });

    allPeople.forEach(p => {
        const task = assignments[p.id] || 'REST';
        counts[task] = (counts[task] || 0) + 1;

        if (task === 'NAVIGATION') {
            if (p.isIll) illInNav.push(p.id);
            if (p.belief === 'PESSIMISTIC') pessimisticInNav.push(p.id);
        }
        if (task === 'REPAIR' && p.isIll) illInRepair.push(p.id);
        if (task === 'LOGISTICS' && p.isIll) illInLogistics.push(p.id);
        if (task === 'MUTINY') mutinyParticipants.push(p.id);
    });

    // Handle Mutiny
    if (vetoed && mutinyParticipants.length >= totalPossibleCrew * 0.75) {
        newState.logs.push({ round, message: 'شورش موفقیت‌آمیز بود! کاپیتان برکنار شد.', type: 'DANGER' });
        newState.officers.forEach(o => o.isCaptain = false);
        newState.officers[Math.floor(Math.random() * newState.officers.length)].isCaptain = true;
    } else if (mutinyParticipants.length > 0) {
        newState.logs.push({ round, message: 'تلاش برای شورش شکست خورد.', type: 'WARNING' });
        newState.officers.forEach(o => {
            if (mutinyParticipants.includes(o.id)) o.morale = Math.max(0, o.morale - 1);
            o.crew.forEach(c => {
                if (mutinyParticipants.includes(c.id)) c.morale = Math.max(0, c.morale - 1);
            });
        });
    }

    // 2. Task Results
    const iceResult = getTaskResult(counts['ICE_BREAKING'] || 0, direction === 'NORTH' ? required.ice : 0);
    const navResult = getTaskResult(counts['NAVIGATION'] || 0, direction === 'NORTH' ? required.nav : (Math.ceil(required.nav / 2)));
    const lookoutResult = getTaskResult(counts['LOOKOUT'] || 0, required.lookout);
    const repairResult = getTaskResult(counts['REPAIR'] || 0, required.repair);
    const logisticsResult = getTaskResult(counts['LOGISTICS'] || 0, required.logistics);

    // 3. Movement & Damage
    const { miles, damage } = calculateShipMovement(
        direction,
        navResult,
        iceResult,
        counts['NAVIGATION'] || 0,
        direction === 'NORTH' ? required.nav : (Math.ceil(required.nav / 2)),
        illInNav.length,
        pessimisticInNav.length
    );

    newState.ship.position += miles;
    newState.ship.hullDamage = Math.min(100, newState.ship.hullDamage + damage);

    // 4. Repair
    const repairAmount = calculateRepair(repairResult, counts['REPAIR'] || 0, required.repair, illInRepair.length);
    newState.ship.hullDamage = Math.max(0, newState.ship.hullDamage - repairAmount);

    // 5. Logistics
    const { provisionLoss, healthChange, moraleChange } = calculateLogistics(logisticsResult, allPeople.length);
    newState.ship.provisions = Math.max(0, newState.ship.provisions - provisionLoss);

    // 6. Survival & Logic
    let updatedOfficers = processSurvival(newState.officers, miles, healthChange, moraleChange);

    updatedOfficers = updatedOfficers.map(o => {
        const setResting = (p: Crew) => ({ ...p, isResting: (assignments[p.id] || 'REST') === 'REST' });
        const uo = setResting(o) as Officer;
        uo.crew = o.crew.map(setResting);
        return uo;
    });

    updatedOfficers = spreadDisease(updatedOfficers);
    updatedOfficers = applyDoctor(updatedOfficers);

    newState.officers = updatedOfficers;

    // 7. Lookout Signs
    const sign = generateSign(newState.ship.position, newState.passageDistance, lookoutResult === 'FULL');
    if (sign) {
        newState.logs.push({ round, message: `دیده بانی: ${sign}`, type: 'SUCCESS' });
    }

    // 8. Scouting Groups Processing
    newState.scoutingGroups = newState.scoutingGroups.filter(group => {
        if (group.isReturned) return false;
        group.weeksLeft -= 1;
        if (group.weeksLeft <= 0) {
            let survivorCount = 0;
            let totalMorale = 0;
            group.members.forEach(memberId => {
                newState.officers.forEach(o => {
                    const check = (p: any) => {
                        if (p.id === memberId) {
                            if (p.health > 2) survivorCount++;
                            totalMorale += p.morale;
                        }
                    };
                    check(o); o.crew.forEach(check);
                });
            });

            const avgMorale = totalMorale / group.members.length;
            const success = Math.random() < (survivorCount / group.members.length) * (avgMorale / 10);

            if (success) {
                newState.logs.push({ round, message: `گروه جستجو از ${group.target === 'BOOTH_POINT' ? 'بوث پوینت' : 'فورت پراویدنس'} بازگشت!`, type: 'SUCCESS' });
                newState.officers.forEach(o => {
                    o.morale = Math.min(10, o.morale + 0.5);
                    o.crew.forEach(c => c.morale = Math.min(10, c.morale + 0.5));
                });
            } else {
                newState.logs.push({ round, message: `گروه جستجو از ${group.target} بازنگشت.`, type: 'DANGER' });
                newState.officers.forEach(o => {
                    o.morale = Math.max(0, o.morale - 0.5);
                    o.crew.forEach(c => c.morale = Math.max(0, c.morale - 0.5));
                });
            }
            return false;
        }
        return true;
    });

    // 9. Captain Ability Penalties
    if (newState.captainAbilitiesUsed.longSummer && round === 8 && newState.winterPattern !== 'LONG_SUMMER') {
         newState.logs.push({ round, message: 'زمستان زودتر از موعد رسید! افت شدید روحیه خدمه.', type: 'DANGER' });
         newState.officers.forEach(o => { o.morale = Math.max(0, o.morale - 2); o.crew.forEach(c => c.morale = Math.max(0, c.morale - 2)); });
    }
    if (newState.captainAbilitiesUsed.passageNear) {
        const startPos = newState.captainAbilitiesUsed.passageNearStartPos || 0;
        if (miles <= 0 || (newState.ship.position - startPos > 40)) {
             newState.logs.push({ round, message: 'امید واهی! گذرگاه یافت نشد. افت شدید روحیه خدمه.', type: 'DANGER' });
             newState.officers.forEach(o => { o.morale = Math.max(0, o.morale - 2); o.crew.forEach(c => c.morale = Math.max(0, c.morale - 2)); });
             newState.captainAbilitiesUsed.passageNear = false;
        }
    }

    // Advance Round
    newState.round += 1;
    newState.logs.push({
        round,
        message: `پایان هفته. حرکت: ${miles} مایل. آسیب بدنه: ${damage}٪. تعمیر: ${repairAmount}٪.`,
        type: miles > 0 ? 'SUCCESS' : (miles < 0 ? 'INFO' : 'WARNING')
    });

    onUpdate(newState);
    setAssignments({});
    setVetoed(false);
  };

  const isCrewScouting = (id: string) => {
      return state.scoutingGroups.some(g => g.members.includes(id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <h3 className="font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="text-yellow-500" />
            وضعیت فرماندهی
        </h3>
        <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={vetoed} onChange={e => setVetoed(e.target.checked)} className="w-5 h-5"/>
                <span>کاپیتان رای جلسه را وتو کرد (امکان شورش فعال می‌شود)</span>
            </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
          <h3 className="font-bold mb-4">تنظیمات حرکت</h3>
          <div className="flex gap-4 mb-4">
             <button onClick={() => setDirection('NORTH')} className={`flex-1 p-2 rounded ${direction === 'NORTH' ? 'bg-blue-600' : 'bg-slate-700'}`}>به سمت شمال</button>
             <button onClick={() => setDirection('SOUTH')} className={`flex-1 p-2 rounded ${direction === 'SOUTH' ? 'bg-green-600' : 'bg-slate-700'}`}>به سمت جنوب</button>
          </div>
          <div className="space-y-2 text-sm">
             <div className="flex justify-between">
                <span>نفرات لازم یخ‌شکنی (۶-۹):</span>
                <input type="number" value={required.ice} onChange={e => setRequired({...required, ice: +e.target.value})} className="w-12 bg-slate-900 border border-slate-700 px-1 rounded"/>
             </div>
             <div className="flex justify-between">
                <span>نفرات لازم ناوبری (۵-۸):</span>
                <input type="number" value={required.nav} onChange={e => setRequired({...required, nav: +e.target.value})} className="w-12 bg-slate-900 border border-slate-700 px-1 rounded"/>
             </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
          <h3 className="font-bold mb-4">تنظیمات نگهداری</h3>
          <div className="space-y-2 text-sm">
             <div className="flex justify-between">
                <span>نفرات لازم دیده‌بانی (۳-۴):</span>
                <input type="number" value={required.lookout} onChange={e => setRequired({...required, lookout: +e.target.value})} className="w-12 bg-slate-900 border border-slate-700 px-1 rounded"/>
             </div>
             <div className="flex justify-between">
                <span>نفرات لازم تعمیر (۱-۲ در هر ۱۰٪):</span>
                <input type="number" value={required.repair} onChange={e => setRequired({...required, repair: +e.target.value})} className="w-12 bg-slate-900 border border-slate-700 px-1 rounded"/>
             </div>
             <div className="flex justify-between">
                <span>نفرات لازم تدارکات (۲-۵):</span>
                <input type="number" value={required.logistics} onChange={e => setRequired({...required, logistics: +e.target.value})} className="w-12 bg-slate-900 border border-slate-700 px-1 rounded"/>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
        <h3 className="font-bold mb-4">اختصاص وظایف خدمه</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-4">نام</th>
                <th className="py-2 px-4">وضعیت</th>
                <th className="py-2 px-4">وظیفه</th>
              </tr>
            </thead>
            <tbody>
              {state.officers.map(officer => (
                <React.Fragment key={officer.id}>
                  <tr className="bg-slate-800/30 font-bold border-t border-slate-800">
                    <td className="py-2 px-4 flex items-center gap-2">
                        {officer.name}
                        {officer.isCaptain && <span className="bg-yellow-900/50 text-yellow-500 text-[10px] px-1 rounded">کاپیتان</span>}
                    </td>
                    <td className="py-2 px-4 text-xs">
                        {isCrewScouting(officer.id) ? <span className="text-orange-400">در جستجو</span> : (
                            <>
                                {officer.isIll && <span className="text-red-400 ml-1">بیمار</span>}
                                {officer.isDepressed && <span className="text-yellow-400 ml-1">افسرده</span>}
                                {!officer.isIll && !officer.isDepressed && 'سالم'}
                            </>
                        )}
                    </td>
                    <td className="py-2 px-4">
                      <select
                        disabled={isCrewScouting(officer.id)}
                        value={assignments[officer.id] || 'REST'}
                        onChange={e => handleTaskChange(officer.id, e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded text-xs p-1 disabled:opacity-30"
                      >
                        {Object.entries(TASKS).map(([k, v]) => {
                            if (k === 'MUTINY' && !vetoed) return null;
                            return <option key={k} value={k}>{v}</option>
                        })}
                      </select>
                    </td>
                  </tr>
                  {officer.crew.map(c => (
                    <tr key={c.id} className="border-t border-slate-800/50">
                      <td className="py-1 px-8 text-slate-300">{c.name}</td>
                      <td className="py-1 px-4 text-xs text-slate-400">
                        {isCrewScouting(c.id) ? <span className="text-orange-400">در جستجو</span> : (
                            <>
                                {c.isIll && <span className="text-red-400 ml-1">بیمار</span>}
                                {c.isDepressed && <span className="text-yellow-400 ml-1">افسرده</span>}
                                {!c.isIll && !c.isDepressed && 'سالم'}
                            </>
                        )}
                      </td>
                      <td className="py-1 px-4">
                        <select
                          disabled={isCrewScouting(c.id)}
                          value={assignments[c.id] || 'REST'}
                          onChange={e => handleTaskChange(c.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded text-xs p-1 disabled:opacity-30"
                        >
                          {Object.entries(TASKS).map(([k, v]) => {
                            if (k === 'MUTINY' && !vetoed) return null;
                            return <option key={k} value={k}>{v}</option>
                          })}
                        </select>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={processRound}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all"
      >
        پردازش پایان هفته و ثبت نتایج
      </button>
    </div>
  );
};

export default RoundManager;
