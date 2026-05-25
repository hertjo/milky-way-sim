"use client";

import { type ViewPreset } from "@/components/CameraController";

type Props = {
  current: ViewPreset;
  onChange: (p: ViewPreset) => void;
};

const ITEMS: { id: ViewPreset; label: string; hint: string }[] = [
  { id: "top",  label: "Top-down", hint: "north galactic pole" },
  { id: "edge", label: "Edge-on",  hint: "looking along the disk plane" },
  { id: "sun",  label: "Sun",      hint: "local solar neighborhood" },
];

export default function ViewToggle({ current, onChange }: Props) {
  return (
    <div className="pointer-events-auto absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/8 p-1 backdrop-blur-sm">
      {ITEMS.map((it) => {
        const active = it.id === current;
        return (
          <button
            key={it.id}
            type="button"
            title={it.hint}
            onClick={() => onChange(it.id)}
            className={
              "rounded-full px-3 py-1 text-[11px] tracking-wide transition " +
              (active
                ? "bg-white text-black"
                : "text-white/85 hover:bg-white/15")
            }
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
