"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import vertShader from "@/shaders/spiral.vert";
import fragShader from "@/shaders/spiral.frag";

const DISC_RADIUS_KPC = 22; // visible artist's-impression radius

type Props = {
  rotationPeriodSec?: number; // wall-clock for a full spiral revolution
};

export default function SpiralDisc({ rotationPeriodSec = 240 }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRotation: { value: 0 },
      uDiskRadiusKpc: { value: DISC_RADIUS_KPC },
    }),
    [],
  );

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    matRef.current.uniforms.uTime.value = t;
    matRef.current.uniforms.uRotation.value =
      (t / rotationPeriodSec) * Math.PI * 2;
  });

  // The plane sits in the z = 0 galactic plane and is twice DISC_RADIUS
  // wide so vUv maps cleanly into [-R, +R] inside the fragment shader.
  return (
    <mesh rotation={[0, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[DISC_RADIUS_KPC * 2, DISC_RADIUS_KPC * 2, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
