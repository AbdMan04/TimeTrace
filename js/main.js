'use strict';

/* TimeTrace — UI layer: rendering, interactions, modal, week view. */

/* ---------------- state ---------------- */

let activities = loadActivities();
let currentDate = todayKey();
let activeView = 'today';
let editingId = null;
let lastAddedId = null;

/* ---------------- dom ---------------- */

const el = {
  tabToday: document.getElementById('tabToday'),
  tabWeek: document.getElementById('tabWeek'),
  viewToday: document.getElementById('viewToday'),
  viewWeek: document.getElementById('viewWeek'),
  btnAdd: document.getElementById('btnAdd'),
  btnDemo: document.getElementById('btnDemo'),
  demoText: document.getElementById('demoText'),
  backToday: document.getElementById('backToday'),

  dayEyebrow: document.getElementById('dayEyebrow'),
  dayTotal: document.getElementById('dayTotal'),
  dayNote: document.getElementById('dayNote'),
  timeline: document.getElementById('timeline'),
  breakdown: document.getElementById('breakdown'),
  reflection: document.getElementById('reflection'),

  weekEyebrow: document.getElementById('weekEyebrow'),
  weekList: document.getElementById('weekList'),

  modal: document.getElementById('activityModal'),
  modalTitle: document.getElementById('activityModalTitle'),
  modalDay: document.getElementById('modalDay'),
  form: document.getElementById('activityForm'),
  btnSave: document.getElementById('btnSave'),
  fTitle: document.getElementById('fTitle'),
  fCategory: document.getElementById('fCategory'),
  fStart: document.getElementById('fStart'),
  fEnd: document.getElementById('fEnd'),
  fNote: document.getElementById('fNote'),
  durationPreview: document.getElementById('durationPreview'),
  formError: document.getElementById('formError'),
};

