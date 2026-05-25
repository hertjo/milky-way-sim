// Fragment shader: render each Points sprite as a soft circular glow.
// gl_PointCoord goes 0..1 across the sprite; we compute radial distance
// from center, then apply a smooth falloff and a faint surrounding
// halo that brighter stars get more of.

const source = `
precision highp float;
varying vec3 vColor;
varying float vIntensity;

void main() {
  vec2 q = gl_PointCoord - vec2(0.5);
  float r = length(q) * 2.0;
  if (r > 1.0) discard;

  // Core: tight Gaussian-ish disk.
  float core = exp(-5.0 * r * r);
  // Halo: wider, dimmer falloff; brighter stars get more.
  float halo = exp(-1.5 * r * r) * (0.15 + 0.55 * vIntensity);

  vec3 col = vColor * (core + halo);
  // Add a tiny additive white-hot spike to the very center so the
  // brightest stars feel like points of light, not just colored dots.
  col += vec3(1.0) * pow(core, 6.0) * vIntensity;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default source;
