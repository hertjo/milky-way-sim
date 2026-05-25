"use client";

type Props = {
  starCount: number;
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

export default function InfoChip({ starCount }: Props) {
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-10 select-none text-right font-mono text-[10px] tracking-wide">
      <div className="uppercase tracking-[0.18em] text-white/45">
        Milky Way
      </div>
      <div className="mt-0.5 text-white/85">
        {formatCount(starCount)} Gaia DR3 stars
      </div>
      <div className="mt-0.5 text-white/45">
        + procedural disc &amp; core
      </div>
    </div>
  );
}
