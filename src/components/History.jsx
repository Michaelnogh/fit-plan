import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { TrendChart, ConsistencyGrid, Icon, Empty, fmtDate } from './ui';

export default function History() {
  const weights = useLiveQuery(() => db.weightEntries.orderBy('date').toArray(), []);
  const workoutLogs = useLiveQuery(() => db.workoutLogs.toArray(), []);
  const mealLogs = useLiveQuery(() => db.mealLogs.toArray(), []);
  const shakes = useLiveQuery(() => db.shakeLogs.toArray(), []);
  const days = useLiveQuery(() => db.workoutDays.toArray(), []);
  const entries = useLiveQuery(() => db.programEntries.toArray(), []);
  const goalSetting = useLiveQuery(() => db.settings.get('goalWeight'), []);
  const [exId, setExId] = useState('');

  const exLogs = useLiveQuery(
    () => (exId ? db.workoutLogs.where('entryId').equals(exId).sortBy('date') : Promise.resolve([])),
    [exId]);

  if (!weights || !workoutLogs || !mealLogs || !shakes || !days || !entries) return null;

  const dayName = (id) => days.find((d) => d.id === id)?.name || id;

  const counts = {};
  workoutLogs.forEach((l) => { counts[l.date] = (counts[l.date] || 0) + 1; });

  // ציר זמן מאוחד
  const byDate = {};
  workoutLogs.forEach((l) => {
    byDate[l.date] ??= { workouts: {}, meals: 0, shake: false };
    byDate[l.date].workouts[l.dayId] = (byDate[l.date].workouts[l.dayId] || 0) + 1;
  });
  mealLogs.forEach((l) => {
    byDate[l.date] ??= { workouts: {}, meals: 0, shake: false };
    byDate[l.date].meals++;
  });
  shakes.forEach((s) => {
    byDate[s.date] ??= { workouts: {}, meals: 0, shake: false };
    byDate[s.date].shake = true;
  });
  const timeline = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 40);

  return (
    <div className="screen enter">
      <header className="screen-head">
        <h1 className="title-lg">היסטוריה</h1>
        <p className="body-2">כל מה שנרשם, לפי תאריך</p>
      </header>

      <section>
        <div className="section-head">
          <span className="eyebrow">רשת האימונים</span>
          <span className="caption num">26 שבועות</span>
        </div>
        <div className="card">
          <ConsistencyGrid countsByDate={counts} weeks={26} />
          <div className="heat-legend caption" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
            <span>פחות</span>
            <div className="heat-cell" /><div className="heat-cell heat-1" />
            <div className="heat-cell heat-2" /><div className="heat-cell heat-3" />
            <div className="heat-cell heat-4" />
            <span>יותר</span>
          </div>
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">משקל גוף</span>
        <div className="card tight">
          <TrendChart data={weights.map((e) => ({ date: e.date, value: e.weight }))}
            unit='ק"ג' height={190} goal={goalSetting?.value ?? 70} />
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">משקל עבודה לפי תרגיל</span>
        <div className="card">
          <select value={exId} onChange={(e) => setExId(e.target.value)}>
            <option value="">בחר תרגיל</option>
            {days.map((d) => (
              <optgroup key={d.id} label={d.name}>
                {entries.filter((e) => e.dayId === d.id).map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {exId && (
            <div style={{ marginTop: 12 }}>
              <TrendChart
                data={(exLogs || []).filter((l) => l.weight != null).map((l) => ({ date: l.date, value: l.weight }))}
                unit='ק"ג' height={180} />
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">יומן פעילות</span>
        {timeline.length ? (
          <div className="list">
            {timeline.map(([date, info]) => (
              <div key={date} className="list-row">
                <div className="grow">
                  <div className="metric metric-sm">{fmtDate(date)}</div>
                  <div className="caption" style={{ marginTop: 2 }}>
                    {Object.entries(info.workouts).map(([d, c]) => `${dayName(d)} · ${c} תרגילים`).join(' | ')}
                    {Object.keys(info.workouts).length && info.meals ? ' | ' : ''}
                    {info.meals ? `${info.meals} ארוחות` : ''}
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  {info.shake && <span className="chip"><Icon name="shake" size={11} /></span>}
                  {Object.keys(info.workouts).length > 0 && (
                    <span className="chip ember"><Icon name="dumbbell" size={11} /></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card"><Empty icon="clock">היומן יתמלא כשתתחיל לסמן</Empty></div>
        )}
      </section>
    </div>
  );
}
