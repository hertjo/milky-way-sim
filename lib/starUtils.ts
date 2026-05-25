// BP-RP (Gaia color index) -> effective temperature -> RGB.
//
// Gaia DR3 reports per-star color as `bp_rp = phot_bp_mean_mag -
// phot_rp_mean_mag`. Typical range for main-sequence + giants:
//
//   bp_rp ~ -0.5   ->  T_eff ~ 30000 K   (hot blue O/B stars)
//   bp_rp ~  0.0   ->  T_eff ~ 10000 K   (white A stars)
//   bp_rp ~  0.7   ->  T_eff ~  5800 K   (Sun, yellow G)
//   bp_rp ~  1.5   ->  T_eff ~  3700 K   (orange K)
//   bp_rp ~  3.0   ->  T_eff ~  2800 K   (red dwarfs / M giants)
//
// We approximate T_eff(bp_rp) with the Mamajek tabulated relation as a
// monotone piecewise-linear fit, then map T_eff to an sRGB triple using
// Tanner Helland's blackbody approximation (a widely-used cubic fit).

export type RGB = [number, number, number];

// Mamajek-style BP-RP -> T_eff anchors (kelvin).
const COLOR_TEMP_TABLE: Array<[bpRp: number, tEff: number]> = [
  [-0.40, 30000],
  [-0.30, 16000],
  [-0.15, 10500],
  [ 0.00,  9800],
  [ 0.25,  7800],
  [ 0.50,  6500],
  [ 0.70,  5800],
  [ 1.00,  5100],
  [ 1.40,  4300],
  [ 1.80,  3800],
  [ 2.50,  3200],
  [ 3.50,  2700],
  [ 5.00,  2300],
];

export function bpRpToTeff(bpRp: number): number {
  if (bpRp <= COLOR_TEMP_TABLE[0][0]) return COLOR_TEMP_TABLE[0][1];
  const last = COLOR_TEMP_TABLE[COLOR_TEMP_TABLE.length - 1];
  if (bpRp >= last[0]) return last[1];
  for (let i = 1; i < COLOR_TEMP_TABLE.length; i++) {
    const [c1, t1] = COLOR_TEMP_TABLE[i];
    if (bpRp <= c1) {
      const [c0, t0] = COLOR_TEMP_TABLE[i - 1];
      const k = (bpRp - c0) / (c1 - c0);
      return t0 + (t1 - t0) * k;
    }
  }
  return last[1];
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// Tanner Helland blackbody approximation, normalized to 0..1 per channel.
// http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
export function tempToRgb(tempK: number): RGB {
  const t = tempK / 100;
  let r: number, g: number, b: number;
  // Red
  if (t <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
  }
  // Green
  if (t <= 66) {
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }
  // Blue
  if (t >= 66) {
    b = 255;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  }
  return [clamp01(r / 255), clamp01(g / 255), clamp01(b / 255)];
}

export function bpRpToRgb(bpRp: number): RGB {
  return tempToRgb(bpRpToTeff(bpRp));
}

// Map a star's apparent G-band magnitude to a relative brightness factor
// in [0, 1]. Brighter (lower magnitude) -> larger value. We use a simple
// 5-magnitude exponential: each 5 mag dimmer halves the brightness, then
// a 2.5x exponent so that the visually faintest star in our cut is dim
// but still visible.
export function magToBrightness(
  gMag: number,
  brightestMag = 0,
  faintestMag = 12,
): number {
  const k = (faintestMag - gMag) / (faintestMag - brightestMag);
  return clamp01(Math.pow(clamp01(k), 1.8));
}
