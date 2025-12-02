import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Center, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const Cell3D = React.memo(({ position, value, isSelected, isError, onClick, rotation }: any) => {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (!mesh.current) return;
    const targetScale = (isSelected || isError) ? 1.1 : 1;
    mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.3);
  });

  const color = useMemo(() => {
    if (isError) return '#ef4444';
    if (isSelected) return '#2563eb';
    
    if (value === 0) return '#333333'; 
    
    return '#555555';
  }, [value, isSelected, isError]);

  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      <mesh ref={mesh} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <boxGeometry args={[0.85, 0.85, 0.2]} />
        <meshStandardMaterial 
            color={color} 
            emissive={isError ? '#ef4444' : (isSelected ? '#1d4ed8' : '#000000')} 
            emissiveIntensity={isError ? 1.5 : (isSelected ? 0.5 : 0)} 
            roughness={0.2}
            metalness={0.1}
        />
      </mesh>
      {value !== 0 && (
        <Text 
            position={[0, 0, 0.16]} 
            fontSize={0.5} 
            color="#ffffff" 
            anchorX="center" 
            anchorY="middle"
            characters="0123456789"
        >
          {value}
        </Text>
      )}
    </group>
  );
}, (prev, next) => {
    return prev.value === next.value && 
           prev.isSelected === next.isSelected && 
           prev.isError === next.isError &&
           prev.position === next.position;
});

const useLayout = (topology: string) => {
  return useMemo(() => {
    const cells = [];
    const GRID_SIZE = 486;
    
    if (topology === 'GRID') {
      for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const xGap = Math.floor(col / 3) * 0.2;
        const yGap = Math.floor(row / 3) * 0.2;
        cells.push({
          pos: [(col - 4) * 1.1 + xGap, (4 - row) * 1.1 - yGap, 0],
          rot: [0, 0, 0],
          idx: i
        });
      }
    } 
    else if (topology === 'CUBE') {
      const size = 5;
      const faces = [
        { pos: [0, 0, size], rot: [0, 0, 0] },
        { pos: [0, 0, -size], rot: [0, Math.PI, 0] },
        { pos: [size, 0, 0], rot: [0, Math.PI/2, 0] },
        { pos: [-size, 0, 0], rot: [0, -Math.PI/2, 0] },
        { pos: [0, size, 0], rot: [-Math.PI/2, 0, 0] },
        { pos: [0, -size, 0], rot: [Math.PI/2, 0, 0] },
      ];
      
      faces.forEach((face, faceIdx) => {
        for(let i=0; i<81; i++) {
             const row = Math.floor(i / 9);
             const col = i % 9;
             const lx = (col - 4) * 0.9;
             const ly = (4 - row) * 0.9;
             
             const dummy = new THREE.Object3D();
             dummy.position.set(lx, ly, 0);
             dummy.lookAt(0,0,1);
             
             const parent = new THREE.Object3D();
             parent.position.set(...face.pos as [number, number, number]);
             parent.rotation.set(...face.rot as [number, number, number]);
             parent.add(dummy);
             parent.updateMatrixWorld(true);
             
             const finalPos = new THREE.Vector3();
             const finalRot = new THREE.Quaternion();
             dummy.getWorldPosition(finalPos);
             dummy.getWorldQuaternion(finalRot);
             
             const globalIndex = faceIdx * 81 + i;
             cells.push({
               pos: [finalPos.x, finalPos.y, finalPos.z],
               rot: [new THREE.Euler().setFromQuaternion(finalRot).x, new THREE.Euler().setFromQuaternion(finalRot).y, new THREE.Euler().setFromQuaternion(finalRot).z],
               idx: globalIndex
             });
        }
      });
    }
    else if (topology === 'TORUS') {
      const rings = 54; 
      const ringSize = 9; 
      const R = 12; 
      const r = 3;  
      
      for (let i = 0; i < rings; i++) {
        for (let j = 0; j < ringSize; j++) {
          const u = (i / rings) * Math.PI * 2;
          const v = (j / ringSize) * Math.PI * 2;
          const x = (R + r * Math.cos(v)) * Math.cos(u);
          const y = (R + r * Math.cos(v)) * Math.sin(u);
          const z = r * Math.sin(v);
          
          const globalIndex = i * ringSize + j;
          if (globalIndex < GRID_SIZE) {
            cells.push({
                pos: [x, y, z],
                rot: [0, 0, u + Math.PI/2],
                idx: globalIndex
            });
          }
        }
      }
    }

    return cells;
  }, [topology]);
};

export const Scene3D = () => {
  const { grid, visualTopology, selectedCell, selectCell, errorCell } = useGameStore();
  const layout = useLayout(visualTopology);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '60vh', background: '#000' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 18], fov: 50 }}>
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.8} />
        <pointLight position={[20, 20, 20]} intensity={1.5} />
        <pointLight position={[-20, -20, -20]} intensity={1} color="#4a90e2" />
        
        <Stars count={1000} factor={4} fade />
        <OrbitControls enablePan={true} />
        <Center>
          <group>
            {layout.map((cell) => (
              <Cell3D 
                key={cell.idx}
                position={cell.pos}
                rotation={cell.rot}
                value={grid[cell.idx]}
                isSelected={selectedCell === cell.idx}
                isError={errorCell === cell.idx}
                onClick={() => selectCell(cell.idx)}
              />
            ))}
          </group>
        </Center>
      </Canvas>
    </div>
  );
};