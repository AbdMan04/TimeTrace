import { useEffect, useRef, useState } from 'react';
import {
  CATEGORIES,
  defaultTimes,
  fullDateLabel,
  timeToMinutes,
  formatDuration,
} from '../lib/timetrace.js';

export default function ActivityDialog({ open, mode, activity, dateKey, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  /* sync form contents + open/close the native dialog */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      setError('');
      if (mode === 'edit' && activity) {
        setTitle(activity.title);
        setCategory(activity.category);
        setStart(activity.startTime);
        setEnd(activity.endTime);
        setNote(activity.note || '');
      } else {
        setTitle('');
        setCategory(CATEGORIES[0]);
        const t = defaultTimes();
        setStart(t.start);
        setEnd(t.end);
        setNote('');
      }
      if (!dialog.open) dialog.showModal();
      const focusTimer = window.setTimeout(() => {
        const field = dialog.querySelector('#fTitle');
        if (field) field.focus();
      }, 0);
      return () => window.clearTimeout(focusTimer);
    } else if (dialog.open) {
      dialog.close();
    }
    return undefined;
  }, [open, mode, activity]);

  const isEdit = mode === 'edit';

  function handleSubmit(e) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Give the activity a name.');
      return;
    }
    if (!start || !end) {
      setError('Pick a start and end time.');
      return;
    }
    const s = timeToMinutes(start);
    const eMin = timeToMinutes(end);
    if (eMin <= s) {
      setError('The end time must be after the start time.');
      return;
    }

    onSave({
      title: trimmedTitle,
      category,
      startTime: start,
      endTime: end,
      duration: eMin - s,
      note: note.trim(),
    });
  }

  /* live duration preview */
  let previewText = '\u00a0';
  let hasDuration = false;
  if (start && end) {
    const s = timeToMinutes(start);
    const eMin = timeToMinutes(end);
    if (eMin > s) {
      previewText = 'Duration: ' + formatDuration(eMin - s);
      hasDuration = true;
    } else {
      previewText = 'End time must be after the start time.';
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="activityModal"
      className="dialog"
      aria-labelledby="activityModalTitle"
      onClick={e => {
        if (e.target === dialogRef.current) onClose();
      }}
      onClose={onClose}
    >
      <div className="dialog-content">
        <div className="dialog-header">
          <h2 className="dialog-title" id="activityModalTitle">
            {isEdit ? 'Edit activity' : 'Add activity'}
          </h2>
          <button type="button" className="dialog-close" aria-label="Close" onClick={onClose}>
            {'\u00d7'}
          </button>
        </div>

        <form id="activityForm" noValidate onSubmit={handleSubmit}>
          <div className="dialog-body">
            <p className="dialog-day" id="modalDay">
              {(isEdit ? 'Editing' : 'Adding to') + '\u00b7' + ' ' + fullDateLabel(dateKey)}
            </p>

            <div className="field">
              <label htmlFor="fTitle" className="form-label">Activity name</label>
              <input
                type="text"
                className="form-control"
                id="fTitle"
                name="title"
                maxLength="80"
                placeholder="e.g. React practice\u2026"
                autoComplete="off"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="fCategory" className="form-label">Category</label>
              <select
                className="form-select"
                id="fCategory"
                name="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="fStart" className="form-label">Started at</label>
                <input
                  type="time"
                  className="form-control"
                  id="fStart"
                  name="startTime"
                  autoComplete="off"
                  required
                  value={start}
                  onChange={e => setStart(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="fEnd" className="form-label">Ended at</label>
                <input
                  type="time"
                  className="form-control"
                  id="fEnd"
                  name="endTime"
                  autoComplete="off"
                  required
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                />
              </div>
            </div>

            <p className={'duration-preview' + (hasDuration ? ' has-duration' : '')} id="durationPreview" aria-live="polite">
              {previewText}
            </p>

            <div className="field">
              <label htmlFor="fNote" className="form-label">
                Note <span className="optional">(optional)</span>
              </label>
              <textarea
                className="form-control"
                id="fNote"
                name="note"
                rows="2"
                maxLength="200"
                autoComplete="off"
                placeholder="What did you work on?\u2026"
                value={note}
                onChange={e => setNote(e.target.value)}
              ></textarea>
            </div>

            <p className="form-error" id="formError" role="alert" hidden={!error}>
              {error}
            </p>
          </div>

          <div className="dialog-footer">
            <button type="button" className="btn btn-quiet" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btnSave">
              {isEdit ? 'Save changes' : 'Add to today'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}