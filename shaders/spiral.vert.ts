// Pass-through vertex shader for the spiral-disc plane. UV runs 0..1
// across the geometry and is remapped to plot-space kpc inside the
// fragment shader.

const source = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export default source;
