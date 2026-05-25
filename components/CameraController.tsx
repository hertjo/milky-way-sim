"use client";

import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { SUN } from "@/lib/galacticCoords";

export type ViewPreset = "top" | "edge" | "sun";

export type CameraHandle = {
  setPreset: (preset: ViewPreset) => void;
};

type Props = {
  controlsRef: React.MutableRefObject<CameraHandle | null>;
};

// (camera position kpc, controls target kpc) per preset.
const PRESETS: Record<ViewPreset, { pos: [number, number, number]; tgt: [number, number, number] }> = {
  top:  { pos: [0, 0, 22],            tgt: [0, 0, 0] },
  edge: { pos: [0, 25, 0.5],          tgt: [0, 0, 0] },
  sun:  { pos: [SUN.x - 0.6, SUN.y, SUN.z + 0.3], tgt: [SUN.x, SUN.y, SUN.z] },
};

export default function CameraController({ controlsRef }: Props) {
  const orbitRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    const apply = (preset: ViewPreset) => {
      const { pos, tgt } = PRESETS[preset];
      camera.position.set(...pos);
      camera.lookAt(...tgt);
      const c = orbitRef.current as unknown as {
        target: THREE.Vector3;
        update: () => void;
      } | null;
      if (c) {
        c.target.set(...tgt);
        c.update();
      }
    };
    apply("top");
    controlsRef.current = { setPreset: apply };
  }, [camera, controlsRef]);

  return (
    <OrbitControls
      ref={orbitRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.05}
      maxDistance={500}
      makeDefault
    />
  );
}
