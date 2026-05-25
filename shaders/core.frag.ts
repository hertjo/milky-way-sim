// Galactic core: bright warm fireball sitting on top of the spiral
// backdrop. Two stacked gaussians (tight inner core + broader bulge
// halo) plus a tiny black-center punch to leave room for the Sgr A*
// marker mesh.

const source = `
precision highp float;
varying vec2 vUv;
uniform float uRadiusKpc;

vec3 cInner = vec3(1.00, 0.95, 0.78);
vec3 cWarm  = vec3(1.00, 0.65, 0.30);
vec3 cBulge = vec3(0.70, 0.30, 0.18);

void main() {
  vec2 p = (vUv - 0.5) * 2.0 * uRadiusKpc;
  float r = length(p);

  // Two-component gaussian profile.
  float core  = exp(-pow(r / 0.20, 2.0));
  float bulge = exp(-pow(r / 1.20, 2.0));
  float i = clamp(core * 1.4 + bulge * 0.55, 0.0, 2.5);

  // Color: shifts from cool yellow-white at the core to a warm
  // orange-brown for the bulge halo.
  vec3 col = mix(cBulge, cWarm, smoothstep(0.0, 0.5, i));
  col = mix(col, cInner, smoothstep(0.7, 1.4, i));

  // Tiny hole at the very center for the Sgr A* marker that sits on
  // top — without this the BH marker would be drowned in the glow.
  float hole = smoothstep(0.04, 0.0, r);
  i *= 1.0 - hole;

  gl_FragColor = vec4(col * i, i);
}
`;

export default source;
