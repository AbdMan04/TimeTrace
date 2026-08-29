import {
  CATEGORIES,
  CATEGORY_COLORS,
  dayActivities,
  dayTotal,
  fullDateLabel,
  shortDateLabel,
  todayKey,
  greeting,
  formatDuration,
  formatClockHuman,
  longestSession,
  categoryTotals,
  busiestWindow,
  focusedCount,
} from '../lib/timetrace.js';

function Timeline({ list, flashId, onEdit, onDelete }) {
  if (list.length === 0) {
    return (
      <div className="empty" id="timeline" aria-live="polite">
        <svg className="empty-mark" width="44" height="44" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M16 9.5V16l5 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="empty-title">Blank page.</p>
        <p className="empty-text">
          Nothing tracked for this day yet.{' '}
          Add your first activity, or load an example day to see how a day reads.
        </p>
      </div>
    );
  }

  return (
    <div className="timeline" id="timeline" aria-live="polite">
      {list.map(a => {
        const color = CATEGORY_COLORS[a.category] || 'var(--accent)';
        const justAdded = a.id === flashId;
        return (
          <article
            key={a.id}
            className={'t-item' + (justAdded ? ' is-just-added' : '')}
            data-id={a.id}
            style={{ '--cat': color }}
          >
            <div className="t-times">
              <span className="t-start">{a.startTime}</span>
              <span className="t-end">{a.endTime}</span>
            </div>
            <div className="t-rail">
              <span className="t-dot" aria-hidden="true"></span>
            </div>
            <div className="t-body">
              <div className="t-head">
                <h3 className="t-title">{a.title}</h3>
                <span className="t-dur">{formatDuration(a.duration)}</span>
              </div>
              <p className="t-cat">
                <span className="cat-dot" aria-hidden="true"></span>
                {a.category}
              </p>
              {a.note ? <p className="t-note">{a.note}</p> : null}
              <div className="t-actions">
                <button type="button" className="btn-ghost" data-action="edit" data-id={a.id} onClick={() => onEdit(a)}>
                  Edit
                </button>
                <button type="button" className="btn-ghost" data-action="delete" data-id={a.id} onClick={() => onDelete(a)}>
                  Delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Breakdown({ list }) {
  if (list.length === 0) {
    return (
      <div className="empty">
        <p className="empty-text">Once you add activities, your time will be grouped by category here.</p>
      </div>
    );
  }

  const total = dayTotal(list);
  const order = CATEGORIES.filter(c => list.some(a => a.category === c));

  return (
    <div className="breakdown">
      {order.map(cat => {
        const mins = list.filter(a => a.category === cat).reduce((s, a) => s + a.duration, 0);
        const pct = total > 0 ? Math.round((mins / total) * 100) : 0;
        const color = CATEGORY_COLORS[cat] || 'var(--accent)';
        return (
          <div key={cat} className="b-row" style={{ color }}>
            <div className="b-head">
              <span className="b-label">
                <span className="cat-dot" aria-hidden="true"></span>
                {cat}
              </span>
              <span className="b-value">{formatDuration(mins)}</span>
            </div>
            <div className="b-track" role="img" aria-label={cat + ': ' + pct + ' percent of tracked time'}>
              <div className="b-bar" style={{ width: pct + '%' }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function reflectionItems(list, dateKey, isToday) {
  const when = isToday ? 'today' : 'on ' + shortDateLabel(dateKey);
  const total = dayTotal(list);

  if (list.length === 0) {
    return [
      <span key="empty">
        No activities yet {'\u2014'} add your first entry and your day will start to take shape.
      </span>,
    ];
  }

  const items = [
    <span key="total">
      You tracked <strong>{formatDuration(total)}</strong> {when}.
    </span>,
  ];

  const longest = longestSession(list);
  if (longest && longest.duration > 0) {
    items.push(
      <span key="longest">
        Your longest session was <strong>{formatDuration(longest.duration)}</strong> {'\u2014'}{' '}
        <em>{longest.title}</em>.
      </span>
    );
  }

  const cats = categoryTotals(list);
  if (cats.length) {
    const used = list.filter(a => a.category === cats[0][0]).length;
    if (used >= 1 && used === list.length && list.length === 1) {
      items.push(
        <span key="whole">
          Your whole day went to <strong>{cats[0][0]}</strong>.
        </span>
      );
    } else if (cats[0][1] > total * 0.4) {
      items.push(
        <span key="most">
          Most of your time went to <strong>{cats[0][0]}</strong> {'\u2014'}{' '}
          {formatDuration(cats[0][1])}.
        </span>
      );
    } else {
      items.push(
        <span key="biggest">
          The biggest block of your day went to <strong>{cats[0][0]}</strong>.
        </span>
      );
    }
  }

  const win = busiestWindow(list);
  if (win) {
    items.push(
      <span key="busy">
        You were busiest between{' '}
        <strong>
          {formatClockHuman(win.start)} and {formatClockHuman(win.end)}
        </strong>
        .
      </span>
    );
  }

  const focused = focusedCount(list);
  if (focused > 0) {
    items.push(
      <span key="focused">
        You had <strong>{focused}</strong> focused {focused === 1 ? 'session' : 'sessions'} {when}.
      </span>
    );
  }

  return items;
}

function Reflection({ list, dateKey, isToday }) {
  return (
    <div className="reflection" aria-live="polite">
      {reflectionItems(list, dateKey, isToday).map((item, i) => (
        <p className="refl-item" key={i}>
          <span className="refl-mark" aria-hidden="true"></span>
          {item}
        </p>
      ))}
    </div>
  );
}

export default function TodayPanel({ activities, dateKey, flashId, onAdd, onEdit, onDelete, onDemo, onBackToday }) {
  const isToday = dateKey === todayKey();
  const list = dayActivities(activities, dateKey);
  const total = dayTotal(list);

  let note;
  if (isToday) {
    note = list.length === 0
      ? 'A fresh page. Add what you did, and it will show up here.'
      : greeting() + ' \u2014 here\u2019s where your time went today.';
  } else {
    note = list.length === 0
      ? 'Nothing tracked for this day yet.'
      : 'Here\u2019s how ' + shortDateLabel(dateKey) + ' added up.';
  }

  const showDemo = isToday && list.length === 0;

  return (
    <section id="viewToday" role="tabpanel" aria-labelledby="tabToday">
      <header className="day-heading">
        <p className="day-eyebrow" id="dayEyebrow">{fullDateLabel(dateKey)}</p>
        <h1 className="day-total" id="dayTotal">{formatDuration(total)}</h1>
        <div className="day-rule" aria-hidden="true"></div>
        <p className="day-total-label">tracked today</p>
        <p className="day-note" id="dayNote">{note}</p>
        {!isToday && (
          <a
            className="back-today"
            id="backToday"
            href="#viewToday"
            onClick={e => {
              e.preventDefault();
              onBackToday();
            }}
          >
            {'\u2190'} Back to today
          </a>
        )}
      </header>

      <hr className="section-rule" role="presentation" />

      <section className="section" aria-labelledby="hTimeline">
        <h2 className="section-title" id="hTimeline">Today</h2>
        <Timeline list={list} flashId={flashId} onEdit={onEdit} onDelete={onDelete} />
      </section>

      <hr className="section-rule" role="presentation" />

      <section className="section" aria-labelledby="hBreakdown">
        <h2 className="section-title" id="hBreakdown">Where your time went</h2>
        <Breakdown list={list} />
      </section>

      <hr className="section-rule" role="presentation" />

      <section className="section" aria-labelledby="hReflection">
        <h2 className="section-title" id="hReflection">A quick reflection</h2>
        <Reflection list={list} dateKey={dateKey} isToday={isToday} />
      </section>

      <hr className="section-rule" role="presentation" />

      <div className="demo-row">
        <p className="demo-text" id="demoText" hidden={!showDemo}>
          Want to see how a day looks? Load an example day to try it out.
        </p>
        <button type="button" className="btn btn-quiet" id="btnDemo" hidden={!showDemo} onClick={onDemo}>
          Load example day
        </button>
      </div>
    </section>
  );
}