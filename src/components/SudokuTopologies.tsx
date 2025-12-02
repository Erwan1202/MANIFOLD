import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

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
          for (let num = 1; num <= 9; num++) {
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

const Cell3D = ({ position, value, color, textColor }: any) => {
  const safeValue = typeof value === 'number' ? value : 0;

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.9, 0.15]} />
        <meshStandardMaterial 
          color={color}
          side={THREE.FrontSide}
          depthWrite={true}
        />
      </mesh>
      {safeValue !== 0 && (
        <Text
          position={[0, 0, 0.12]}
          fontSize={0.5}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          depthTest={true}
          depthWrite={false}
        >
          {String(safeValue)}
        </Text>
      )}
    </group>
  );
};

export const CubeSudoku = () => {
  const grid = useMemo(() => generateSudokuGrid(), []);
  const FACE_SIZE = 5.5;

  const cubeFaces = useMemo(() => [
    { position: [0, 0, FACE_SIZE], rotation: [0, 0, 0], name: 'Front' },
    { position: [0, 0, -FACE_SIZE], rotation: [0, Math.PI, 0], name: 'Back' },
    { position: [FACE_SIZE, 0, 0], rotation: [0, Math.PI / 2, 0], name: 'Right' },
    { position: [-FACE_SIZE, 0, 0], rotation: [0, -Math.PI / 2, 0], name: 'Left' },
    { position: [0, FACE_SIZE, 0], rotation: [Math.PI / 2, 0, 0], name: 'Top' },
    { position: [0, -FACE_SIZE, 0], rotation: [-Math.PI / 2, 0, 0], name: 'Bottom' },
  ], []);

  const renderGridOnFace = (faceIndex: number) => {
    return (
      <group 
        key={`face-${faceIndex}`} 
        position={cubeFaces[faceIndex].position as [number, number, number]} 
        rotation={cubeFaces[faceIndex].rotation as [number, number, number]}
      >
        {Array(9).fill(null).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const offsetX = (col - 1) * 1.9;
          const offsetY = (1 - row) * 1.9;
          const boxIndex = row * 3 + col;

          return (
            <group key={`box-${i}`} position={[offsetX, offsetY, 0]}>
              {Array(9).fill(null).map((_, j) => {
                const cellRow = Math.floor(j / 3);
                const cellCol = j % 3;
                const x = (cellCol - 1) * 0.6;
                const y = (1 - cellRow) * 0.6;

                const cellIndex = boxIndex * 9 + j;
                const value = grid[Math.floor(cellIndex / 9) % 9]?.[cellIndex % 9] ?? 0;

                return (
                  <Cell3D
                    key={`cell-${j}`}
                    position={[x, y, 0]}
                    value={value}
                    color="#1f2937"
                    textColor="#60a5fa"
                  />
                );
              })}
            </group>
          );
        })}
      </group>
    );
  };

  return (
    <Canvas 
      camera={{ position: [8, 8, 12], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[12, 12, 12]} intensity={1} />
      <pointLight position={[-12, -12, -12]} intensity={0.4} />

      {[0, 1, 2, 3, 4, 5].map((faceIndex) => renderGridOnFace(faceIndex))}
      
      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
};

export const TorusSudoku = () => {
  const gridWidth = 18;
  const gridHeight = 18;
  const majorRadius = 8;
  const minorRadius = 4;

  const grid = useMemo(() => {
    const baseGrid = generateSudokuGrid();
    const extended: number[][] = [];
    
    for (let i = 0; i < gridHeight; i++) {
      extended[i] = [];
      for (let j = 0; j < gridWidth; j++) {
        extended[i][j] = baseGrid[i % 9][j % 9];
      }
    }
    return extended;
  }, []);

  const cells = useMemo(() => {
    const result: Array<[number, number, number, number]> = [];

    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        const u = (j / gridWidth) * Math.PI * 2;
        const v = (i / gridHeight) * Math.PI * 2;

        const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
        const y = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
        const z = minorRadius * Math.sin(v);
        const value = grid[i]?.[j] ?? 0;

        result.push([x, y, z, value]);
      }
    }
    return result;
  }, [grid]);

  return (
    <Canvas 
      camera={{ position: [0, 0, 20], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[15, 15, 15]} intensity={1} />
      
      {cells.map((cell, idx) => (
        <Cell3D
          key={idx}
          position={[cell[0], cell[1], cell[2]]}
          value={cell[3]}
          color="#1f2937"
          textColor="#60a5fa"
        />
      ))}
      
      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
};

export const SphereSudoku = () => {
  const grid = useMemo(() => generateSudokuGrid(), []);
  const gridResolution = 18;
  const radius = 6;

  const cells = useMemo(() => {
    const result: Array<[number, number, number, number]> = [];

    for (let i = 0; i < gridResolution; i++) {
      for (let j = 0; j < gridResolution; j++) {
        const theta = (i / gridResolution) * Math.PI;
        const phi = (j / gridResolution) * Math.PI * 2;

        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);
        const value = grid[i % 9]?.[j % 9] ?? 0;

        result.push([x, y, z, value]);
      }
    }
    return result;
  }, [grid]);

  return (
    <Canvas 
      camera={{ position: [0, 0, 18], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[12, 12, 12]} intensity={1} />
      
      {cells.map((cell, idx) => (
        <Cell3D
          key={idx}
          position={[cell[0], cell[1], cell[2]]}
          value={cell[3]}
          color="#1f2937"
          textColor="#a78bfa"
        />
      ))}
      
      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
};

export const OctahedronSudoku = () => {
  const grid = useMemo(() => generateSudokuGrid(), []);
  const scale = 5;

  const octahedronFaces = useMemo(() => [
    { pos: [0, 0, scale], name: 'Front' } as const,
    { pos: [0, 0, -scale], name: 'Back' } as const,
    { pos: [scale, 0, 0], name: 'Right' } as const,
    { pos: [-scale, 0, 0], name: 'Left' } as const,
    { pos: [0, scale, 0], name: 'Top' } as const,
    { pos: [0, -scale, 0], name: 'Bottom' } as const,
    { pos: [scale / 2, scale / 2, scale / 2], name: 'TopRight' } as const,
    { pos: [-scale / 2, -scale / 2, -scale / 2], name: 'BottomLeft' } as const,
  ], []);

  return (
    <Canvas 
      camera={{ position: [12, 12, 12], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[12, 12, 12]} intensity={1} />
      
      {octahedronFaces.map((face, faceIdx) => (
        <group key={`octaface-${faceIdx}`} position={face.pos as [number, number, number]}>
          {Array(9).fill(null).map((_, cellIdx) => {
            const x = ((cellIdx % 3) - 1) * 0.8;
            const y = (Math.floor(cellIdx / 3) - 1) * 0.8;
            const value = grid[faceIdx % 9]?.[cellIdx] ?? 0;

            return (
              <Cell3D
                key={`cell-${cellIdx}`}
                position={[x, y, 0]}
                value={value}
                color="#1f2937"
                textColor="#fb923c"
              />
            );
          })}
        </group>
      ))}
      
      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
};

export const KleinBottleSudoku = () => {
  const grid = useMemo(() => generateSudokuGrid(), []);
  const gridResolution = 18;

  const cells = useMemo(() => {
    const result: Array<[number, number, number, number]> = [];

    for (let u = 0; u < gridResolution; u++) {
      for (let v = 0; v < gridResolution; v++) {
        const uNorm = (u / gridResolution) * Math.PI * 2;
        const vNorm = (v / gridResolution) * Math.PI * 2;

        const r = 2 + Math.cos(uNorm / 2) * Math.sin(vNorm) - Math.sin(uNorm / 2) * Math.sin(2 * vNorm);
        const x = r * Math.cos(uNorm);
        const y = Math.sin(uNorm / 2) * Math.sin(vNorm) + Math.cos(uNorm / 2) * Math.sin(2 * vNorm);
        const z = Math.sin(uNorm) * Math.sin(vNorm) + Math.cos(uNorm / 2) * Math.cos(2 * vNorm);
        const value = grid[u % 9]?.[v % 9] ?? 0;

        result.push([x * 2, y * 2, z * 2, value]);
      }
    }
    return result;
  }, [grid]);

  return (
    <Canvas 
      camera={{ position: [0, 0, 15], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {cells.map((cell, idx) => (
        <Cell3D
          key={idx}
          position={[cell[0], cell[1], cell[2]]}
          value={cell[3]}
          color="#1f2937"
          textColor="#ec4899"
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
