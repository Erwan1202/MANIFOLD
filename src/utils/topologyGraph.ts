export type FaceId = 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom';
export type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface FaceAdjacency {
  face: FaceId;
  edge: Edge;
  reversed: boolean;
}

export interface CubeFaceConfig {
  id: FaceId;
  adjacencies: Record<Edge, FaceAdjacency>;
}

export const CUBE_ADJACENCIES: Record<FaceId, Record<Edge, FaceAdjacency>> = {
  front: {
    top: { face: 'top', edge: 'bottom', reversed: false },
    bottom: { face: 'bottom', edge: 'top', reversed: false },
    left: { face: 'left', edge: 'right', reversed: false },
    right: { face: 'right', edge: 'left', reversed: false },
  },
  back: {
    top: { face: 'top', edge: 'top', reversed: true },
    bottom: { face: 'bottom', edge: 'bottom', reversed: true },
    left: { face: 'right', edge: 'right', reversed: false },
    right: { face: 'left', edge: 'left', reversed: false },
  },
  right: {
    top: { face: 'top', edge: 'right', reversed: true },
    bottom: { face: 'bottom', edge: 'right', reversed: false },
    left: { face: 'front', edge: 'right', reversed: false },
    right: { face: 'back', edge: 'left', reversed: false },
  },
  left: {
    top: { face: 'top', edge: 'left', reversed: false },
    bottom: { face: 'bottom', edge: 'left', reversed: true },
    left: { face: 'back', edge: 'right', reversed: false },
    right: { face: 'front', edge: 'left', reversed: false },
  },
  top: {
    top: { face: 'back', edge: 'top', reversed: true },
    bottom: { face: 'front', edge: 'top', reversed: false },
    left: { face: 'left', edge: 'top', reversed: false },
    right: { face: 'right', edge: 'top', reversed: true },
  },
  bottom: {
    top: { face: 'front', edge: 'bottom', reversed: false },
    bottom: { face: 'back', edge: 'bottom', reversed: true },
    left: { face: 'left', edge: 'bottom', reversed: true },
    right: { face: 'right', edge: 'bottom', reversed: false },
  },
};

export const FACE_ORDER: FaceId[] = ['front', 'back', 'right', 'left', 'top', 'bottom'];

export function getEdgeCells(edge: Edge, gridSize: number = 9): [number, number][] {
  const cells: [number, number][] = [];
  
  switch (edge) {
    case 'top':
      for (let col = 0; col < gridSize; col++) {
        cells.push([0, col]);
      }
      break;
    case 'bottom':
      for (let col = 0; col < gridSize; col++) {
        cells.push([gridSize - 1, col]);
      }
      break;
    case 'left':
      for (let row = 0; row < gridSize; row++) {
        cells.push([row, 0]);
      }
      break;
    case 'right':
      for (let row = 0; row < gridSize; row++) {
        cells.push([row, gridSize - 1]);
      }
      break;
  }
  
  return cells;
}

export function mapEdgeValues(values: number[], reversed: boolean): number[] {
  return reversed ? [...values].reverse() : values;
}

export interface GlobalCellId {
  face: FaceId;
  row: number;
  col: number;
}

export function getCubeConstraintGroups(gridSize: number = 9): GlobalCellId[][] {
  const groups: GlobalCellId[][] = [];
  
  for (const face of FACE_ORDER) {
    for (let row = 0; row < gridSize; row++) {
      const rowGroup: GlobalCellId[] = [];
      for (let col = 0; col < gridSize; col++) {
        rowGroup.push({ face, row, col });
      }
      groups.push(rowGroup);
    }
    
    for (let col = 0; col < gridSize; col++) {
      const colGroup: GlobalCellId[] = [];
      for (let row = 0; row < gridSize; row++) {
        colGroup.push({ face, row, col });
      }
      groups.push(colGroup);
    }
    
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxGroup: GlobalCellId[] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            boxGroup.push({
              face,
              row: boxRow * 3 + r,
              col: boxCol * 3 + c,
            });
          }
        }
        groups.push(boxGroup);
      }
    }
  }
  
  for (const face of FACE_ORDER) {
    const adjacencies = CUBE_ADJACENCIES[face];
    for (const edge of ['top', 'bottom', 'left', 'right'] as Edge[]) {
      const adj = adjacencies[edge];
      const sourceCells = getEdgeCells(edge, gridSize);
      const targetCells = getEdgeCells(adj.edge, gridSize);
      
      for (let i = 0; i < gridSize; i++) {
        const targetIdx = adj.reversed ? gridSize - 1 - i : i;
        const sourceCell = sourceCells[i];
        const targetCell = targetCells[targetIdx];
        
        if (FACE_ORDER.indexOf(face) < FACE_ORDER.indexOf(adj.face)) {
          groups.push([
            { face, row: sourceCell[0], col: sourceCell[1] },
            { face: adj.face, row: targetCell[0], col: targetCell[1] },
          ]);
        }
      }
    }
  }
  
  return groups;
}

