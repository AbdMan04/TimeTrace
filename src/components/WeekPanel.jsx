import {
  dayActivities,
  dayTotal,
  toISODate,
  shortDateLabel,
  formatDuration,
  mondayOf,
} from '../lib/timetrace.js';

export default function WeekPanel({ activities, dateKey, onOpenDay }) {
  const monday = mondayOf(new Date());

  const days = [];
  let max = 0;
  const totals = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = toISODate(d);
    const t = dayTotal(dayActivities(activities, key));
    days.push({
      key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
    });
    totals[key] = t;
    if (t > max) max = t;
  }

  return (
    <section id="viewWeek" role="tabpanel" aria-labelledby="tabWeek">
      <header className="week-heading">
        <p className="day-eyebrow" id="weekEyebrow">
          {shortDateLabel(days[0].key)} {'\u2013'} {shortDateLabel(days[6].key)},{' '}
          {monday.getFullYear()}
        </p>
        <h1 className="week-title">This week</h1>
        <p className="day-note">How each day added up.</p>
      </header>

      <hr className="section-rule" role="presentation" />

      <div className="week-list" id="weekList" aria-live="polite">
        {days.map(day => {
          const t = totals[day.key];
          const pct = max > 0 && t > 0 ? Math.round((t / max) * 100) : 0;
          const isActive = day.key === dateKey;
          return (
            <button
              type="button"
              key={day.key}
              className={'week-row' + (isActive ? ' is-active' : '')}
              data-date={day.key}
              aria-pressed={isActive}
              onClick={() => onOpenDay(day.key)}
            >
              <span className="week-col-label">
                <span className="week-day">{day.label}</span>
                <span className="week-date">{day.num}</span>
              </span>
              <span className="week-track">
                <span className="week-bar" style={{ width: pct + '%' }}></span>
              </span>
              <span className={'week-total' + (t === 0 ? ' is-empty' : '')}>
                {t === 0 ? '\u2014' : formatDuration(t)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}