"use client";

import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { SUN } from "@/lib/galacticCoords";

export type ViewPreset = "top" | "edge" | "sun";

export type CameraHandle = {
  setPreset: (preset: ViewPreset) => void;
};

type Props = {
  controlsRef: React.MutableRefObject<CameraHandle | null>;
};

const PRESETS: Record<ViewPreset, { pos: [number, number, number]; tgt: [number, number, number] }> = {
  // Looking down on the disk plane from the north galactic pole.
  top:  { pos: [SUN.x * 0.5, 0, 18],          tgt: [SUN.x * 0.5, 0, 0] },
  // Looking along the disk plane from outside, so the local Gaia
  // volume appears as a flat band — the "Milky Way" the eye sees.
  edge: { pos: [SUN.x * 0.4, 12, 1.0],        tgt: [SUN.x * 0.4, 0, 0] },
  // Up close in the solar neighborhood.
  sun:  { pos: [SUN.x - 0.6, SUN.y, SUN.z + 0.3], tgt: [SUN.x, SUN.y, SUN.z] },
};

const FLY_SECONDS = 1.5;
function smootherstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

type FlyState = {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTgt: THREE.Vector3;
  toTgt: THREE.Vector3;
  startedAt: number;
};

export default function CameraController({ controlsRef }: Props) {
  const orbitRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
  const flyRef = useRef<FlyState | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    // Snap to "edge" preset on first mount (no animation) — the local
    // Gaia neighborhood is a flat puffy disk and edge-on is the most
    // informative starting view.
    const initial = PRESETS.edge;
    camera.position.set(...initial.pos);
    const c = orbitRef.current as unknown as {
      target: THREE.Vector3;
      update: () => void;
    } | null;
    if (c) {
      c.target.set(...initial.tgt);
      c.update();
    }

    controlsRef.current = {
      setPreset: (preset: ViewPreset) => {
        const target = PRESETS[preset];
        const c = orbitRef.current as unknown as {
          target: THREE.Vector3;
        } | null;
        flyRef.current = {
          fromPos: camera.position.clone(),
          toPos: new THREE.Vector3(...target.pos),
          fromTgt: c ? c.target.clone() : new THREE.Vector3(...target.tgt),
          toTgt: new THREE.Vector3(...target.tgt),
          startedAt: performance.now(),
        };
      },
    };
  }, [camera, controlsRef]);

  useFrame(() => {
    const fly = flyRef.current;
    if (!fly) return;
    const t = (performance.now() - fly.startedAt) / 1000 / FLY_SECONDS;
    const k = smootherstep(t);
    camera.position.lerpVectors(fly.fromPos, fly.toPos, k);
    const c = orbitRef.current as unknown as {
      target: THREE.Vector3;
      update: () => void;
    } | null;
    if (c) {
      c.target.lerpVectors(fly.fromTgt, fly.toTgt, k);
      c.update();
    }
    if (t >= 1) flyRef.current = null;
  });

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
