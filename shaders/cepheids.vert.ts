// Cepheid billboard vertex shader. Same per-vertex attributes as the
// field-star shader but with constant-ish on-screen size: Cepheids
// are tracers, we want them legible from any zoom.

const source = `
attribute vec3 aColor;
attribute float aMag;
uniform float uPixelRatio;
varying vec3 vColor;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // Cepheids are intrinsically luminous; keep them visibly bigger
  // than the field stars and shrink only mildly with distance.
  float baseSize = 4.0 * uPixelRatio;
  gl_PointSize = baseSize * clamp(60.0 / -mv.z, 0.6, 4.0);
  vColor = aColor;
  gl_Position = projectionMatrix * mv;
}
`;

export default source;