export function generateInterconnectedCubeSudoku(): Map<FaceId, number[][]> {
  const faces = new Map<FaceId, number[][]>();
  
  for (const face of FACE_ORDER) {
    faces.set(face, Array(9).fill(null).map(() => Array(9).fill(0)));
  }
  
  const setValue = (cell: GlobalCellId, value: number): void => {
    faces.get(cell.face)![cell.row][cell.col] = value;
  };
  
  const isValid = (cell: GlobalCellId, value: number): boolean => {
    const face = cell.face;
    const row = cell.row;
    const col = cell.col;
    const grid = faces.get(face)!;
    
    for (let c = 0; c < 9; c++) {
      if (c !== col && grid[row][c] === value) return false;
    }
    
    for (let r = 0; r < 9; r++) {
      if (r !== row && grid[r][col] === value) return false;
    }
    
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && grid[r][c] === value) return false;
      }
    }
    
    const adjacencies = CUBE_ADJACENCIES[face];
    
    if (row === 0) {
      const adj = adjacencies.top;
      const targetCells = getEdgeCells(adj.edge);
      const targetIdx = adj.reversed ? 8 - col : col;
      const targetCell = targetCells[targetIdx];
      const targetValue = faces.get(adj.face)![targetCell[0]][targetCell[1]];
      if (targetValue !== 0 && targetValue !== value) return false;
    }
    
    if (row === 8) {
      const adj = adjacencies.bottom;
      const targetCells = getEdgeCells(adj.edge);
      const targetIdx = adj.reversed ? 8 - col : col;
      const targetCell = targetCells[targetIdx];
      const targetValue = faces.get(adj.face)![targetCell[0]][targetCell[1]];
      if (targetValue !== 0 && targetValue !== value) return false;
    }
    
    if (col === 0) {
      const adj = adjacencies.left;
      const targetCells = getEdgeCells(adj.edge);
      const targetIdx = adj.reversed ? 8 - row : row;
      const targetCell = targetCells[targetIdx];
      const targetValue = faces.get(adj.face)![targetCell[0]][targetCell[1]];
      if (targetValue !== 0 && targetValue !== value) return false;
    }
    
    if (col === 8) {
      const adj = adjacencies.right;
      const targetCells = getEdgeCells(adj.edge);
      const targetIdx = adj.reversed ? 8 - row : row;
      const targetCell = targetCells[targetIdx];
      const targetValue = faces.get(adj.face)![targetCell[0]][targetCell[1]];
      if (targetValue !== 0 && targetValue !== value) return false;
    }
    
    return true;
  };
  
  const propagateEdge = (cell: GlobalCellId, value: number): void => {
    const face = cell.face;
    const row = cell.row;
    const col = cell.col;
    const adjacencies = CUBE_ADJACENCIES[face];
    
    if (row === 0) {
      const adj = adjacencies.top;
      const targetCells = getEdgeCells(adj.edge);
      const targetIdx = adj.reversed ? 8 - col : col;
      const targetCell = targetCells[targetIdx];
      faces.get(adj.face)![targetCell[0]][targetCell[1]] = value;
    }
    
    if (row === 8) {
      const adj = adjacencies.bottom;
      const targetCells = getEdgeCells(adj.edge);
      const targetIdx = adj.reversed ? 8 - col : col;
      const targetCell = targetCells[targetIdx];
      faces.get(adj.face)![targetCell[0]][targetCell[1]] = value;
    }
    
    if (col === 0) {
      const adj = adjacencies.left;
      const targetCells = getEdgeCells(adj.edge);
      const targetIdx = adj.reversed ? 8 - row : row;
      const targetCell = targetCells[targetIdx];
      faces.get(adj.face)![targetCell[0]][targetCell[1]] = value;
    }
    
    if (col === 8) {
      const adj = adjacencies.right;
      const targetCells = getEdgeCells(adj.edge);
      const targetIdx = adj.reversed ? 8 - row : row;
      const targetCell = targetCells[targetIdx];
      faces.get(adj.face)![targetCell[0]][targetCell[1]] = value;
    }
  };
  
  const solve = (): boolean => {
    for (const face of FACE_ORDER) {
      const grid = faces.get(face)!;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            const cell: GlobalCellId = { face, row, col };
            const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            
            for (const num of nums) {
              if (isValid(cell, num)) {
                setValue(cell, num);
                propagateEdge(cell, num);
                
                if (solve()) return true;
                
                setValue(cell, 0);
                propagateEdge(cell, 0);
              }
            }
            return false;
          }
        }
      }
    }
    return true;
  };
  
  solve();
  return faces;
}

export function generateTorusSudoku(width: number = 9, height: number = 9): number[][] {
  const grid: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));
  
  const isValid = (row: number, col: number, num: number): boolean => {
    for (let c = 0; c < width; c++) {
      if (c !== col && grid[row][c] === num) return false;
    }
    
    for (let r = 0; r < height; r++) {
      if (r !== row && grid[r][col] === num) return false;
    }
    
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && grid[r][c] === num) return false;
      }
    }
    
    return true;
  };
  
  const solve = (): boolean => {
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (grid[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(row, col, num)) {
              grid[row][col] = num;
              if (solve()) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  
  solve();
  return grid;
}
