"use client";

import { Eye, EyeOff } from "lucide-react";

type Props = {
  visible: boolean;
  onToggle: () => void;
};

export default function LabelsToggle({ visible, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="pointer-events-auto absolute right-3 top-12 z-10 flex items-center gap-1 rounded-full bg-white/8 px-3 py-1 text-[11px] tracking-wide text-white/85 backdrop-blur-sm transition hover:bg-white/15"
      title={visible ? "Hide star labels" : "Show star labels"}
    >
      {visible ? <Eye size={12} /> : <EyeOff size={12} />}
      <span>labels</span>
    </button>
  );
}
