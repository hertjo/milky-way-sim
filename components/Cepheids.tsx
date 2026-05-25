"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import vertShader from "@/shaders/cepheids.vert";
import fragShader from "@/shaders/cepheids.frag";

// Record format mirrors scripts/fetch-cepheids.py:
//   x, y, z, period_days, g_mag, r, g, b   (8 × float32 = 32 bytes)
const RECORD_FLOATS = 8;

type Props = {
  url?: string;
};

export default function Cepheids({
  url = "/milkyway/cepheids.bin",
}: Props) {
  const [geom, setGeom] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (cancelled) return;
        const records = new Float32Array(buf);
        const n = records.length / RECORD_FLOATS;
        const positions = new Float32Array(n * 3);
        const colors = new Float32Array(n * 3);
        const mags = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const o = i * RECORD_FLOATS;
          positions[i * 3 + 0] = records[o + 0];
          positions[i * 3 + 1] = records[o + 1];
          positions[i * 3 + 2] = records[o + 2];
          mags[i] = records[o + 4];
          colors[i * 3 + 0] = records[o + 5];
          colors[i * 3 + 1] = records[o + 6];
          colors[i * 3 + 2] = records[o + 7];
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
        g.setAttribute("aMag", new THREE.BufferAttribute(mags, 1));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 60);
        setGeom(g);
        console.log(`[cepheids] loaded ${n.toLocaleString()} Cepheids`);
      })
      .catch((e) => console.error("cepheid load failed", e));
    return () => {
      cancelled = true;
    };
  }, [url]);

  const uniforms = useMemo(
    () => ({
      uPixelRatio: {
        value: typeof window !== "undefined" ? window.devicePixelRatio : 1,
      },
    }),
    [],
  );

  if (!geom) return null;
  return (
    <points geometry={geom} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
