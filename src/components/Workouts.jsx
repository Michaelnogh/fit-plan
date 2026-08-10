import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, updateEntry, toggleExerciseDone } from '../db/db';
import { Sheet, Check, TrendChart, Icon, PRToast, Empty, fmtDate } from './ui';

/* ------------------------------------------------------------------
   גיליון עריכת תרגיל — משקל, סטים, חזרות, הערות + היסטוריה
   ------------------------------------------------------------------ */
function ExerciseSheet({ entry, onClose }) {
  const [form, setForm] = useState({
    name: entry.name,
    weight: entry.weight ?? '',
    sets: entry.sets,
    reps: entry.reps,
    notes: entry.notes || '',
  });

  const history = useLiveQuery(
    () => db.weightHistory.where('entryId').equals(entry.id).sortBy('date'), [entry.id]);
  const logs = useLiveQuery(
    () => db.workoutLogs.where('entryId').equals(entry.id).reverse().sortBy('date'), [entry.id]);
  const prs = useLiveQuery(
    () => db.personalRecords.where('name').equals(entry.name).toArray(), [entry.name]);

  const best = prs?.length ? Math.max(...prs.map((p) => p.weight)) : null;

  const save = async () => {
    await updateEntry(entry.id, {
      name: form.name.trim() || entry.name,
      weight: form.weight === '' ? null : parseFloat(form.weight),
      sets: parseInt(form.sets, 10) || entry.sets,
      reps: String(form.reps),
      notes: form.notes,
    });
    onClose();
  };

  const points = [
    ...(history || []).map((h) => ({ date: h.date, value: h.weight })),
    ...(logs || []).filter((l) => l.weight != null).map((l) => ({ date: l.date, value: l.weight })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const chart = points.filter((p, i) => i === 0 || p.date !== points[i - 1].date || p.value !== points[i - 1].value);

  return (
    <Sheet title={entry.name} subtitle={entry.muscle} onClose={onClose}>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        <span className="chip">מנוחה {entry.rest}</span>
        <span className="chip">RIR {entry.rir}</span>
        <span className="chip">קצב {entry.tempo}</span>
        {best != null && <span className="chip brass"><Icon name="trophy" size={11} />שיא {best} ק"ג</span>}
      </div>

      <label className="field-label">שם התרגיל</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

      <div className="grid-2">
        <div>
          <label className="field-label">משקל עבודה</label>
          <input type="number" inputMode="decimal" step="0.5" placeholder="—"
            value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
        </div>
        <div>
          <label className="field-label">סטים</label>
          <input type="number" inputMode="numeric" value={form.sets}
            onChange={(e) => setForm({ ...form, sets: e.target.value })} />
        </div>
      </div>

      <label className="field-label">חזרות</label>
      <input value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />

      <label className="field-label">הערות</label>
      <textarea rows={2} value={form.notes} placeholder="תחושה, טכניקה, כאב..."
        onChange={(e) => setForm({ ...form, notes: e.target.value })} />

      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>שמירה</button>

      <div className="section">
        <span className="eyebrow">התקדמות משקל</span>
        <div className="card tight"><TrendChart data={chart} unit='ק"ג' height={170} /></div>
      </div>

      <div className="section">
        <span className="eyebrow">אימונים קודמים</span>
        {logs?.length ? (
          <div className="list">
            {logs.slice(0, 15).map((l) => (
              <div key={l.id} className="list-row">
                <div className="grow">
                  <div className="metric metric-sm">{fmtDate(l.date)}</div>
                  <div className="caption num">{l.sets} × {l.reps}</div>
                </div>
                <span className={`chip ${best != null && l.weight === best ? 'brass' : 'ember'}`}>
                  {l.weight != null ? `${l.weight} ק"ג` : 'ללא משקל'}
                </span>
              </div>
            ))}
          </div>
        ) : <div className="card"><Empty icon="clock">עוד לא בוצע</Empty></div>}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------
   מסך אימונים
   ------------------------------------------------------------------ */
export default function Workouts({ initialDay }) {
  const days = useLiveQuery(() => db.workoutDays.orderBy('order').toArray(), []);
  const [dayId, setDayId] = useState(initialDay || 'upper');
  const [open, setOpen] = useState(null);
  const [prToast, setPrToast] = useState(null);
  const today = todayStr();

  const entries = useLiveQuery(() => db.programEntries.where('dayId').equals(dayId).sortBy('order'), [dayId]);
  const todayLogs = useLiveQuery(
    () => db.workoutLogs.where('[dayId+date]').equals([dayId, today]).toArray(), [dayId, today]);
  const allPRs = useLiveQuery(() => db.personalRecords.toArray(), []);

  if (!days || !entries) return null;

  const doneIds = new Set((todayLogs || []).map((l) => l.entryId));
  const bestByName = {};
  (allPRs || []).forEach((p) => {
    if (!bestByName[p.name] || p.weight > bestByName[p.name]) bestByName[p.name] = p.weight;
  });

  const onToggle = async (entry) => {
    const { pr } = await toggleExerciseDone(entry, today);
    if (pr) setPrToast(pr);
  };

  const pct = entries.length ? (doneIds.size / entries.length) * 100 : 0;

  return (
    <div className="screen enter">
      <header className="screen-head">
        <h1 className="title-lg">אימונים</h1>
        <p className="body-2 num">{fmtDate(today)}</p>
      </header>

      <div className="seg" style={{ marginBottom: 16 }}>
        {days.map((d) => (
          <button key={d.id} className={d.id === dayId ? 'on' : ''} onClick={() => setDayId(d.id)}>
            {d.name}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row between">
          <span className="eyebrow">התקדמות היום</span>
          <span className="metric metric-md">{doneIds.size}<span className="unit">/{entries.length}</span></span>
        </div>
        <div className="bar" style={{ marginTop: 12 }}><i style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="list">
        {entries.map((e) => {
          const done = doneIds.has(e.id);
          const isPR = e.weight != null && bestByName[e.name] === e.weight;
          return (
            <div key={e.id} className={`list-row ${done ? 'done' : ''}`}>
              <Check on={done} label={`סימון ${e.name}`} onClick={() => onToggle(e)} />
              <button className="grow" style={{ textAlign: 'start' }} onClick={() => setOpen(e)}>
                <div className="title-sm">{e.name}</div>
                <div className="caption" style={{ marginTop: 2 }}>{e.muscle}</div>
                <div className="caption num" style={{ marginTop: 3 }}>
                  {e.sets} × {e.reps} · מנוחה {e.rest}
                  {e.notes ? ' · הערה' : ''}
                </div>
              </button>
              <button className={`chip ${isPR ? 'brass' : 'ember'}`} onClick={() => setOpen(e)}>
                {isPR && <Icon name="trophy" size={11} />}
                {e.weight != null ? `${e.weight} ק"ג` : 'הגדר'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="caption" style={{ margin: '10px 4px' }}>
        לחיצה על תרגיל פותחת עריכה, הערות והיסטוריית משקלים.
      </p>

      {open && <ExerciseSheet entry={entries.find((e) => e.id === open.id) || open} onClose={() => setOpen(null)} />}
      {prToast && <PRToast pr={prToast} onDone={() => setPrToast(null)} />}
    </div>
  );
}
