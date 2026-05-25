"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import StarField from "@/components/StarField";

export default function Galaxy() {
  return (
    <div className="h-full w-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 40], fov: 50, near: 0.1, far: 5000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          <StarField />
        </Suspense>
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={0.5}
          maxDistance={2000}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
