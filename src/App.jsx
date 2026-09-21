import { useEffect, useMemo, useState } from "react";
import SUBWAY_STATIONS from "./lib/stations.json";
import PATH_STATIONS from "./lib/path_stations.json";
import { buildIndex } from "./lib/search.js";
import { formatMiles, rankSpots } from "./lib/geo.js";
import { BOROUGHS, FRIEND_COLORS } from "./lib/lines.js";
import { Bullets, PersonBadge } from "./components/Bullet.jsx";
import StationPicker from "./components/StationPicker.jsx";
import NetworkMap from "./components/NetworkMap.jsx";


const STATIONS = [...SUBWAY_STATIONS, ...PATH_STATIONS];
const BY_ID = new Map(STATIONS.map((s) => [s.id, s]));
const INDEX = buildIndex(STATIONS);
const MAX_FRIENDS = 4;
const EXAMPLE_IDS = [616, 39];


function parseHash() {
  const raw = window.location.hash.slice(1);
  const [friendPart, destPart] = raw.split("_d");
  const ids = friendPart.split("-").map(Number).filter((n) => BY_ID.has(n));
  const picks = ids.slice(0, MAX_FRIENDS).map((id) => BY_ID.get(id));
  while (picks.length < 2) picks.push(null);
  const destId = Number(destPart);
  const destination = BY_ID.has(destId) ? BY_ID.get(destId) : null;
  return { picks, destination };
}

const friendName = (i) => (i === 0 ? "You" : `Friend ${i + 1}`);

