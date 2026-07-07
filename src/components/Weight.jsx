import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, todayStr, upsertWeight } from '../db/db';
import { TrendChart, fmtDate, Delta } from './ui';

const avg = (arr) => (arr.length ? +(arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1) : null);

export default function Weight() {
  const entries = useLiveQuery(() => db.weightEntries.orderBy('date').toArray(), []);
  const [date, setDate] = useState(todayStr());
  const [val, setVal] = useState('');
  const [cmpA, setCmpA] = useState('');
  const [cmpB, setCmpB] = useState('');

  if (!entries) return null;

  const last = entries[entries.length - 1];
  const first = entries[0];
  const totalChange = last && first ? +(last.weight - first.weight).toFixed(1) : null;

  // ממוצעים
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const weekAvg = avg(entries.filter((e) => e.date >= daysAgo(7)).map((e) => e.weight));
  const monthAvg = avg(entries.filter((e) => e.date >= daysAgo(30)).map((e) => e.weight));

  const save = async () => {
    const w = parseFloat(val);
    if (!w || !date) return;
    await upsertWeight(date, w);
    setVal('');
  };

  const a = entries.find((e) => e.date === cmpA);
  const b = entries.find((e) => e.date === cmpB);

  return (
    <div className="screen">
      <h1 className="large-title">משקל</h1>
      <p className="subtitle">מעקב יומי או שבועי — לפי הקצב שלך</p>

      <div className="card">
        <div className="grid-2">
          <div>
            <label className="field">תאריך</label>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="field">משקל (ק"ג)</label>
            <input type="number" inputMode="decimal" step="0.1" placeholder="לדוגמה 88.4"
              value={val} onChange={(e) => setVal(e.target.value)} />
          </div>
        </div>
        <button className="btn primary" style={{ width: '100%', marginTop: 14 }} onClick={save}>שמירת משקל</button>
      </div>

      <div className="grid-2">
        <div className="card stat">
          <div className="val num">{last ? `${last.weight}` : '—'}</div>
          <div className="lbl">נוכחי (ק"ג)</div>
          {totalChange != null && (
            <div className={`delta num ${totalChange < 0 ? 'pos' : totalChange > 0 ? 'neg' : 'muted'}`}>
              {totalChange > 0 ? '+' : ''}{totalChange} סה"כ מ-{fmtDate(first.date)}
            </div>
          )}
        </div>
        <div className="card stat">
          <div className="val num">{weekAvg ?? '—'}</div>
          <div className="lbl">ממוצע שבועי</div>
          <div className="delta muted num">חודשי: {monthAvg ?? '—'}</div>
        </div>
      </div>

      <div className="section-title">גרף התקדמות</div>
      <div className="card chart-card">
        <TrendChart data={entries.map((e) => ({ date: e.date, value: e.weight }))} unit='ק"ג' height={220} />
      </div>

      <div className="section-title">השוואה בין תאריכים</div>
      <div className="card">
        <div className="grid-2">
          <div>
            <label className="field">תאריך א'</label>
            <select value={cmpA} onChange={(e) => setCmpA(e.target.value)}>
              <option value="">בחר</option>
              {entries.map((e) => <option key={e.id} value={e.date}>{fmtDate(e.date)} — {e.weight} ק"ג</option>)}
            </select>
          </div>
          <div>
            <label className="field">תאריך ב'</label>
            <select value={cmpB} onChange={(e) => setCmpB(e.target.value)}>
              <option value="">בחר</option>
              {entries.map((e) => <option key={e.id} value={e.date}>{fmtDate(e.date)} — {e.weight} ק"ג</option>)}
            </select>
          </div>
        </div>
        {a && b && (
          <div className="row between" style={{ marginTop: 14 }}>
            <span className="small">שינוי בין התאריכים:</span>
            <Delta curr={b.weight} prev={a.weight} unit='ק"ג' invert />
          </div>
        )}
      </div>

      <div className="section-title">כל הרישומים</div>
      <div className="list">
        {[...entries].reverse().map((e) => (
          <div key={e.id} className="list-row">
            <div className="grow bold num">{fmtDate(e.date)}</div>
            <div className="chip num">{e.weight} ק"ג</div>
          </div>
        ))}
      </div>
    </div>
  );
}
