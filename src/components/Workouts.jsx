import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, updateEntry, toggleExerciseDone } from '../db/db';
import { Sheet, Check, TrendChart, fmtDate } from './ui';

function ExerciseSheet({ entry, onClose }) {
  const [form, setForm] = useState({
    name: entry.name, weight: entry.weight ?? '', sets: entry.sets, reps: entry.reps, notes: entry.notes || '',
  });
  const history = useLiveQuery(
    () => db.weightHistory.where('entryId').equals(entry.id).sortBy('date'), [entry.id]);
  const logs = useLiveQuery(
    () => db.workoutLogs.where('entryId').equals(entry.id).reverse().sortBy('date'), [entry.id]);

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

  // גרף משקל עבודה: היסטוריית שינויים + ביצועים
  const chartData = [
    ...(history || []).map((h) => ({ date: h.date, value: h.weight })),
    ...(logs || []).filter((l) => l.weight != null).map((l) => ({ date: l.date, value: l.weight })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  // דילוג על כפילויות של אותו יום/ערך
  const dedup = chartData.filter((p, i) => i === 0 || p.date !== chartData[i - 1].date || p.value !== chartData[i - 1].value);

  return (
    <Sheet title={entry.name} onClose={onClose}>
      <div className="small">{entry.muscle} · מנוחה {entry.rest} · RIR {entry.rir} · קצב {entry.tempo}</div>

      <label className="field">שם התרגיל</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

      <div className="grid-2">
        <div>
          <label className="field">משקל עבודה (ק"ג)</label>
          <input type="number" inputMode="decimal" step="0.5" value={form.weight}
            placeholder="טרם הוגדר"
            onChange={(e) => setForm({ ...form, weight: e.target.value })} />
        </div>
        <div>
          <label className="field">סטים</label>
          <input type="number" inputMode="numeric" value={form.sets}
            onChange={(e) => setForm({ ...form, sets: e.target.value })} />
        </div>
      </div>
      <label className="field">חזרות</label>
      <input value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />

      <label className="field">הערות</label>
      <textarea rows={2} value={form.notes} placeholder="הערות אישיות לתרגיל..."
        onChange={(e) => setForm({ ...form, notes: e.target.value })} />

      <button className="btn primary" style={{ width: '100%', marginTop: 16 }} onClick={save}>שמירה</button>

      <div className="section-title">התקדמות משקל עבודה</div>
      <div className="card flat chart-card"><TrendChart data={dedup} unit='ק"ג' height={180} /></div>

      <div className="section-title">אימונים קודמים</div>
      {logs?.length ? (
        <div className="list">
          {logs.slice(0, 20).map((l) => (
            <div key={l.id} className="list-row">
              <div className="grow">
                <div className="bold num">{fmtDate(l.date)}</div>
                <div className="small num">{l.sets} סטים × {l.reps} חזרות</div>
              </div>
              <div className="chip accent num">{l.weight != null ? `${l.weight} ק"ג` : 'ללא משקל'}</div>
            </div>
          ))}
        </div>
      ) : <div className="empty">עוד לא בוצע — סמן ✓ אחרי האימון הראשון</div>}
    </Sheet>
  );
}

export default function Workouts({ initialDay }) {
  const days = useLiveQuery(() => db.workoutDays.orderBy('order').toArray(), []);
  const [dayId, setDayId] = useState(initialDay || 'upper');
  const [open, setOpen] = useState(null);
  const today = todayStr();
  const entries = useLiveQuery(
    () => db.programEntries.where('dayId').equals(dayId).sortBy('order'), [dayId]);
  const todayLogs = useLiveQuery(
    () => db.workoutLogs.where('[dayId+date]').equals([dayId, today]).toArray(), [dayId, today]);

  if (!days || !entries) return null;
  const doneIds = new Set((todayLogs || []).map((l) => l.entryId));

  return (
    <div className="screen">
      <h1 className="large-title">אימונים</h1>
      <p className="subtitle num">{doneIds.size}/{entries.length} הושלמו היום · {fmtDate(today)}</p>

      <div className="seg" style={{ marginBottom: 14 }}>
        {days.map((d) => (
          <button key={d.id} className={d.id === dayId ? 'on' : ''} onClick={() => setDayId(d.id)}>{d.name}</button>
        ))}
      </div>

      <div className="list">
        {entries.map((e) => {
          const done = doneIds.has(e.id);
          return (
            <div key={e.id} className={`list-row ${done ? 'done-strike' : ''}`}>
              <Check on={done} label={`סימון ${e.name}`} onClick={() => toggleExerciseDone(e, today)} />
              <button className="grow" style={{ textAlign: 'start' }} onClick={() => setOpen(e)}>
                <div className="exercise-title">{e.name}</div>
                <div className="small">{e.muscle}</div>
                <div className="tiny num" style={{ marginTop: 3 }}>
                  {e.sets} סטים · {e.reps} חזרות · מנוחה {e.rest}{e.notes ? ' · 📝' : ''}
                </div>
              </button>
              <button className="chip accent num" onClick={() => setOpen(e)}>
                {e.weight != null ? `${e.weight} ק"ג` : 'הגדר'}
              </button>
            </div>
          );
        })}
      </div>
      <div className="tiny" style={{ margin: '4px 6px' }}>לחיצה על תרגיל — עריכה, הערות והיסטוריית משקלים.</div>

      {open && <ExerciseSheet entry={entries.find((e) => e.id === open.id) || open} onClose={() => setOpen(null)} />}
    </div>
  );
}
