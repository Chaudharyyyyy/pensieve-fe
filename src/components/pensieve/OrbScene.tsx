import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

const Orb = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.x = pointer.y * 0.3;
      meshRef.current.rotation.z = pointer.x * 0.2;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.08;
      wireRef.current.rotation.x = pointer.y * 0.2;
    }
  });

  return (
    <group>
      {/* Solid inner sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Wireframe shell */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.3, 24, 24]} />
        <meshBasicMaterial color="#666666" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

const BreathingRings = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const scale = 1 + Math.sin(t * 0.5 + i * 0.8) * 0.15;
      child.scale.set(scale, scale, scale);
      (child as THREE.Mesh).material && ((child as any).material.opacity = 0.15 + Math.sin(t * 0.5 + i * 0.8) * 0.1);
    });
  });

  const rings = useMemo(() => [1.8, 2.2, 2.6], []);

  return (
    <group ref={groupRef}>
      {rings.map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.01, 128]} />
          <meshBasicMaterial color="#888888" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

export const OrbScene = () => (
  <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ position: "absolute", inset: 0 }}>
    <ambientLight intensity={0.2} />
    <directionalLight position={[5, 5, 5]} intensity={0.6} color="#cccccc" />
    <directionalLight position={[-3, -2, 4]} intensity={0.3} color="#888888" />
    {/* Rim light */}
    <pointLight position={[0, 0, -3]} intensity={0.4} color="#aaaaaa" />
    <Orb />
    <BreathingRings />
  </Canvas>
);
