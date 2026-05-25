"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import StarField from "@/components/StarField";
import SpiralDisc from "@/components/SpiralDisc";
import GalacticCore from "@/components/GalacticCore";
import CameraController, {
  type CameraHandle,
  type ViewPreset,
} from "@/components/CameraController";
import ViewToggle from "@/components/hud/ViewToggle";
import ScaleBar from "@/components/hud/ScaleBar";
import InfoChip from "@/components/hud/InfoChip";
import PlayToggle from "@/components/hud/PlayToggle";

export default function Galaxy() {
  const cameraRef = useRef<CameraHandle | null>(null);
  const [preset, setPreset] = useState<ViewPreset>("top");
  const [playing, setPlaying] = useState(true);

  // Shared time clock for the rotation, in seconds. Lives in a ref so
  // pausing doesn't reconcile the tree and per-frame consumers can
  // read the current value via useFrame.
  const timeRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      timeRef.current += dt;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const onChangeView = useCallback((p: ViewPreset) => {
    setPreset(p);
    cameraRef.current?.setPreset(p);
  }, []);

  const onTogglePlay = useCallback(() => setPlaying((p) => !p), []);

  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 22], fov: 50, near: 0.1, far: 5000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#000000"]} />
        <SpiralDisc timeRef={timeRef} />
        <GalacticCore />
        <Suspense fallback={null}>
          <StarField />
        </Suspense>
        <CameraController controlsRef={cameraRef} />
        <EffectComposer>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <ViewToggle current={preset} onChange={onChangeView} />
      <PlayToggle playing={playing} onToggle={onTogglePlay} />
      <ScaleBar />
      <InfoChip starCount={250_000} />
    </div>
  );
}
