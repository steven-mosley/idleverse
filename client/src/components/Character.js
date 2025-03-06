import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

const Character = ({ position, character, isPlayer }) => {
  const characterRef = useRef();
  const targetPosition = useRef([position[0], position[1], position[2]]);
  
  // Update target position when props change
  useEffect(() => {
    targetPosition.current = [position[0], position[1], position[2]];
  }, [position]);
  
  // Animation for smooth movement
  useFrame((state, delta) => {
    if (characterRef.current) {
      // Get current position
      const currentPos = characterRef.current.position;
      
      // Calculate the distance to the target
      const dx = targetPosition.current[0] - currentPos.x;
      const dy = targetPosition.current[1] - currentPos.y;
      const dz = targetPosition.current[2] - currentPos.z;
      
      // Interpolate the position for smooth movement (adjust the lerp factor for speed)
      const lerpFactor = 0.1; // Higher = faster movement
      
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01 || Math.abs(dz) > 0.01) {
        currentPos.x += dx * lerpFactor;
        currentPos.y += dy * lerpFactor;
        currentPos.z += dz * lerpFactor;
      }
    }
  });

  return (
    <group ref={characterRef} position={position}>
      {/* Character body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.5, 1, 8, 16]} />
        <meshStandardMaterial color={isPlayer ? '#1E90FF' : '#FF69B4'} />
      </mesh>

      {/* Character head */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={isPlayer ? '#1E90FF' : '#FF69B4'} />
      </mesh>

      {/* Character nameplate */}
      <Html position={[0, 1.5, 0]} center>
        <div style={{ 
          color: 'white', 
          background: 'rgba(0,0,0,0.8)', 
          padding: '3px 6px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          fontWeight: 'bold'
        }}>
          {character.name}
        </div>
      </Html>

      {/* Action progress indicator for gathering */}
      {character.state === 'gathering' && character.actionProgress > 0 && (
        <Html position={[0, -0.7, 0]} center>
          <div style={{ 
            width: '50px', 
            height: '5px', 
            background: '#444',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${character.actionProgress * 100}%`, 
              height: '100%', 
              background: '#00FF00' 
            }} />
          </div>
        </Html>
      )}
    </group>
  );
};

export default Character;
