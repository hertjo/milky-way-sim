"use client";

import { useMemo } from "react";
import * as THREE from "three";

import vertShader from "@/shaders/spiral.vert";
import fragShader from "@/shaders/core.frag";

const CORE_RADIUS_KPC = 3.5;
const SGR_A_RADIUS_KPC = 0.05;

export default function GalacticCore() {
  const coreUniforms = useMemo(
    () => ({ uRadiusKpc: { value: CORE_RADIUS_KPC } }),
    [],
  );

  return (
    <group>
      {/* Bright bulge / fireball */}
      <mesh renderOrder={0}>
        <planeGeometry
          args={[CORE_RADIUS_KPC * 2, CORE_RADIUS_KPC * 2, 1, 1]}
        />
        <shaderMaterial
          vertexShader={vertShader}
          fragmentShader={fragShader}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Sgr A* — small black disk at the geometric centre, ringed by a
          faint warm halo so it reads as a focused point rather than
          a hole in the bulge. */}
      <mesh renderOrder={1}>
        <circleGeometry args={[SGR_A_RADIUS_KPC, 24]} />
        <meshBasicMaterial color={"#000000"} toneMapped={false} />
      </mesh>
    </group>
  );
}
