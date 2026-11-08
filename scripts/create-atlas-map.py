"""Regenerate local SVG paths from us-atlas 3.0.1 (ISC).

Run from the repository root after creating work/ and downloading:
https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json -> work/states.json
No network or TopoJSON dependency is used by the game.
"""
import json
from pathlib import Path

source = json.loads(Path("work/states.json").read_text())
arcs = []
for arc in source["arcs"]:
    position = [0, 0]
    decoded = []
    for dx, dy in arc:
        position[0] += dx
        position[1] += dy
        decoded.append([
            position[i] * source["transform"]["scale"][i]
            + source["transform"]["translate"][i]
            for i in range(2)
        ])
    arcs.append(decoded)


def project(point, state_id):
    longitude, latitude = point
    if state_id == "02":  # Alaska inset
        return [(longitude + 180) * 2 + 30, (72 - latitude) * 2 + 440]
    if state_id == "15":  # Hawaii inset
        return [(longitude + 161) * 7 + 165, (23 - latitude) * 7 + 465]
    return [(longitude + 125) * 15 + 35, (50 - latitude) * 15 + 35]


states = []
for geometry in source["objects"]["states"]["geometries"]:
    if int(geometry["id"]) > 56:  # States + DC, excluding territories
        continue
    polygons = (
        geometry["arcs"] if geometry["type"] == "MultiPolygon"
        else [geometry["arcs"]]
    )
    paths = []
    for polygon in polygons:
        for ring in polygon:
            coordinates = []
            for index in ring:
                coordinates += (
                    arcs[index] if index >= 0 else list(reversed(arcs[~index]))
                )
            coordinates = [project(point, geometry["id"]) for point in coordinates]
            filtered = []
            for point in coordinates:
                if not filtered or (
                    abs(point[0] - filtered[-1][0])
                    + abs(point[1] - filtered[-1][1]) > .35
                ):
                    filtered.append(point)
            if len(filtered) > 2:
                paths.append(
                    "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in filtered) + "Z"
                )
    states.append({
        "id": geometry["id"],
        "name": geometry["properties"]["name"],
        "path": "".join(paths),
    })

Path("js/atlas-states.js").write_text(
    "// US Census boundaries via us-atlas 3.0.1 (ISC). See docs/FASE-3B.md.\n"
    + "export const STATES = " + json.dumps(states, separators=(",", ":")) + ";\n"
)
