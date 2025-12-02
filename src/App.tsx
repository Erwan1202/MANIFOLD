import { useEffect } from 'react';
import { useGameStore, VisualTopology } from './store/gameStore';
import { Scene3D } from './components/Scene3D';

function App() {
  const { 
    init, status, loadRandomPuzzle, reset, solve, setCell, 
    visualTopology, setTopology, currentPuzzleName 
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

  const btnStyle = {
    padding: '8px 12px', 
    margin: '0 4px', 
    border: '1px solid #333',
    borderRadius: '4px',
    cursor: 'pointer', 
    fontFamily: 'monospace', 
    fontWeight: 'bold', 
    textTransform: 'uppercase' as const,
    color: '#e5e5e5', 
    fontSize: '11px', 
    background: '#171717', 
    transition: 'all 0.2s'
  };

  const activeBtnStyle = { 
    ...btnStyle, 
    background: '#2563eb', 
    border: '1px solid #2563eb', 
    color: 'white' 
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>
      
      <header style={{ padding: '12px 16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: '#0a0a0a' }}>
        <div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', letterSpacing: '-0.05em' }}>
            MANIFOLD <span style={{ color: '#2563eb' }}>ENGINE</span>
          </h1>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px', fontFamily: 'monospace' }}>
            {currentPuzzleName}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
            {(['GRID', 'TORUS', 'CUBE'] as VisualTopology[]).map(t => (
                <button 
                    key={t}
                    onClick={() => setTopology(t)}
                    style={visualTopology === t ? activeBtnStyle : btnStyle}
                >
                    {t}
                </button>
            ))}
        </div>

        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: status === 'SOLVED' ? '#22c55e' : '#666' }}>
             STATUS: {status}
        </div>
      </header>

      <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
         <Scene3D />
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid #333', background: '#0a0a0a', zIndex: 10, textAlign: 'center' }}>
            <button onClick={loadRandomPuzzle} style={btnStyle}>RANDOM PUZZLE</button>
            <button onClick={reset} style={{ ...btnStyle, color: '#ef4444', border: '1px solid #7f1d1d' }}>RESET</button>
            <div style={{ display: 'inline-block', width: '20px' }}></div>
            <button onClick={solve} style={{ ...btnStyle, color: '#2563eb', border: '1px solid #2563eb' }}>⚡ SOLVE</button>
      </div>
    </div>
  );
}

export default App;