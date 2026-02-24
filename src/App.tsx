import { useState, useEffect } from 'react'
import type { GameState } from './types'
import Setup from './components/Setup'
import Dashboard from './components/Dashboard'
import LogView from './components/LogView'
import RoundManager from './components/RoundManager'
import StatusPanel from './components/StatusPanel'
import WalkSimulator from './components/WalkSimulator'
import CaptainActions from './components/CaptainActions'
import { Users, PlayCircle, Footprints, FileJson } from 'lucide-react'

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [activeTab, setActiveTab] = useState('round')

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('franklin_game_state')
    if (saved) {
      try {
        setGameState(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load game state", e)
      }
    }
  }, [])

  // Save to local storage on change
  useEffect(() => {
    if (gameState) {
      localStorage.setItem('franklin_game_state', JSON.stringify(gameState))
    }
  }, [gameState])

  const exportJSON = () => {
    if (!gameState) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `franklin_save_round_${gameState.round}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setGameState(JSON.parse(content));
        } catch (err) {
          alert("خطا در بارگذاری فایل!");
        }
      };
      reader.readAsText(file);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <h1 className="text-4xl font-bold text-ice-400 mb-8 text-center">ماموریت فرانکلین</h1>
        <Setup onStart={setGameState} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12 font-sans" dir="rtl">
      <header className="bg-slate-900 border-b border-ice-900/50 p-4 mb-8 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-ice-400">ماموریت فرانکلین</h1>
            <span className="bg-ice-900 text-ice-400 text-xs px-2 py-1 rounded">هفته {gameState.round}</span>
          </div>
          <div className="flex gap-4">
             <button
                onClick={() => { if(confirm('آیا از شروع مجدد اطمینان دارید؟')) setGameState(null) }}
                className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded hover:bg-red-900/50"
              >
                شروع مجدد
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <Dashboard state={gameState} />

        <div className="flex gap-2 mb-6 bg-slate-900 p-1 rounded-lg w-fit border border-slate-800">
           <button
             onClick={() => setActiveTab('round')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'round' ? 'bg-ice-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
           >
             <PlayCircle size={18}/> مدیریت راند
           </button>
           <button
             onClick={() => setActiveTab('status')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'status' ? 'bg-ice-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
           >
             <Users size={18}/> وضعیت دقیق
           </button>
           <button
             onClick={() => setActiveTab('walk')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'walk' ? 'bg-red-700 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
           >
             <Footprints size={18}/> شبیه‌ساز راهپیمایی
           </button>
           <button
             onClick={() => setActiveTab('json')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'json' ? 'bg-slate-700 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
           >
             <FileJson size={18}/> داده‌ها
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'round' && <RoundManager state={gameState} onUpdate={setGameState} />}
            {activeTab === 'status' && <StatusPanel state={gameState} onUpdate={setGameState} />}
            {activeTab === 'walk' && <WalkSimulator state={gameState} />}
            {activeTab === 'json' && (
                <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                    <h2 className="text-xl font-bold mb-4">مدیریت داده‌های JSON</h2>
                    <textarea
                        readOnly
                        value={JSON.stringify(gameState, null, 2)}
                        className="w-full h-96 bg-slate-950 border border-slate-800 rounded p-4 text-xs font-mono text-ice-300 mb-4"
                    />
                    <div className="flex gap-4">
                        <button onClick={exportJSON} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">دانلود JSON</button>
                        <label className="bg-slate-700 px-4 py-2 rounded hover:bg-slate-600 cursor-pointer">
                            بارگذاری JSON
                            <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                        </label>
                    </div>
                </div>
            )}
          </div>

          <div className="space-y-6">
            <CaptainActions state={gameState} onUpdate={setGameState} />
            <LogView logs={gameState.logs} />
            <div className="bg-slate-900 p-4 rounded-lg border border-ice-900/20">
                <h3 className="text-sm font-bold mb-2">راهنما</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                    این ابزار کمکی برای بازی‌گردان طراحی شده است. پس از هر راند، نتایج حرکت کشتی، وضعیت بدنه و سلامت خدمه به طور خودکار محاسبه می‌شود.
                    در صورت یخبندان کامل (هفته ۶ تا ۱۰)، به زبانه شبیه‌ساز راهپیمایی بروید.
                </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