export default function App() {
  const initial = useMemo(parseHash, []);
  const [picks, setPicks] = useState(initial.picks);
  const [destination, setDestination] = useState(initial.destination);
  const [activeSpot, setActiveSpot] = useState(0);
  const [copied, setCopied] = useState(false);

  const friends = picks.map((station, idx) => ({ station, idx, name: friendName(idx) })).filter((f) => f.station);
  const friendKey = friends.map((f) => f.station.id).join("-") + (destination ? `_d${destination.id}` : "");

  const spots = useMemo(
    () => (friends.length >= 2 ? rankSpots(STATIONS, friends.map((f) => f.station), 3, destination) : []),

    [friendKey]
  );


  useEffect(() => {
    const url = window.location.pathname + window.location.search + (friendKey ? `#${friendKey}` : "");
    window.history.replaceState(null, "", url);
    setActiveSpot(0);
    setCopied(false);
  }, [friendKey]);

  const setPick = (i, station) => setPicks((p) => p.map((s, k) => (k === i ? station : s)));
  const addFriend = () => setPicks((p) => (p.length < MAX_FRIENDS ? [...p, null] : p));
  const removeFriend = (i) => setPicks((p) => (p.length > 2 ? p.filter((_, k) => k !== i) : p));
  const loadExample = () => setPicks(EXAMPLE_IDS.map((id) => BY_ID.get(id)));

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const t = document.createElement("textarea");
      t.value = window.location.href;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const shareLink = () =>
    navigator.share?.({ title: "Meet in the Middle", text: `Let's meet at ${spots[activeSpot].station.name}`, url: window.location.href }).catch(() => {});

  const best = spots[activeSpot];

  const coffeeLink = (station, query) =>
    `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${station.lat},${station.lon},16z`;

  const COFFEE_TYPES = [
    { label: "Local & indie", query: "independent coffee shop" },
    { label: "Everyday cafe", query: "coffee shop" },
    { label: "High-end / specialty", query: "specialty coffee roastery" },
  ];

  return (
    <main className="page">
      <div className="col-left">
        <header className="hero">
          <h1>Meet in the middle.</h1>
          <p className="lede">Add where everyone is coming from, subway or PATH. We'll find the station that's fairest for the group, or the one closest to wherever you're headed next.</p>
        </header>

        <section className="who" aria-labelledby="who-title">
          <h2 id="who-title">Who's coming?</h2>
          {picks.map((station, i) => (
            <StationPicker
              key={i}
              label={friendName(i)}
              color={FRIEND_COLORS[i]}
              station={station}
              searchIndex={INDEX}
              onSelect={(s) => setPick(i, s)}
              onRemove={() => removeFriend(i)}
              canRemove={picks.length > 2 && i >= 2}
            />
          ))}
          <div className="who-actions">
            {picks.length < MAX_FRIENDS && (
              <button type="button" className="btn btn-ghost" onClick={addFriend}>
                + Add a friend
              </button>
            )}
            <button type="button" className="text-btn" onClick={loadExample}>
              Try an example
            </button>
          </div>
        </section>

        <section className="destination" aria-labelledby="destination-title">
          <h2 id="destination-title">Going somewhere after? (optional)</h2>
          <StationPicker
            label="Destination"
            color="#333333"
            station={destination}
            searchIndex={INDEX}
            onSelect={(s) => setDestination(s)}
            onRemove={() => setDestination(null)}
            canRemove={!!destination}
          />
          {destination && (
            <p className="destination-note">
              We'll favor meeting spots that are also close to {destination.name}, so the group can head there together.
            </p>
          )}
        </section>

        <section className="result" aria-live="polite">
          {best ? (
            <>
              <div className="sign">
                <p className="sign-small">Meet at</p>
                <h2 className="sign-name">{best.station.name}</h2>
                <div className="sign-lines">
                  <Bullets routes={best.station.routes} size="lg" />
                  <span className="sign-borough">{BOROUGHS[best.station.borough]}</span>
                </div>
                <ul className="dists">
                  {friends.map((f, k) => (
                    <li key={f.idx}>
                      <PersonBadge color={FRIEND_COLORS[f.idx]} size={26} />
                      <span className="dists-name">{f.name}</span>
                      <span className="dists-mi">{formatMiles(best.distances[k])}</span>
                    </li>
                  ))}
                  {destination && (
                    <li>
                      <PersonBadge color="#333333" size={26} />
                      <span className="dists-name">To {destination.name}</span>
                      <span className="dists-mi">{formatMiles(best.toDestination)}</span>
                    </li>
                  )}
                </ul>
                <div className="sign-actions">
                  <button type="button" className="btn btn-light" onClick={copyLink}>
                    {copied ? "Link copied" : "Copy link"}
                  </button>
                  {typeof navigator !== "undefined" && navigator.share && (
                    <button type="button" className="btn btn-outline-light" onClick={shareLink}>
                      Share
                    </button>
                  )}
                </div>

                <div className="coffee">
                  <p className="coffee-label">Grab coffee nearby</p>
                  <div className="coffee-links">
                    {COFFEE_TYPES.map((c) => (
                      <a
                        key={c.label}
                        className="coffee-chip"
                        href={coffeeLink(best.station, c.query)}
                        target="_blank"
                        rel="noopener"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

            </>
          ) : (
            <p className="empty">
              {friends.length === 1 ? "Add one more station to see where to meet." : "Pick at least two stations to see where to meet."}
            </p>
          )}
        </section>


        {spots.length > 1 && (
          <section className="others" aria-labelledby="others-title">
            <h3 id="others-title">Other good spots</h3>
            <ul>
              {spots.map((sp, i) =>
                i === activeSpot ? null : (
                  <li key={sp.station.id}>
                    <button type="button" className="other" onClick={() => setActiveSpot(i)}>
                      <span className="other-rank">{i + 1}</span>
                      <span className="other-main">
                        <span className="other-name">{sp.station.name}</span>
                        <span className="other-meta">
                          <Bullets routes={sp.station.routes} size="sm" />
                          <span>Farthest friend {formatMiles(sp.max)}</span>
                          {destination && <span>&middot; {formatMiles(sp.toDestination)} to {destination.name}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              )}
            </ul>
          </section>
        )}

        <p className="fineprint">
         Made by Prachi Patel. Distances are straight-line, not train times, so check your route before you leave. Subway data from the MTA via NY Open Data; PATH stations added separately. Not affiliated with the MTA or the Port Authority.
        </p>
      </div>

      <div className="col-right">
        <NetworkMap stations={STATIONS} friends={friends} spots={spots} activeSpot={activeSpot} />
      </div>
    </main>
  );
}
