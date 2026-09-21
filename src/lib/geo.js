
const EARTH_RADIUS_MI = 3958.8;
const rad = (d) => (d * Math.PI) / 180;


export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h));
}


export function rankSpots(stations, friendStations, howMany = 3, destination = null) {
  const scored = stations
    .map((station) => {
      const distances = friendStations.map((f) => haversine(station, f));
      const max = Math.max(...distances);
      const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      const toDestination = destination ? haversine(station, destination) : null;
      const score = max + 0.35 * mean + (destination ? 0.25 * toDestination : 0);
      return { station, distances, max, mean, toDestination, score };
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
