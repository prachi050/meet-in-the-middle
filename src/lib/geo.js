const EARTH_RADIUS_MI = 3958.8;
const rad = (d) => (d * Math.PI) / 180;

// Straight-line ("as the crow flies") distance in miles.
export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h));
}

// Score every station by how far the farthest friend would travel (fairness),
// with a small weight on the average distance as a tie-breaker.
// Then keep the best few that are not right next to each other.
export function rankSpots(stations, friendStations, howMany = 3) {
  const scored = stations
    .map((station) => {
      const distances = friendStations.map((f) => haversine(station, f));
      const max = Math.max(...distances);
      const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      return { station, distances, max, mean, score: max + 0.35 * mean };
    })
    .sort((a, b) => a.score - b.score);

  const picks = [];
  for (const candidate of scored) {
    const farEnough = picks.every((p) => haversine(p.station, candidate.station) > 0.3);
    if (farEnough) picks.push(candidate);
    if (picks.length === howMany) break;
  }
  return picks;
}

export function formatMiles(d) {
  return d < 0.05 ? "0 mi" : `${d.toFixed(1)} mi`;
}