/* ---------------- helpers ---------------- */

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function fullDateLabel(dateKey) {
  return parseISODate(dateKey).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function shortDateLabel(dateKey) {
  return parseISODate(dateKey).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function defaultTimes() {
  const now = new Date();
  let m = now.getHours() * 60 + now.getMinutes();
  m = Math.ceil(m / 30) * 30;
  if (m > 23 * 60) m = 23 * 60;
  const end = Math.min(m + 60, 23 * 60 + 30);
  return { start: minutesToClock(m), end: minutesToClock(end) };
}

/* ---------------- render: day header ---------------- */

function renderDayHeader() {
  const isToday = currentDate === todayKey();
  el.dayEyebrow.textContent = fullDateLabel(currentDate);

  const list = dayActivities(activities, currentDate);
  const total = dayTotal(list);

  el.dayTotal.textContent = formatDuration(total);

  let note;
  if (isToday) {
    note = list.length === 0
      ? 'A fresh page. Add what you did, and it will show up here.'
      : greeting() + ' \u2014 here\u2019s where your time went today.';
  } else {
    note = list.length === 0
      ? 'Nothing tracked for this day yet.'
      : 'Here\u2019s how ' + shortDateLabel(currentDate) + ' added up.';
  }
  el.dayNote.textContent = note;

  el.backToday.hidden = isToday;

  // Demo affordance only applies to today, when the day is empty.
  const showDemo = isToday && list.length === 0;
  el.btnDemo.hidden = !showDemo;
  el.demoText.hidden = !showDemo;
}

/* ---------------- render: timeline ---------------- */

function renderTimeline() {
  const list = dayActivities(activities, currentDate);

  if (list.length === 0) {
    const today = currentDate === todayKey();
    el.timeline.innerHTML =
      '<div class="empty">' +
        '<svg class="empty-mark" width="44" height="44" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
          '<circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" stroke-width="2"/>' +
          '<path d="M16 9.5V16l5 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
        '<p class="empty-title">Blank page.</p>' +
        '<p class="empty-text">Nothing tracked for this day yet.' +
        (today ? ' Add your first activity, or load an example day to see how a day reads.' : '') +
        '</p>' +
      '</div>';
    return;
  }

  el.timeline.innerHTML = list.map(a => {
    const color = CATEGORY_COLORS[a.category] || 'var(--accent)';
    const note = a.note ? '<p class="t-note">' + esc(a.note) + '</p>' : '';
    return (
      '<article class="t-item" data-id="' + a.id + '" style="--cat:' + color + '">' +
        '<div class="t-times">' +
          '<span class="t-start">' + esc(a.startTime) + '</span>' +
          '<span class="t-end">' + esc(a.endTime) + '</span>' +
        '</div>' +
        '<div class="t-rail"><span class="t-dot" aria-hidden="true"></span></div>' +
        '<div class="t-body">' +
          '<div class="t-head">' +
            '<h3 class="t-title">' + esc(a.title) + '</h3>' +
            '<span class="t-dur">' + esc(formatDuration(a.duration)) + '</span>' +
          '</div>' +
          '<p class="t-cat"><span class="cat-dot" style="background:currentColor" aria-hidden="true"></span>' + esc(a.category) + '</p>' +
          note +
          '<div class="t-actions">' +
            '<button type="button" class="btn-ghost" data-action="edit" data-id="' + a.id + '">Edit</button>' +
            '<button type="button" class="btn-ghost" data-action="delete" data-id="' + a.id + '">Delete</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }).join('');

  if (lastAddedId) {
    const item = el.timeline.querySelector('.t-item[data-id="' + lastAddedId + '"]');
    if (item) {
      item.classList.add('is-just-added');
      setTimeout(() => item.classList.remove('is-just-added'), 1200);
    }
    lastAddedId = null;
  }
}

/* ---------------- render: breakdown ---------------- */

function renderBreakdown() {
  const list = dayActivities(activities, currentDate);
  const total = dayTotal(list);

  if (list.length === 0) {
    el.breakdown.innerHTML =
      '<div class="empty"><p class="empty-text">Once you add activities, your time will be grouped by category here.</p></div>';
    return;
  }

  const order = CATEGORIES.filter(c => list.some(a => a.category === c));
  el.breakdown.innerHTML = order.map(cat => {
    const mins = list.filter(a => a.category === cat).reduce((s, a) => s + a.duration, 0);
    const pct = total > 0 ? Math.round((mins / total) * 100) : 0;
    const color = CATEGORY_COLORS[cat] || 'var(--accent)';
    return (
      '<div class="b-row" style="color:' + color + '">' +
        '<div class="b-head">' +
          '<span class="b-label"><span class="cat-dot" style="background:currentColor" aria-hidden="true"></span>' + esc(cat) + '</span>' +
          '<span class="b-value">' + esc(formatDuration(mins)) + '</span>' +
        '</div>' +
        '<div class="b-track" role="img" aria-label="' + esc(cat) + ': ' + pct + ' percent of tracked time">' +
          '<div class="b-bar" style="width:' + pct + '%"></div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/* ---------------- render: reflection ---------------- */

function renderReflection() {
  const list = dayActivities(activities, currentDate);
  const isToday = currentDate === todayKey();
  const when = isToday ? 'today' : 'on ' + shortDateLabel(currentDate);
  const items = [];

  if (list.length === 0) {
    items.push('<span>No activities yet \u2014 add your first entry and your day will start to take shape.</span>');
  } else {
    items.push('<span>You tracked <strong>' + esc(formatDuration(dayTotal(list))) + '</strong> ' + when + '.</span>');

    const longest = longestSession(list);
    if (longest && longest.duration > 0) {
      items.push('<span>Your longest session was <strong>' + esc(formatDuration(longest.duration)) + '</strong> \u2014 <em>' + esc(longest.title) + '</em>.</span>');
    }

    const cats = categoryTotals(list);
    if (cats.length) {
      const used = list.filter(a => a.category === cats[0][0]).length;
      if (used >= 1 && used === list.length && list.length === 1) {
        items.push('<span>Your whole day went to <strong>' + esc(cats[0][0]) + '</strong>.</span>');
      } else if (cats[0][1] > dayTotal(list) * 0.4) {
        items.push('<span>Most of your time went to <strong>' + esc(cats[0][0]) + '</strong> \u2014 ' + esc(formatDuration(cats[0][1])) + '.</span>');
      } else {
        items.push('<span>The biggest block of your day went to <strong>' + esc(cats[0][0]) + '</strong>.</span>');
      }
    }

    const win = busiestWindow(list);
    if (win) {
      items.push('<span>You were busiest between <strong>' + esc(formatClockHuman(win.start)) + ' and ' + esc(formatClockHuman(win.end)) + '</strong>.</span>');
    }

    const focused = focusedCount(list);
    if (focused > 0) {
      items.push('<span>You had <strong>' + focused + '</strong> focused ' + (focused === 1 ? 'session' : 'sessions') + ' ' + when + '.</span>');
    }
  }

  el.reflection.innerHTML = items.map(t => '<p class="refl-item"><span class="refl-mark" aria-hidden="true"></span>' + t + '</p>').join('');
}

/* ---------------- render: week ---------------- */

function renderWeek() {
  const monday = mondayOf(new Date());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({ key: toISODate(d), label: d.toLocaleDateString('en-US', { weekday: 'short' }), num: d.getDate() });
  }

  const totals = {};
  let max = 0;
  days.forEach(day => {
    const t = dayTotal(dayActivities(activities, day.key));
    totals[day.key] = t;
    if (t > max) max = t;
  });

  el.weekEyebrow.textContent =
    shortDateLabel(days[0].key) + ' \u2013 ' + shortDateLabel(days[6].key) + ', ' + monday.getFullYear();

  el.weekList.innerHTML = days.map(day => {
    const t = totals[day.key];
    const pct = max > 0 && t > 0 ? Math.round((t / max) * 100) : 0;
    const isActive = day.key === currentDate;
    const cls = 'week-row' + (isActive ? ' is-active' : '');
    return (
      '<button type="button" class="' + cls + '" data-date="' + day.key + '">' +
        '<span class="week-col-label">' +
          '<span class="week-day">' + day.label + '</span>' +
          '<span class="week-date">' + day.num + '</span>' +
        '</span>' +
        '<span class="week-track"><span class="week-bar" ' + (pct ? 'style="width:' + pct + '%"' : '') + '></span></span>' +
        '<span class="week-total' + (t === 0 ? ' is-empty' : '') + '">' + (t === 0 ? '\u2014' : esc(formatDuration(t))) + '</span>' +
      '</button>'
    );
  }).join('');
}

/* ---------------- render ---------------- */

function render() {
  renderDayHeader();
  renderTimeline();
  renderBreakdown();
  renderReflection();
  renderWeek();
}

function refresh() {
  render();
}

/* ---------------- views ---------------- */

function setView(name) {
  activeView = name;
  const isToday = name === 'today';
  el.viewToday.hidden = !isToday;
  el.viewWeek.hidden = isToday;
  el.tabToday.classList.toggle('is-active', isToday);
  el.tabWeek.classList.toggle('is-active', !isToday);
  el.tabToday.setAttribute('aria-selected', String(isToday));
  el.tabWeek.setAttribute('aria-selected', String(!isToday));
  syncHash();
}

/* ---------------- deep links (hash) ---------------- */

function isValidDateKey(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function encodeHash() {
  if (currentDate !== todayKey()) return 'day/' + currentDate;
  return activeView === 'week' ? 'week' : 'today';
}

function syncHash() {
  history.replaceState(null, '', '#' + encodeHash());
}

function applyHash() {
  const h = (location.hash || '').replace(/^#\/?/, '') || 'today';
  if (h.indexOf('day/') === 0) {
    const d = h.slice(4);
    if (isValidDateKey(d) && d !== currentDate) {
      currentDate = d;
      setView('today');
      refresh();
    }
  } else if (h === 'week') {
    if (activeView !== 'week') setView('week');
  } else if (activeView !== 'today') {
    setView('today');
  }
}

/* ---------------- modal ---------------- */

const modalInst = new bootstrap.Modal(el.modal);

function clearFormError() {
  el.formError.hidden = true;
}

function showFormError(msg) {
  el.formError.textContent = msg;
  el.formError.hidden = false;
}

function updateDurationPreview() {
  const start = el.fStart.value;
  const end = el.fEnd.value;
  if (!start || !end) {
    el.durationPreview.textContent = '\u00a0';
    el.durationPreview.classList.remove('has-duration');
    return;
  }
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (e <= s) {
    el.durationPreview.textContent = 'End time must be after the start time.';
    el.durationPreview.classList.remove('has-duration');
    return;
  }
  el.durationPreview.textContent = 'Duration: ' + formatDuration(e - s);
  el.durationPreview.classList.add('has-duration');
}

function openModal(mode, activity) {
  clearFormError();
  editingId = mode === 'edit' ? activity.id : null;

  el.modalTitle.textContent = mode === 'edit' ? 'Edit activity' : 'Add activity';
  el.btnSave.textContent = mode === 'edit' ? 'Save changes' : 'Add to today';
  el.modalDay.textContent = (mode === 'edit' ? 'Editing\u00b7' : 'Adding to\u00b7') + ' ' + fullDateLabel(currentDate);

  if (mode === 'edit') {
    el.fTitle.value = activity.title;
    el.fCategory.value = activity.category;
    el.fStart.value = activity.startTime;
    el.fEnd.value = activity.endTime;
    el.fNote.value = activity.note || '';
  } else {
    el.form.reset();
    const t = defaultTimes();
    el.fStart.value = t.start;
    el.fEnd.value = t.end;
  }

  updateDurationPreview();
  modalInst.show();
  el.modal.addEventListener('shown.bs.modal', function focusOnce() {
    el.fTitle.focus();
    el.modal.removeEventListener('shown.bs.modal', focusOnce);
  }, { once: true });
}

function handleSubmit(event) {
  event.preventDefault();

  const title = el.fTitle.value.trim();
  const start = el.fStart.value;
  const end = el.fEnd.value;
  const category = el.fCategory.value;
  const note = el.fNote.value.trim();

  if (!title) { showFormError('Give the activity a name.'); el.fTitle.focus(); return; }
  if (!start || !end) { showFormError('Pick a start and end time.'); return; }

  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (e <= s) { showFormError('The end time must be after the start time.'); el.fEnd.focus(); return; }

  const payload = { title: title, category: category, startTime: start, endTime: end, duration: e - s, note: note };

  if (editingId) {
    activities = activities.map(a => a.id === editingId ? Object.assign({}, a, payload) : a);
  } else {
    const fresh = Object.assign({ id: uid(), date: currentDate }, payload);
    activities.push(fresh);
    lastAddedId = fresh.id;
  }

  saveActivities(activities);
  modalInst.hide();
  refresh();
}

/* ---------------- actions ---------------- */

function deleteActivity(id) {
  const a = activities.find(x => x.id === id);
  if (!a) return;
  if (!window.confirm('Delete \u201C' + a.title + '\u201D from your day?')) return;
  activities = activities.filter(x => x.id !== id);
  saveActivities(activities);
  refresh();
}

function handleTimelineClick(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const activity = activities.find(x => x.id === id);
  if (!activity) return;
  if (btn.getAttribute('data-action') === 'edit') {
    openModal('edit', activity);
  } else {
    deleteActivity(id);
  }
}

function handleWeekClick(event) {
  const row = event.target.closest('.week-row');
  if (!row) return;
  currentDate = row.getAttribute('data-date');
  setView('today');
  refresh();
}

/* ---------------- boot ---------------- */

function init() {
  el.btnAdd.addEventListener('click', () => openModal('add'));
  el.tabToday.addEventListener('click', () => setView('today'));
  el.tabWeek.addEventListener('click', () => setView('week'));
  el.timeline.addEventListener('click', handleTimelineClick);
  el.weekList.addEventListener('click', handleWeekClick);
  el.form.addEventListener('submit', handleSubmit);
  el.fStart.addEventListener('change', updateDurationPreview);
  el.fEnd.addEventListener('change', updateDurationPreview);
  el.btnDemo.addEventListener('click', () => {
    const fresh = demoActivities(currentDate);
    activities = activities.concat(fresh);
    saveActivities(activities);
    lastAddedId = fresh[0].id;
    refresh();
  });
  el.backToday.addEventListener('click', (event) => {
    event.preventDefault();
    currentDate = todayKey();
    refresh();
    syncHash();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('hashchange', applyHash);

  refresh();
  applyHash();
}

document.addEventListener('DOMContentLoaded', init);