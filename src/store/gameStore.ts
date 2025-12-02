import { create } from 'zustand';
import { ManifoldEngine, Topology, init_core } from '../manifold-wasm/manifold_core';
import init from '../manifold-wasm/manifold_core';
import { puzzles, Puzzle, getRandomPuzzle } from '../examples/puzzles';

let engineInstance: ManifoldEngine | null = null;
let wasmInitialized = false;

interface GameState {
  grid: Uint8Array;
  status: 'LOADING' | 'READY' | 'SOLVED' | 'IMPOSSIBLE' | 'INVALID';
  selectedCell: number | null;
  lastErrorTime: number;
  currentPuzzle: Puzzle | null;
  availablePuzzles: Puzzle[];
  
  init: () => Promise<void>;
  selectCell: (index: number | null) => void;
  setCell: (value: number) => void;
  loadExample: () => void;
  loadPuzzle: (puzzle: Puzzle) => void;
  solve: () => void;
  reset: () => void;
}

function buildGridFromEngine(engine: ManifoldEngine): Uint8Array {
  const grid = new Uint8Array(81);
  for (let i = 0; i < 81; i++) {
    grid[i] = engine.get_cell(i);
  }
  return grid;
}

export const useGameStore = create<GameState>((set, get) => ({
  grid: new Uint8Array(81),
  status: 'LOADING',
  selectedCell: null,
  lastErrorTime: 0,
  currentPuzzle: null,
  availablePuzzles: puzzles,

  init: async () => {
    try {
      if (!wasmInitialized) {
        await init();
        wasmInitialized = true;
      }
      init_core();
      engineInstance = ManifoldEngine.new(Topology.Classic9x9);
      const randomPuzzle = getRandomPuzzle();
      
      for (let i = 0; i < randomPuzzle.grid.length; i++) {
        if (randomPuzzle.grid[i] !== 0) {
          engineInstance.set_cell(i, randomPuzzle.grid[i]);
        }
      }
      
      set({ 
        grid: buildGridFromEngine(engineInstance), 
        status: 'READY',
        currentPuzzle: randomPuzzle
      });
    } catch (e) {
      console.error("WASM Load Error", e);
    }
  },

  selectCell: (index) => set({ selectedCell: index }),

  setCell: (value) => {
    const { selectedCell, status } = get();
    if (!engineInstance || selectedCell === null || status !== 'READY') return;
    
    const isValid = engineInstance.set_cell(selectedCell, value);
    
    if (isValid || value === 0) {
      set({ grid: buildGridFromEngine(engineInstance) });
    } else {
      set({ status: 'INVALID', lastErrorTime: Date.now() });
      
      setTimeout(() => {
        set({ status: 'READY' });
      }, 600);
    }
  },

  loadExample: () => {
    const randomPuzzle = getRandomPuzzle();
    const { loadPuzzle } = get();
    loadPuzzle(randomPuzzle);
  },

  loadPuzzle: (puzzle: Puzzle) => {
    if (!engineInstance) return;
    engineInstance.reset();
    
    for (let i = 0; i < puzzle.grid.length; i++) {
      if (puzzle.grid[i] !== 0) {
        engineInstance.set_cell(i, puzzle.grid[i]);
      }
    }
    
    set({ 
      grid: buildGridFromEngine(engineInstance), 
      status: 'READY', 
      selectedCell: null,
      currentPuzzle: puzzle
    });
  },

  solve: () => {
    if (!engineInstance) return;
    const result = engineInstance.solve();
    
    if (result) {
      set({ grid: buildGridFromEngine(engineInstance), status: 'SOLVED' });
    } else {
      set({ status: 'IMPOSSIBLE' });
    }
  },

  reset: () => {
    if (!engineInstance) return;
    engineInstance.reset();
    set({ grid: buildGridFromEngine(engineInstance), status: 'READY', selectedCell: null });
  }
}));
