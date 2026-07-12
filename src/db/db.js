import Dexie from 'dexie';
import {
  WORKOUT_DAYS, PROGRAM_ENTRIES, MEALS, NUTRITION_NOTES,
  DAILY_TOTALS, BASELINE_MEASUREMENT,
} from './seedData';

// ------------------------------------------------------------------
// סכמת נתונים — כל רשומה נושאת createdAt/updatedAt לצורך סנכרון עתידי
// ------------------------------------------------------------------
export const db = new Dexie('fitPlanDB');

db.version(1).stores({
  workoutDays:    'id, order',
  programEntries: 'id, dayId, order',
  workoutLogs:    '++id, entryId, dayId, date, [entryId+date], [dayId+date]',
  weightHistory:  '++id, entryId, date',
  meals:          'id, order',
  mealLogs:       '++id, date, [mealId+date]',
  weightEntries:  '++id, &date',
  measurements:   '++id, &date',
  settings:       'key',
});

// לוח שבועי ברירת-מחדל: מפתח = יום בשבוע (0=ראשון), ערך = מזהה יום אימון או 'rest'
export const DEFAULT_SCHEDULE = { 0: 'upper', 1: 'lower', 2: 'rest', 3: 'push', 4: 'pull', 5: 'legs', 6: 'rest' };
export const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// גרסה 2: סשני אימון (השלמת אימון יומי), יומן רכיבות ולוח שבועי.
// השדרוג משחזר סשנים מהיסטוריית התרגילים הקיימת כך שהרצפים והלוח עובדים רטרואקטיבית.
db.version(2).stores({
  workoutSessions: '++id, &[dayId+date], date, dayId, status',
  cyclingLogs:     '++id, &date',
}).upgrade(async (tx) => {
  const [logs, entries] = await Promise.all([
    tx.table('workoutLogs').toArray(),
    tx.table('programEntries').toArray(),
  ]);
  const sessions = buildSessionsFromLogs(logs, entries);
  if (sessions.length) await tx.table('workoutSessions').bulkAdd(sessions);
  await tx.table('settings').put({ key: 'schedule', value: DEFAULT_SCHEDULE });
});

// שחזור סשנים מיומן התרגילים — משמש את שדרוג הסכמה וגם שחזור מגיבוי ישן
function buildSessionsFromLogs(logs, entries) {
  const totals = {};
  entries.forEach((e) => { totals[e.dayId] = (totals[e.dayId] || 0) + 1; });
  const groups = {};
  logs.forEach((l) => { (groups[`${l.dayId}|${l.date}`] ??= new Set()).add(l.entryId); });
  const ts = new Date().toISOString();
  return Object.entries(groups).map(([key, ids]) => {
    const [dayId, date] = key.split('|');
    const total = totals[dayId] || 0;
    const completed = total > 0 && ids.size >= total;
    return {
      dayId, date, exercisesDone: ids.size, exercisesTotal: total,
      status: completed ? 'completed' : 'active', manuallyCompleted: false,
      completedAt: completed ? ts : null, createdAt: ts, updatedAt: ts,
    };
  });
}

const now = () => new Date().toISOString();
const fmtYMD = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const parseYMD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayStr = () => fmtYMD(new Date());

// אתחול חד-פעמי: טעינת נתוני האקסל כפי שהם
export async function seedIfNeeded() {
  const done = await db.settings.get('seeded');
  if (done) {
    // רשת ביטחון: ודא שהלוח השבועי קיים גם בבסיסי נתונים ותיקים
    if (!(await db.settings.get('schedule'))) await db.settings.put({ key: 'schedule', value: DEFAULT_SCHEDULE });
    return;
  }
  await db.transaction('rw', db.tables, async () => {
    await db.workoutDays.bulkAdd(WORKOUT_DAYS.map((d) => ({ ...d, createdAt: now(), updatedAt: now() })));
    await db.programEntries.bulkAdd(PROGRAM_ENTRIES.map((e) => ({ ...e, createdAt: now(), updatedAt: now() })));
    await db.meals.bulkAdd(MEALS.map((m) => ({ ...m, notes: '', createdAt: now(), updatedAt: now() })));
    await db.weightEntries.add({ date: BASELINE_MEASUREMENT.date, weight: BASELINE_MEASUREMENT.weight, createdAt: now(), updatedAt: now() });
    await db.measurements.add({ ...BASELINE_MEASUREMENT, createdAt: now(), updatedAt: now() });
    await db.settings.bulkAdd([
      { key: 'seeded', value: true },
      { key: 'nutritionNotes', value: NUTRITION_NOTES.join('\n') },
      { key: 'dailyTotals', value: DAILY_TOTALS },
      { key: 'theme', value: 'auto' },
      { key: 'todayWorkout', value: null }, // { date, dayId } — עקיפה ידנית של הלוח
      { key: 'schedule', value: DEFAULT_SCHEDULE },
    ]);
  });
  // בקשת אחסון קבוע כדי ש-iOS לא ינקה את הנתונים
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
}

