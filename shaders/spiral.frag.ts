// Procedural Milky Way artist's-impression backdrop.
//
// Four logarithmic spiral arms (pitch ~12 deg) modulated by a
// domain-warped fbm dust pattern, falling off radially with a soft
// disk envelope. Color grades from warm yellow at the core through
// blue-tinted outer arms. Total intensity is bloom-friendly (sub-1
// across most of the disk so individual stars still dominate).

const source = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uRotation;       // radians, rotates the spiral pattern
uniform float uDiskRadiusKpc;  // outer fall-off in plot units (kpc)

// -- hash + simplex 2D noise (Ashima / Gustavson) --
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                 + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                          dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 g;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  float f = 1.0;
  for (int i = 0; i < 5; i++) {
    s += a * snoise(p * f);
    f *= 2.05;
    a *= 0.52;
  }
  return s;
}

float warpedFbm(vec2 p) {
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0)), fbm(p + vec2(5.2, 1.3)));
  return fbm(p + 1.7 * q);
}

void main() {
  // vUv in [0, 1] across the disc; remap to plot-space kpc.
  vec2 p = (vUv - 0.5) * 2.0 * uDiskRadiusKpc;
  float r = length(p);
  float theta = atan(p.y, p.x) + uRotation;

  // Disk envelope: bright core, exponential fall-off, soft inner hole.
  float inner = smoothstep(0.4, 1.5, r);
  float outer = exp(-r / (uDiskRadiusKpc * 0.30));
  float disk  = inner * outer;

  // Four logarithmic spiral arms. Arm density highest along the
  // centerline phase = m * theta - alpha * ln(r).
  const float m = 4.0;
  const float alpha = 4.6;     // pitch ~12 deg
  float phase = m * theta - alpha * log(max(r, 0.1));
  float armRaw = cos(phase) * 0.5 + 0.5;
  float arm = pow(armRaw, 6.0);     // tightens the arms

  // Dust / cloud detail via domain-warped fbm.
  float dust = 0.5 + 0.5 * warpedFbm(p * 0.18);
  dust = pow(dust, 1.4);
  float clouds = mix(0.35, 1.0, dust);

  // Combine: arms multiplied by clouds, scaled by the disk envelope.
  float intensity = disk * (0.25 + 0.85 * arm) * clouds;

  // Color gradient: warm yellow core -> orange mid -> dim blue outer.
  vec3 cCore   = vec3(1.00, 0.78, 0.42);
  vec3 cMid    = vec3(0.95, 0.52, 0.28);
  vec3 cArm    = vec3(0.55, 0.45, 0.85);
  vec3 cOuter  = vec3(0.15, 0.18, 0.40);
  float rN = clamp(r / uDiskRadiusKpc, 0.0, 1.0);
  vec3 base = mix(cCore, cMid, smoothstep(0.0, 0.25, rN));
  base      = mix(base, cArm, smoothstep(0.25, 0.7, rN));
  base      = mix(base, cOuter, smoothstep(0.7, 1.0, rN));

  // Subtle dust-lane darkening: the bright arms have a darker companion
  // just inside on the trailing edge — fake it with a phase-shifted band.
  float dustLane = pow(cos(phase + 0.45) * 0.5 + 0.5, 12.0);
  intensity *= (1.0 - 0.45 * dustLane * disk);

  // Soft cutoff so the disc fades to true black before its mesh edge.
  intensity *= smoothstep(0.0, 0.1, intensity);

  gl_FragColor = vec4(base * intensity, intensity);
}
`;

export default source;
