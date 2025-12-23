import { create } from 'zustand';
import initWasm, { ManifoldEngine, Topology, init_core } from '../manifold-wasm/manifold_core';
import { getRandomPuzzle } from '../examples/puzzles';

let engineInstance: ManifoldEngine | null = null;
let isInitializing = false;
let isWasmLoaded = false;

export type VisualTopology = 'GRID' | 'TORUS' | 'CUBE';

export interface BenchmarkStats {
  iterations: number;
  backtracks: number;
  depth: number;
  time: number;
}

interface GameState {
  grid: Uint8Array;
  fixed: Uint8Array;
  status: 'LOADING' | 'READY' | 'SOLVED' | 'IMPOSSIBLE';
  selectedCell: number | null;
  errorCell: number | null;
  visualTopology: VisualTopology;
  currentPuzzleName: string;
  stats: BenchmarkStats | null;

  init: () => Promise<void>;
  selectCell: (index: number | null) => void;
  setCell: (value: number) => void;
  loadRandomPuzzle: () => void;
  reset: () => void;
  solve: () => void;
  setTopology: (topo: VisualTopology) => void;
  shareState: () => string;
  loadFromHash: () => boolean;
}

const generateFullTopologyData = () => {
  const totalSize = 486;
  const fullData = new Uint8Array(totalSize);
  let firstName = "";

  for (let face = 0; face < 6; face++) {
    const puzzle = getRandomPuzzle();
    if (face === 0) firstName = puzzle.name;

    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      let val = puzzle.grid[i];
      const isEdge = row === 0 || row === 8 || col === 0 || col === 8;
      if (isEdge) val = 0;

      fullData[face * 81 + i] = val;
    }
  }

  return {
    data: fullData,
    name: `${firstName} (Stitched)`
  };
};

export const useGameStore = create<GameState>((set, get) => ({
  grid: new Uint8Array(486),
  fixed: new Uint8Array(486),
  status: 'LOADING',
  selectedCell: null,
  errorCell: null,
  visualTopology: 'GRID',
  currentPuzzleName: '',
  stats: null,

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

      engineInstance = ManifoldEngine.new(Topology.Cube6Faces);

      const { data, name } = generateFullTopologyData();
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
    const { data, name } = generateFullTopologyData();
    engineInstance.load_puzzle(data);
    set({
      grid: engineInstance.get_grid(),
      fixed: engineInstance.get_fixed_cells(),
      currentPuzzleName: name,
      status: 'READY',
      errorCell: null,
      stats: null
    });
  },

  reset: () => {
    if (!engineInstance) return;
    engineInstance.reset();
    set({ grid: engineInstance.get_grid(), status: 'READY', errorCell: null, stats: null });
  },

  solve: () => {
    if (!engineInstance) return;

    const result = engineInstance.solve();

    if (result.success) {
      set({
        grid: engineInstance.get_grid(),
        status: 'SOLVED',
        errorCell: null,
        stats: {
          iterations: result.iterations,
          backtracks: result.backtracks,
          depth: result.max_depth,
          time: result.time_us
        }
      });
    } else {
      set({ status: 'IMPOSSIBLE' });
    }
  },

  setTopology: (topo) => set({ visualTopology: topo }),

  shareState: () => {
    if (!engineInstance) return '';
    const packed = engineInstance.export_state();
    const base64 = btoa(String.fromCharCode(...packed))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const url = `${window.location.origin}${window.location.pathname}#${base64}`;
    window.history.replaceState(null, '', url);
    return url;
  },

  loadFromHash: () => {
    if (!engineInstance) return false;
    const hash = window.location.hash.slice(1);
    if (!hash) return false;
    try {
      const base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const binary = atob(padded);
      const packed = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        packed[i] = binary.charCodeAt(i);
      }
      if (engineInstance.import_state(packed)) {
        set({
          grid: engineInstance.get_grid(),
          fixed: engineInstance.get_fixed_cells(),
          currentPuzzleName: 'Shared Puzzle',
          status: 'READY',
          errorCell: null,
          stats: null
        });
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
}));