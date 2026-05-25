#!/usr/bin/env python3
"""
Fetch Gaia DR3 classical Cepheids and compute distances via the
Wesenheit Period-Luminosity relation. Cepheids are intrinsically
luminous (~10^3 - 10^5 L_sun) and visible across the galactic disk,
so their distribution traces the spiral arms — this is the
dataset behind the famous Skowron et al. 2019 Science paper map.

Pipeline:

  1. JOIN gaiadr3.vari_cepheid (gives pf = fundamental period, type)
     with gaiadr3.gaia_source (gives RA/Dec/parallax/G/BP/RP).
  2. Filter to fundamental-mode classical Cepheids with valid period.
  3. For each: Wesenheit magnitude W = G - 1.91 (BP - RP) (largely
     extinction-free in Gaia photometry).
  4. P-L relation (Riess+ 2018-ish anchor):
        M_W = -3.32 log10(P_days) - 5.96
  5. Distance modulus mu = W - M_W,  d = 10^((mu + 5) / 5) pc.
  6. Galactic transform to galactocentric kpc (mirrors the standard
     pipeline used for the field-star binary).

Outputs:
    public/milkyway/cepheids.bin       — Float32Array, 8 floats/star:
        x, y, z, period_days, g_mag, r, g, b
    plus stats lines into stderr.

Pure stdlib + urllib (no astroquery / astropy dependency).
"""

from __future__ import annotations

import argparse
import csv
import math
import struct
import sys
import urllib.parse
import urllib.request
from io import StringIO
from pathlib import Path

TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"

QUERY = """
SELECT TOP 50000
    s.ra, s.dec, s.parallax,
    s.phot_g_mean_mag, s.bp_rp,
    c.pf
FROM gaiadr3.vari_cepheid AS c
JOIN gaiadr3.gaia_source AS s ON s.source_id = c.source_id
WHERE c.pf IS NOT NULL
  AND c.pf BETWEEN 1.0 AND 80.0
  AND s.bp_rp IS NOT NULL
  AND s.phot_g_mean_mag IS NOT NULL
""".strip()

# Mirrors lib/galacticCoords.ts.
R_SUN = 8.122
Z_SUN = 0.0208
DEG2RAD = math.pi / 180.0
M_EQ_TO_GAL = (
    -0.0548755604, -0.8734370902, -0.4838350155,
     0.4941094279, -0.4448296300,  0.7469822445,
    -0.8676661490, -0.1980763734,  0.4559837762,
)


def equatorial_to_galactocentric(ra_deg, dec_deg, distance_kpc):
    d = distance_kpc
    ra = ra_deg * DEG2RAD
    dec = dec_deg * DEG2RAD
    cd = math.cos(dec)
    xe = d * cd * math.cos(ra)
    ye = d * cd * math.sin(ra)
    ze = d * math.sin(dec)
    m = M_EQ_TO_GAL
    xg = m[0]*xe + m[1]*ye + m[2]*ze
    yg = m[3]*xe + m[4]*ye + m[5]*ze
    zg = m[6]*xe + m[7]*ye + m[8]*ze
    return xg - R_SUN, yg, zg + Z_SUN


def temp_to_rgb_from_bp_rp(bp_rp):
    # Reuse the same Mamajek + Tanner Helland approximation as the
    # field-star bake. Cepheids tend to be yellow-orange supergiants
    # (BP-RP ~ 0.6 .. 1.5 typically).
    table = [
        (-0.40, 30000), (-0.30, 16000), (-0.15, 10500),
        ( 0.00,  9800), ( 0.25,  7800), ( 0.50,  6500),
        ( 0.70,  5800), ( 1.00,  5100), ( 1.40,  4300),
        ( 1.80,  3800), ( 2.50,  3200), ( 3.50,  2700),
        ( 5.00,  2300),
    ]
    if bp_rp <= table[0][0]:
        T = table[0][1]
    elif bp_rp >= table[-1][0]:
        T = table[-1][1]
    else:
        T = table[-1][1]
        for i in range(1, len(table)):
            c1, t1 = table[i]
            if bp_rp <= c1:
                c0, t0 = table[i-1]
                k = (bp_rp - c0) / (c1 - c0)
                T = t0 + (t1 - t0) * k
                break
    t = T / 100.0
    if t <= 66: r = 255.0
    else: r = 329.698727446 * ((t - 60) ** -0.1332047592)
    if t <= 66: g = 99.4708025861 * math.log(t) - 161.1195681661
    else: g = 288.1221695283 * ((t - 60) ** -0.0755148492)
    if t >= 66: b = 255.0
    elif t <= 19: b = 0.0
    else: b = 138.5177312231 * math.log(t - 10) - 305.0447927307
    clip = lambda v: max(0.0, min(1.0, v / 255.0))
    return clip(r), clip(g), clip(b)


