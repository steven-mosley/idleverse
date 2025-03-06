import React from 'react';

const Terrain = () => {
  // Basic flat terrain for now
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#3A5F0B" />
    </mesh>
  );
};

export default Terrain;
