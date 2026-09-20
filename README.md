# Meet in the Middle

Pick everyone's subway station and find the fairest station in NYC to meet at.
No accounts, no API keys, no backend. Everything runs in the browser.

## Run it

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## Publish it (free)

**Option A: Vercel (best, gives you a link you can put on a resume)**
1. Create a GitHub repository and upload this folder (leave out `node_modules` and `dist`).
2. On vercel.com, click **Add New > Project** and import the repository.
3. Vercel detects Vite on its own. Click **Deploy**. You get a link like `meet-in-the-middle.vercel.app`.

**Option B: Drag and drop (no GitHub)**
Run `npm run build`, then drag the `dist` folder onto Netlify Drop (app.netlify.com/drop).
The built site must be served over http(s). Double-clicking `index.html` will not work.

## How it works

- `src/lib/stations.json` holds 445 station complexes (name, borough, lines, latitude, longitude).
- `src/lib/geo.js` scores every station by how far the **farthest** friend would travel,
  plus a small weight on the average, then returns the best three that are not right next to each other.
- The map is a plain SVG: each station is a dot placed by its latitude and longitude.
- The address bar keeps the selection (for example `#616-36`), so any result is a shareable link.

## Limits (say this in your write-up)

- Distances are straight lines, not train times. A station that is close on the map can be a slow trip.
- A good next step is to use the MTA's schedule data (GTFS) to compare real travel times.

## Data

Station data: "MTA Subway Stations and Complexes" from NY Open Data (data.ny.gov).
The dataset page lists no license, so check its terms before using this commercially.
Not affiliated with the MTA. To refresh the data, download the CSV and run `python3 scripts/prepare_stations.py <file.csv>`.
