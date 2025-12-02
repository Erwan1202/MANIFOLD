import { create } from 'zustand';
import initWasm, { ManifoldEngine, Topology, init_core } from '../manifold-wasm/manifold_core';
import { getRandomPuzzle } from '../examples/puzzles';

let engineInstance: ManifoldEngine | null = null;
let isInitializing = false; 
let isWasmLoaded = false; 

export type VisualTopology = 'GRID' | 'TORUS' | 'CUBE';

interface GameState {
  grid: Uint8Array;
  fixed: Uint8Array;
  status: 'LOADING' | 'READY' | 'SOLVED' | 'IMPOSSIBLE';
  selectedCell: number | null;
  errorCell: number | null;
  visualTopology: VisualTopology;
  currentPuzzleName: string;
  
  init: () => Promise<void>;
  selectCell: (index: number | null) => void;
  setCell: (value: number) => void;
  loadRandomPuzzle: () => void;
  reset: () => void;
  solve: () => void;
  setTopology: (topo: VisualTopology) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  grid: new Uint8Array(81),
  fixed: new Uint8Array(81),
  status: 'LOADING',
  selectedCell: null,
  errorCell: null,
  visualTopology: 'GRID',
  currentPuzzleName: '',

  init: async () => {
    if (isWasmLoaded || isInitializing) {
        if (engineInstance) {
            set({ status: 'READY' });
        }
        return;
    }

    isInitializing = true;

    try {
      console.log("MANIFOLD: Starting Wasm Init...");
      await initWasm();
      init_core();
      isWasmLoaded = true;
      
      engineInstance = ManifoldEngine.new(Topology.Classic9x9);
      
      const puzzle = getRandomPuzzle();
      const loaded = engineInstance.load_puzzle(new Uint8Array(puzzle.grid));
      
      if (loaded) {
          set({ 
              grid: engineInstance.get_grid(), 
              fixed: engineInstance.get_fixed_cells(),
              currentPuzzleName: `${puzzle.name} (${puzzle.difficulty})`,
              status: 'READY' 
          });
          console.log("MANIFOLD: Engine Ready.");
      } else {
          console.error(" MANIFOLD: Failed to load initial puzzle.");
      }

    } catch (e) {
      console.error("MANIFOLD: Critical Wasm Error", e);
      set({ status: 'IMPOSSIBLE' });
    } finally {
        isInitializing = false;
    }
  },

  selectCell: (index) => set({ selectedCell: index, errorCell: null }),

  setCell: (value) => {
    const { status, selectedCell } = get();
    if (!engineInstance || status === 'SOLVED' || selectedCell === null) return;
    
    if (selectedCell < 0) return;

    const engineIndex = selectedCell % 81;
    
    try {
        const isValid = engineInstance.set_cell(engineIndex, value);
        if (isValid) {
           set({ grid: engineInstance.get_grid(), errorCell: null });
        } else {
           set({ errorCell: selectedCell });
           setTimeout(() => set({ errorCell: null }), 400);
        }
    } catch (e) {
        console.error("Rust Panic caught in JS:", e);
    }
  },

  loadRandomPuzzle: () => {
    if (!engineInstance) return;
    const puzzle = getRandomPuzzle();
    if(engineInstance.load_puzzle(new Uint8Array(puzzle.grid))) {
        set({ 
            grid: engineInstance.get_grid(), 
            fixed: engineInstance.get_fixed_cells(),
            currentPuzzleName: `${puzzle.name} (${puzzle.difficulty})`,
            status: 'READY',
            errorCell: null
        });
    }
  },

  reset: () => {
    if (!engineInstance) return;
    engineInstance.reset();
    set({ grid: engineInstance.get_grid(), status: 'READY', errorCell: null });
  },

  solve: () => {
    if (!engineInstance) return;
    const start = performance.now();
    const result = engineInstance.solve();
    console.log(`Solved in ${(performance.now() - start).toFixed(2)}ms`);

    if (result) {
        set({ grid: engineInstance.get_grid(), status: 'SOLVED', errorCell: null });
    } else {
        set({ status: 'IMPOSSIBLE' });
    }
  },

  setTopology: (topo) => set({ visualTopology: topo })
}));