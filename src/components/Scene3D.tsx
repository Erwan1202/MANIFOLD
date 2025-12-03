import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Center, Edges, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const TORUS_MAJOR_RADIUS = 12; 
const TORUS_MINOR_RADIUS = 2.85;

const TORUS_CORE_MAJOR_RADIUS = 6.2;
const TORUS_CORE_MINOR_RADIUS = 2.6;


const TopologyCore = React.memo(({ type }: { type: string }) => {
    const material = <meshBasicMaterial color="#FFFFFF" />; 

    if (type === 'CUBE') {
        return (
            <mesh>
                <boxGeometry args={[8.95, 8.95, 8.95]} />
                {material}
            </mesh>
        );
    }
    if (type === 'TORUS') {
        return (
            <group rotation={[Math.PI / 2, 0, 0]}>
            </group>
        );
    }
    return null;
});


const CellPlate = ({ position, rotation, value, isSelected, isError, onClick, size = [0.98, 0.98] }: any) => {
    return (
        <group position={position} rotation={rotation}>
            <mesh onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <planeGeometry args={size} />
                <meshBasicMaterial 
                    color={isError ? '#D93025' : (isSelected ? '#FEF08A' : '#FFFFFF')} 
                    side={THREE.DoubleSide}
                    polygonOffset={true}
                    polygonOffsetFactor={-1}
                />
                <Edges scale={1} threshold={15} color="#111111" linewidth={5} />
            </mesh>
            {value !== 0 && (
                <Text 
                    position={[0, 0, 0.02]} 
                    fontSize={Math.min(size[0], size[1]) * 0.55} 
                    color="#111111" 
                    anchorX="center" 
                    anchorY="middle"
                    characters="0123456789"
                >
                    {value}
                </Text>
            )}
        </group>
    );
};

const CubeView = ({ grid, selectCell, selectedCell, errorCell }: any) => {
    const faces = useMemo(() => {
        const size = 4.5;
        return [
            { pos: [0, 0, size], rot: [0, 0, 0] },
            { pos: [0, 0, -size], rot: [0, Math.PI, 0] },
            { pos: [size, 0, 0], rot: [0, Math.PI / 2, 0] },
            { pos: [-size, 0, 0], rot: [0, -Math.PI / 2, 0] },
            { pos: [0, size, 0], rot: [-Math.PI / 2, 0, 0] },
            { pos: [0, -size, 0], rot: [Math.PI / 2, 0, 0] },
        ];
    }, []);

    return (
        <group>
            {faces.map((face, faceIdx) => (
                <group key={faceIdx} position={face.pos as any} rotation={face.rot as any}>
                    {Array.from({ length: 81 }).map((_, i) => {
                        const row = Math.floor(i / 9);
                        const col = i % 9;
                        const idx = faceIdx * 81 + i;
                        const x = (col - 4) * 1.0;
                        const y = (4 - row) * 1.0;
                        return (
                            <CellPlate
                                key={idx}
                                position={[x, y, 0]}
                                rotation={[0, 0, 0]}
                                value={grid[idx]}
                                isSelected={selectedCell === idx}
                                isError={errorCell === idx}
                                onClick={() => selectCell(idx)}
                            />
                        );
                    })}
                </group>
            ))}
        </group>
    );
};

const GridView = ({ grid, selectCell, selectedCell, errorCell }: any) => {
    return (
        <group>
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[9.5, 9.5]} />
                <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            {Array.from({ length: 81 }).map((_, i) => {
                const row = Math.floor(i / 9);
                const col = i % 9;
                const xGap = Math.floor(col / 3) * 0.1;
                const yGap = Math.floor(row / 3) * 0.1;
                const x = (col - 4) * 1.0 + xGap;
                const y = (4 - row) * 1.0 - yGap;
                return (
                    <CellPlate
                        key={i}
                        position={[x, y, 0]}
                        rotation={[0, 0, 0]}
                        value={grid[i]}
                        isSelected={selectedCell === i}
                        isError={errorCell === i}
                        onClick={() => selectCell(i)}
                    />
                );
            })}
        </group>
    );
};

const TorusView = ({ grid, selectCell, selectedCell, errorCell }: any) => {
  const cells = useMemo(() => {
    const items: {
      idx: number;
      pos: [number, number, number];
      rot: [number, number, number];
      size: [number, number];
    }[] = [];

    const rings = 54;       
    const ringSize = 9;   

    const R = TORUS_MAJOR_RADIUS;
    const r = TORUS_MINOR_RADIUS;

    const tileWidth = 1.35;
    const tileHeight = 1.95;

    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < ringSize; j++) {
        const globalIndex = i * ringSize + j;
        if (globalIndex >= 486) continue;

        const u = ((i + 0.5) / rings) * Math.PI * 2;
        const v = ((j + 0.5) / ringSize) * Math.PI * 2;

        const cosV = Math.cos(v);
        const sinV = Math.sin(v);
        const cosU = Math.cos(u);
        const sinU = Math.sin(u);

        const radius = R + r * cosV;

        const x = radius * cosU;
        const y = radius * sinU;
        const z = r * sinV;

        const posVec = new THREE.Vector3(x, y, z);

        const centerVec = new THREE.Vector3(R * cosU, R * sinU, 0);
        const normal = new THREE.Vector3().subVectors(posVec, centerVec).normalize();

        const tangentU = new THREE.Vector3(
          -radius * sinU,
          radius * cosU,
          0
        ).normalize();


        const tangentV = new THREE.Vector3()
          .crossVectors(normal, tangentU)
          .normalize();

        const matrix = new THREE.Matrix4();
        matrix.makeBasis(tangentU, tangentV, normal);

        const euler = new THREE.Euler().setFromRotationMatrix(matrix);

        items.push({
          idx: globalIndex,
          pos: [x, y, z],
          rot: [euler.x, euler.y, euler.z],
          size: [tileWidth, tileHeight],
        });
      }
    }

    return items;
  }, []);

  return (
    <group>
      {cells.map((c) => (
        <CellPlate
          key={c.idx}
          position={c.pos}
          rotation={c.rot}
          size={c.size}
          value={grid[c.idx]}
          isSelected={selectedCell === c.idx}
          isError={errorCell === c.idx}
          onClick={() => selectCell(c.idx)}
        />
      ))}
    </group>
  );
};


export const Scene3D = () => {
  const { grid, visualTopology, selectedCell, selectCell, errorCell } = useGameStore();

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 26], fov: 40 }}>
        <color attach="background" args={['#ffffffff']} />
        
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} />
        <OrbitControls enablePan={true} />
        
        <Center>
            {visualTopology !== 'GRID' && <TopologyCore type={visualTopology} />}

            {visualTopology === 'GRID' && (
                <GridView grid={grid} selectCell={selectCell} selectedCell={selectedCell} errorCell={errorCell} />
            )}
            
            {visualTopology === 'CUBE' && (
                <CubeView grid={grid} selectCell={selectCell} selectedCell={selectedCell} errorCell={errorCell} />
            )}

            {visualTopology === 'TORUS' && (
                <TorusView grid={grid} selectCell={selectCell} selectedCell={selectedCell} errorCell={errorCell} />
            )}
        </Center>

        <AccumulativeShadows temporal frames={60} color="#111111" colorBlend={2} toneMapped={true} alphaTest={0.7} opacity={0.3} scale={40} position={[0, -12, 0]}>
          <RandomizedLight amount={8} radius={8} ambient={0.6} intensity={1} position={[10, 20, 5]} bias={0.001} />
        </AccumulativeShadows>
      </Canvas>
    </div>
  );
};