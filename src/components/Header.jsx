export default function Header({ view, onViewChange, onAdd }) {
  const isToday = view === 'today';

  return (
    <header className="site-head">
      <div className="brand">
        <svg className="brand-mark" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M16 9.5V16l5 3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="brand-name" translate="no">TimeTrace</span>
      </div>

      <div className="head-controls">
        <nav className="view-switch" role="tablist" aria-label="View">
          <button
            type="button"
            role="tab"
            id="tabToday"
            aria-selected={isToday}
            aria-controls="viewToday"
            className={'view-tab' + (isToday ? ' is-active' : '')}
            onClick={() => onViewChange('today')}
          >
            Today
          </button>
          <button
            type="button"
            role="tab"
            id="tabWeek"
            aria-selected={!isToday}
            aria-controls="viewWeek"
            className={'view-tab' + (!isToday ? ' is-active' : '')}
            onClick={() => onViewChange('week')}
          >
            Week
          </button>
        </nav>
        <button type="button" className="btn btn-primary btn-add" id="btnAdd" aria-haspopup="dialog" onClick={onAdd}>
          <span aria-hidden="true" className="plus">+</span> Add activity
        </button>
      </div>
    </header>
  );
}