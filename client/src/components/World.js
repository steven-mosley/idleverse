import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useThree } from '@react-three/fiber';
import Terrain from './Terrain';
import Character from './Character';
import ResourceNode from './ResourceNode';
import { useGameStore } from '../game/store';

const World = forwardRef((props, ref) => {
  const { scene } = useThree();
  const worldRef = useRef();
  
  const resources = useGameStore(state => state.resources);
  const characters = useGameStore(state => state.characters);
  const otherPlayers = useGameStore(state => state.otherPlayers);
  
  // Filter out depleted resources
  const activeResources = resources.filter(resource => !resource.depleted);
  
  // Debug log current state
  useEffect(() => {
    console.log("World component rendering with:");
    console.log("- Active resources:", activeResources.length, "of", resources.length);
    console.log("- Characters:", characters.length);
    console.log("- Other players:", Object.keys(otherPlayers).length);
  }, [resources, activeResources, characters, otherPlayers]);

  // Allow parent components to access world methods
  useImperativeHandle(ref, () => ({
    getWorldRef: () => worldRef.current,
    getScene: () => scene
  }));

  return (
    <group ref={worldRef}>
      <Terrain />
      
      {/* Render only non-depleted resource nodes */}
      {Array.isArray(activeResources) && activeResources.map(resource => (
        <ResourceNode 
          key={resource.id} 
          position={[resource.position.x, 0, resource.position.y]} 
          resource={resource} 
        />
      ))}
      
      {/* Render player character */}
      {Array.isArray(characters) && characters.length > 0 && characters.map(character => (
        <Character 
          key={character.id || 'player'} 
          position={[character.position.x, 0, character.position.y]} 
          character={character}
          isPlayer={true}
        />
      ))}
      
      {/* Render other players */}
      {Object.values(otherPlayers || {}).map(player => (
        <Character 
          key={player.id} 
          position={[player.position.x, 0, player.position.y]} 
          character={player}
          isPlayer={false}
        />
      ))}
    </group>
  );
});

export default World;
