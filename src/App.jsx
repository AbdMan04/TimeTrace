import { useEffect, useState } from 'react';
import {
  loadActivities,
  saveActivities,
  demoActivities,
  todayKey,
  uid,
} from './lib/timetrace.js';
import Header from './components/Header.jsx';
import TodayPanel from './components/TodayPanel.jsx';
import WeekPanel from './components/WeekPanel.jsx';
import ActivityDialog from './components/ActivityDialog.jsx';

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function snapshotHash() {
  return (window.location.hash || '').replace(/^#\/?/, '') || 'today';
}

export default function App() {
  const [activities, setActivities] = useState(loadActivities);
  const [dateKey, setDateKey] = useState(todayKey());
  const [view, setView] = useState('today');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [flashId, setFlashId] = useState(null);

  /* persist on every change */
  useEffect(() => {
    saveActivities(activities);
  }, [activities]);

  /* stop flashing a freshly added entry */
  useEffect(() => {
    if (!flashId) return;
    const t = setTimeout(() => setFlashId(null), 1200);
    return () => clearTimeout(t);
  }, [flashId]);

  function setViewIfNeeded(name) {
    setView(v => (v === name ? v : name));
  }

  /* deep links: keep the hash in sync with state (relative, works on file://) */
  useEffect(() => {
    function encodeHash() {
      if (dateKey !== todayKey()) return 'day/' + dateKey;
      return view === 'week' ? 'week' : 'today';
    }
    try {
      history.replaceState(null, '', '#' + encodeHash());
    } catch (_) {
      /* file:// protocol blocks history — ignore */
    }
  }, [dateKey, view]);

  /* deep links: navigate from the hash */
  useEffect(() => {
    function applyHash() {
      const h = snapshotHash();
      if (h.startsWith('day/')) {
        const d = h.slice(4);
        if (DATE_KEY_RE.test(d)) {
          setDateKey(d);
          setViewIfNeeded('today');
        }
      } else if (h === 'week') {
        setViewIfNeeded('week');
      } else {
        setViewIfNeeded('today');
      }
    }
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  /* ---------------- actions ---------------- */

  function openAddDialog() {
    setEditActivity(null);
    setDialogOpen(true);
  }

  function openEditDialog(activity) {
    setEditActivity(activity);
    setDialogOpen(true);
  }

  function handleSave(payload) {
    if (editActivity) {
      setActivities(list => list.map(a => (a.id === editActivity.id ? { ...a, ...payload } : a)));
    } else {
      const fresh = { id: uid(), date: dateKey, ...payload };
      setActivities(list => list.concat(fresh));
      setFlashId(fresh.id);
    }
    setDialogOpen(false);
  }

  function deleteActivity(activity) {
    if (!window.confirm('Delete \u201C' + activity.title + '\u201D from your day?')) return;
    setActivities(list => list.filter(a => a.id !== activity.id));
  }

  function loadDemoDay() {
    const fresh = demoActivities(dateKey);
    setActivities(list => list.concat(fresh));
    setFlashId(fresh[0].id);
  }

  function goToday() {
    setDateKey(todayKey());
    setViewIfNeeded('today');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openDay(key) {
    setDateKey(key);
    setViewIfNeeded('today');
  }

  /* ---------------- render ---------------- */

  return (
    <div className="page">
      <Header view={view} onViewChange={setViewIfNeeded} onAdd={openAddDialog} />

      <main id="main">
        {view === 'today' ? (
          <TodayPanel
            activities={activities}
            dateKey={dateKey}
            flashId={flashId}
            onAdd={openAddDialog}
            onEdit={openEditDialog}
            onDelete={deleteActivity}
            onDemo={loadDemoDay}
            onBackToday={goToday}
          />
        ) : (
          <WeekPanel activities={activities} dateKey={dateKey} onOpenDay={openDay} />
        )}
      </main>

      <footer className="site-foot">
        <p>
          <span translate="no">TimeTrace</span> {'\u2014'} a simple log of where your time actually goes.
        </p>
      </footer>

      <ActivityDialog
        open={dialogOpen}
        mode={editActivity ? 'edit' : 'add'}
        activity={editActivity}
        dateKey={dateKey}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}