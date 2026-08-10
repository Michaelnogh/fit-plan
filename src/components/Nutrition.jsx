import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, toggleMealDone, updateMeal } from '../db/db';
import { Sheet, Check, Icon, dayKey } from './ui';

function MealSheet({ meal, onClose }) {
  const [form, setForm] = useState({
    name: meal.name,
    macros: meal.macros,
    options: meal.options.join('\n'),
    notes: meal.notes || '',
  });
  const save = async () => {
    await updateMeal(meal.id, {
      name: form.name.trim() || meal.name,
      macros: form.macros,
      options: form.options.split('\n').map((s) => s.trim()).filter(Boolean),
      notes: form.notes,
    });
    onClose();
  };
  return (
    <Sheet title="עריכת ארוחה" subtitle={meal.name} onClose={onClose}>
      <label className="field-label">שם</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <label className="field-label">יעדי הארוחה</label>
      <input value={form.macros} onChange={(e) => setForm({ ...form, macros: e.target.value })} />
      <label className="field-label">אפשרויות — שורה לכל אחת</label>
      <textarea rows={9} value={form.options}
        onChange={(e) => setForm({ ...form, options: e.target.value })} />
      <label className="field-label">הערות אישיות</label>
      <textarea rows={2} value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>שמירה</button>
    </Sheet>
  );
}

export default function Nutrition() {
  const today = todayStr();
  const meals = useLiveQuery(() => db.meals.orderBy('order').toArray(), []);
  const logs = useLiveQuery(() => db.mealLogs.where('date').equals(today).toArray(), [today]);
  const notes = useLiveQuery(() => db.settings.get('nutritionNotes'), []);
  const totals = useLiveQuery(() => db.settings.get('dailyTotals'), []);
  const [edit, setEdit] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return dayKey(d); })();
  const weekLogs = useLiveQuery(
    () => db.mealLogs.where('date').between(weekAgo, today + '\uffff').toArray(), [weekAgo, today]);

  if (!meals) return null;
  const doneIds = new Set((logs || []).map((l) => l.mealId));
  const adherence = meals.length ? Math.round(((weekLogs?.length || 0) / (7 * meals.length)) * 100) : 0;
  const t = totals?.value;

  return (
    <div className="screen enter">
      <header className="screen-head">
        <h1 className="title-lg">תזונה</h1>
        <p className="body-2">התפריט היומי שלך</p>
      </header>

      {/* סיכום */}
      <div className="card">
        <div className="row between">
          <div>
            <div className="eyebrow">היום</div>
            <div className="metric metric-lg" style={{ marginTop: 4 }}>
              {doneIds.size}<span className="unit">/{meals.length}</span>
            </div>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div className="eyebrow">עמידה שבועית</div>
            <div className="metric metric-lg" style={{ marginTop: 4 }}>{adherence}<span className="unit">%</span></div>
          </div>
        </div>
        <div className="bar" style={{ marginTop: 14 }}>
          <i style={{ width: `${(doneIds.size / meals.length) * 100}%` }} />
        </div>

        {t && (
          <>
            <div className="divider" style={{ marginTop: 16 }} />
            <div className="grid-4">
              {t.headers.map((h, i) => (
                <div key={h} style={{ textAlign: 'center' }}>
                  <div className="metric metric-md">{t.grams[i]}</div>
                  <div className="caption" style={{ marginTop: 2 }}>{h}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ארוחות */}
      <section className="section">
        <span className="eyebrow">ארוחות</span>
        <div className="stack">
          {meals.map((m) => {
            const done = doneIds.has(m.id);
            const open = expanded === m.id;
            return (
              <div key={m.id} className="card" style={done ? { opacity: .55 } : undefined}>
                <div className="row between">
                  <div className="row grow" style={{ minWidth: 0 }}>
                    <Check on={done} label={`סימון ${m.name}`} onClick={() => toggleMealDone(m.id, today)} />
                    <button className="grow" style={{ textAlign: 'start', minWidth: 0 }}
                      onClick={() => setExpanded(open ? null : m.id)}>
                      <div className="title-sm">{m.name}</div>
                      <div className="caption num" style={{ marginTop: 2 }}>{m.macros}</div>
                    </button>
                  </div>
                  <button className="chip" onClick={() => setExpanded(open ? null : m.id)}>
                    {open ? 'סגור' : `${m.options.length} אפשרויות`}
                  </button>
                </div>

                {open && (
                  <div className="enter" style={{ marginTop: 14 }}>
                    <div className="divider" />
                    <div className="stack" style={{ gap: 8 }}>
                      {m.options.map((op, i) => (
                        <div key={i} className="body-2" style={{ paddingInlineStart: 2 }}>{op}</div>
                      ))}
                    </div>
                    {m.notes && (
                      <div className="well" style={{ marginTop: 12 }}>
                        <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                          <span className="dim"><Icon name="note" size={15} /></span>
                          <span className="body-2 grow">{m.notes}</span>
                        </div>
                      </div>
                    )}
                    <button className="btn quiet block sm" style={{ marginTop: 12 }} onClick={() => setEdit(m)}>
                      עריכה
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* הערות */}
      <section className="section">
        <span className="eyebrow">הנחיות</span>
        <div className="card">
          <div className="stack" style={{ gap: 8 }}>
            {(notes?.value || '').split('\n').filter(Boolean).map((n, i) => (
              <div key={i} className="body-2">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {edit && <MealSheet meal={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}
