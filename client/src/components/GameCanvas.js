import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import World from './World';
import ThirdPersonCamera from './ThirdPersonCamera';
import { useGameStore } from '../game/store';
import socket from '../socket';

const GameCanvas = ({ active }) => {
  const worldRef = useRef();
  const setSocket = useGameStore(state => state.setSocket);

  useEffect(() => {
    if (active && socket) {
      console.log("GameCanvas: Setting socket in store:", socket.id);
      setSocket(socket);
    }
  }, [active, setSocket]);

  if (!active) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas 
        shadows 
        camera={{ position: [0, 10, 10], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        <Sky sunPosition={[100, 10, 100]} />
        
        {/* ThirdPersonCamera replaced OrbitControls */}
        <ThirdPersonCamera active={active} />
        
        <World ref={worldRef} />
      </Canvas>
    </div>
  );
};

export default GameCanvas;
