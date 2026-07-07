import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, upsertMeasurement } from '../db/db';
import { MEASUREMENT_FIELDS } from '../db/seedData';
import { Sheet, TrendChart, fmtDate, Delta } from './ui';

function MeasureForm({ initial, onClose }) {
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
      <label className="field">תאריך</label>
      <input type="date" value={date} max={todayStr()} disabled={!!initial}
        onChange={(e) => setDate(e.target.value)} />
      <div className="grid-2">
        {MEASUREMENT_FIELDS.map(({ key, label, unit }) => (
          <div key={key}>
            <label className="field">{label} ({unit})</label>
            <input type="number" inputMode="decimal" step="0.1" value={form[key] ?? ''}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
      </div>
      <button className="btn primary" style={{ width: '100%', marginTop: 18 }} onClick={save}>שמירת מדידה</button>
    </Sheet>
  );
}

export default function Measurements() {
  const rows = useLiveQuery(() => db.measurements.orderBy('date').toArray(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [chartKey, setChartKey] = useState('weight');

  if (!rows) return null;
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const first = rows[0];
  const field = MEASUREMENT_FIELDS.find((f) => f.key === chartKey);
  const chartData = rows.filter((r) => r[chartKey] != null).map((r) => ({ date: r.date, value: r[chartKey] }));

  return (
    <div className="screen">
      <h1 className="large-title">מדידות גוף</h1>
      <p className="subtitle">{rows.length} מדידות · אחרונה {latest ? fmtDate(latest.date) : '—'}</p>

      <button className="btn primary" style={{ width: '100%', marginBottom: 16 }} onClick={() => setFormOpen(true)}>
        + מדידה חדשה
      </button>

      {latest && (
        <>
          <div className="section-title">המדידה האחרונה — {fmtDate(latest.date)}</div>
          <div className="list">
            {MEASUREMENT_FIELDS.filter((f) => latest[f.key] != null).map(({ key, label, unit }) => (
              <div key={key} className="list-row">
                <div className="grow">{label}</div>
                <div style={{ textAlign: 'left' }}>
                  <div className="bold num">{latest[key]} {unit}</div>
                  <div className="row" style={{ gap: 10, justifyContent: 'flex-end' }}>
                    <span className="tiny">מהקודמת: <Delta curr={latest[key]} prev={prev?.[key]} invert /></span>
                    {first !== latest && (
                      <span className="tiny">מהראשונה: <Delta curr={latest[key]} prev={first?.[key]} invert /></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn gray small" onClick={() => setEditRow(latest)}>עריכת המדידה האחרונה</button>
        </>
      )}

      <div className="section-title">גרף לפי מדד</div>
      <div className="seg" style={{ marginBottom: 10 }}>
        {MEASUREMENT_FIELDS.filter((f) => rows.some((r) => r[f.key] != null)).map((f) => (
          <button key={f.key} className={f.key === chartKey ? 'on' : ''} onClick={() => setChartKey(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="card chart-card">
        <TrendChart data={chartData} unit={field?.unit || ''} height={200} />
      </div>

      <div className="section-title">כל המדידות</div>
      <div className="list">
        {[...rows].reverse().map((r) => (
          <div key={r.id} className="list-row" onClick={() => setEditRow(r)} style={{ cursor: 'pointer' }}>
            <div className="grow">
              <div className="bold num">{fmtDate(r.date)}</div>
              <div className="tiny num">
                {MEASUREMENT_FIELDS.filter((f) => r[f.key] != null)
                  .slice(0, 4).map((f) => `${f.label} ${r[f.key]}`).join(' · ')}
              </div>
            </div>
            <span className="tiny">עריכה ←</span>
          </div>
        ))}
      </div>

      {(formOpen || editRow) && (
        <MeasureForm initial={editRow} onClose={() => { setFormOpen(false); setEditRow(null); }} />
      )}
    </div>
  );
}
