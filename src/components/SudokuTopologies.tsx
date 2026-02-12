import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { 
  generateInterconnectedCubeSudoku, 
  generateTorusSudoku,
  FaceId, 
  FACE_ORDER 
} from '../utils/topologyGraph';

const generateSudokuGrid = (): number[][] => {
  const grid: number[][] = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  const isValid = (row: number, col: number, num: number): boolean => {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num) return false;
    }
    for (let i = 0; i < 9; i++) {
      if (grid[i][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if (grid[i][j] === num) return false;
      }
    }
    return true;
  };

  const solve = (): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
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
};

const Cell3D = ({ position, value, color, textColor, isEdge = false }: any) => {
  const safeValue = typeof value === 'number' ? value : 0;

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.9, 0.15]} />
        <meshStandardMaterial
          color={isEdge ? '#2563eb' : color}
          side={THREE.FrontSide}
          depthWrite={true}
        />
      </mesh>
      {safeValue !== 0 && (
        <Text
          position={[0, 0, 0.12]}
          fontSize={0.5}
          color={isEdge ? '#fbbf24' : textColor}
          anchorX="center"
          anchorY="middle"
        >
          {String(safeValue)}
        </Text>
      )}
    </group>
  );
};

export const CubeSudoku = () => {
  const cubeGrids = useMemo(() => generateInterconnectedCubeSudoku(), []);
  const FACE_SIZE = 5.5;

  const faceConfigs: Record<FaceId, { position: [number, number, number]; rotation: [number, number, number]; color: string }> = {
    front: { position: [0, 0, FACE_SIZE], rotation: [0, 0, 0], color: '#60a5fa' },
    back: { position: [0, 0, -FACE_SIZE], rotation: [0, Math.PI, 0], color: '#f472b6' },
    right: { position: [FACE_SIZE, 0, 0], rotation: [0, Math.PI / 2, 0], color: '#34d399' },
    left: { position: [-FACE_SIZE, 0, 0], rotation: [0, -Math.PI / 2, 0], color: '#fbbf24' },
    top: { position: [0, FACE_SIZE, 0], rotation: [-Math.PI / 2, 0, 0], color: '#a78bfa' },
    bottom: { position: [0, -FACE_SIZE, 0], rotation: [Math.PI / 2, 0, 0], color: '#fb923c' },
  };

  const isEdgeCell = (row: number, col: number): boolean => {
    return row === 0 || row === 8 || col === 0 || col === 8;
  };

  const renderFace = (faceId: FaceId) => {
    const config = faceConfigs[faceId];
    const grid = cubeGrids.get(faceId)!;

    return (
      <group
        key={`face-${faceId}`}
        position={config.position}
        rotation={config.rotation}
      >
        {grid.map((row, rowIdx) =>
          row.map((value, colIdx) => {
            const x = (colIdx - 4) * 1.1;
            const y = (4 - rowIdx) * 1.1;
            const edge = isEdgeCell(rowIdx, colIdx);

            return (
              <Cell3D
                key={`cell-${rowIdx}-${colIdx}`}
                position={[x, y, 0]}
                value={value}
                color="#1f2937"
                textColor={config.color}
                isEdge={edge}
              />
            );
          })
        )}
        {/* Face label */}
        <Text
          position={[0, -5.5, 0.2]}
          fontSize={0.8}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {faceId.toUpperCase()}
        </Text>
      </group>
    );
  };

  return (
    <Canvas
      camera={{ position: [12, 12, 18], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[12, 12, 12]} intensity={1} />
      <pointLight position={[-12, -12, -12]} intensity={0.4} />

      {FACE_ORDER.map((faceId) => renderFace(faceId))}

      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
};

export const TorusSudoku = () => {
  const gridWidth = 9;
  const gridHeight = 9;
  const majorRadius = 6;
  const minorRadius = 2.5;

  const grid = useMemo(() => generateTorusSudoku(gridWidth, gridHeight), []);

  const cells = useMemo(() => {
    const result: Array<{ pos: [number, number, number]; value: number; row: number; col: number }> = [];

    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        // Map to torus surface with proper wrapping
        const u = (j / gridWidth) * Math.PI * 2;
        const v = (i / gridHeight) * Math.PI * 2;

        const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
        const y = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
        const z = minorRadius * Math.sin(v);
        const value = grid[i]?.[j] ?? 0;

        result.push({ pos: [x, y, z], value, row: i, col: j });
      }
    }
    return result;
  }, [grid]);

  // Check if cell is on wrapping edge (demonstrates continuity)
  const isWrapEdge = (row: number, col: number): boolean => {
    return row === 0 || row === gridHeight - 1 || col === 0 || col === gridWidth - 1;
  };

  return (
    <Canvas
      camera={{ position: [0, 12, 12], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[15, 15, 15]} intensity={1} />

      {cells.map((cell, idx) => (
        <Cell3D
          key={idx}
          position={cell.pos}
          value={cell.value}
          color="#1f2937"
          textColor="#60a5fa"
          isEdge={isWrapEdge(cell.row, cell.col)}
        />
      ))}

      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
};

export const SphereSudoku = () => {
  // Use cubed-sphere projection: 6 faces mapped onto a sphere
  // This avoids pole singularities and gives proper interconnection
  const cubeGrids = useMemo(() => generateInterconnectedCubeSudoku(), []);
  const radius = 8;

  // Map cube face coordinates to sphere surface using gnomonic projection
  const cubeToSphere = (face: FaceId, u: number, v: number): [number, number, number] => {
    // u, v are in range [-1, 1]
    let x: number, y: number, z: number;
    
    switch (face) {
      case 'front':
        x = u; y = v; z = 1;
        break;
      case 'back':
        x = -u; y = v; z = -1;
        break;
      case 'right':
        x = 1; y = v; z = -u;
        break;
      case 'left':
        x = -1; y = v; z = u;
        break;
      case 'top':
        x = u; y = 1; z = -v;
        break;
      case 'bottom':
        x = u; y = -1; z = v;
        break;
      default:
        x = 0; y = 0; z = 1;
    }
    
    // Normalize to sphere surface
    const len = Math.sqrt(x * x + y * y + z * z);
    return [
      (x / len) * radius,
      (y / len) * radius,
      (z / len) * radius
    ];
  };

  const cells = useMemo(() => {
    const result: Array<{ pos: [number, number, number]; value: number; face: FaceId; isEdge: boolean }> = [];

    for (const faceId of FACE_ORDER) {
      const grid = cubeGrids.get(faceId)!;
      
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          // Map grid coordinates to [-1, 1] range
          const u = (col / 8) * 2 - 1;
          const v = ((8 - row) / 8) * 2 - 1;
          
          const pos = cubeToSphere(faceId, u, v);
          const isEdge = row === 0 || row === 8 || col === 0 || col === 8;
          
          result.push({
            pos,
            value: grid[row][col],
            face: faceId,
            isEdge
          });
        }
      }
    }
    
    return result;
  }, [cubeGrids]);

  const getFaceColor = (face: FaceId): string => {
    const colors: Record<FaceId, string> = {
      front: '#60a5fa',
      back: '#f472b6',
      right: '#34d399',
      left: '#fbbf24',
      top: '#a78bfa',
      bottom: '#fb923c',
    };
    return colors[face];
  };

  return (
    <Canvas
      camera={{ position: [0, 0, 22], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[12, 12, 12]} intensity={1} />
      <pointLight position={[-12, -12, -12]} intensity={0.4} />

      {cells.map((cell, idx) => (
        <Cell3D
          key={idx}
          position={cell.pos}
          value={cell.value}
          color="#1f2937"
          textColor={getFaceColor(cell.face)}
          isEdge={cell.isEdge}
        />
      ))}

      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
};

export const OctahedronSudoku = () => {
  const grid = useMemo(() => generateSudokuGrid(), []);
  const scale = 6;

  // 8 triangular faces of an octahedron
  // Each face is defined by 3 vertices
  const octaFaces = useMemo(() => {
    const vertices = {
      px: [scale, 0, 0] as [number, number, number],
      nx: [-scale, 0, 0] as [number, number, number],
      py: [0, scale, 0] as [number, number, number],
      ny: [0, -scale, 0] as [number, number, number],
      pz: [0, 0, scale] as [number, number, number],
      nz: [0, 0, -scale] as [number, number, number],
    };

    // 8 faces - each connects 3 vertices
    return [
      { v: [vertices.px, vertices.py, vertices.pz], name: 'F1', color: '#60a5fa' },
      { v: [vertices.px, vertices.pz, vertices.ny], name: 'F2', color: '#34d399' },
      { v: [vertices.px, vertices.ny, vertices.nz], name: 'F3', color: '#fbbf24' },
      { v: [vertices.px, vertices.nz, vertices.py], name: 'F4', color: '#f472b6' },
      { v: [vertices.nx, vertices.pz, vertices.py], name: 'F5', color: '#a78bfa' },
      { v: [vertices.nx, vertices.ny, vertices.pz], name: 'F6', color: '#fb923c' },
      { v: [vertices.nx, vertices.nz, vertices.ny], name: 'F7', color: '#22d3d3' },
      { v: [vertices.nx, vertices.py, vertices.nz], name: 'F8', color: '#ef4444' },
    ];
  }, []);

  // Generate cells on triangular face using barycentric coordinates
  const generateTriangleCells = (v0: [number, number, number], v1: [number, number, number], v2: [number, number, number], faceIdx: number) => {
    const cells: Array<{ pos: [number, number, number]; value: number; isEdge: boolean }> = [];
    const rows = 4; // Number of rows in triangle

    for (let row = 0; row < rows; row++) {
      const cellsInRow = row + 1;
      for (let col = 0; col < cellsInRow; col++) {
        // Interpolate position within triangle
        const t1 = row / (rows - 1);
        const t2 = cellsInRow > 1 ? col / (cellsInRow - 1) : 0.5;

        // Lerp between vertices through centroid
        const edgeMid: [number, number, number] = [
          v1[0] * t2 + v2[0] * (1 - t2),
          v1[1] * t2 + v2[1] * (1 - t2),
          v1[2] * t2 + v2[2] * (1 - t2)
        ];

        const pos: [number, number, number] = [
          v0[0] * (1 - t1) + edgeMid[0] * t1,
          v0[1] * (1 - t1) + edgeMid[1] * t1,
          v0[2] * (1 - t1) + edgeMid[2] * t1
        ];

        const cellIdx = cells.length;
        const value = grid[faceIdx % 9]?.[cellIdx % 9] ?? ((cellIdx % 9) + 1);
        const isEdge = row === 0 || row === rows - 1 || col === 0 || col === cellsInRow - 1;

        cells.push({ pos, value, isEdge });
      }
    }

    return cells;
  };

  return (
    <Canvas
      camera={{ position: [12, 12, 12], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[12, 12, 12]} intensity={1} />
      <pointLight position={[-12, -12, -12]} intensity={0.4} />

      {octaFaces.map((face, faceIdx) => {
        const cells = generateTriangleCells(
          face.v[0] as [number, number, number],
          face.v[1] as [number, number, number],
          face.v[2] as [number, number, number],
          faceIdx
        );

        return (
          <group key={`face-${faceIdx}`}>
            {cells.map((cell, cellIdx) => (
              <Cell3D
                key={`cell-${cellIdx}`}
                position={cell.pos}
                value={cell.value}
                color="#1f2937"
                textColor={face.color}
                isEdge={cell.isEdge}
              />
            ))}
          </group>
        );
      })}

      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
};

export const KleinBottleSudoku = () => {
  const gridSize = 9;

  // Klein bottle: like a torus but with a twist
  // When wrapping horizontally, the vertical axis is inverted
  const grid = useMemo(() => {
    const g: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    
    const isValid = (row: number, col: number, num: number): boolean => {
      // Row constraint (with Klein twist at wrap)
      for (let c = 0; c < gridSize; c++) {
        if (c !== col && g[row][c] === num) return false;
      }
      
      // Column constraint
      for (let r = 0; r < gridSize; r++) {
        if (r !== row && g[r][col] === num) return false;
      }
      
      // 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          if ((r !== row || c !== col) && g[r][c] === num) return false;
        }
      }
      
      // Klein twist constraint: when reaching edge, rows are mirrored
      // Left edge connects to right edge with vertical flip
      if (col === 0) {
        const mirrorRow = gridSize - 1 - row;
        if (g[mirrorRow][gridSize - 1] === num && mirrorRow !== row) return false;
      }
      if (col === gridSize - 1) {
        const mirrorRow = gridSize - 1 - row;
        if (g[mirrorRow][0] === num && mirrorRow !== row) return false;
      }
      
      return true;
    };
    
    const solve = (): boolean => {
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          if (g[row][col] === 0) {
            const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            for (const num of nums) {
              if (isValid(row, col, num)) {
                g[row][col] = num;
                if (solve()) return true;
                g[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };
    
    solve();
    return g;
  }, []);

  // Klein bottle parametric surface (figure-8 immersion)
  const cells = useMemo(() => {
    const result: Array<{ pos: [number, number, number]; value: number; isEdge: boolean; isTwistEdge: boolean }> = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const u = (i / gridSize) * Math.PI * 2;
        const v = (j / gridSize) * Math.PI * 2;

        // Figure-8 Klein bottle immersion in 3D
        const r = 4 + 2 * Math.cos(v);
        const x = r * Math.cos(u);
        const y = r * Math.sin(u);
        const z = 2 * Math.sin(v) * Math.cos(u / 2) + 2 * Math.sin(2 * v) * Math.sin(u / 2);

        const value = grid[i]?.[j] ?? 0;
        const isEdge = i === 0 || i === gridSize - 1 || j === 0 || j === gridSize - 1;
        const isTwistEdge = j === 0 || j === gridSize - 1; // Horizontal edges have twist

        result.push({ pos: [x, y, z], value, isEdge, isTwistEdge });
      }
    }
    return result;
  }, [grid]);

  return (
    <Canvas
      camera={{ position: [0, 15, 12], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} />

      {cells.map((cell, idx) => (
        <Cell3D
          key={idx}
          position={cell.pos}
          value={cell.value}
          color={cell.isTwistEdge ? '#7c3aed' : '#1f2937'}
          textColor={cell.isTwistEdge ? '#fbbf24' : '#ec4899'}
          isEdge={cell.isEdge && !cell.isTwistEdge}
        />
      ))}

      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
};

export const SudokuTopologies = () => {
  const [topology, setTopology] = useState<'cube' | 'torus' | 'sphere' | 'octahedron' | 'klein'>('cube');

  const topologies = {
    cube: { name: 'Cube', component: CubeSudoku },
    torus: { name: 'Torus (Bagel)', component: TorusSudoku },
    sphere: { name: 'Sphere', component: SphereSudoku },
    octahedron: { name: 'Octahedron', component: OctahedronSudoku },
    klein: { name: 'Klein Bottle', component: KleinBottleSudoku },
  };

  const CurrentComponent = topologies[topology].component;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
      <div style={{ padding: '16px', backgroundColor: '#1f1f1f', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(Object.keys(topologies) as Array<keyof typeof topologies>).map((key) => (
          <button
            key={key}
            onClick={() => setTopology(key)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: topology === key ? '#2563eb' : '#404040',
              color: '#fff',
            }}
            onMouseEnter={(e) => {
              if (topology !== key) (e.target as HTMLButtonElement).style.backgroundColor = '#505050';
            }}
            onMouseLeave={(e) => {
              if (topology !== key) (e.target as HTMLButtonElement).style.backgroundColor = '#404040';
            }}
          >
            {topologies[key].name}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
        <CurrentComponent />
      </div>
    </div>
  );
};
