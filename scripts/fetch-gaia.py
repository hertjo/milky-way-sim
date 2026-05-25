#!/usr/bin/env python3
"""
Fetch the brightest ~N stars from Gaia DR3 via the ESA public TAP
server. Writes a CSV with the columns we actually use downstream:
ra, dec, parallax, phot_g_mean_mag, bp_rp.

The query restricts to positive parallax (so we have a finite
distance) and a magnitude cap; the brightest ~250 k stars are
plenty for a striking visual.

Usage:
    python3 scripts/fetch-gaia.py --out /tmp/gaia.csv --limit 250000

No third-party Python deps needed — pure stdlib urllib.
"""

from __future__ import annotations

import argparse
import sys
import urllib.parse
import urllib.request
from pathlib import Path

TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"

# ADQL query.
#
# Goals for the cut:
#   - Enough stars (~10^6) that the galactic disk emerges naturally
#     when viewed top-down.
#   - Trim by parallax SNR (`parallax_over_error > 5`) so distance is
#     trustworthy and the 3D positions aren't smeared by noise.
#   - Cap apparent magnitude at G < 15.5 so we don't drown in the
#     Gaia faint-end where errors blow up.
#   - Require valid bp_rp (the renderer keys star RGB off it).
#
# We don't restrict by absolute magnitude or color, so the sample
# includes the local main sequence + giants + OB-star spiral tracers.
QUERY_TEMPLATE = """
SELECT TOP {limit}
    ra, dec, parallax, phot_g_mean_mag, bp_rp
FROM gaiadr3.gaia_source
WHERE parallax > 0.05
  AND parallax_over_error > 3
  AND phot_g_mean_mag < 17.5
  AND bp_rp IS NOT NULL
ORDER BY phot_g_mean_mag ASC
"""


def fetch_gaia(limit: int, out_path: Path):
    query = QUERY_TEMPLATE.format(limit=limit).strip()
    params = {
        "REQUEST": "doQuery",
        "LANG": "ADQL",
        "FORMAT": "csv",
        "QUERY": query,
    }
    data = urllib.parse.urlencode(params).encode("utf-8")
    print(f"Submitting ADQL to {TAP_URL} (limit={limit:,})", file=sys.stderr)
    req = urllib.request.Request(
        TAP_URL,
        data=data,
        headers={"User-Agent": "milky-way-sim/0.1"},
    )
    with urllib.request.urlopen(req, timeout=600) as resp:
        with open(out_path, "wb") as f:
            total = 0
            while True:
                chunk = resp.read(64 * 1024)
                if not chunk:
                    break
                f.write(chunk)
                total += len(chunk)
                if total % (4 * 1024 * 1024) < 64 * 1024:
                    print(
                        f"  ...{total / (1024 * 1024):.1f} MB",
                        end="\r",
                        file=sys.stderr,
                    )
    print(f"\nwrote {out_path} ({out_path.stat().st_size / 1024 / 1024:.1f} MB)",
          file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=250_000,
                    help="number of brightest stars to fetch")
    ap.add_argument("--out", type=Path, default=Path("/tmp/gaia.csv"),
                    help="output CSV path")
    args = ap.parse_args()
    fetch_gaia(args.limit, args.out)


if __name__ == "__main__":
    sys.exit(main())
