import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, toggleShake, updateShake, setSetting } from '../db/db';
import { Sheet, Icon, ConsistencyGrid, Empty, fmtDate, dayKey } from './ui';

const FRUITS = ['תות', 'בננה', 'מנגו', 'פירות יער', 'אננס', 'אפרסק'];

/* רצף שייקים — ימים רצופים אחורה שבהם נשתה שייק */
function shakeStreak(dates) {
  const set = new Set(dates);
  let n = 0;
  const cur = new Date();
  if (!set.has(dayKey(cur))) cur.setDate(cur.getDate() - 1);
  while (set.has(dayKey(cur))) { n++; cur.setDate(cur.getDate() - 1); }
  return n;
}

/* ------------------------------------------------------------------
   עריכת השייק של היום
   ------------------------------------------------------------------ */
function ShakeSheet({ date, log, preset, onClose }) {
  const [form, setForm] = useState({
    protein: log?.protein ?? preset.protein,
    creatine: log?.creatine ?? preset.creatine,
    fruit: log?.fruit ?? preset.fruit ?? '',
    notes: log?.notes ?? '',
  });

  const save = async () => {
    await updateShake(date, {
      protein: parseFloat(form.protein) || 0,
      creatine: parseFloat(form.creatine) || 0,
      fruit: form.fruit,
      notes: form.notes,
    });
    onClose();
  };

  const saveAsDefault = async () => {
    await setSetting('shakePreset', {
      protein: parseFloat(form.protein) || 0,
      creatine: parseFloat(form.creatine) || 0,
      fruit: form.fruit,
    });
    await save();
  };

  return (
    <Sheet title="השייק של היום" subtitle={fmtDate(date)} onClose={onClose}>
      <div className="grid-2" style={{ marginTop: 8 }}>
        <div>
          <label className="field-label">חלבון (גרם)</label>
          <input type="number" inputMode="decimal" value={form.protein}
            onChange={(e) => setForm({ ...form, protein: e.target.value })} />
        </div>
        <div>
          <label className="field-label">קריאטין (גרם)</label>
          <input type="number" inputMode="decimal" step="0.5" value={form.creatine}
            onChange={(e) => setForm({ ...form, creatine: e.target.value })} />
        </div>
      </div>

      <label className="field-label">פירות קפואים</label>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6, margin: '0 4px' }}>
        {FRUITS.map((f) => (
          <button key={f} className={`chip ${form.fruit === f ? 'ember' : ''}`}
            onClick={() => setForm({ ...form, fruit: form.fruit === f ? '' : f })}>
            {f}
          </button>
        ))}
      </div>
      <input style={{ marginTop: 8 }} value={form.fruit} placeholder="או הקלד משהו אחר"
        onChange={(e) => setForm({ ...form, fruit: e.target.value })} />

      <label className="field-label">הערות</label>
      <textarea rows={2} value={form.notes} placeholder="תוספות, תחושה..."
        onChange={(e) => setForm({ ...form, notes: e.target.value })} />

      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>שמירה</button>
      <button className="btn ghost block" style={{ marginTop: 8 }} onClick={saveAsDefault}>
        שמור גם כברירת מחדל
      </button>
    </Sheet>
  );
}

/* ------------------------------------------------------------------
   מסך שייק
   ------------------------------------------------------------------ */
