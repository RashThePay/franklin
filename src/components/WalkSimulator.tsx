import React, { useState } from 'react';
import type { GameState } from '../types';
import { simulateWalkDay } from '../humanLogic';

interface WalkSimulatorProps {
  state: GameState;
}

interface Walker {
    id: string;
    name: string;
    health: number;
    morale: number;
    isIll: boolean;
    provisions: number;
    isOfficer: boolean;
    deadThisDay?: boolean;
}

const WalkSimulator: React.FC<WalkSimulatorProps> = ({ state }) => {
  const [active, setActive] = useState(false);
  const [day, setDay] = useState(0);
  const [distance, setDistance] = useState(0);
  const [people, setPeople] = useState<Walker[]>([]);
  const [finished, setFinished] = useState(false);

  const startWalk = () => {
      const initialPeople: Walker[] = [];
      state.officers.forEach(o => {
          initialPeople.push({ id: o.id, name: o.name, health: o.health, morale: o.morale, isIll: o.isIll, provisions: 40, isOfficer: true });
          o.crew.forEach(c => {
              initialPeople.push({ id: c.id, name: c.name, health: c.health, morale: c.morale, isIll: c.isIll, provisions: 40, isOfficer: false });
          });
      });
      setPeople(initialPeople);
      setActive(true);
      setDay(0);
      setDistance(0);
      setFinished(false);
  };

  const nextDay = () => {
      if (finished) return;

      const survivorsBefore = people.filter(p => p.health > 0);
      if (survivorsBefore.length === 0) {
          setFinished(true);
          return;
      }

      const avgMorale = survivorsBefore.reduce((acc, p) => acc + p.morale, 0) / survivorsBefore.length;
      const dailyMove = avgMorale < 5 ? 3 : 5;

      const nextPeople = simulateWalkDay(people) as Walker[];

      // Handle deaths
      const processedPeople = nextPeople.map((p, i) => {
          const oldP = people[i];
          if (oldP.health > 0 && p.health <= 0) {
              return { ...p, health: 0, deadThisDay: true };
          }
          return { ...p, deadThisDay: false };
      });

      // Morale penalty for deaths
      const deathCount = processedPeople.filter(p => p.deadThisDay).length;
      if (deathCount > 0) {
          processedPeople.forEach(p => {
              if (p.health > 0) p.morale = Math.max(0, p.morale - 0.5 * deathCount);
          });
      }

      setPeople(processedPeople);
      setDistance(prev => prev + dailyMove);
      setDay(prev => prev + 1);

      if (distance + dailyMove >= 200) {
          setFinished(true);
      }
      if (processedPeople.filter(p => p.health > 0).length === 0) {
          setFinished(true);
      }
  };

  if (!active) {
      return (
          <div className="bg-slate-900 p-8 rounded-lg border border-red-900/50 text-center">
              <h2 className="text-2xl font-bold text-red-500 mb-4">کشتی در یخ منجمد شد!</h2>
              <p className="mb-6 text-slate-400">تنها راه بقا، راهپیمایی چند صد مایلی به سمت جنوب و رسیدن به اردوگاه‌هاست.</p>
              <button
                onClick={startWalk}
                className="bg-red-700 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
              >
                  آغاز راهپیمایی مرگ
              </button>
          </div>
      );
  }

  const survivors = people.filter(p => p.health > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded border border-slate-800">
          <div>
              <p className="text-xs text-slate-500">روز راهپیمایی</p>
              <p className="text-2xl font-bold">{day}</p>
          </div>
          <div className="text-center">
              <p className="text-xs text-slate-500">مسافت طی شده</p>
              <p className="text-2xl font-bold text-orange-400">{distance} مایل</p>
          </div>
          <div>
              <p className="text-xs text-slate-500">بازماندگان</p>
              <p className="text-2xl font-bold text-green-500">{survivors.length} نفر</p>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {people.map(p => (
              <div key={p.id} className={`p-2 rounded text-[10px] border ${p.health <= 0 ? 'bg-red-900/20 border-red-900 text-red-500 opacity-50' : 'bg-slate-800 border-slate-700'}`}>
                  <p className="font-bold truncate">{p.name}</p>
                  <p>❤️ {p.health.toFixed(1)}</p>
                  <p>😊 {p.morale.toFixed(1)}</p>
                  <p>🍞 {p.provisions}</p>
              </div>
          ))}
      </div>

      {!finished ? (
          <button
            onClick={nextDay}
            className="w-full bg-orange-700 hover:bg-orange-600 text-white font-bold py-4 rounded-lg"
          >
              ادامه مسیر (یک روز بعد)
          </button>
      ) : (
          <div className="bg-slate-800 p-6 rounded-lg text-center border-2 border-ice-500">
              <h3 className="text-xl font-bold mb-2">پایان شبیه‌سازی</h3>
              <p>{survivors.length > 0 ? `تعداد ${survivors.length} نفر به مقصد رسیدند.` : 'همه افراد در مسیر جان باختند.'}</p>
              <button onClick={() => setActive(false)} className="mt-4 text-ice-400 underline">بازگشت</button>
          </div>
      )}
    </div>
  );
};

export default WalkSimulator;
