"use client";

// Reference distances in the galactic disk:
//   1 kpc  ~  3261 light-years   ~  0.124 R_galactic-disk-radius
//
// Drawn as a fixed-width chip in the bottom-left. The actual on-screen
// scale changes with the orbit zoom, so this is a *reference* legend
// rather than a calibrated ruler — labelled clearly as such.

export default function ScaleBar() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-end gap-2 font-mono text-[10px] tracking-wide text-white/55">
      <div className="flex flex-col items-start gap-1">
        <span className="uppercase tracking-[0.18em]">scale ref</span>
        <div className="flex items-center gap-2">
          <div className="h-px w-16 bg-white/55" />
          <span className="text-white/85">~5 kpc</span>
        </div>
      </div>
    </div>
  );
}
