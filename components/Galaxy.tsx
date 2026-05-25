"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import StarField from "@/components/StarField";
import CameraController, {
  type CameraHandle,
  type ViewPreset,
} from "@/components/CameraController";
import ViewToggle from "@/components/hud/ViewToggle";

export default function Galaxy() {
  const cameraRef = useRef<CameraHandle | null>(null);
  const [preset, setPreset] = useState<ViewPreset>("top");

  const onChangeView = useCallback((p: ViewPreset) => {
    setPreset(p);
    cameraRef.current?.setPreset(p);
  }, []);

  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 22], fov: 50, near: 0.1, far: 5000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          <StarField />
        </Suspense>
        <CameraController controlsRef={cameraRef} />
      </Canvas>

      <ViewToggle current={preset} onChange={onChangeView} />
    </div>
  );
}
