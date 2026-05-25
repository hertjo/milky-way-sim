// Record a short demo of the running dev server, then encode as an
// optimized GIF for the README.
//
// Cycles through the view presets so the GIF shows all three
// viewpoints + a labels-on/off flicker.
//
// Usage: node scripts/capture-gif.mjs [--out path] [--duration s] [--fps n]
//
// Requires: ffmpeg on PATH, playwright-core, dev server running on :3020.

import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce((acc, cur, i, arr) => {
      if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
      return acc;
    }, []),
);
const OUT = args.out ?? "public/milkyway/demo.gif";
const DURATION_S = parseFloat(args.duration ?? "10");
const FPS = parseInt(args.fps ?? "12", 10);
const N_FRAMES = Math.round(DURATION_S * FPS);
const WIDTH = 640;
const HEIGHT = 360;

// Timeline of "actions" at given t (seconds).
const SCRIPT = [
  { at: 0.0, do: "top" },
  { at: 3.0, do: "sun" },
  { at: 6.0, do: "edge" },
  { at: 9.0, do: "top" },
];

function clickPreset(label) {
  return async (page) => {
    await page.evaluate((label) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const target = buttons.find((b) => b.textContent?.trim() === label);
      if (target) (target).click();
    }, label);
  };
}

const ACTIONS = SCRIPT.map((s) => ({
  at: s.at,
  fn: clickPreset(
    s.do === "top" ? "Top-down" : s.do === "edge" ? "Edge-on" : "Sun",
  ),
}));

const tmpDir = fs.mkdtempSync("/tmp/mw-gif-");
console.log(`Capturing ${N_FRAMES} frames @ ${FPS} fps into ${tmpDir}`);

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
const page = await ctx.newPage();
await page.goto("http://localhost:3020/", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(2500);

const start = Date.now();
let nextAction = 0;
for (let i = 0; i < N_FRAMES; i++) {
  const tFrame = i / FPS;
  while (nextAction < ACTIONS.length && tFrame >= ACTIONS[nextAction].at) {
    await ACTIONS[nextAction].fn(page);
    nextAction++;
  }
  const target = start + tFrame * 1000;
  const wait = target - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const file = path.join(tmpDir, `f_${String(i).padStart(4, "0")}.png`);
  await page.screenshot({ path: file });
}
console.log(`Captured ${N_FRAMES} frames`);
await browser.close();

const palette = path.join(tmpDir, "palette.png");
console.log("Generating palette…");
execSync(
  `ffmpeg -y -framerate ${FPS} -i ${tmpDir}/f_%04d.png ` +
    `-vf "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos,palettegen=max_colors=64" ${palette}`,
  { stdio: "inherit" },
);
console.log("Encoding GIF…");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
execSync(
  `ffmpeg -y -framerate ${FPS} -i ${tmpDir}/f_%04d.png -i ${palette} ` +
    `-lavfi "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=4" ` +
    `-loop 0 ${OUT}`,
  { stdio: "inherit" },
);
const size = fs.statSync(OUT).size;
console.log(`Wrote ${OUT} — ${(size / 1024 / 1024).toFixed(2)} MB`);

fs.rmSync(tmpDir, { recursive: true, force: true });
