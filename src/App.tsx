import { useEffect } from 'react';
import { useGameStore, VisualTopology } from './store/gameStore';
import { Scene3D } from './components/Scene3D';

function App() {
  const { 
    init, status, loadRandomPuzzle, reset, solve, setCell, 
    visualTopology, setTopology, currentPuzzleName, stats 
  } = useGameStore();

  useEffect(() => { init(); }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) setCell(num);
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setCell(0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCell]);

  const navBtnStyle = (isActive: boolean) => `
    px-4 py-2 text-sm font-bold border-r-2 border-ink transition-all
    ${isActive ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-gray-200'}
  `;

  const actionBtnStyle = `
    flex-1 py-4 text-xl font-serif font-bold border-2 border-ink 
    bg-paper text-ink shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-gray-200 transition-all
  `;

  return (
    <div className="w-screen h-screen flex flex-col bg-paper text-ink overflow-hidden border-4 border-ink">
      
      <header className="border-b-4 border-ink bg-paper z-10 flex flex-col">
        <div className="flex justify-between items-end px-6 py-4 border-b border-ink">
          <div>
            <h1 className="text-5xl font-serif font-black tracking-tight leading-none">
              MANIFOLD ENGINE
            </h1>
            <div className="font-mono text-xs mt-2 text-graphite uppercase tracking-widest">
             — Spatial Constraint Solver — {new Date().toLocaleDateString()}
            </div>
          </div>
          
          <div className="text-right">
             <div className="font-serif font-bold text-lg italic border-b-2 border-ink inline-block mb-1">
               {currentPuzzleName || "Loading..."}
             </div>
             <div className="font-mono text-xs flex items-center justify-end gap-2">
                STATUS: 
                <span className={`px-1 ${status === 'SOLVED' ? 'bg-ink text-paper' : ''}`}>
                  {status}
                </span>
             </div>
          </div>
        </div>

        <nav className="flex border-b border-ink">
          {(['GRID', 'TORUS', 'CUBE'] as VisualTopology[]).map(t => (
            <button 
                key={t}
                onClick={() => setTopology(t)}
                className={navBtnStyle(visualTopology === t)}
            >
                {t}
            </button>
          ))}
          <div className="flex-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmOWY3ZjEiLz48Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0iI2QxZDVRiIvPjwvc3ZnPg==')] opacity-20"></div>
        </nav>
      </header>

      <div className="flex-1 relative bg-paper cursor-crosshair">
         <Scene3D />
         
         {stats && status === 'SOLVED' && (
             <div className="absolute top-6 right-6 border-2 border-ink bg-paper p-4 shadow-hard min-w-[240px]">
                 <div className="border-b-2 border-ink pb-2 mb-3 font-serif font-bold text-lg">
                   PERFORMANCE DATA
                 </div>
                 <div className="font-mono text-sm grid grid-cols-2 gap-y-2">
                     <span className="text-graphite">Time:</span>
                     <span className="text-right font-bold">{(stats.time / 1000).toFixed(2)} ms</span>
                     
                     <span className="text-graphite">Nodes:</span>
                     <span className="text-right">{stats.iterations.toLocaleString()}</span>
                     
                     <span className="text-graphite">Backtracks:</span>
                     <span className="text-right text-red-ink">{stats.backtracks}</span>
                     
                     <span className="text-graphite">Depth:</span>
                     <span className="text-right">{stats.depth}</span>
                 </div>
             </div>
         )}
      </div>

      <footer className="border-t-4 border-ink bg-paper p-6">
        <div className="flex gap-4 max-w-4xl mx-auto">
            <button onClick={loadRandomPuzzle} className={actionBtnStyle}>
              RANDOM ISSUE
            </button>
            <button onClick={reset} className={`${actionBtnStyle} text-red-ink border-red-ink`}>
              RESET
            </button>
            <button onClick={solve} className={`${actionBtnStyle}`}>
              SOLVE PUZZLE
            </button>
        </div>
      </footer>
    </div>
  );
}

export default App;