#!/usr/bin/env python3
"""
Fetch the Reid et al. 2019 catalog of trigonometric parallaxes to
high-mass star-forming regions, via VizieR. Each row is a maser
(typically methanol or water) with VLBA-measured parallax and an
explicit spiral-arm tag from the catalog authors — these are the
present-day skeleton of the Milky Way's spiral arms.

Catalog: VizieR J/ApJ/885/131/table1.
Columns we use: Name, RAJ2000, DEJ2000, plx (mas), Arm.

Output: public/milkyway/masers.json (~30 KB), list of
    { "x": kpc, "y": kpc, "z": kpc, "arm": "Sgr", "name": "..." }
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

VIZIER_URL = (
    "https://vizier.cds.unistra.fr/viz-bin/asu-tsv"
    "?-source=J/ApJ/885/131/table1&-out.max=99999"
    "&-out=Name,RAJ2000,DEJ2000,plx,Arm"
)

R_SUN = 8.122
Z_SUN = 0.0208
DEG2RAD = math.pi / 180.0
M_EQ_TO_GAL = (
    -0.0548755604, -0.8734370902, -0.4838350155,
     0.4941094279, -0.4448296300,  0.7469822445,
    -0.8676661490, -0.1980763734,  0.4559837762,
)


def parse_sexagesimal_ra(s: str) -> float:
    h, m, sec = s.split()
    return (float(h) + float(m) / 60 + float(sec) / 3600) * 15.0


def parse_sexagesimal_dec(s: str) -> float:
    s = s.strip()
    sign = -1.0 if s.startswith("-") else 1.0
    s = s.lstrip("+-")
    d, m, sec = s.split()
    return sign * (float(d) + float(m) / 60 + float(sec) / 3600)


def equatorial_to_galactocentric(ra_deg, dec_deg, d_kpc):
    ra = ra_deg * DEG2RAD
    dec = dec_deg * DEG2RAD
    cd = math.cos(dec)
    xe = d_kpc * cd * math.cos(ra)
    ye = d_kpc * cd * math.sin(ra)
    ze = d_kpc * math.sin(dec)
    m = M_EQ_TO_GAL
    xg = m[0]*xe + m[1]*ye + m[2]*ze
    yg = m[3]*xe + m[4]*ye + m[5]*ze
    zg = m[6]*xe + m[7]*ye + m[8]*ze
    return xg - R_SUN, yg, zg + Z_SUN


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path,
                    default=Path("public/milkyway/masers.json"))
    args = ap.parse_args()

    print(f"Fetching {VIZIER_URL}", file=sys.stderr)
    with urllib.request.urlopen(VIZIER_URL, timeout=300) as resp:
        text = resp.read().decode("utf-8")

    lines = [ln for ln in text.splitlines() if ln and not ln.startswith("#")]
    if len(lines) < 3:
        print("not enough rows in response", file=sys.stderr)
        return 1
    header = [c.strip() for c in lines[0].split("\t")]
    # Skip the unit row and dash row that VizieR emits.
    rows = lines[3:]
    print(f"header: {header}", file=sys.stderr)
    print(f"data rows: {len(rows)}", file=sys.stderr)

    out = []
    arm_counts: dict[str, int] = {}
    for ln in rows:
        cells = ln.split("\t")
        if len(cells) != len(header):
            continue
        row = dict(zip(header, [c.strip() for c in cells]))
        try:
            ra = parse_sexagesimal_ra(row["RAJ2000"])
            dec = parse_sexagesimal_dec(row["DEJ2000"])
            plx = float(row["plx"])
        except (ValueError, KeyError):
            continue
        if plx <= 0:
            continue
        d_kpc = 1.0 / plx
        x, y, z = equatorial_to_galactocentric(ra, dec, d_kpc)
        arm = (row.get("Arm") or "?").strip()
        out.append({
            "x": round(x, 4),
            "y": round(y, 4),
            "z": round(z, 4),
            "arm": arm,
            "name": row.get("Name", "").strip(),
        })
        arm_counts[arm] = arm_counts.get(arm, 0) + 1

    print(f"\nmasers kept: {len(out)}", file=sys.stderr)
    for arm, n in sorted(arm_counts.items(), key=lambda x: -x[1]):
        print(f"  {arm:5s} {n}", file=sys.stderr)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out))
    print(f"wrote {args.out} ({args.out.stat().st_size / 1024:.1f} KB)",
          file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
