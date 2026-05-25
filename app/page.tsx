export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">
          Milky Way
          <div className="mt-1 text-[9px] tracking-[0.2em] text-white/20">
            scaffolding
          </div>
        </div>
      </div>
    </main>
  );
}
