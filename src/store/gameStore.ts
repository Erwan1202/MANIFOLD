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

const generateCubeData = () => {
    const fullData = new Uint8Array(486);
    const names = [];
    
    for(let face=0; face<6; face++) {
        const p = getRandomPuzzle();
        names.push(p.name);
        for(let i=0; i<81; i++) {
            fullData[face * 81 + i] = p.grid[i];
        }
    }
    return { data: fullData, name: "Cube: " + names[0] + "..." };
};

export const useGameStore = create<GameState>((set, get) => ({
  grid: new Uint8Array(486),
  fixed: new Uint8Array(486),
  status: 'LOADING',
  selectedCell: null,
  errorCell: null,
  visualTopology: 'GRID',
  currentPuzzleName: '',

  init: async () => {
    if (isWasmLoaded || isInitializing) {
        if (engineInstance) set({ status: 'READY' });
        return;
    }

    isInitializing = true;

    try {
      await initWasm();
      init_core();
      isWasmLoaded = true;
      
      engineInstance = ManifoldEngine.new(Topology.Classic9x9);
      
      const { data, name } = generateCubeData();
      engineInstance.load_puzzle(data);
      
      set({ 
          grid: engineInstance.get_grid(), 
          fixed: engineInstance.get_fixed_cells(),
          currentPuzzleName: name,
          status: 'READY' 
      });

    } catch (e) {
      console.error(e);
      set({ status: 'IMPOSSIBLE' });
    } finally {
        isInitializing = false;
    }
  },

  selectCell: (index) => set({ selectedCell: index, errorCell: null }),

  setCell: (value) => {
    const { status, selectedCell } = get();
    if (!engineInstance || status === 'SOLVED' || selectedCell === null) return;
    
    if (engineInstance.set_cell(selectedCell, value)) {
       set({ grid: engineInstance.get_grid(), errorCell: null });
    } else {
       set({ errorCell: selectedCell });
       setTimeout(() => set({ errorCell: null }), 400);
    }
  },

  loadRandomPuzzle: () => {
    if (!engineInstance) return;
    const { data, name } = generateCubeData();
    engineInstance.load_puzzle(data);
    set({ 
        grid: engineInstance.get_grid(), 
        fixed: engineInstance.get_fixed_cells(),
        currentPuzzleName: name,
        status: 'READY',
        errorCell: null
    });
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