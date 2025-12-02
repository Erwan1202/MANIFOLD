import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text, OrbitControls, Center } from '@react-three/drei';
import { useGameStore } from '../store/gameStore';

const Cell3D = ({ index, value, isFixed, isSelected, onClick }: any) => {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const x = (col - 4) * 1.1;
  const y = (4 - row) * 1.1;

  const color = useMemo(() => {
    if (isSelected) return '#3b82f6';
    if (isFixed) return '#404040';
    if (value === 0) return '#171717';
    return '#262626';
  }, [value, isFixed, isSelected]);

  const textColor = useMemo(() => {
    if (isFixed) return '#999999';
    return '#ffffff';
  }, [isFixed]);

  return (
    <group position={[x, y, 0]}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(index); }}>
        <boxGeometry args={[1, 1, 0.2]} />
        <meshStandardMaterial 
          color={color}
          emissive={isSelected ? '#1f2937' : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : 0}
        />
      </mesh>
      {value !== 0 && (
        <Text
          position={[0, 0, 0.15]}
          fontSize={0.6}
          color={textColor}
          anchorX="center"
          anchorY="middle"
        >
          {String(value)}
        </Text>
      )}
    </group>
  );
};

export const Scene3D = () => {
  const { grid, selectedCell, selectCell } = useGameStore();

  const fixedCells = useMemo(() => {
    const fixed = new Uint8Array(81);
    for (let i = 0; i < 81; i++) {
      fixed[i] = grid[i] !== 0 ? 1 : 0;
    }
    return fixed;
  }, [grid]);

  const sceneContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '600px',
    background: '#0a0a0a',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
  };

  return (
    <div style={sceneContainerStyle}>
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, 10]} intensity={0.4} color="#4a90e2" />
        <OrbitControls 
          enablePan={true}
          minDistance={5}
          maxDistance={25}
          autoRotate={false}
        />
        <Center>
          {Array.from(grid).map((val, i) => (
            <Cell3D 
              key={i} 
              index={i} 
              value={val}
              isFixed={fixedCells[i] === 1}
              isSelected={selectedCell === i}
              onClick={selectCell} 
            />
          ))}
        </Center>
      </Canvas>
    </div>
  );
};
