// Cepheid fragment shader — a soft saturated dot with a wider halo
// than the field stars, so they read as a separate tracer layer
// rather than getting lost in the cluster glow.

const source = `
precision highp float;
varying vec3 vColor;

void main() {
  vec2 q = gl_PointCoord - vec2(0.5);
  float r = length(q) * 2.0;
  if (r > 1.0) discard;
  float core = exp(-7.0 * r * r);
  float halo = exp(-1.0 * r * r) * 0.35;
  vec3 col = vColor * (core + halo);
  col += vec3(1.0, 0.97, 0.9) * pow(core, 8.0) * 0.6;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default source;
