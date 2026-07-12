import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db, todayStr, setSetting, computeStreaks, upsertCycling, deleteCycling,
  DEFAULT_SCHEDULE, WEEKDAYS,
} from '../db/db';
import { Sheet, Stat, fmtDate } from './ui';

const pad = (n) => String(n).padStart(2, '0');
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const CAL_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

// פירוט יום: סיכום אימוני כוח + רישום/עריכת רכיבה. משמש גם כקיצור מהדשבורד.
export function DaySheet({ date, onClose }) {
  const sessions = useLiveQuery(() => db.workoutSessions.where('date').equals(date).toArray(), [date]);
  const ride = useLiveQuery(() => db.cyclingLogs.where('date').equals(date).first(), [date]);
  const days = useLiveQuery(() => db.workoutDays.toArray(), []);
  const [form, setForm] = useState({ distanceKm: '', durationMin: '', notes: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (ride) setForm({ distanceKm: ride.distanceKm ?? '', durationMin: ride.durationMin ?? '', notes: ride.notes || '' });
  }, [ride?.id]);

  const dayName = (id) => days?.find((d) => d.id === id)?.name || id;
  const future = date > todayStr();

  const save = async () => {
    try { await upsertCycling(date, form); setMsg('נשמר ✓'); }
    catch (err) { setMsg(err.message); }
  };
  const remove = async () => {
    await deleteCycling(date);
    setForm({ distanceKm: '', durationMin: '', notes: '' });
    setMsg('הרכיבה נמחקה');
  };

  return (
    <Sheet title={fmtDate(date)} onClose={onClose}>
      <div className="section-title">אימון כוח</div>
      {sessions?.length ? (
        <div className="list">
          {sessions.map((s) => (
            <div key={s.id} className="list-row">
              <div className="grow">
                <div className="bold">{dayName(s.dayId)}</div>
                <div className="small num">{s.exercisesDone}/{s.exercisesTotal} תרגילים</div>
              </div>
              <span className={`chip ${s.status === 'completed' ? 'accent' : ''}`}>
                {s.status === 'completed' ? 'הושלם ✓' : 'חלקי'}
              </span>
            </div>
          ))}
        </div>
      ) : <div className="card flat small">לא נרשם אימון כוח בתאריך זה</div>}

      <div className="section-title">רכיבה 🚴</div>
      {future ? (
        <div className="card flat small">לא ניתן לרשום רכיבה לתאריך עתידי</div>
      ) : (
        <div className="card flat">
          <div className="grid-2">
            <div>
              <label className="field">מרחק (ק"מ)</label>
              <input type="number" inputMode="decimal" step="0.1" min="0" value={form.distanceKm}
                placeholder="0" onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} />
            </div>
            <div>
              <label className="field">משך (דקות)</label>
              <input type="number" inputMode="numeric" min="0" value={form.durationMin}
                placeholder="0" onChange={(e) => setForm({ ...form, durationMin: e.target.value })} />
            </div>
          </div>
          <label className="field">הערות</label>
          <input value={form.notes} placeholder="מסלול, תחושה..."
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn primary" style={{ width: '100%', marginTop: 14 }} onClick={save}>
            {ride ? 'עדכון רכיבה' : 'שמירת רכיבה'}
          </button>
          {ride && (
            <button className="btn danger" style={{ width: '100%', marginTop: 8 }} onClick={remove}>מחיקת רכיבה</button>
          )}
          {msg && <div className="small" style={{ marginTop: 10 }}>{msg}</div>}
        </div>
      )}
    </Sheet>
  );
}

export default function Roadmap() {
  const today = todayStr();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(null);

  const days = useLiveQuery(() => db.workoutDays.orderBy('order').toArray(), []);
  const scheduleSetting = useLiveQuery(() => db.settings.get('schedule'), []);
  const streaks = useLiveQuery(() => computeStreaks(), []);
  const prefix = monthKey(month) + '-';
  const sessions = useLiveQuery(() => db.workoutSessions.where('date').startsWith(prefix).toArray(), [prefix]);
  const rides = useLiveQuery(() => db.cyclingLogs.where('date').startsWith(prefix).toArray(), [prefix]);

  if (!days) return null;
  const schedule = scheduleSetting?.value || DEFAULT_SCHEDULE;

  const byDate = {};
  (sessions || []).forEach((s) => {
    const info = (byDate[s.date] ??= {});
    if (s.status === 'completed') info.session = 'completed';
    else info.session ??= 'active';
  });
  (rides || []).forEach((r) => { (byDate[r.date] ??= {}).ride = true; });

  const y = month.getFullYear();
  const m = month.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dateOf = (day) => `${y}-${pad(m + 1)}-${pad(day)}`;
  const nav = (delta) => setMonth(new Date(y, m + delta, 1));
  const title = month.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  return (
    <div className="screen">
      <h1 className="large-title">מסלול</h1>
      <p className="subtitle">לוח אימונים, רצפים ורכיבות</p>

      <div className="grid-2">
        <Stat value={streaks ? streaks.current : '—'} label="🔥 רצף נוכחי (ימים)" />
        <Stat value={streaks ? streaks.longest : '—'} label="🏆 רצף שיא (ימים)" />
      </div>

      <div className="section-title">לוח חודשי</div>
      <div className="card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <button className="chip" onClick={() => nav(-1)}>‹ הקודם</button>
          <div className="bold">{title}</div>
          <button className="chip" onClick={() => nav(1)}>הבא ›</button>
        </div>
        <div className="cal-head">
          {CAL_LETTERS.map((l, i) => <span key={i}>{l}</span>)}
        </div>
        <div className="cal-grid">
          {cells.map((day, i) => {
            if (!day) return <span key={`empty-${i}`} />;
            const ds = dateOf(day);
            const info = byDate[ds] || {};
            const scheduledWorkout = (schedule[new Date(y, m, day).getDay()] ?? 'rest') !== 'rest';
            const cls = ['cal-cell'];
            if (ds === today) cls.push('today');
            if (info.session === 'completed') cls.push('done');
            else if (info.session === 'active') cls.push('partial');
            return (
              <button key={ds} className={cls.join(' ')} onClick={() => setSelected(ds)} aria-label={fmtDate(ds)}>
                <span className="num">{day}</span>
                <span className="cal-dots">
                  {info.session && <i className="cal-dot w" />}
                  {info.ride && <i className="cal-dot c" />}
                  {!info.session && !info.ride && scheduledWorkout && ds >= today && <i className="cal-dot s" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="row" style={{ marginTop: 12, gap: 14, flexWrap: 'wrap' }}>
          <span className="tiny row" style={{ gap: 5 }}><i className="cal-dot w" /> אימון</span>
          <span className="tiny row" style={{ gap: 5 }}><i className="cal-dot c" /> רכיבה</span>
          <span className="tiny row" style={{ gap: 5 }}><i className="cal-dot s" /> מתוכנן</span>
        </div>
      </div>

      <div className="section-title">הלוח השבועי שלי</div>
      <div className="list">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="list-row">
            <div className="grow bold" style={{ fontSize: 15 }}>{w}</div>
            <select style={{ width: 180 }} value={schedule[i] ?? 'rest'}
              onChange={(e) => setSetting('schedule', { ...schedule, [i]: e.target.value })}>
              <option value="rest">מנוחה</option>
              {days.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="tiny" style={{ margin: '4px 6px' }}>
        שינוי הלוח משפיע על "האימון של היום" בבית ועל חישוב הרצפים.
      </div>

      {selected && <DaySheet date={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
