#!/usr/bin/env python3
"""
Convert the Gaia CSV (ra, dec, parallax, phot_g_mean_mag, bp_rp) into
a packed Float32Array binary that the browser can stream straight into
a vertex buffer.

Per-star record (8 floats, 32 bytes):

    x, y, z       galactocentric position in kpc
    bp_rp         color index
    g_mag         G-band apparent magnitude
    r, g, b       sRGB color (0..1) derived from blackbody fit on bp_rp

We bake (r, g, b) into the binary so the shader doesn't need to
recompute the blackbody approximation per-star.

Also emits a sibling manifest.json with byte count, star count,
bounding box, etc.

Usage:
    python3 scripts/stars-to-binary.py --in /tmp/gaia.csv --out public/milkyway

Pure stdlib.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import struct
import sys
from pathlib import Path

# -----------------------------------------------------------------------------
# Mirrors lib/galacticCoords.ts
# -----------------------------------------------------------------------------
R_SUN = 8.122
Z_SUN = 0.0208
DEG2RAD = math.pi / 180.0

M_EQ_TO_GAL = (
    -0.0548755604, -0.8734370902, -0.4838350155,
     0.4941094279, -0.4448296300,  0.7469822445,
    -0.8676661490, -0.1980763734,  0.4559837762,
)


def equatorial_to_galactocentric(ra_deg: float, dec_deg: float,
                                 parallax_mas: float):
    d = 1.0 / parallax_mas
    ra = ra_deg * DEG2RAD
    dec = dec_deg * DEG2RAD
    cd = math.cos(dec)
    xeq = d * cd * math.cos(ra)
    yeq = d * cd * math.sin(ra)
    zeq = d * math.sin(dec)
    m = M_EQ_TO_GAL
    xg = m[0] * xeq + m[1] * yeq + m[2] * zeq
    yg = m[3] * xeq + m[4] * yeq + m[5] * zeq
    zg = m[6] * xeq + m[7] * yeq + m[8] * zeq
    return xg - R_SUN, yg, zg + Z_SUN


# -----------------------------------------------------------------------------
# Mirrors lib/starUtils.ts
# -----------------------------------------------------------------------------
COLOR_TEMP_TABLE = [
    (-0.40, 30000), (-0.30, 16000), (-0.15, 10500),
    ( 0.00,  9800), ( 0.25,  7800), ( 0.50,  6500),
    ( 0.70,  5800), ( 1.00,  5100), ( 1.40,  4300),
    ( 1.80,  3800), ( 2.50,  3200), ( 3.50,  2700),
    ( 5.00,  2300),
]


def bp_rp_to_teff(bp_rp: float) -> float:
    if bp_rp <= COLOR_TEMP_TABLE[0][0]:
        return COLOR_TEMP_TABLE[0][1]
    if bp_rp >= COLOR_TEMP_TABLE[-1][0]:
        return COLOR_TEMP_TABLE[-1][1]
    for i in range(1, len(COLOR_TEMP_TABLE)):
        c1, t1 = COLOR_TEMP_TABLE[i]
        if bp_rp <= c1:
            c0, t0 = COLOR_TEMP_TABLE[i - 1]
            k = (bp_rp - c0) / (c1 - c0)
            return t0 + (t1 - t0) * k
    return COLOR_TEMP_TABLE[-1][1]


def temp_to_rgb(temp_k: float):
    t = temp_k / 100.0
    if t <= 66:
        r = 255.0
    else:
        r = 329.698727446 * ((t - 60) ** -0.1332047592)
    if t <= 66:
        g = 99.4708025861 * math.log(t) - 161.1195681661
    else:
        g = 288.1221695283 * ((t - 60) ** -0.0755148492)
    if t >= 66:
        b = 255.0
    elif t <= 19:
        b = 0.0
    else:
        b = 138.5177312231 * math.log(t - 10) - 305.0447927307
    return (
        max(0.0, min(1.0, r / 255.0)),
        max(0.0, min(1.0, g / 255.0)),
        max(0.0, min(1.0, b / 255.0)),
    )


# -----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="src", type=Path, required=True)
    ap.add_argument("--out", dest="out_dir", type=Path, required=True)
    args = ap.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)
    bin_path = args.out_dir / "stars.bin"
    manifest_path = args.out_dir / "manifest.json"

    fmt = "<8f"  # little-endian: x, y, z, bp_rp, g_mag, r, g, b
    record_size = struct.calcsize(fmt)
    assert record_size == 32

    xs: list[float] = []
    ys: list[float] = []
    zs: list[float] = []
    g_mags: list[float] = []

    n_in = 0
    n_out = 0
    with open(args.src, newline="") as f_csv, open(bin_path, "wb") as f_bin:
        reader = csv.DictReader(f_csv)
        for row in reader:
            n_in += 1
            try:
                ra = float(row["ra"])
                dec = float(row["dec"])
                plx = float(row["parallax"])
                g_mag = float(row["phot_g_mean_mag"])
                bp_rp = float(row["bp_rp"])
            except (TypeError, ValueError):
                continue
            if plx <= 0:
                continue
            x, y, z = equatorial_to_galactocentric(ra, dec, plx)
            rgb = temp_to_rgb(bp_rp_to_teff(bp_rp))
            f_bin.write(struct.pack(fmt, x, y, z, bp_rp, g_mag, *rgb))
            xs.append(x); ys.append(y); zs.append(z)
            g_mags.append(g_mag)
            n_out += 1
            if n_out % 10000 == 0:
                print(f"  ...{n_out:,}", end="\r", file=sys.stderr)

    print(f"\nwrote {bin_path}  ({bin_path.stat().st_size / 1024 / 1024:.2f} MB,"
          f" {n_out:,} stars)", file=sys.stderr)
    print(f"  dropped {n_in - n_out:,} rows with missing / invalid fields",
          file=sys.stderr)

    manifest = {
        "count": n_out,
        "record_size_bytes": record_size,
        "record_format": "x:f32 y:f32 z:f32 bp_rp:f32 g_mag:f32 r:f32 g:f32 b:f32",
        "units": "kpc, galactocentric",
        "source": "Gaia DR3 (gaiadr3.gaia_source), CC-BY-SA / ESA",
        "bounds_kpc": {
            "x": [min(xs), max(xs)],
            "y": [min(ys), max(ys)],
            "z": [min(zs), max(zs)],
        },
        "g_mag": {
            "min": min(g_mags),
            "max": max(g_mags),
        },
    }
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"wrote {manifest_path}", file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
