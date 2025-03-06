import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { useGameStore } from '../game/store';
import socket from '../socket';

const ResourceNode = ({ position, resource }) => {
  const [hovered, setHovered] = useState(false);
  const playerCharacter = useGameStore(state => state.characters[0]);
  const setTargetResource = useGameStore(state => state.setTargetResource);
  
  // Determine geometry and color based on resource type
  const getResourceGeometry = () => {
    switch(resource.type) {
      case 'wood':
        return <cylinderGeometry args={[0.2, 0.2, 2, 8]} />;
      case 'stone':
        return <dodecahedronGeometry args={[0.7, 0]} />;
      case 'food':
        return <sphereGeometry args={[0.6, 16, 16]} />;
      case 'iron':
        return <octahedronGeometry args={[0.7, 0]} />;
      case 'herbs':
        return <coneGeometry args={[0.5, 1, 8]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };
  
  const getResourceColor = () => {
    switch(resource.type) {
      case 'wood': return '#8B4513';
      case 'stone': return '#A9A9A9';
      case 'food': return '#FF6347';
      case 'iron': return '#B0C4DE';
      case 'herbs': return '#90EE90';
      default: return '#FFC107';
    }
  };
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (playerCharacter && socket && socket.connected) {
      console.log("ResourceNode: Setting target resource:", resource);
      setTargetResource(resource);
      
      // Notify server directly
      socket.emit('playerUpdate', {
        state: 'moving',
        targetResource: resource.id
      });
    }
  };

  return (
    <group 
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main resource mesh */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        {getResourceGeometry()}
        <meshStandardMaterial 
          color={getResourceColor()} 
          emissive={hovered ? getResourceColor() : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* For wood type, add tree top */}
      {resource.type === 'wood' && (
        <mesh castShadow position={[0, 1.5, 0]}>
          <coneGeometry args={[1, 2, 8]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
      )}

      {/* Resource label */}
      <Html position={[0, 2, 0]} center distanceFactor={10}>
        <div style={{ 
          color: 'white', 
          background: 'rgba(0,0,0,0.5)', 
          padding: '2px 5px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          textAlign: 'center'
        }}>
          {resource.type} ({Math.floor(resource.amount)})
        </div>
      </Html>

      {/* Highlighted outline for selection */}
      {playerCharacter && playerCharacter.targetResource && 
       playerCharacter.targetResource.id === resource.id && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.2} wireframe />
        </mesh>
      )}
    </group>
  );
};

export default ResourceNode;
