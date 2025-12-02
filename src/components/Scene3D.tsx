import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Center, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const Cell3D = ({ position, value, isSelected, isError, onClick, rotation }: any) => {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!mesh.current) return;
    const targetScale = (isSelected || isError) ? 1.1 : 1;
    mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
  });

  const color = useMemo(() => {
    if (isError) return '#ef4444'; 
    if (value === 0) return '#171717'; 
    return '#404040'; 
  }, [value, isSelected, isError]);

  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      <mesh 
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <boxGeometry args={[0.85, 0.85, 0.2]} />
        <meshStandardMaterial 
          color={color} 
          emissive={isError ? '#ef4444' : (isSelected ? '#1d4ed8' : '#000000')}
          emissiveIntensity={isError ? 1.5 : (isSelected ? 0.5 : 0)}
          roughness={0.2}
        />
      </mesh>
      {value !== 0 && (
        <Text
          position={[0, 0, 0.15]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {value}
        </Text>
      )}
    </group>
  );
};


const useLayout = (topology: string, grid: Uint8Array) => {
  return useMemo(() => {
    const cells = [];
    
    if (topology === 'GRID') {
      for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const xGap = Math.floor(col / 3) * 0.2;
        const yGap = Math.floor(row / 3) * 0.2;
        cells.push({
          pos: [(col - 4) * 1.1 + xGap, (4 - row) * 1.1 - yGap, 0],
          rot: [0, 0, 0],
          val: grid[i],
          idx: i
        });
      }
    } 
    else if (topology === 'TORUS') {
      const rings = 24;
      const ringSize = 12;
      const R = 8; 
      const r = 3; 
      
      for (let i = 0; i < rings; i++) {
        for (let j = 0; j < ringSize; j++) {
          const u = (i / rings) * Math.PI * 2;
          const v = (j / ringSize) * Math.PI * 2;
          const x = (R + r * Math.cos(v)) * Math.cos(u);
          const y = (R + r * Math.cos(v)) * Math.sin(u);
          const z = r * Math.sin(v);
          
          const linearIdx = (i * ringSize + j) % 81;
          cells.push({
            pos: [x, y, z],
            rot: [0, 0, u + Math.PI/2],
            val: grid[linearIdx],
            idx: linearIdx
          });
        }
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
      
      faces.forEach((face) => {
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
             
             cells.push({
               pos: [finalPos.x, finalPos.y, finalPos.z],
               rot: [new THREE.Euler().setFromQuaternion(finalRot).x, new THREE.Euler().setFromQuaternion(finalRot).y, new THREE.Euler().setFromQuaternion(finalRot).z],
               val: grid[i],
               idx: i
             });
        }
      });
    }

    return cells;
  }, [topology, grid]);
};

export const Scene3D = () => {
  const { grid, visualTopology, selectedCell, selectCell, errorCell } = useGameStore();
  const layout = useLayout(visualTopology, grid);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '60vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 16], fov: 50 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#2563eb" />
        <Stars count={2000} factor={4} />

        <OrbitControls enablePan={true} />
        
        <Center>
          <group>
            {layout.map((cell, i) => (
              <Cell3D 
                key={i}
                position={cell.pos}
                rotation={cell.rot}
                value={cell.val}
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