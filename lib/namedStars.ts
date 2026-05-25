// A small hand-picked set of famous bright/iconic stars in the night
// sky. Coordinates are ICRS (RA, Dec in degrees) and parallax in mas
// from SIMBAD / Hipparcos — they go through the same equatorial ->
// galactocentric pipeline as the Gaia stars so the labels land on the
// right point in our 3D space.

import { equatorialToGalactocentric, type Galactocentric } from "@/lib/galacticCoords";

export type NamedStar = {
  name: string;
  ra: number;        // degrees
  dec: number;       // degrees
  parallaxMas: number;
  pos: Galactocentric;
};

type Raw = Omit<NamedStar, "pos">;

const STARS: Raw[] = [
  { name: "Sirius",      ra: 101.2871, dec: -16.7161, parallaxMas: 379.21 },
  { name: "Canopus",     ra: 95.9879,  dec: -52.6957, parallaxMas:  10.55 },
  { name: "Arcturus",    ra: 213.9154, dec:  19.1825, parallaxMas:  88.83 },
  { name: "Vega",        ra: 279.2347, dec:  38.7837, parallaxMas: 130.23 },
  { name: "Capella",     ra: 79.1723,  dec:  45.9981, parallaxMas:  76.20 },
  { name: "Rigel",       ra: 78.6345,  dec:  -8.2017, parallaxMas:   3.78 },
  { name: "Procyon",     ra: 114.8255, dec:   5.2250, parallaxMas: 284.56 },
  { name: "Betelgeuse",  ra: 88.7929,  dec:   7.4071, parallaxMas:   5.95 },
  { name: "Altair",      ra: 297.6958, dec:   8.8683, parallaxMas: 194.45 },
  { name: "Aldebaran",   ra: 68.9802,  dec:  16.5093, parallaxMas:  48.94 },
  { name: "Antares",     ra: 247.3519, dec: -26.4320, parallaxMas:   5.89 },
  { name: "Spica",       ra: 201.2983, dec: -11.1614, parallaxMas:  13.06 },
  { name: "Pollux",      ra: 116.3289, dec:  28.0262, parallaxMas:  96.54 },
  { name: "Fomalhaut",   ra: 344.4127, dec: -29.6222, parallaxMas: 130.08 },
  { name: "Deneb",       ra: 310.3580, dec:  45.2803, parallaxMas:   2.31 },
  { name: "Polaris",     ra: 37.9546,  dec:  89.2641, parallaxMas:   7.54 },
  { name: "Mirfak",      ra: 51.0807,  dec:  49.8612, parallaxMas:   6.44 },
  { name: "Bellatrix",   ra: 81.2828,  dec:   6.3497, parallaxMas:  12.92 },
  { name: "Alnilam",     ra: 84.0534,  dec:  -1.2019, parallaxMas:   2.43 },
  { name: "Achernar",    ra: 24.4285,  dec: -57.2367, parallaxMas:  23.39 },
];

export const NAMED_STARS: NamedStar[] = STARS.map((s) => ({
  ...s,
  pos: equatorialToGalactocentric({
    raDeg: s.ra,
    decDeg: s.dec,
    parallaxMas: s.parallaxMas,
  }),
}));