// ---------------- אימונים ----------------
export async function updateEntry(id, patch) {
  const entry = await db.programEntries.get(id);
  await db.programEntries.update(id, { ...patch, updatedAt: now() });
  // שינוי משקל עבודה נרשם להיסטוריה
  if ('weight' in patch && patch.weight !== entry.weight && patch.weight != null) {
    await db.weightHistory.add({ entryId: id, date: todayStr(), weight: patch.weight, createdAt: now() });
  }
}

export async function toggleExerciseDone(entry, date) {
  const existing = await db.workoutLogs.where('[entryId+date]').equals([entry.id, date]).first();
  let added;
  if (existing) {
    await db.workoutLogs.delete(existing.id);
    added = false;
  } else {
    await db.workoutLogs.add({
      entryId: entry.id, dayId: entry.dayId, date,
      weight: entry.weight, sets: entry.sets, reps: entry.reps,
      name: entry.name, createdAt: now(),
    });
    added = true;
  }
  await syncSession(entry.dayId, date);
  return added;
}

// ---------------- סשני אימון, רצפים ורכיבה ----------------
// סשן = רשומה אחת לכל (יום אימון, תאריך). מסונכרן אוטומטית עם סימוני התרגילים:
// כל התרגילים סומנו → 'completed'; חלק → 'active'; אף אחד → הסשן נמחק (אלא אם סומן ידנית כהושלם).
async function syncSession(dayId, date) {
  const [doneCount, total, existing] = await Promise.all([
    db.workoutLogs.where('[dayId+date]').equals([dayId, date]).count(),
    db.programEntries.where('dayId').equals(dayId).count(),
    db.workoutSessions.where('[dayId+date]').equals([dayId, date]).first(),
  ]);
  if (!doneCount && !existing?.manuallyCompleted) {
    if (existing) await db.workoutSessions.delete(existing.id);
    return;
  }
  const completed = (total > 0 && doneCount >= total) || !!existing?.manuallyCompleted;
  const patch = {
    exercisesDone: doneCount, exercisesTotal: total,
    status: completed ? 'completed' : 'active',
    completedAt: completed ? (existing?.completedAt || now()) : null,
    updatedAt: now(),
  };
  if (existing) await db.workoutSessions.update(existing.id, patch);
  else await db.workoutSessions.add({ dayId, date, manuallyCompleted: false, ...patch, createdAt: now() });
}

// סימון ידני של אימון כהושלם — למקרה שדולגו תרגילים (למשל שורות "בחר תרגיל")
export async function completeWorkout(dayId, date) {
  const existing = await db.workoutSessions.where('[dayId+date]').equals([dayId, date]).first();
  if (existing) {
    await db.workoutSessions.update(existing.id, {
      status: 'completed', manuallyCompleted: true,
      completedAt: existing.completedAt || now(), updatedAt: now(),
    });
    return;
  }
  const total = await db.programEntries.where('dayId').equals(dayId).count();
  await db.workoutSessions.add({
    dayId, date, exercisesDone: 0, exercisesTotal: total,
    status: 'completed', manuallyCompleted: true,
    completedAt: now(), createdAt: now(), updatedAt: now(),
  });
}

export async function reopenWorkout(dayId, date) {
  const existing = await db.workoutSessions.where('[dayId+date]').equals([dayId, date]).first();
  if (!existing) return;
  if (!existing.exercisesDone) { await db.workoutSessions.delete(existing.id); return; }
  const completed = existing.exercisesDone >= existing.exercisesTotal;
  await db.workoutSessions.update(existing.id, {
    manuallyCompleted: false,
    status: completed ? 'completed' : 'active',
    completedAt: completed ? existing.completedAt : null,
    updatedAt: now(),
  });
}

// רכיבה — רשומה אחת ליום (upsert לפי תאריך), עם ולידציה של הקלט
export async function upsertCycling(date, { distanceKm, durationMin, notes = '' }) {
  const dist = distanceKm === '' || distanceKm == null ? null : Number(distanceKm);
  const dur = durationMin === '' || durationMin == null ? null : Number(durationMin);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('תאריך לא תקין');
  if (date > todayStr()) throw new Error('לא ניתן לרשום רכיבה לתאריך עתידי');
  if (dist != null && (!Number.isFinite(dist) || dist <= 0 || dist > 500)) throw new Error('מרחק לא תקין (עד 500 ק"מ)');
  if (dur != null && (!Number.isFinite(dur) || dur <= 0 || dur > 1440)) throw new Error('משך לא תקין (עד 1440 דקות)');
  if (dist == null && dur == null) throw new Error('יש להזין מרחק או משך רכיבה');
  const patch = { distanceKm: dist, durationMin: dur, notes: String(notes).slice(0, 500), updatedAt: now() };
  const existing = await db.cyclingLogs.where('date').equals(date).first();
  if (existing) await db.cyclingLogs.update(existing.id, patch);
  else await db.cyclingLogs.add({ date, ...patch, createdAt: now() });
}

