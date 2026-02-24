import React from 'react';
import type { GameState, Belief } from '../types';
import { Heart, Smile, Brain } from 'lucide-react';

interface StatusPanelProps {
  state: GameState;
  onUpdate: (newState: GameState) => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ state, onUpdate }) => {
  const injectHope = (officerId: string, crewId: string) => {
      const newState = JSON.parse(JSON.stringify(state)) as GameState;
      const officer = newState.officers.find(o => o.id === officerId);
      if (officer) {
          const crewMember = officer.crew.find(c => c.id === crewId);
          if (crewMember) {
              crewMember.belief = 'OPTIMISTIC';
              newState.logs.push({
                  round: state.round,
                  message: `تزریق امید: ${crewMember.name} اکنون خوشبین است.`,
                  type: 'SUCCESS'
              });
              onUpdate(newState);
          }
      }
  };

  const getBeliefColor = (belief: Belief) => {
      switch(belief) {
          case 'OPTIMISTIC': return 'text-green-400';
          case 'DOUBTING': return 'text-yellow-400';
          case 'PESSIMISTIC': return 'text-red-400';
      }
  };

  const getBeliefName = (belief: Belief) => {
      switch(belief) {
          case 'OPTIMISTIC': return 'خوشبین';
          case 'DOUBTING': return 'مردد';
          case 'PESSIMISTIC': return 'بدبین';
      }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ice-300 mb-4">وضعیت دقیق خدمه</h2>
      {state.officers.map(officer => (
        <div key={officer.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="bg-slate-800 p-3 flex justify-between items-center">
            <span className="font-bold">{officer.name}</span>
            <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1"><Heart size={14} className="text-red-500"/> {officer.health.toFixed(1)}</span>
                <span className="flex items-center gap-1"><Smile size={14} className="text-yellow-500"/> {officer.morale.toFixed(1)}</span>
                <span className={`flex items-center gap-1 ${getBeliefColor(officer.belief)}`}><Brain size={14}/> {getBeliefName(officer.belief)}</span>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {officer.crew.map(c => (
              <div key={c.id} className="flex justify-between items-center text-sm p-2 bg-slate-800/20 rounded">
                <span>{c.name}</span>
                <div className="flex items-center gap-4 text-xs">
                    <span className="w-12">❤️ {c.health.toFixed(1)}</span>
                    <span className="w-12">😊 {c.morale.toFixed(1)}</span>
                    <span className={`w-16 ${getBeliefColor(c.belief)}`}>{getBeliefName(c.belief)}</span>
                    <button
                        onClick={() => injectHope(officer.id, c.id)}
                        disabled={c.belief === 'OPTIMISTIC'}
                        className="text-[10px] bg-ice-900/50 text-ice-400 px-2 py-1 rounded hover:bg-ice-800 disabled:opacity-30"
                    >
                        تزریق امید
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusPanel;
