"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import StarField from "@/components/StarField";
import NamedStars from "@/components/NamedStars";
import CameraController, {
  type CameraHandle,
  type ViewPreset,
} from "@/components/CameraController";
import ViewToggle from "@/components/hud/ViewToggle";
import ScaleBar from "@/components/hud/ScaleBar";
import InfoChip from "@/components/hud/InfoChip";
import LabelsToggle from "@/components/hud/LabelsToggle";

export default function Galaxy() {
  const cameraRef = useRef<CameraHandle | null>(null);
  const [preset, setPreset] = useState<ViewPreset>("edge");
  const [labelsVisible, setLabelsVisible] = useState(false);

  // Animation clock (kept around for any future motion uniforms).
  const timeRef = useRef(0);
  useEffect(() => {
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
  }, []);

  const onChangeView = useCallback((p: ViewPreset) => {
    setPreset(p);
    cameraRef.current?.setPreset(p);
  }, []);

  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 35], fov: 50, near: 0.1, far: 5000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          <StarField />
        </Suspense>
        <NamedStars visible={labelsVisible} />
        <CameraController controlsRef={cameraRef} />
        <EffectComposer>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.62}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <ViewToggle current={preset} onChange={onChangeView} />
      <LabelsToggle
        visible={labelsVisible}
        onToggle={() => setLabelsVisible((v) => !v)}
      />
      <ScaleBar />
      <InfoChip starCount={611_057} />
    </div>
  );
}
