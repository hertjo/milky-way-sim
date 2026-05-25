// Vertex shader: per-star position + color + size attributes.
// gl_PointSize is computed from the per-star magnitude (brighter stars
// get larger sprites) plus a distance fall-off so far stars don't
// shrink to invisibility under perspective.

const source = `
attribute vec3 aColor;
attribute float aMag;
uniform float uPixelRatio;
uniform float uBrightnessGamma;
uniform float uSizeScale;
varying vec3 vColor;
varying float vIntensity;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);

  // Map magnitude -> [0..1] brightness (brighter = larger value).
  // Cut is roughly G in [2, 9], with the brightest stars saturating.
  float b = clamp((9.0 - aMag) / 7.0, 0.0, 1.0);
  b = pow(b, uBrightnessGamma);

  // Perspective-correct point size: keep apparent angular size roughly
  // proportional to brightness, with a floor so far stars are still
  // visible.
  float baseSize = mix(1.4, 12.0, b) * uSizeScale * uPixelRatio;
  gl_PointSize = baseSize * (200.0 / -mv.z);

  vColor = aColor;
  vIntensity = b;
  gl_Position = projectionMatrix * mv;
}
`;

export default source;
