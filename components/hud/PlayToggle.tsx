"use client";

import { Pause, Play } from "lucide-react";

type Props = {
  playing: boolean;
  onToggle: () => void;
};

export default function PlayToggle({ playing, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/8 px-3 py-1 text-[11px] tracking-wide text-white/85 backdrop-blur-sm transition hover:bg-white/15"
      title={playing ? "Pause rotation" : "Play rotation"}
    >
      {playing ? <Pause size={12} /> : <Play size={12} />}
      <span>rotation</span>
    </button>
  );
}