export default function Shakes() {
  const today = todayStr();
  const [edit, setEdit] = useState(false);
  const logs = useLiveQuery(() => db.shakeLogs.orderBy('date').reverse().toArray(), []);
  const presetSetting = useLiveQuery(() => db.settings.get('shakePreset'), []);

  if (!logs) return null;
  const preset = presetSetting?.value ?? { protein: 50, creatine: 5, fruit: '' };
  const todayLog = logs.find((l) => l.date === today);
  const had = !!todayLog;

  const streak = shakeStreak(logs.map((l) => l.date));
  const counts = {};
  // 7 => הרמה הגבוהה ברשת: מעקב בינארי, או שנשתה או שלא
  logs.forEach((l) => { counts[l.date] = 7; });

  // 30 הימים האחרונים — אחוז עמידה
  const last30 = (() => {
    const d = new Date(); d.setDate(d.getDate() - 29);
    const from = dayKey(d);
    return logs.filter((l) => l.date >= from).length;
  })();

  return (
    <div className="screen enter">
      <header className="screen-head">
        <h1 className="title-lg">שייק</h1>
        <p className="body-2">הרגל הבוקר · חלבון, קריאטין ופירות קפואים</p>
      </header>

      {/* הפעולה המרכזית */}
      <div className="card">
        <div className="row between">
          <div className="grow">
            <div className="eyebrow">היום</div>
            <div className="title-md" style={{ marginTop: 4 }}>
              {had ? 'השייק נשתה' : 'עוד לא נשתה'}
            </div>
            {had && (
              <div className="body-2 num" style={{ marginTop: 4 }}>
                {todayLog.protein} ג׳ חלבון · {todayLog.creatine} ג׳ קריאטין
                {todayLog.fruit ? ` · ${todayLog.fruit}` : ''}
              </div>
            )}
          </div>
          <button
            className={`check ${had ? 'on' : ''}`}
            style={{ width: 52, height: 52, minWidth: 52 }}
            aria-pressed={had}
            aria-label="סימון שייק"
            onClick={() => toggleShake(today, preset)}>
            <Icon name="check" size={24} />
          </button>
        </div>

        {had && (
          <button className="btn quiet block sm" style={{ marginTop: 14 }} onClick={() => setEdit(true)}>
            עריכת המרכיבים
          </button>
        )}
        {!had && (
          <div className="well" style={{ marginTop: 14 }}>
            <div className="row between">
              <span className="caption">ברירת מחדל</span>
              <span className="metric metric-sm">
                {preset.protein} ג׳ · {preset.creatine} ג׳{preset.fruit ? ` · ${preset.fruit}` : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* מדדים */}
      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="row" style={{ gap: 6 }}>
            <span style={{ color: streak > 0 ? 'var(--ember)' : 'var(--text-3)' }}>
              <Icon name="flame" size={17} />
            </span>
            <span className="metric metric-lg">{streak}</span>
          </div>
          <div className="caption" style={{ marginTop: 4 }}>ימים ברצף</div>
        </div>
        <div className="card">
          <div className="metric metric-lg">{last30}<span className="unit">/30</span></div>
          <div className="caption" style={{ marginTop: 4 }}>ב-30 הימים האחרונים</div>
        </div>
      </div>

      {/* רשת עקביות */}
      <section className="section">
        <span className="eyebrow">עקביות</span>
        <div className="card">
          <ConsistencyGrid countsByDate={counts} weeks={13} />
          <div className="heat-legend caption" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
            <span>ללא</span>
            <div className="heat-cell" />
            <div className="heat-cell heat-4" />
            <span>נשתה</span>
          </div>
        </div>
      </section>

      {/* יומן */}
      <section className="section">
        <span className="eyebrow">יומן</span>
        {logs.length ? (
          <div className="list">
            {logs.slice(0, 30).map((l) => (
              <div key={l.id} className="list-row">
                <div className="grow">
                  <div className="metric metric-sm">{fmtDate(l.date)}</div>
                  <div className="caption num">
                    {l.protein} ג׳ חלבון · {l.creatine} ג׳ קריאטין{l.fruit ? ` · ${l.fruit}` : ''}
                  </div>
                  {l.notes && <div className="caption" style={{ marginTop: 2 }}>{l.notes}</div>}
                </div>
                <span className="chip ember"><Icon name="check" size={11} /></span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card"><Empty icon="shake">סמן את השייק הראשון והרצף יתחיל</Empty></div>
        )}
      </section>

      {edit && (
        <ShakeSheet date={today} log={todayLog} preset={preset} onClose={() => setEdit(false)} />
      )}
    </div>
  );
}
