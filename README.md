# TimeTrace

**See where your day actually goes.**

TimeTrace is a small, simple time-awareness tool for students. Record what you did and for how long, and TimeTrace turns it into a timeline, a category breakdown, and a few plain-language reflections — all from data that never leaves your browser.

This is not a productivity or task-management app. It is a log that helps you answer one question:

> "Where did my time actually go today?"

## Features

- **Today overview** — a big day total, a dated page header, and a neutral one-line takeaway
- **Timeline** — each activity on a time rail, with start/end times, category, duration, and an optional note
- **Where your time went** — per-category totals with proportion bars
- **A quick reflection** — plain calculations only (longest session, busiest window, top category, focused-session count). No fake AI
- **Week view** — simple Mon–Sun totals; click a day to open it
- **Add / edit / delete** activities
- **Demo day** — one-click "Load example day" to see how a day reads, on your empty days
- **Everything persists** in `localStorage`; activities are grouped by day, and the app opens on today
- **Deep links** — `#today`, `#week`, `#day/YYYY-MM-DD` all work as plain URLs

## Running it

1. **The published file.** `index.html` in the repo root is the single-file build (everything inlined). Open it directly in a browser, or just use the GitHub Pages URL. After editing source, regenerate it:

   ```bash
   npm run publish:single   # builds dist-single/ and copies to ./index.html
   ```

   Like all bundler output it uses ES modules, so while Firefox happily runs the single file from disk, **Chrome/Edge block module scripts on `file://` — the single-file build inlines everything precisely to get around that.** If it still won't run, use option 2.

2. **Development server** with hot reload for editing:

   ```bash
   npm install
   npm run dev
   ```

3. **Serve the multi-file build** (what the GitHub Actions workflow deploys):

   ```bash
   npm run build
   npx serve dist        # or: py -m http.server 8000 -d dist
   ```

## Deploying to GitHub Pages

Either works out of the box:

- **Deploy from a branch (no setup).** Push `index.html` in the repo root — the single-file build from `npm run publish:single`. In **Settings → Pages**, pick *Deploy from a branch → main / (root)*. Any later update is just `npm run publish:single && git push`.
- **GitHub Actions.** Enable **Settings → Pages → Source: GitHub Actions**. The included workflow (`.github/workflows/deploy.yml`) builds and publishes `dist/` on every push to `main`.

The build uses a relative base (`base: './'`), so both methods work under the `<user>.github.io/<repo>/` sub-path with no further configuration.

## Tech

- React 18 + Vite 5
- Plain CSS3 custom design layer (no UI framework)
- `localStorage` for persistence — no backend, no network calls

```
index.html                committed single-file build (published to Pages / double-click)
src/
  index.html              Vite dev entry (meta + fonts + root div)
  main.jsx                 React entry
  App.jsx                  state, hash routing, view switching
  styles.css               design: type scale, timeline rail, spacing
  lib/timetrace.js         data layer: storage, duration math, insights
  components/
    Header.jsx             brand, Today/Week tabs, Add button
    TodayPanel.jsx         day heading, timeline, breakdown, reflection
    WeekPanel.jsx          Mon–Sun totals
    ActivityDialog.jsx     add/edit form (native <dialog>)
scripts/publish-single.mjs COPY dist-single/index.html -> ./index.html
vite.config.js             app build (dist/)
vite.singlefile.config.js  single-file build (dist-single/)
```

## Data model

Each activity follows this shape (stored under the `timetrace.activities.v1` key):

```js
{
  id: "k3f9a2",
  date: "2026-08-29",
  title: "React Practice",
  category: "Study",          // Study | Project | Personal | Entertainment | Break | Other
  startTime: "10:00",
  endTime: "11:30",
  duration: 90,               // minutes, derived from start/end
  note: "Worked on the portfolio."
}
```

Totals, category groups, and insights are all calculated from this list.