def cepheid_distance_kpc(period_days, g_mag, bp_rp):
    """Wesenheit P-L distance, kpc."""
    # Wesenheit magnitude in Gaia bands (largely extinction-free).
    W = g_mag - 1.91 * bp_rp
    # P-L relation for fundamental-mode classical Cepheids.
    log_p = math.log10(period_days)
    M_W = -3.32 * log_p - 5.96
    # Distance modulus -> parsecs -> kpc.
    mu = W - M_W
    d_pc = 10 ** ((mu + 5) / 5.0)
    return d_pc / 1000.0


def fetch_csv() -> str:
    params = {
        "REQUEST": "doQuery",
        "LANG": "ADQL",
        "FORMAT": "csv",
        "QUERY": QUERY,
    }
    print(f"Submitting Cepheid ADQL to {TAP_URL}", file=sys.stderr)
    req = urllib.request.Request(
        TAP_URL,
        data=urllib.parse.urlencode(params).encode("utf-8"),
        headers={"User-Agent": "milky-way-sim/0.1"},
    )
    with urllib.request.urlopen(req, timeout=600) as resp:
        return resp.read().decode("utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path,
                    default=Path("public/milkyway/cepheids.bin"))
    args = ap.parse_args()

    csv_text = fetch_csv()
    reader = csv.DictReader(StringIO(csv_text))

    fmt = "<8f"  # x, y, z, period_days, g_mag, r, g, b
    rec_size = struct.calcsize(fmt)
    assert rec_size == 32

    args.out.parent.mkdir(parents=True, exist_ok=True)
    n_in, n_out = 0, 0
    xs, ys, zs, dists = [], [], [], []
    with open(args.out, "wb") as f_bin:
        for row in reader:
            n_in += 1
            try:
                ra = float(row["ra"])
                dec = float(row["dec"])
                period = float(row["pf"])
                g_mag = float(row["phot_g_mean_mag"])
                bp_rp = float(row["bp_rp"])
            except (TypeError, ValueError, KeyError):
                continue
            if not (1.0 < period < 80.0):
                continue
            d_kpc = cepheid_distance_kpc(period, g_mag, bp_rp)
            if not (0.1 < d_kpc < 30.0):
                continue
            x, y, z = equatorial_to_galactocentric(ra, dec, d_kpc)
            rgb = temp_to_rgb_from_bp_rp(bp_rp)
            f_bin.write(struct.pack(fmt, x, y, z, period, g_mag, *rgb))
            xs.append(x); ys.append(y); zs.append(z); dists.append(d_kpc)
            n_out += 1

    print(f"Cepheids: {n_in} rows in, {n_out} kept", file=sys.stderr)
    if n_out > 0:
        print(f"  X kpc: {min(xs):+.2f} .. {max(xs):+.2f}", file=sys.stderr)
        print(f"  Y kpc: {min(ys):+.2f} .. {max(ys):+.2f}", file=sys.stderr)
        print(f"  Z kpc: {min(zs):+.2f} .. {max(zs):+.2f}", file=sys.stderr)
        print(f"  distance kpc: {min(dists):.2f} .. {max(dists):.2f}",
              file=sys.stderr)
        print(f"wrote {args.out} "
              f"({args.out.stat().st_size / 1024:.0f} KB, {n_out} cepheids)",
              file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
