import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, Euler } from 'three';
import { useGameStore } from '../game/store';

const ThirdPersonCamera = ({ active }) => {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef(new Vector3(0, 0, 0));
  const playerCharacter = useGameStore(state => state.characters[0]);
  
  // Camera settings
  const cameraSettingsRef = useRef({
    distance: 10,
    minDistance: 3,
    maxDistance: 20,
    height: 3,
    rotationX: 0,
    rotationY: Math.PI / 6, // Slightly tilted down
    lerpFactor: 0.1,        // How quickly the camera follows
    isRightMouseDown: false,
    isLeftMouseDown: false,
    lastMouseX: 0,
    lastMouseY: 0
  });

  // Set up event listeners
  useEffect(() => {
    if (!active) return;
    
    const handleMouseDown = (e) => {
      if (e.button === 0) { // Left mouse button
        cameraSettingsRef.current.isLeftMouseDown = true;
      } else if (e.button === 2) { // Right mouse button
        cameraSettingsRef.current.isRightMouseDown = true;
      }
      cameraSettingsRef.current.lastMouseX = e.clientX;
      cameraSettingsRef.current.lastMouseY = e.clientY;
    };
    
    const handleMouseUp = (e) => {
      if (e.button === 0) { // Left mouse button
        cameraSettingsRef.current.isLeftMouseDown = false;
      } else if (e.button === 2) { // Right mouse button
        cameraSettingsRef.current.isRightMouseDown = false;
      }
    };
    
    const handleMouseMove = (e) => {
      const settings = cameraSettingsRef.current;
      const deltaX = e.clientX - settings.lastMouseX;
      const deltaY = e.clientY - settings.lastMouseY;
      
      if (settings.isRightMouseDown) {
        // Right mouse button - rotate camera horizontally
        settings.rotationX -= deltaX * 0.01;
      } else if (settings.isLeftMouseDown) {
        // Left mouse button - orbit camera
        settings.rotationX -= deltaX * 0.01;
        settings.rotationY = Math.max(0.1, Math.min(Math.PI / 2, settings.rotationY + deltaY * 0.01));
      }
      
      settings.lastMouseX = e.clientX;
      settings.lastMouseY = e.clientY;
    };
    
    const handleWheel = (e) => {
      const settings = cameraSettingsRef.current;
      settings.distance = Math.max(
        settings.minDistance,
        Math.min(settings.maxDistance, settings.distance + Math.sign(e.deltaY) * 1)
      );
    };
    
    const handleContextMenu = (e) => {
      e.preventDefault(); // Prevent right-click menu
    };
    
    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('contextmenu', handleContextMenu);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [active]);
  
  // Update camera position every frame
  useFrame(() => {
    if (!active || !playerCharacter) return;
    
    const settings = cameraSettingsRef.current;
    
    // Update target position (player's position)
    const playerPos = playerCharacter.position;
    if (playerPos) {
      targetRef.current.set(playerPos.x, 0, playerPos.y);
    }
    
    // Calculate camera position based on distance and angles
    const cameraOffset = new Vector3(
      Math.sin(settings.rotationX) * settings.distance * Math.cos(settings.rotationY),
      Math.sin(settings.rotationY) * settings.distance + settings.height,
      Math.cos(settings.rotationX) * settings.distance * Math.cos(settings.rotationY)
    );
    
    // Create destination position by adding offset to target
    const destination = targetRef.current.clone().add(cameraOffset);
    
    // Smoothly interpolate current camera position to destination
    camera.position.lerp(destination, settings.lerpFactor);
    
    // Always look at the target
    camera.lookAt(targetRef.current);
  });
  
  return null; // This component doesn't render anything visible
};

export default ThirdPersonCamera;
