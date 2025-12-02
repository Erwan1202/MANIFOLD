import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Scene3D } from './components/Scene3D';

function App() {
  const { init, status, solve, reset, loadExample, setCell } = useGameStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === 'LOADING') return;
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) setCell(num);
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setCell(0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, setCell]);

  const btnStyle = {
    padding: '10px 20px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#0a0a0a', 
      color: 'white',
      fontFamily: 'monospace',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
      <header style={{ padding: '20px', textAlign: 'center', flex: '0 0 auto' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6', fontSize: '2.5rem' }}>
          MANIFOLD ENGINE
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>
          SPATIAL CONSTRAINT SOLVER
        </p>
      </header>

      <div style={{ flex: '1 1 auto', minHeight: 0, padding: '20px' }}>
        <Scene3D />
      </div>
      <div style={{ padding: '20px', textAlign: 'center', flex: '0 0 auto' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button onClick={loadExample} style={{ ...btnStyle, background: '#333', color: '#fff' }}>Load Example</button>
          <button onClick={solve} disabled={status !== 'READY'} style={{ ...btnStyle, background: status !== 'READY' ? '#555' : '#2563eb', color: '#fff' }}>SOLVE (WASM)</button>
          <button onClick={reset} style={{ ...btnStyle, background: '#7f1d1d', color: '#fff' }}>Reset</button>
        </div>
        {status === 'INVALID' && (<div style={{ color: '#ff0000', fontWeight: 'bold', animation: 'pulse 0.6s infinite' }}>❌ Invalid Move</div>)}
        {status === 'SOLVED' && (<div style={{ color: '#00ff00', fontWeight: 'bold' }}>✓ Puzzle Solved!</div>)}
        {status === 'IMPOSSIBLE' && (<div style={{ color: '#ff8800', fontWeight: 'bold' }}>⚠ No Solution Found</div>)}
        <div style={{ color: '#444', fontSize: '12px', marginTop: '10px' }}>Rotate: Left Click | Zoom: Scroll | Status: {status}</div>
      </div>
    </div>
  );
}

export default App;
