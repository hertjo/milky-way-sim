"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

type Maser = { x: number; y: number; z: number; arm: string; name: string };

// Color palette per Milky Way spiral arm. Loosely based on the convention
// used in Reid+ 2019 figures: hot pinks/oranges for inner arms, cooler
// teals for the outer ones, and white/grey for unassigned or local.
const ARM_COLORS: Record<string, [number, number, number]> = {
  Per:  [0.95, 0.45, 0.10], // Perseus — orange
  ScN:  [1.00, 0.85, 0.20], // Scutum Near — gold
  ScF:  [1.00, 0.85, 0.20],
  SgN:  [0.95, 0.20, 0.45], // Sagittarius Near — magenta
  SgF:  [0.95, 0.20, 0.45],
  Nor:  [0.40, 0.85, 1.00], // Norma — cyan
  Out:  [0.50, 0.55, 1.00], // Outer — light blue
  OSC:  [0.55, 0.40, 1.00], // Outer Scutum-Centaurus — purple
  Loc:  [0.92, 0.92, 0.92], // Local arm — neutral white
  LoS:  [0.92, 0.92, 0.92],
  "3kN": [0.95, 0.55, 0.95],
  "3kF": [0.95, 0.55, 0.95],
  GC:   [0.60, 0.95, 1.00],
  CtN:  [1.00, 0.60, 0.30],
  CrN:  [1.00, 0.60, 0.30],
  AqS:  [0.50, 1.00, 0.55],
  Con:  [0.80, 0.80, 0.80],
};
const FALLBACK: [number, number, number] = [0.7, 0.7, 0.7];

const VERT = `
attribute vec3 aColor;
uniform float uPixelRatio;
varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 8.0 * uPixelRatio * clamp(100.0 / -mv.z, 0.7, 5.0);
  vColor = aColor;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = `
precision highp float;
varying vec3 vColor;
void main() {
  vec2 q = gl_PointCoord - vec2(0.5);
  float r = length(q) * 2.0;
  if (r > 1.0) discard;
  float core = exp(-9.0 * r * r);
  float halo = exp(-1.2 * r * r) * 0.6;
  vec3 col = vColor * (core + halo);
  col += vec3(1.0) * pow(core, 10.0) * 0.5;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function Masers({ url = "/milkyway/masers.json" }: { url?: string }) {
  const [geom, setGeom] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((arr: Maser[]) => {
        if (cancelled) return;
        const n = arr.length;
        const positions = new Float32Array(n * 3);
        const colors = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const m = arr[i];
          positions[i * 3 + 0] = m.x;
          positions[i * 3 + 1] = m.y;
          positions[i * 3 + 2] = m.z;
          const c = ARM_COLORS[m.arm] ?? FALLBACK;
          colors[i * 3 + 0] = c[0];
          colors[i * 3 + 1] = c[1];
          colors[i * 3 + 2] = c[2];
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 40);
        setGeom(g);
        console.log(`[masers] loaded ${n} Reid+ 2019 maser arm anchors`);
      })
      .catch((e) => console.error("maser load failed", e));
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!geom) return null;
  const uniforms = {
    uPixelRatio: {
      value: typeof window !== "undefined" ? window.devicePixelRatio : 1,
    },
  };

  return (
    <points geometry={geom} frustumCulled={false}>
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
