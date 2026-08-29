'use strict';

/* TimeTrace — data layer: storage, activity math, plain-text insights.
   No framework, no backend. Everything lives in localStorage. */

const STORAGE_KEY = 'timetrace.activities.v1';

const CATEGORIES = ['Study', 'Project', 'Personal', 'Entertainment', 'Break', 'Other'];

const CATEGORY_COLORS = {
  'Study':         'var(--cat-study)',
  'Project':       'var(--cat-project)',
  'Personal':      'var(--cat-personal)',
  'Entertainment': 'var(--cat-entertainment)',
  'Break':         'var(--cat-break)',
  'Other':         'var(--cat-other)',
};

/* ---------------- small date / time helpers ---------------- */

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISODate(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function parseISODate(s) {
  const p = s.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

function todayKey() {
  return toISODate(new Date());
}

function timeToMinutes(t) {
  const p = t.split(':').map(Number);
  return p[0] * 60 + p[1];
}

function minutesToClock(m) {
  return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0 && m === 0) return '0m';
  if (h === 0) return m + 'm';
  if (m === 0) return h + 'h';
  return h + 'h ' + m + 'm';
}

function formatClockHuman(minOfDay) {
  const h = Math.floor(minOfDay / 60);
  const m = minOfDay % 60;
  const am = h < 12;
  const hh = ((h + 11) % 12) + 1;
  return m === 0 ? hh + ' ' + (am ? 'AM' : 'PM') : hh + ':' + pad(m) + ' ' + (am ? 'AM' : 'PM');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------------- storage ---------------- */

function loadActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveActivities(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------------- queries ---------------- */

function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const idx = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - idx);
  return x;
}

function dayActivities(list, date) {
  return list
    .filter(a => a.date === date)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

function dayTotal(list) {
  return list.reduce((sum, a) => sum + a.duration, 0);
}

function categoryTotals(list) {
  const map = {};
  list.forEach(a => {
    map[a.category] = (map[a.category] || 0) + a.duration;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function longestSession(list) {
  let best = null;
  list.forEach(a => {
    if (!best || a.duration > best.duration) best = a;
  });
  return best;
}

/* Busiest contiguous 4-hour window of the day. */
function busiestWindow(list, windowMinutes) {
  windowMinutes = windowMinutes || 240;
  if (!list.length) return null;
  const day = new Array(1440).fill(0);
  list.forEach(a => {
    const s = timeToMinutes(a.startTime);
    const e = timeToMinutes(a.endTime);
    for (let i = s; i < e; i++) day[i]++;
  });
  let bestStart = 0;
  let bestSum = 0;
  let running = 0;
  for (let i = 0; i < 1440; i++) {
    if (i >= windowMinutes) running -= day[i - windowMinutes];
    running += day[i];
    if (i >= windowMinutes - 1 && running > bestSum) {
      bestSum = running;
      bestStart = i - windowMinutes + 1;
    }
  }
  if (bestSum === 0) return null;
  return { start: bestStart, end: bestStart + windowMinutes };
}

function focusedCount(list) {
  return list.filter(a => a.category === 'Study' || a.category === 'Project').length;
}

/* ---------------- demo day ---------------- */

function demoActivities(date) {
  return [
    { id: uid(), date: date, title: 'Data structures revision', category: 'Study', startTime: '09:00', endTime: '11:30', duration: 150, note: 'Recursion, trees, and a few coding problems.' },
    { id: uid(), date: date, title: 'Mid-morning break', category: 'Break', startTime: '11:30', endTime: '12:00', duration: 30, note: '' },
    { id: uid(), date: date, title: 'Portfolio website', category: 'Project', startTime: '13:00', endTime: '15:00', duration: 120, note: 'Wired up the projects page.' },
    { id: uid(), date: date, title: 'Series episode', category: 'Entertainment', startTime: '16:00', endTime: '17:30', duration: 90, note: '' },
    { id: uid(), date: date, title: 'Evening walk', category: 'Personal', startTime: '18:30', endTime: '19:15', duration: 45, note: 'Fresh air.' },
  ];
}