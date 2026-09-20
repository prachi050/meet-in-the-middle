"""Turns the MTA CSV (NY Open Data: "MTA Subway Stations and Complexes") into src/lib/stations.json.

Usage:  python3 scripts/prepare_stations.py path/to/MTA_Subway_Stations_and_Complexes.csv
"""
import csv, json, sys

rows = []
with open(sys.argv[1], newline="", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        rows.append({
            "id": int(r["Complex ID"]),
            "name": r["Stop Name"],
            "display": r["Display Name"],
            "borough": r["Borough"],
            "routes": r["Daytime Routes"].split(),
            "lat": round(float(r["Latitude"]), 5),
            "lon": round(float(r["Longitude"]), 5),
        })

with open("src/lib/stations.json", "w", encoding="utf-8") as out:
    json.dump(rows, out, separators=(",", ":"))
print(f"Wrote {len(rows)} stations")
