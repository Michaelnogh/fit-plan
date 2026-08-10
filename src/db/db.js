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

// גרסה 2 — תוספת בלבד. אף טבלה קיימת לא שונתה או נמחקה,
// ולכן שדרוג/חזרה לאחור אינם מסכנים נתונים שנרשמו.
db.version(2).stores({
  shakeLogs:       '++id, &date',
  personalRecords: '++id, name, date, [name+date]',
});

const now = () => new Date().toISOString();
export const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// אתחול חד-פעמי: טעינת נתוני האקסל כפי שהם
// עמיד ל-seed שנקטע באמצע (סגירת אפליקציה, קריסה) — לא ידרוס נתונים קיימים,
// ולא יזרוק שגיאה שתעצור את טעינת React אם חלק מהרשומות כבר קיימות.
export async function seedIfNeeded() {
  try {
    const done = await db.settings.get('seeded');
    if (done) return;

    await db.transaction('rw', db.tables, async () => {
      const putIfEmpty = async (table, rows) => {
        if (await table.count() === 0) await table.bulkAdd(rows);
      };
      await putIfEmpty(db.workoutDays, WORKOUT_DAYS.map((d) => ({ ...d, createdAt: now(), updatedAt: now() })));
      await putIfEmpty(db.programEntries, PROGRAM_ENTRIES.map((e) => ({ ...e, createdAt: now(), updatedAt: now() })));
      await putIfEmpty(db.meals, MEALS.map((m) => ({ ...m, notes: '', createdAt: now(), updatedAt: now() })));

      if (await db.weightEntries.count() === 0) {
        await db.weightEntries.add({ date: BASELINE_MEASUREMENT.date, weight: BASELINE_MEASUREMENT.weight, createdAt: now(), updatedAt: now() });
      }
      if (await db.measurements.count() === 0) {
        await db.measurements.add({ ...BASELINE_MEASUREMENT, createdAt: now(), updatedAt: now() });
      }

      await db.settings.put({ key: 'seeded', value: true });
      if (!await db.settings.get('nutritionNotes')) await db.settings.put({ key: 'nutritionNotes', value: NUTRITION_NOTES.join('\n') });
      if (!await db.settings.get('dailyTotals')) await db.settings.put({ key: 'dailyTotals', value: DAILY_TOTALS });
      if (!await db.settings.get('theme')) await db.settings.put({ key: 'theme', value: 'auto' });
      if (!await db.settings.get('todayWorkout')) await db.settings.put({ key: 'todayWorkout', value: null });
      if (!await db.settings.get('goalWeight')) await db.settings.put({ key: 'goalWeight', value: 70 });
      if (!await db.settings.get('shakePreset')) {
        await db.settings.put({ key: 'shakePreset', value: { protein: 50, creatine: 5, fruit: '' } });
      }
    });
  } catch (err) {
    // לא מפילים את האפליקציה בגלל כשל בזריעה — ממשיכים עם מה שקיים,
    // ומדווחים לקונסול כדי שאפשר יהיה לאתר את הבעיה דרך Web Inspector.
    console.error('seedIfNeeded failed, continuing with existing data:', err);
  }
  // בקשת אחסון קבוע כדי ש-iOS לא ינקה את הנתונים
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
}

// איפוס מלא — לשימוש רק במקרה של DB תקוע/פגום, מכפתור "איפוס נתונים" בהגדרות
export async function resetAllData() {
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
  await db.settings.put({ key: 'seeded', value: false });
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

// מחזיר { done, pr } — pr מאוכלס רק כשנשבר שיא אישי בסימון הזה.
export async function toggleExerciseDone(entry, date) {
  const existing = await db.workoutLogs.where('[entryId+date]').equals([entry.id, date]).first();
  if (existing) {
    await db.workoutLogs.delete(existing.id);
    return { done: false, pr: null };
  }
  await db.workoutLogs.add({
    entryId: entry.id, dayId: entry.dayId, date,
    weight: entry.weight, sets: entry.sets, reps: entry.reps,
    name: entry.name, createdAt: now(),
  });
  const pr = await checkForPR({
    name: entry.name, weight: entry.weight, reps: entry.reps, entryId: entry.id, date,
  });
  return { done: true, pr };
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

// ---------------- שיאים אישיים ----------------
// שיא נרשם כשמסמנים תרגיל כהושלם במשקל גבוה מכל מה שנרשם עד כה לאותו תרגיל.
// ההשוואה לפי *שם* התרגיל, כך שאותה תנועה בימי אימון שונים נספרת יחד.
export async function checkForPR({ name, weight, reps, entryId, date }) {
  if (weight == null || !name) return null;
  const existing = await db.personalRecords.where('name').equals(name).toArray();
  const best = existing.reduce((max, r) => (r.weight > max ? r.weight : max), 0);
  if (weight <= best) return null;
  const id = await db.personalRecords.add({
    name, entryId, weight, reps, date,
    previousWeight: best || null,
    createdAt: now(),
  });
  return { id, name, weight, previousWeight: best || null };
}

// השיא הנוכחי לכל תרגיל (הרשומה בעלת המשקל הגבוה ביותר לכל שם)
export async function getCurrentPRs() {
  const all = await db.personalRecords.toArray();
  const byName = {};
  for (const r of all) {
    if (!byName[r.name] || r.weight > byName[r.name].weight) byName[r.name] = r;
  }
  return Object.values(byName).sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------- שייק יומי ----------------
export async function getShakeToday(date) {
  return db.shakeLogs.where('date').equals(date).first();
}

export async function toggleShake(date, preset) {
  const existing = await db.shakeLogs.where('date').equals(date).first();
  if (existing) {
    await db.shakeLogs.delete(existing.id);
    return false;
  }
  await db.shakeLogs.add({
    date,
    protein: preset?.protein ?? 50,
    creatine: preset?.creatine ?? 5,
    fruit: preset?.fruit ?? '',
    notes: '',
    createdAt: now(), updatedAt: now(),
  });
  return true;
}

export async function updateShake(date, patch) {
  const existing = await db.shakeLogs.where('date').equals(date).first();
  if (existing) await db.shakeLogs.update(existing.id, { ...patch, updatedAt: now() });
  else await db.shakeLogs.add({ date, ...patch, createdAt: now(), updatedAt: now() });
}

// ---------------- גיבוי ----------------
export async function exportJSON() {
  const dump = {};
  for (const t of db.tables) dump[t.name] = await t.toArray();
  return JSON.stringify({ app: 'fit-plan', version: 1, exportedAt: now(), data: dump }, null, 2);
}

export async function importJSON(text) {
  const parsed = JSON.parse(text);
  if (parsed.app !== 'fit-plan' || !parsed.data) throw new Error('קובץ גיבוי לא תקין');
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) {
      await t.clear();
      if (parsed.data[t.name]?.length) await t.bulkAdd(parsed.data[t.name]);
    }
  });
}
