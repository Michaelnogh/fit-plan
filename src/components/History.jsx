import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { TrendChart, fmtDate } from './ui';

export default function History() {
  const weights = useLiveQuery(() => db.weightEntries.orderBy('date').toArray(), []);
  const workoutLogs = useLiveQuery(() => db.workoutLogs.orderBy('date').reverse().toArray(), []);
  const mealLogs = useLiveQuery(() => db.mealLogs.orderBy('date').reverse().toArray(), []);
  const meals = useLiveQuery(() => db.meals.toArray(), []);
  const entries = useLiveQuery(() => db.programEntries.toArray(), []);
  const days = useLiveQuery(() => db.workoutDays.toArray(), []);
  const [exerciseId, setExerciseId] = useState('');
  const exHistory = useLiveQuery(
    () => exerciseId
      ? db.workoutLogs.where('entryId').equals(exerciseId).sortBy('date')
      : Promise.resolve([]),
    [exerciseId]);

  if (!weights || !workoutLogs || !mealLogs || !entries || !days || !meals) return null;

  const dayName = (id) => days.find((d) => d.id === id)?.name || id;
  const mealName = (id) => meals.find((m) => m.id === id)?.name || id;

  // ציר זמן מאוחד לפי תאריך
  const byDate = {};
  workoutLogs.forEach((l) => {
    byDate[l.date] ??= { workouts: {}, meals: 0 };
    byDate[l.date].workouts[l.dayId] = (byDate[l.date].workouts[l.dayId] || 0) + 1;
  });
  mealLogs.forEach((l) => {
    byDate[l.date] ??= { workouts: {}, meals: 0 };
    byDate[l.date].meals += 1;
  });
  const timeline = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);

  const exChart = (exHistory || []).filter((l) => l.weight != null).map((l) => ({ date: l.date, value: l.weight }));

  return (
    <div className="screen">
      <h1 className="large-title">היסטוריה</h1>
      <p className="subtitle">כל שינוי נשמר — התקדמות לפי תאריך</p>

      <div className="section-title">משקל גוף לאורך זמן</div>
      <div className="card chart-card">
        <TrendChart data={weights.map((e) => ({ date: e.date, value: e.weight }))} unit='ק"ג' height={190} />
      </div>

      <div className="section-title">משקל עבודה לפי תרגיל</div>
      <div className="card">
        <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
          <option value="">בחר תרגיל...</option>
          {days.map((d) => (
            <optgroup key={d.id} label={d.name}>
              {entries.filter((e) => e.dayId === d.id).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {exerciseId && (
          <div className="chart-card" style={{ marginTop: 10 }}>
            <TrendChart data={exChart} unit='ק"ג' height={180} color="var(--blue)" />
          </div>
        )}
      </div>

      <div className="section-title">יומן פעילות</div>
      {timeline.length ? (
        <div className="list">
          {timeline.map(([date, info]) => (
            <div key={date} className="list-row">
              <div className="grow">
                <div className="bold num">{fmtDate(date)}</div>
                <div className="small">
                  {Object.entries(info.workouts).map(([d, c]) => `${dayName(d)} (${c} תרגילים)`).join(' · ')}
                  {Object.keys(info.workouts).length && info.meals ? ' · ' : ''}
                  {info.meals ? `${info.meals} ארוחות` : ''}
                </div>
              </div>
              {Object.keys(info.workouts).length > 0 && <span className="chip accent">אימון</span>}
            </div>
          ))}
        </div>
      ) : <div className="empty">היומן יתמלא ברגע שתתחיל לסמן אימונים וארוחות</div>}
    </div>
  );
}
