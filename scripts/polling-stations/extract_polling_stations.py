#!/usr/bin/env python3
"""
Rebuild the public.polling_stations table from the Electoral Commission of
Ghana's authoritative "2024 Polling Stations" PDF.

Why this exists
---------------
The original import used a naive whitespace-split parser on the PDF's
space-collapsed columns, which mis-split multi-word names/constituencies and
produced corrupted constituency values (e.g. "CENTRAL ASANTE"), dropped the
District level entirely, and added an unused "community" column. It also
missed ~8,600 stations.

This script parses by the PDF's actual column x-coordinates (via pdfplumber),
so values that contain spaces (e.g. "Tarkwa Nsuaem") stay intact. It emits an
idempotent SQL file that:
  1. renames community -> district (guarded),
  2. TRUNCATEs the table (code is PK; nothing references it),
  3. bulk-inserts every EC station, Title-cased to match the app's convention.

Usage
-----
    pip install pdfplumber
    python extract_polling_stations.py \
        ../../docs/Polling_stations.pdf \
        ../../../polling_stations_rebuild.sql

Columns: code | name | constituency | district | region
"""

import json
import re
import sys
from collections import defaultdict

import pdfplumber

# Column x0 lower/upper bounds, derived from the EC PDF header word positions.
BOUNDS = [
    (93, 180, "code"),
    (180, 448, "name"),
    (448, 568, "constituency"),
    (568, 672, "district"),
    (672, 9999, "region"),
]

# The EC codes every station's region in the leading letter of its code. This
# is authoritative and immune to column drift, unlike the region text column —
# see extract() for why that matters.
REGION_BY_CODE = {
    "A": "WESTERN", "B": "CENTRAL", "C": "GREATER ACCRA", "D": "VOLTA",
    "E": "EASTERN", "F": "ASHANTI", "G": "WESTERN NORTH", "H": "AHAFO",
    "J": "BONO", "K": "BONO EAST", "L": "OTI", "M": "NORTHERN",
    "N": "SAVANNAH", "P": "UPPER WEST", "Q": "NORTH EAST", "R": "UPPER EAST",
}

CODE_RE = re.compile(r"^[A-Z]\d{6}[A-Z]?$")
BATCH = 1000


def column_of(x0: float):
    for lo, hi, name in BOUNDS:
        if lo <= x0 < hi:
            return name
    return None


def title(s: str) -> str:
    """Title-case matching the app's existing convention, fixing possessives."""
    return re.sub(r"([A-Za-z])'S\b", lambda m: m.group(1) + "'s", s.title())


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def extract(pdf_path: str):
    """Return {code: [code, name, constituency, district, region]} from the PDF."""
    seen = {}
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            lines = defaultdict(list)
            for w in page.extract_words(use_text_flow=False):
                lines[round(w["top"])].append(w)
            for top in sorted(lines):
                cols = defaultdict(list)
                for w in sorted(lines[top], key=lambda w: w["x0"]):
                    c = column_of(w["x0"])
                    if c:
                        cols[c].append(w["text"])
                code = " ".join(cols.get("code", [])).strip()
                if not CODE_RE.match(code):
                    continue  # skips page headers/footers and stray lines
                # Region from the code's leading letter, NOT the region column.
                # Constituencies with long names (e.g. "Komenda Edina Eguafo
                # Abrem", "Asante Akim South") overflow the constituency column,
                # shove the region text into the district cell, and leave the
                # region column empty — which the old `region in REGIONS` guard
                # silently dropped (~370 stations across those constituencies).
                region = REGION_BY_CODE.get(code[0])
                if region is None:
                    continue
                region_col = " ".join(cols.get("region", [])).strip()
                district = " ".join(cols.get("district", [])).strip()
                # Overflow recovery: when the region column came out empty, the
                # region name usually glued onto the tail of the district cell.
                if not region_col and district.upper().endswith(region):
                    district = district[: len(district) - len(region)].strip()
                seen[code] = [
                    code,
                    " ".join(cols.get("name", [])).strip(),
                    " ".join(cols.get("constituency", [])).strip(),
                    district,
                    region,
                ]
    return list(seen.values())


def build_sql(rows) -> str:
    out = [
        "-- Rebuild polling_stations from the EC 2024 Polling Stations list (authoritative).",
        "-- Renames community -> district, then replaces all rows with the clean set.",
        "-- code is PK; no FKs reference this table. Run in the Supabase SQL editor.",
        "",
        "DO $$ BEGIN",
        "  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'"
        " AND table_name='polling_stations' AND column_name='community') THEN",
        "    ALTER TABLE public.polling_stations RENAME COLUMN community TO district;",
        "  END IF;",
        "END $$;",
        "",
        "TRUNCATE public.polling_stations;",
        "",
    ]
    for i in range(0, len(rows), BATCH):
        vals = [
            "('%s','%s','%s','%s','%s')"
            % (
                sql_escape(code),
                sql_escape(title(name)),
                sql_escape(title(con)),
                sql_escape(title(dist)),
                sql_escape(title(reg)),
            )
            for code, name, con, dist, reg in rows[i : i + BATCH]
        ]
        out.append("INSERT INTO public.polling_stations (code,name,constituency,district,region) VALUES")
        out.append(",\n".join(vals) + ";")
        out.append("")
    return "\n".join(out)


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    pdf_path, sql_path = sys.argv[1], sys.argv[2]
    rows = extract(pdf_path)
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write(build_sql(rows))
    districts = len({(r[4], r[3]) for r in rows})
    constituencies = len({(r[4], r[2]) for r in rows})
    print(
        f"Wrote {sql_path}: {len(rows)} stations, "
        f"{constituencies} constituencies, {districts} districts, "
        f"{len({r[4] for r in rows})} regions"
    )


if __name__ == "__main__":
    main()
