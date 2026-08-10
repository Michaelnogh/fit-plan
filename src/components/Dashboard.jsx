import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, setSetting, getCurrentPRs } from '../db/db';
import {
  Ring, ConsistencyGrid, CountUp, Icon, PRCard, Empty, dayKey, fmtDate,
} from './ui';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 6) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
};

const heDate = () =>
  new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

// תחילת השבוע (ראשון)
const weekStartStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return dayKey(d);
};

// רצף פעילות: ימים רצופים אחורה שבהם נרשמה פעילות כלשהי
function computeStreak(activeDates) {
  let streak = 0;
  const cur = new Date();
  // אם היום עוד לא נרשמה פעילות, מתחילים לספור מאתמול
  if (!activeDates.has(dayKey(cur))) cur.setDate(cur.getDate() - 1);
  while (activeDates.has(dayKey(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

export default function Dashboard({ go }) {
  const today = todayStr();
  const weekStart = weekStartStr();

  const weights = useLiveQuery(() => db.weightEntries.orderBy('date').toArray(), []);
  const days = useLiveQuery(() => db.workoutDays.orderBy('order').toArray(), []);
  const entries = useLiveQuery(() => db.programEntries.toArray(), []);
  const allWorkoutLogs = useLiveQuery(() => db.workoutLogs.toArray(), []);
  const allMealLogs = useLiveQuery(() => db.mealLogs.toArray(), []);
  const allShakes = useLiveQuery(() => db.shakeLogs.toArray(), []);
  const meals = useLiveQuery(() => db.meals.toArray(), []);
  const todayWorkout = useLiveQuery(() => db.settings.get('todayWorkout'), []);
  const goalSetting = useLiveQuery(() => db.settings.get('goalWeight'), []);
  const prs = useLiveQuery(() => getCurrentPRs(), []);

  if (!weights || !days || !entries || !allWorkoutLogs || !allMealLogs || !allShakes || !meals) return null;

  /* ---------- משקל ---------- */
  const curr = weights.length ? weights[weights.length - 1].weight : null;
  const first = weights.length ? weights[0].weight : null;
  const goal = goalSetting?.value ?? 70;
  const change = curr != null && first != null ? +(curr - first).toFixed(1) : null;
  const toGoal = curr != null ? +(curr - goal).toFixed(1) : null;
  const goalProgress =
    curr != null && first != null && first !== goal
      ? Math.max(0, Math.min(1, (first - curr) / (first - goal)))
      : 0;

  /* ---------- טבעות ---------- */
  const weekWorkoutDates = new Set(allWorkoutLogs.filter((l) => l.date >= weekStart).map((l) => l.date));
  const mealsToday = allMealLogs.filter((l) => l.date === today).length;
  const shakeToday = allShakes.some((s) => s.date === today);

  /* ---------- רצף + רשת ---------- */
  const countsByDate = {};
  allWorkoutLogs.forEach((l) => { countsByDate[l.date] = (countsByDate[l.date] || 0) + 1; });
  const activeDates = new Set([
    ...allWorkoutLogs.map((l) => l.date),
    ...allMealLogs.map((l) => l.date),
    ...allShakes.map((s) => s.date),
  ]);
  const streak = computeStreak(activeDates);

  /* ---------- אימון היום ---------- */
  const chosenId = todayWorkout?.value?.date === today ? todayWorkout.value.dayId : null;
  const chosenDay = days.find((d) => d.id === chosenId);
  const dayEntries = chosenId ? entries.filter((e) => e.dayId === chosenId) : [];
  const dayDone = chosenId
    ? allWorkoutLogs.filter((l) => l.date === today && l.dayId === chosenId).length : 0;

  const latestPR = prs?.[0];

  return (
    <div className="screen enter">
      <header className="screen-head">
        <h1 className="title-lg">{greeting()}, מיכאל</h1>
        <p className="body-2">{heDate()}</p>
      </header>

      {/* ---------- מדד ראשי: משקל ---------- */}
      <div className="card">
        <div className="row between top">
          <div>
            <div className="eyebrow">משקל נוכחי</div>
            <div className="metric metric-hero" style={{ marginTop: 6 }}>
              <CountUp to={curr} decimals={1} /><span className="unit">ק"ג</span>
            </div>
            {change != null && (
              <div className="body-2" style={{ marginTop: 6 }}>
                <span className={change < 0 ? 'good' : change > 0 ? 'bad' : 'dim'}>
                  <span className="num sn">{change > 0 ? '+' : ''}{change}</span> ק"ג
                </span> מההתחלה
              </div>
            )}
          </div>
          <div style={{ textAlign: 'end' }}>
            <div className="eyebrow">יעד</div>
            <div className="metric metric-lg brass" style={{ marginTop: 6 }}>
              {goal}<span className="unit">ק"ג</span>
            </div>
            {toGoal != null && (
              <div className="caption num" style={{ marginTop: 4 }}>
                נותרו {Math.max(0, toGoal).toFixed(1)} ק"ג
              </div>
            )}
          </div>
        </div>
        <div className="bar" style={{ marginTop: 16 }}>
          <i style={{ width: `${goalProgress * 100}%` }} />
        </div>
      </div>

      {/* ---------- טבעות ---------- */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent: 'space-around' }}>
          <Ring value={weekWorkoutDates.size} max={5} label="אימונים"
            center={<span className="metric metric-sm" style={{ color: 'var(--text)' }}>
              {weekWorkoutDates.size}/5</span>} />
          <Ring value={mealsToday} max={meals.length} color="var(--good)" label="ארוחות"
            center={<span className="metric metric-sm" style={{ color: 'var(--text)' }}>
              {mealsToday}/{meals.length}</span>} />
          <Ring value={shakeToday ? 1 : 0} max={1} color="var(--warn)" label="שייק"
            center={<span style={{ color: shakeToday ? 'var(--warn)' : 'var(--text-3)' }}>
              <Icon name={shakeToday ? 'check' : 'shake'} size={17} /></span>} />
          <Ring value={goalProgress} max={1} color="var(--brass)" label="ליעד"
            center={<span className="metric metric-sm" style={{ color: 'var(--text)' }}>
              {Math.round(goalProgress * 100)}%</span>} />
        </div>
      </div>

      {/* ---------- אימון היום ---------- */}
      <section className="section">
        <span className="eyebrow">האימון של היום</span>
        {chosenDay ? (
          <div className="card">
            <div className="row between">
              <div className="grow">
                <div className="title-md">{chosenDay.name}</div>
                <div className="body-2 num" style={{ marginTop: 2 }}>
                  {dayDone} מתוך {dayEntries.length} תרגילים
                </div>
              </div>
              <button className="btn primary sm" onClick={() => go('workouts', chosenId)}>
                {dayDone ? 'המשך' : 'התחל'}
              </button>
            </div>
            <div className="bar" style={{ marginTop: 14 }}>
              <i style={{ width: `${dayEntries.length ? (dayDone / dayEntries.length) * 100 : 0}%` }} />
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="body-2" style={{ marginBottom: 10 }}>מה מתאמנים היום?</div>
            <div className="seg">
              {days.map((d) => (
                <button key={d.id}
                  onClick={() => setSetting('todayWorkout', { date: today, dayId: d.id })}>
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ---------- רשת העקביות ---------- */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">עקביות</span>
          <span className="caption num">13 שבועות</span>
        </div>
        <div className="card">
          <div className="row between" style={{ marginBottom: 14, alignItems: 'flex-end' }}>
            <div>
              <div className="row" style={{ gap: 6 }}>
                <span style={{ color: streak > 0 ? 'var(--ember)' : 'var(--text-3)' }}>
                  <Icon name="flame" size={18} />
                </span>
                <span className="metric metric-lg">{streak}</span>
              </div>
              <div className="caption" style={{ marginTop: 2 }}>ימים ברצף</div>
            </div>
            <div style={{ textAlign: 'end' }}>
              <div className="metric metric-lg">{Object.keys(countsByDate).length}</div>
              <div className="caption">אימונים סה"כ</div>
            </div>
          </div>
          <ConsistencyGrid countsByDate={countsByDate} weeks={13} />
          <div style={{ marginTop: 10 }}>
            <div className="heat-legend caption" style={{ justifyContent: 'flex-end' }}>
              <span>פחות</span>
              <div className="heat-cell" /><div className="heat-cell heat-1" />
              <div className="heat-cell heat-2" /><div className="heat-cell heat-3" />
              <div className="heat-cell heat-4" />
              <span>יותר</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- שיא אחרון ---------- */}
      <section className="section">
        <div className="section-head">
          <span className="eyebrow">שיא אחרון</span>
          {prs?.length > 1 && (
            <button className="caption" style={{ color: 'var(--ember)' }} onClick={() => go('records')}>
              כל השיאים
            </button>
          )}
        </div>
        {latestPR ? <PRCard pr={latestPR} /> : (
          <div className="card">
            <Empty icon="trophy">סמן תרגיל כהושלם — השיא הראשון יירשם אוטומטית</Empty>
          </div>
        )}
      </section>
    </div>
  );
}
