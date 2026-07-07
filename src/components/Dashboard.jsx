import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, setSetting } from '../db/db';
import { Stat } from './ui';

const heDate = () =>
  new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

function weekRange() {
  // שבוע ישראלי: ראשון–שבת
  const d = new Date();
  const start = new Date(d); start.setDate(d.getDate() - d.getDay()); start.setHours(0, 0, 0, 0);
  const p = (n) => String(n).padStart(2, '0');
  const s = `${start.getFullYear()}-${p(start.getMonth() + 1)}-${p(start.getDate())}`;
  return s;
}

export default function Dashboard({ go }) {
  const today = todayStr();
  const weights = useLiveQuery(() => db.weightEntries.orderBy('date').toArray(), []);
  const days = useLiveQuery(() => db.workoutDays.orderBy('order').toArray(), []);
  const todayWorkoutSetting = useLiveQuery(() => db.settings.get('todayWorkout'), []);
  const mealsDoneToday = useLiveQuery(() => db.mealLogs.where('date').equals(today).count(), [today]);
  const mealsCount = useLiveQuery(() => db.meals.count(), []);
  const weekStart = weekRange();
  const weekLogs = useLiveQuery(
    () => db.workoutLogs.where('date').between(weekStart, today + '\uffff').toArray(), [weekStart, today]);
  const weekMeals = useLiveQuery(
    () => db.mealLogs.where('date').between(weekStart, today + '\uffff').toArray(), [weekStart, today]);
  const entries = useLiveQuery(() => db.programEntries.toArray(), []);
  const todayLogs = useLiveQuery(() => db.workoutLogs.where('date').equals(today).toArray(), [today]);

  if (!weights || !days || !entries) return null;

  const currWeight = weights.length ? weights[weights.length - 1].weight : null;
  const firstWeight = weights.length ? weights[0].weight : null;
  const totalChange = currWeight != null && firstWeight != null ? +(currWeight - firstWeight).toFixed(1) : null;

  // יום האימון של היום — נבחר ידנית ונשמר לתאריך
  const chosen = todayWorkoutSetting?.value?.date === today ? todayWorkoutSetting.value.dayId : null;
  const chosenDay = days.find((d) => d.id === chosen);
  const dayEntries = chosen ? entries.filter((e) => e.dayId === chosen) : [];
  const dayDone = chosen ? (todayLogs || []).filter((l) => l.dayId === chosen).length : 0;

  // אחוז התקדמות שבועי: ימי אימון ייחודיים (מתוך 5) + עמידה בארוחות השבוע
  const trainedDates = new Set((weekLogs || []).map((l) => l.date));
  const dow = new Date().getDay(); // ימים שחלפו השבוע (כולל היום)
  const expectedMeals = (dow + 1) * (mealsCount || 4);
  const mealPct = expectedMeals ? Math.min(100, Math.round(((weekMeals?.length || 0) / expectedMeals) * 100)) : 0;
  const trainPct = Math.min(100, Math.round((trainedDates.size / 5) * 100));
  const weekPct = Math.round((trainPct + mealPct) / 2);

  return (
    <div className="screen">
      <h1 className="large-title">שלום, מיכאל</h1>
      <p className="subtitle">{heDate()}</p>

      <div className="grid-2">
        <Stat
          value={currWeight != null ? `${currWeight} ק"ג` : '—'}
          label="משקל נוכחי"
          delta={totalChange != null ? `${totalChange > 0 ? '+' : ''}${totalChange} ק"ג מההתחלה` : null}
          deltaGood={totalChange != null ? totalChange < 0 : null}
        />
        <Stat value={`${weekPct}%`} label="התקדמות שבועית" delta={`אימונים ${trainedDates.size}/5 · ארוחות ${mealPct}%`} />
      </div>

      <div className="section-title">האימון של היום</div>
      <div className="card">
        {chosenDay ? (
          <>
            <div className="row between">
              <div>
                <div className="exercise-title">{chosenDay.name}</div>
                <div className="small num">{dayDone}/{dayEntries.length} תרגילים הושלמו</div>
              </div>
              <button className="btn soft small" onClick={() => go('workouts', chosen)}>לאימון ←</button>
            </div>
            <div className="bar" style={{ marginTop: 12 }}>
              <i style={{ width: `${dayEntries.length ? (dayDone / dayEntries.length) * 100 : 0}%` }} />
            </div>
          </>
        ) : (
          <>
            <div className="small" style={{ marginBottom: 10 }}>מה מתאמנים היום?</div>
            <div className="seg">
              {days.map((d) => (
                <button key={d.id} onClick={() => setSetting('todayWorkout', { date: today, dayId: d.id })}>
                  {d.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="section-title">התזונה של היום</div>
      <div className="card row between">
        <div>
          <div className="exercise-title num">{mealsDoneToday ?? 0}/{mealsCount ?? 4} ארוחות</div>
          <div className="small">תפריט יומי · 1800 קק"ל</div>
        </div>
        <button className="btn soft small" onClick={() => go('nutrition')}>לתפריט ←</button>
      </div>

      <div className="section-title">קיצורי דרך</div>
      <div className="grid-2">
        <button className="btn gray" onClick={() => go('weight')}>⚖️ הזנת משקל</button>
        <button className="btn gray" onClick={() => go('measure')}>📏 מדידות גוף</button>
        <button className="btn gray" onClick={() => go('history')}>📈 היסטוריה</button>
        <button className="btn gray" onClick={() => go('settings')}>⚙️ הגדרות</button>
      </div>
    </div>
  );
}
