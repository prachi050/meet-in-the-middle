const ALIASES = { ave: "av", avenue: "av", street: "st", square: "sq", boulevard: "blvd", road: "rd", heights: "hts", hts: "hts" };

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function buildIndex(stations) {
  return stations.map((s) => {
    const hay = norm(s.name);
    return { s, hay, words: hay.split(" ") };
  });
}

export function searchStations(index, query, limit = 7) {
  const tokens = norm(query)
    .split(" ")
    .filter(Boolean)
    .map((t) => ALIASES[t] ?? t);
  if (tokens.length === 0) return [];

  const results = [];
  for (const item of index) {
    let score = 0;
    let matches = true;
    for (const t of tokens) {
      if (item.hay.startsWith(t)) score += 3;
      else if (item.words.some((w) => w.startsWith(t))) score += 2;
      else if (t.length >= 3 && item.hay.includes(t)) score += 1;
      else if (t.length === 1 && item.s.routes.some((r) => r.toLowerCase() === t)) score += 0.5;
      else {
        matches = false;
        break;
      }
    }
    if (matches) results.push([score, item.s]);
  }
  results.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name));
  return results.slice(0, limit).map((r) => r[1]);
}
