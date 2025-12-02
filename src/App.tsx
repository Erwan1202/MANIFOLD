import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';

function App() {
  const { init, status, grid, solve, reset, loadExample, loadPuzzle, selectedCell, selectCell, setCell, currentPuzzle, availablePuzzles } = useGameStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'READY') return;
      
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        setCell(num);
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setCell(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, setCell]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
    fontFamily: 'monospace',
    backgroundColor: '#000',
    color: '#fff',
    padding: '2rem',
  };

  const titleStyle: React.CSSProperties = {
    textAlign: 'center',
  };

  const h1Style: React.CSSProperties = {
    fontSize: '3rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#666',
    margin: 0,
  };

  const gridContainerStyle: React.CSSProperties = {
    padding: '1rem',
    border: status === 'INVALID' ? '2px solid #f00' : '2px solid #333',
    display: 'grid',
    gridTemplateColumns: 'repeat(9, 1fr)',
    gap: '1px',
    backgroundColor: '#222',
    background: status === 'INVALID' ? '#330000' : '#222',
  };

  const cellStyle = (i: number): React.CSSProperties => {
    const isRightBorder = (i + 1) % 3 === 0 && (i + 1) % 9 !== 0;
    const isBottomBorder = Math.floor(i / 9) % 3 === 2 && Math.floor(i / 9) !== 8;

    return {
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.125rem',
      cursor: 'pointer',
      backgroundColor: selectedCell === i ? '#0066cc' : '#111',
      color: grid[i] === 0 ? '#444' : '#fff',
      fontWeight: grid[i] === 0 ? 'normal' : 'bold',
      borderRight: isRightBorder ? '2px solid #444' : 'none',
      borderBottom: isBottomBorder ? '2px solid #444' : 'none',
      border: `1px solid #222`,
    };
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #555',
    cursor: 'pointer',
    fontSize: '1rem',
    fontFamily: 'monospace',
  };

  const solveButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: status !== 'READY' ? '#444' : '#0066cc',
    opacity: status !== 'READY' ? 0.5 : 1,
    cursor: status !== 'READY' ? 'not-allowed' : 'pointer',
  };

  const clearButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#663333',
  };

  const messageStyle: React.CSSProperties = {
    fontWeight: 'bold',
    fontSize: '1rem',
    marginTop: '1rem',
    minHeight: '1.5rem',
  };

  const invalidMessageStyle: React.CSSProperties = {
    ...messageStyle,
    color: '#f00',
    animation: 'pulse 0.6s infinite',
  };

  const solvedMessageStyle: React.CSSProperties = {
    ...messageStyle,
    color: '#0f0',
  };

  const impossibleMessageStyle: React.CSSProperties = {
    ...messageStyle,
    color: '#ff8800',
  };

  const puzzleListStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '600px',
  };

  const puzzleButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.4rem 0.8rem',
    backgroundColor: isActive ? '#0066cc' : '#333',
    color: '#fff',
    border: `1px solid ${isActive ? '#00ccff' : '#555'}`,
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
  });

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      <div style={titleStyle}>
        <h1 style={h1Style}>MANIFOLD</h1>
        <p style={subtitleStyle}>RUST WASM CONSTRAINT SOLVER</p>
      </div>
      
      <div style={gridContainerStyle}>
        {Array.from(grid).map((val, i) => (
          <div 
            key={i}
            style={cellStyle(i)}
            onClick={() => selectCell(i)}
          >
            {val || '.'}
          </div>
        ))}
      </div>

      <div style={controlsStyle}>
        <button onClick={loadExample} style={buttonStyle}>
          LOAD EXAMPLE
        </button>
        
        <button 
          onClick={solve} 
          disabled={status !== 'READY'}
          style={solveButtonStyle}
        >
          {status === 'SOLVED' ? 'SOLVED!' : status === 'IMPOSSIBLE' ? 'IMPOSSIBLE' : 'SOLVE (WASM)'}
        </button>
        
        <button onClick={reset} style={clearButtonStyle}>
          CLEAR
        </button>
      </div>

      <div style={puzzleListStyle}>
        {availablePuzzles.map((puzzle) => (
          <button
            key={puzzle.name}
            onClick={() => loadPuzzle(puzzle)}
            style={puzzleButtonStyle(currentPuzzle?.name === puzzle.name)}
          >
            {puzzle.name}
          </button>
        ))}
      </div>

      <div>
        {status === 'INVALID' && <div style={invalidMessageStyle}>❌ Invalid Move</div>}
        {status === 'SOLVED' && <div style={solvedMessageStyle}>✓ Puzzle Solved!</div>}
        {status === 'IMPOSSIBLE' && <div style={impossibleMessageStyle}>⚠ No Solution</div>}
      </div>
    </div>
  );
}

export default App;
