import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, toggleMealDone, updateMeal } from '../db/db';
import { Sheet, Check } from './ui';

function MealEditSheet({ meal, onClose }) {
  const [form, setForm] = useState({
    name: meal.name, macros: meal.macros,
    options: meal.options.join('\n'), notes: meal.notes || '',
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
    <Sheet title={`עריכה — ${meal.name}`} onClose={onClose}>
      <label className="field">שם הארוחה</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <label className="field">יעדי הארוחה (קלוריות ומאקרו)</label>
      <input value={form.macros} onChange={(e) => setForm({ ...form, macros: e.target.value })} />
      <label className="field">אפשרויות (שורה לכל אפשרות — ערוך כמויות ומזונות בחופשיות)</label>
      <textarea rows={9} value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
      <label className="field">הערות אישיות</label>
      <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button className="btn primary" style={{ width: '100%', marginTop: 16 }} onClick={save}>שמירה</button>
    </Sheet>
  );
}

export default function Nutrition() {
  const today = todayStr();
  const meals = useLiveQuery(() => db.meals.orderBy('order').toArray(), []);
  const logs = useLiveQuery(() => db.mealLogs.where('date').equals(today).toArray(), [today]);
  const notes = useLiveQuery(() => db.settings.get('nutritionNotes'), []);
  const totals = useLiveQuery(() => db.settings.get('dailyTotals'), []);
  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 6); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  const weekLogs = useLiveQuery(() => db.mealLogs.where('date').between(weekAgo, today + '\uffff').toArray(), [weekAgo, today]);
  const [edit, setEdit] = useState(null);

  if (!meals) return null;
  const doneIds = new Set((logs || []).map((l) => l.mealId));
  const weekAdherence = Math.round(((weekLogs?.length || 0) / (7 * meals.length)) * 100);

  return (
    <div className="screen">
      <h1 className="large-title">תזונה</h1>
      <p className="subtitle">תפריט תזונה יומי</p>

      {/* סיכום יומי */}
      <div className="card">
        <div className="row between">
          <div className="exercise-title num">היום: {doneIds.size}/{meals.length} ארוחות</div>
          <div className="chip num">עמידה שבועית {weekAdherence}%</div>
        </div>
        <div className="bar" style={{ marginTop: 12 }}>
          <i style={{ width: `${(doneIds.size / meals.length) * 100}%` }} />
        </div>
        {totals?.value && (
          <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
            {totals.value.headers.map((h, i) => (
              <div key={h} style={{ textAlign: 'center' }}>
                <div className="bold num">{totals.value.grams[i]}</div>
                <div className="tiny">{h} · {totals.value.percent[i]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {meals.map((m) => {
        const done = doneIds.has(m.id);
        return (
          <div key={m.id} className={`card ${done ? 'done-strike' : ''}`}>
            <div className="row between">
              <div className="row">
                <Check on={done} label={`סימון ${m.name}`} onClick={() => toggleMealDone(m.id, today)} />
                <div>
                  <div className="exercise-title">{m.name}</div>
                  <div className="tiny num">{m.macros}</div>
                </div>
              </div>
              <button className="btn gray small" onClick={() => setEdit(m)}>עריכה</button>
            </div>
            <div className="divider" />
            {m.options.map((op, i) => (
              <div key={i} className="small" style={{ padding: '4px 2px', lineHeight: 1.45 }}>{op}</div>
            ))}
            {m.notes && <div className="tiny" style={{ marginTop: 8 }}>📝 {m.notes}</div>}
          </div>
        );
      })}

      <div className="section-title">הערות</div>
      <div className="card">
        {(notes?.value || '').split('\n').map((n, i) => (
          <div key={i} className="small" style={{ padding: '3px 0', lineHeight: 1.5 }}>{n}</div>
        ))}
      </div>

      {edit && <MealEditSheet meal={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}
