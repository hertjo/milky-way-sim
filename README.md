# Milky Way

Interactive WebGL visualization of the **real** Milky Way disk and
spiral-arm structure, layered from three published astronomical
catalogs and rendered in the browser. No procedural galaxy art —
every star, every spiral-arm anchor on screen comes from a real
catalog.

![Demo](public/milkyway/demo.gif)

## The layers (back to front)

| Layer | Catalog | Count | What it traces |
|---|---|---|---|
| **Field stars** | Gaia DR3 `gaia_source` (G < 17.5, π/σ > 3) | ~611 k | The local stellar disk visible from Earth — every star with its real BP-RP color and apparent magnitude |
| **Cepheids** | Gaia DR3 `vari_cepheid` + Wesenheit P-L distances | 1,147 | Intrinsically luminous variable stars seen across the whole disk — the canonical spiral-arm tracer (Skowron+ 2019) |
| **Spiral arm anchors** | Reid+ 2019 (VizieR `J/ApJ/885/131/table1`) | 199 | VLBA-parallax masers in high-mass star-forming regions, color-coded by their published arm assignment |
| **Sgr A\*** | hard-coded at galactic origin | 1 | Galactic center marker (the supermassive black hole) |

Color key for the spiral-arm masers:

- Perseus → orange
- Scutum-Centaurus → gold
- Sagittarius-Carina → magenta
- Norma → cyan
- Outer → light blue
- Outer Scutum-Centaurus → purple
- Local arm → white
- 3-kpc Near/Far → pink
- Galactic Center → light cyan

## Interaction

- **Mouse drag / scroll / right-drag** — orbit / zoom / pan
- **Top-down ⇄ Edge-on ⇄ Sun** pill (top-left) tweens the camera over
  ~1.5 s with a smootherstep ease
- **labels** pill (top-right) toggles the 20 famous-named-star labels
  (Sirius, Vega, Betelgeuse, Polaris, Antares, …)

## Running

```bash
npm install
npm run dev
# open http://localhost:3000 (or PORT=3020 npm run dev to match the demo URL)
```

The browser fetches `stars.bin` (~19 MB LFS-tracked), `cepheids.bin`
(~36 KB) and `masers.json` (~16 KB) at startup; expect a half-second
loading hiccup on first visit while they parse into vertex buffers.

## Project layout

```
app/                          Next.js App Router root
components/
  Galaxy.tsx                  Composition root: Canvas + scene + HUD
  StarField.tsx               GPU Points: 611k Gaia field stars
  Cepheids.tsx                GPU Points: 1.1k Cepheid spiral tracers
  Masers.tsx                  GPU Points: 199 arm-colored Reid masers
  SgrAStar.tsx                Cyan-ring center marker + label
  NamedStars.tsx              drei <Html> labels for 20 famous stars
  CameraController.tsx        OrbitControls + preset fly-in tween
  hud/
    ViewToggle.tsx            Top-down / Edge-on / Sun pill
    LabelsToggle.tsx          Named-label show / hide
    ScaleBar.tsx              Bottom-left ~5 kpc reference legend
    InfoChip.tsx              Bottom-right star count + project tag
lib/
  galacticCoords.ts           Equatorial -> galactocentric kpc transform
  starUtils.ts                BP-RP -> T_eff -> RGB color helpers
  namedStars.ts               Hand-picked iconic stars (SIMBAD/Hipparcos)
shaders/
  stars.{vert,frag}.ts        Field-star sprite shader
  cepheids.{vert,frag}.ts     Cepheid sprite shader (bigger, fatter halo)
public/milkyway/
  stars.bin                   611k Gaia DR3 field stars (LFS)
  cepheids.bin                1.1k Gaia DR3 Cepheids
  masers.json                 199 Reid+ 2019 maser arm anchors
  manifest.json               Star count + bounds + record format
  demo.gif                    README hero
scripts/
  fetch-gaia.py               ADQL TAP query for the field stars
  fetch-cepheids.py           ADQL TAP query for Cepheids + P-L distances
  fetch-masers.py             VizieR REST query for Reid+ 2019 masers
  stars-to-binary.py          CSV -> Float32Array packing
  capture-gif.mjs             Records demo.gif via playwright + ffmpeg
```

## Data sources

All three layers are derived from public catalogs:

- **Gaia DR3 field stars and Cepheids** — ESA / Gaia, CC-BY-SA.
  `gaiadr3.gaia_source` and `gaiadr3.vari_cepheid` accessed via the
  [Gaia archive TAP server](https://gea.esac.esa.int/tap-server/tap).
- **Reid+ 2019 masers** — *"Trigonometric Parallaxes of High-Mass Star
  Forming Regions: Our View of the Milky Way"*, ApJ 885, 131. Accessed
  via VizieR catalog
  [J/ApJ/885/131](https://cdsarc.cds.unistra.fr/viz-bin/cat/J/ApJ/885/131).

If you reuse the bundled binaries, please cite the original papers.

## Regenerating the data

```bash
# Field stars (~2 min, ~19 MB binary):
python3 scripts/fetch-gaia.py    --out /tmp/gaia.csv --limit 3000000
python3 scripts/stars-to-binary.py --in /tmp/gaia.csv --out public/milkyway

# Cepheids (~30 s, 36 KB binary):
python3 scripts/fetch-cepheids.py --out public/milkyway/cepheids.bin

# Reid masers (~5 s, 16 KB JSON):
python3 scripts/fetch-masers.py --out public/milkyway/masers.json
```

## Regenerating the demo GIF

```bash
# requires ffmpeg + the dev server on :3020
node scripts/capture-gif.mjs --duration 9 --fps 10 \
     --out public/milkyway/demo.gif
```

## Why these specific catalogs

A naive "all of Gaia" point cloud is heavily biased toward stars
within ~kpc of the Sun (apparent-magnitude limit + galactic dust),
so it looks like a Sun-centered ball rather than a galaxy. The
Cepheid and maser layers are intrinsically luminous enough — and
distance-corrected by either Period-Luminosity or VLBA parallax —
to span the whole disk and reveal real spiral arms.

This is the same data-product stack that modern Milky Way structure
papers (Skowron+ 2019, Reid+ 2019, etc.) use to map the present-day
Galaxy.

## Performance

- Each layer is a single `THREE.Points` draw call with custom vert+frag
- Additive blending, no depth write — overlapping halos sum cleanly
- `frustumCulled: false` so the disk doesn't pop out at extreme zoom
- Camera preset transitions use a smootherstep lerp on
  position + OrbitControls.target so they read as smooth flights
  instead of teleports

## License

MIT for the code. The bundled astronomical catalogs under
`public/milkyway/` are derivatives of ESA Gaia (CC-BY-SA) and the
published Reid+ 2019 catalog — cite the sources above.
