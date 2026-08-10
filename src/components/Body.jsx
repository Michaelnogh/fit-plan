import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, upsertWeight, upsertMeasurement } from '../db/db';
import { MEASUREMENT_FIELDS } from '../db/seedData';
import { Sheet, TrendChart, Delta, Icon, Empty, fmtDate, dayKey, CountUp } from './ui';

const avg = (a) => (a.length ? +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(1) : null);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); };

/* ==================================================================
   משקל
   ================================================================== */
function WeightPane() {
  const entries = useLiveQuery(() => db.weightEntries.orderBy('date').toArray(), []);
  const goalSetting = useLiveQuery(() => db.settings.get('goalWeight'), []);
  const [date, setDate] = useState(todayStr());
  const [val, setVal] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  if (!entries) return null;
  const goal = goalSetting?.value ?? 70;
  const last = entries[entries.length - 1];
  const first = entries[0];
  const prev = entries[entries.length - 2];
  const total = last && first ? +(last.weight - first.weight).toFixed(1) : null;

  const save = async () => {
    const w = parseFloat(val);
    if (!w || !date) return;
    await upsertWeight(date, w);
    setVal('');
  };

  const eA = entries.find((e) => e.date === a);
  const eB = entries.find((e) => e.date === b);

  return (
    <>
      <div className="card">
        <div className="row between top">
          <div>
            <div className="eyebrow">נוכחי</div>
            <div className="metric metric-hero" style={{ marginTop: 6 }}>
              <CountUp to={last?.weight ?? null} /><span className="unit">ק"ג</span>
            </div>
            {total != null && (
              <div className="body-2" style={{ marginTop: 6 }}>
                <span className={`num sn ${total < 0 ? 'good' : total > 0 ? 'bad' : 'dim'}`}>
                  {total > 0 ? '+' : ''}{total}
                </span> מ-{fmtDate(first.date)}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'end' }}>
            <div className="eyebrow">מהמדידה הקודמת</div>
            <div style={{ marginTop: 8 }}>
              <Delta curr={last?.weight} prev={prev?.weight} unit='ק"ג' invert size={16} />
            </div>
            <div className="caption" style={{ marginTop: 10 }}>יעד <span className="num brass">{goal}</span></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <span className="eyebrow">רישום חדש</span>
        <div className="grid-2" style={{ marginTop: 4 }}>
          <div>
            <label className="field-label">תאריך</label>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="field-label">משקל</label>
            <input type="number" inputMode="decimal" step="0.1" placeholder="0.0"
              value={val} onChange={(e) => setVal(e.target.value)} />
          </div>
        </div>
        <button className="btn primary block" style={{ marginTop: 14 }} onClick={save}>שמירה</button>
      </div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="metric metric-lg">{avg(entries.filter((e) => e.date >= daysAgo(7)).map((e) => e.weight)) ?? '—'}</div>
          <div className="caption" style={{ marginTop: 4 }}>ממוצע שבועי</div>
        </div>
        <div className="card">
          <div className="metric metric-lg">{avg(entries.filter((e) => e.date >= daysAgo(30)).map((e) => e.weight)) ?? '—'}</div>
          <div className="caption" style={{ marginTop: 4 }}>ממוצע חודשי</div>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">מגמה</span>
          <span className="caption brass">— — קו היעד</span>
        </div>
        <div className="card tight">
          <TrendChart data={entries.map((e) => ({ date: e.date, value: e.weight }))}
            unit='ק"ג' height={210} goal={goal} />
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">השוואה בין תאריכים</span>
        <div className="card">
          <div className="grid-2">
            <div>
              <label className="field-label">מ־</label>
              <select value={a} onChange={(e) => setA(e.target.value)}>
                <option value="">בחר</option>
                {entries.map((e) => <option key={e.id} value={e.date}>{fmtDate(e.date)} · {e.weight}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">עד</label>
              <select value={b} onChange={(e) => setB(e.target.value)}>
                <option value="">בחר</option>
                {entries.map((e) => <option key={e.id} value={e.date}>{fmtDate(e.date)} · {e.weight}</option>)}
              </select>
            </div>
          </div>
          {eA && eB && (
            <div className="well row between" style={{ marginTop: 14 }}>
              <span className="body-2">שינוי</span>
              <Delta curr={eB.weight} prev={eA.weight} unit='ק"ג' invert size={16} />
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">כל הרישומים</span>
        <div className="list">
          {[...entries].reverse().map((e) => (
            <div key={e.id} className="list-row">
              <span className="grow metric metric-sm">{fmtDate(e.date)}</span>
              <span className="chip ember">{e.weight} ק"ג</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ==================================================================
   מדידות
   ================================================================== */
function MeasureSheet({ initial, onClose }) {
  const [date, setDate] = useState(initial?.date || todayStr());
  const [form, setForm] = useState(() => {
    const f = {};
    MEASUREMENT_FIELDS.forEach(({ key }) => { f[key] = initial?.[key] ?? ''; });
    return f;
  });
  const save = async () => {
    const values = {};
    MEASUREMENT_FIELDS.forEach(({ key }) => {
      values[key] = form[key] === '' || form[key] == null ? null : parseFloat(form[key]);
    });
    await upsertMeasurement(date, values);
    onClose();
  };
  return (
    <Sheet title={initial ? 'עריכת מדידה' : 'מדידה חדשה'} onClose={onClose}>
      <label className="field-label">תאריך</label>
      <input type="date" value={date} max={todayStr()} disabled={!!initial}
        onChange={(e) => setDate(e.target.value)} />
      <div className="grid-2">
        {MEASUREMENT_FIELDS.map(({ key, label, unit }) => (
          <div key={key}>
            <label className="field-label">{label} <span className="dim">({unit})</span></label>
            <input type="number" inputMode="decimal" step="0.1" placeholder="—"
              value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
      </div>
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>שמירה</button>
    </Sheet>
  );
}

function MeasurePane() {
  const rows = useLiveQuery(() => db.measurements.orderBy('date').toArray(), []);
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [chartKey, setChartKey] = useState('chest');

  if (!rows) return null;
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const first = rows[0];
  const field = MEASUREMENT_FIELDS.find((f) => f.key === chartKey);
  const tracked = MEASUREMENT_FIELDS.filter((f) => rows.some((r) => r[f.key] != null));

  return (
    <>
      <button className="btn primary block" onClick={() => setOpen(true)}>
        <Icon name="plus" size={18} /> מדידה חדשה
      </button>

      {latest ? (
        <section className="section">
          <div className="section-head">
            <span className="eyebrow">אחרונה</span>
            <span className="caption num">{fmtDate(latest.date)}</span>
          </div>
          <div className="list">
            {MEASUREMENT_FIELDS.filter((f) => latest[f.key] != null).map(({ key, label, unit }) => (
              <div key={key} className="list-row">
                <span className="grow body">{label}</span>
                <div style={{ textAlign: 'end' }}>
                  <div className="metric metric-md">{latest[key]}<span className="unit">{unit}</span></div>
                  <div className="row" style={{ gap: 10, justifyContent: 'flex-end', marginTop: 2 }}>
                    <span className="caption">קודמת <Delta curr={latest[key]} prev={prev?.[key]} invert /></span>
                    {first !== latest && (
                      <span className="caption">ראשונה <Delta curr={latest[key]} prev={first?.[key]} invert /></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn quiet block sm" style={{ marginTop: 10 }} onClick={() => setEditRow(latest)}>
            עריכת המדידה האחרונה
          </button>
        </section>
      ) : (
        <div className="card" style={{ marginTop: 12 }}><Empty icon="ruler">עוד לא נרשמו מדידות</Empty></div>
      )}

      {tracked.length > 0 && (
        <section className="section">
          <span className="eyebrow">מגמה לפי מדד</span>
          <div className="seg" style={{ marginBottom: 12 }}>
            {tracked.map((f) => (
              <button key={f.key} className={f.key === chartKey ? 'on' : ''} onClick={() => setChartKey(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="card tight">
            <TrendChart
              data={rows.filter((r) => r[chartKey] != null).map((r) => ({ date: r.date, value: r[chartKey] }))}
              unit={field?.unit || ''} height={190} />
          </div>
        </section>
      )}

      <section className="section">
        <span className="eyebrow">כל המדידות</span>
        <div className="list">
          {[...rows].reverse().map((r) => (
            <button key={r.id} className="list-row" onClick={() => setEditRow(r)}>
              <div className="grow">
                <div className="metric metric-sm">{fmtDate(r.date)}</div>
                <div className="caption num" style={{ marginTop: 2 }}>
                  {MEASUREMENT_FIELDS.filter((f) => r[f.key] != null).slice(0, 4)
                    .map((f) => `${f.label} ${r[f.key]}`).join(' · ')}
                </div>
              </div>
              <span className="dim"><Icon name="back" size={16} /></span>
            </button>
          ))}
        </div>
      </section>

      {(open || editRow) && (
        <MeasureSheet initial={editRow} onClose={() => { setOpen(false); setEditRow(null); }} />
      )}
    </>
  );
}

/* ==================================================================
   מסך גוף
   ================================================================== */
export default function Body() {
  const [pane, setPane] = useState('weight');
  return (
    <div className="screen enter">
      <header className="screen-head">
        <h1 className="title-lg">גוף</h1>
        <p className="body-2">משקל ומדידות היקפים</p>
      </header>

      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={pane === 'weight' ? 'on' : ''} onClick={() => setPane('weight')}>משקל</button>
        <button className={pane === 'measure' ? 'on' : ''} onClick={() => setPane('measure')}>מדידות</button>
      </div>

      {pane === 'weight' ? <WeightPane /> : <MeasurePane />}
    </div>
  );
}
