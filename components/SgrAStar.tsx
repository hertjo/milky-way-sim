"use client";

import { Html } from "@react-three/drei";
import * as THREE from "three";

// A small marker at the galactic center: a faint cyan ring, a hard
// black dot in the middle, and an offset label.
//
// (The orientation matches the disk plane so it reads as a flat
// crosshair on top-down view.)
export default function SgrAStar() {
  return (
    <group position={[0, 0, 0]}>
      {/* Outer faint ring (1 kpc) so users can find the GC at any zoom */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.02, 64]} />
        <meshBasicMaterial
          color={"#84d8ff"}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {/* Bright pinpoint at exact center */}
      <mesh>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={"#ffffff"} toneMapped={false} />
      </mesh>
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: "none" }}
      >
        <div className="-translate-y-3 whitespace-nowrap font-mono text-[10px] tracking-[0.25em] text-cyan-200/85">
          Sgr A*
        </div>
      </Html>
    </group>
  );
}
