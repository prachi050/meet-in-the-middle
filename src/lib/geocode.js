
const NYC_VIEWBOX = "-74.35,41.05,-73.55,40.45"; 

export async function searchPlaces(query, signal) {
  const q = query.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    format: "jsonv2",
    q,
    limit: "6",
    viewbox: NYC_VIEWBOX,
    bounded: "1",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];

  const data = await res.json();
  return data.map((d) => ({
    id: d.place_id,
    name: (d.namedetails?.name || d.display_name.split(",")[0]).trim(),
    fullName: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));
}
