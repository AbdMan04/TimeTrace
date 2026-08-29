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

## Running it

The app is fully static. The quickest way to open it is to double-click `index.html`.

## Tech

- HTML5
- CSS3 (custom design layer)
- Bootstrap 5 (via CDN — forms, modal, utilities only)
- Vanilla JavaScript

No build step, no framework, no backend.

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
