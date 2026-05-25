// Equatorial (RA, Dec, parallax) → galactocentric (x, y, z) in kpc.
//
// The transform is the standard chain used in Milky Way visualizations:
//
//   1. spherical equatorial (RA/Dec, distance) → cartesian equatorial (ICRS)
//   2. rotate by the equatorial→galactic matrix (Reid & Brunthaler 2004,
//      ESA Hipparcos definition) to get heliocentric galactic cartesian
//   3. translate by the Sun's offset to put the origin at the galactic
//      center, with +x pointing from the GC toward the Sun, +z toward
//      the north galactic pole.
//
// Distance is derived from parallax in milliarcseconds:
//
//   d_kpc = 1 / parallax_mas
//
// Stars with non-positive parallax are dropped upstream; here we assume
// parallax_mas > 0.

// Sun's distance from the galactic center, kpc (GRAVITY Coll. 2019).
export const R_SUN = 8.122;
// Sun's height above the galactic mid-plane, kpc.
export const Z_SUN = 0.0208;

const DEG2RAD = Math.PI / 180;

// Equatorial (ICRS) → galactic rotation matrix, as 9 floats in row-major
// order. Standard ESA Hipparcos / Reid & Brunthaler convention.
//
//   x_gal       (-0.0548755604 -0.8734370902 -0.4838350155) x_eq
//   y_gal   =   ( 0.4941094279 -0.4448296300  0.7469822445) y_eq
//   z_gal       (-0.8676661490 -0.1980763734  0.4559837762) z_eq
const M_EQ_TO_GAL = [
  -0.0548755604, -0.8734370902, -0.4838350155,
   0.4941094279, -0.4448296300,  0.7469822445,
  -0.8676661490, -0.1980763734,  0.4559837762,
] as const;

export type Equatorial = {
  raDeg: number;
  decDeg: number;
  parallaxMas: number;
};

export type Galactocentric = {
  x: number;
  y: number;
  z: number;
};

/** Convert an equatorial spherical position to heliocentric cartesian (kpc). */
function equatorialCartesian(eq: Equatorial): [number, number, number] {
  const d = 1 / eq.parallaxMas; // kpc
  const ra = eq.raDeg * DEG2RAD;
  const dec = eq.decDeg * DEG2RAD;
  const cd = Math.cos(dec);
  return [d * cd * Math.cos(ra), d * cd * Math.sin(ra), d * Math.sin(dec)];
}

/** Rotate equatorial cartesian to heliocentric galactic cartesian. */
function rotateToGalactic(
  v: [number, number, number],
): [number, number, number] {
  const m = M_EQ_TO_GAL;
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/** Translate heliocentric → galactocentric. */
function helioToGalactocentric(
  v: [number, number, number],
): Galactocentric {
  // Sun sits at (x = -R_SUN, y = 0, z = +Z_SUN) in the galactocentric frame
  // (with +x pointing GC→Sun convention). Equivalently a star at galactic
  // (X, Y, Z) heliocentric ends up at (X - R_SUN, Y, Z + Z_SUN)
  // galactocentric — note the sign convention places +x toward the Sun.
  return { x: v[0] - R_SUN, y: v[1], z: v[2] + Z_SUN };
}

/** Full pipeline: equatorial spherical → galactocentric cartesian (kpc). */
export function equatorialToGalactocentric(eq: Equatorial): Galactocentric {
  return helioToGalactocentric(rotateToGalactic(equatorialCartesian(eq)));
}

/** The Sun's position in galactocentric kpc. Handy as a camera target. */
export const SUN: Galactocentric = { x: -R_SUN, y: 0, z: Z_SUN };
