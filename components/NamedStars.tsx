"use client";

import { Html } from "@react-three/drei";

import { NAMED_STARS } from "@/lib/namedStars";

type Props = {
  visible?: boolean;
};

export default function NamedStars({ visible = true }: Props) {
  if (!visible) return null;
  return (
    <group>
      {NAMED_STARS.map((s) => (
        <Html
          key={s.name}
          position={[s.pos.x, s.pos.y, s.pos.z]}
          center
          distanceFactor={6}
          zIndexRange={[40, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap font-mono text-[9px] tracking-[0.18em] text-white/70">
            <div className="ml-1 inline-block h-px w-3 align-middle bg-white/40" />
            <span className="ml-1">{s.name}</span>
          </div>
        </Html>
      ))}
    </group>
  );
}