export async function deleteCycling(date) {
  const existing = await db.cyclingLogs.where('date').equals(date).first();
  if (existing) await db.cyclingLogs.delete(existing.id);
}

// חישוב רצפים מהנתונים עצמם (מקור אמת יחיד — אין מונים כפולים שיכולים להתבלבל).
// יום "פעיל" = סשן שהושלם או רכיבה. יום מנוחה לפי הלוח לא שובר רצף,
// והיום הנוכחי לא שובר רצף כל עוד לא הסתיים.
export async function computeStreaks() {
  const [schedSetting, sessions, cycling] = await Promise.all([
    db.settings.get('schedule'),
    db.workoutSessions.where('status').equals('completed').toArray(),
    db.cyclingLogs.toArray(),
  ]);
  const schedule = schedSetting?.value || DEFAULT_SCHEDULE;
  const isRest = (d) => (schedule[d.getDay()] ?? 'rest') === 'rest';
  const active = new Set([...sessions.map((s) => s.date), ...cycling.map((c) => c.date)]);
  const today = todayStr();

  let current = 0;
  const back = parseYMD(today);
  for (let i = 0; i < 3660; i++) {
    const ds = fmtYMD(back);
    if (active.has(ds)) current++;
    else if (!isRest(back) && i > 0) break;
    back.setDate(back.getDate() - 1);
  }

  let longest = current;
  if (active.size) {
    let run = 0;
    const walk = parseYMD([...active].sort()[0]);
    const end = parseYMD(today);
    while (walk <= end) {
      const ds = fmtYMD(walk);
      if (active.has(ds)) { run++; if (run > longest) longest = run; }
      else if (!isRest(walk) && ds !== today) run = 0;
      walk.setDate(walk.getDate() + 1);
    }
  }
  return { current, longest };
}

// ---------------- תזונה ----------------
export async function toggleMealDone(mealId, date) {
  const existing = await db.mealLogs.where('[mealId+date]').equals([mealId, date]).first();
  if (existing) { await db.mealLogs.delete(existing.id); return false; }
  await db.mealLogs.add({ mealId, date, createdAt: now() });
  return true;
}

export async function updateMeal(id, patch) {
  await db.meals.update(id, { ...patch, updatedAt: now() });
}

// ---------------- משקל ומדידות ----------------
export async function upsertWeight(date, weight) {
  const existing = await db.weightEntries.where('date').equals(date).first();
  if (existing) await db.weightEntries.update(existing.id, { weight, updatedAt: now() });
  else await db.weightEntries.add({ date, weight, createdAt: now(), updatedAt: now() });
  // עדכון משקל גם ברשומת מדידות של אותו יום אם קיימת
  const m = await db.measurements.where('date').equals(date).first();
  if (m) await db.measurements.update(m.id, { weight, updatedAt: now() });
}

export async function upsertMeasurement(date, values) {
  const existing = await db.measurements.where('date').equals(date).first();
  if (existing) await db.measurements.update(existing.id, { ...values, updatedAt: now() });
  else await db.measurements.add({ date, ...values, createdAt: now(), updatedAt: now() });
  if (values.weight != null) await upsertWeight(date, values.weight);
}

// ---------------- הגדרות ----------------
export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

// ---------------- גיבוי ----------------
export async function exportJSON() {
  const dump = {};
  for (const t of db.tables) dump[t.name] = await t.toArray();
  return JSON.stringify({ app: 'fit-plan', version: 2, exportedAt: now(), data: dump }, null, 2);
}

export async function importJSON(text) {
  const parsed = JSON.parse(text);
  if (parsed.app !== 'fit-plan' || !parsed.data) throw new Error('קובץ גיבוי לא תקין');
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) {
      await t.clear();
      if (parsed.data[t.name]?.length) await t.bulkAdd(parsed.data[t.name]);
    }
    // גיבוי ישן (לפני גרסה 2) לא מכיל סשנים — נשחזר אותם מיומן התרגילים
    if (!parsed.data.workoutSessions?.length) {
      const [logs, entries] = await Promise.all([
        db.workoutLogs.toArray(), db.programEntries.toArray(),
      ]);
      const sessions = buildSessionsFromLogs(logs, entries);
      if (sessions.length) await db.workoutSessions.bulkAdd(sessions);
    }
    if (!(await db.settings.get('schedule'))) {
      await db.settings.put({ key: 'schedule', value: DEFAULT_SCHEDULE });
    }
  });
}
