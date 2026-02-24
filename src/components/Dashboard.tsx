import React from 'react';
import type { GameState } from '../types';
import { Ship, Users, Navigation, Wind } from 'lucide-react';

interface DashboardProps {
  state: GameState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const { ship, round } = state;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-slate-900 p-4 rounded border border-ice-900 flex items-center gap-4">
        <div className="bg-ice-900/50 p-2 rounded">
          <Ship className="text-ice-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">وضعیت بدنه</p>
          <p className="text-xl font-bold">{100 - ship.hullDamage}%</p>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded border border-ice-900 flex items-center gap-4">
        <div className="bg-ice-900/50 p-2 rounded">
          <Navigation className="text-ice-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">موقعیت (مایل شمال)</p>
          <p className="text-xl font-bold">{ship.position}</p>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded border border-ice-900 flex items-center gap-4">
        <div className="bg-ice-900/50 p-2 rounded">
          <Users className="text-ice-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">راند (هفته)</p>
          <p className="text-xl font-bold">{round}</p>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded border border-ice-900 flex items-center gap-4">
        <div className="bg-ice-900/50 p-2 rounded">
          <Wind className="text-ice-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">آذوقه</p>
          <p className="text-xl font-bold">{ship.provisions}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
