import React from 'react';
import type { GameEvent } from '../types';

interface LogViewProps {
  logs: GameEvent[];
}

const LogView: React.FC<LogViewProps> = ({ logs }) => {
  return (
    <div className="bg-slate-900 rounded border border-slate-800 p-4 h-64 overflow-y-auto">
      <h3 className="text-lg font-bold mb-4 sticky top-0 bg-slate-900 pb-2">تاریخچه رویدادها</h3>
      <div className="space-y-2">
        {logs.slice().reverse().map((log, i) => (
          <div key={i} className={`text-sm p-2 rounded ${
            log.type === 'DANGER' ? 'bg-red-900/20 text-red-400' :
            log.type === 'WARNING' ? 'bg-yellow-900/20 text-yellow-400' :
            log.type === 'SUCCESS' ? 'bg-green-900/20 text-green-400' :
            'bg-slate-800 text-slate-300'
          }`}>
            <span className="font-bold ml-2">هفته {log.round}:</span>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogView;
