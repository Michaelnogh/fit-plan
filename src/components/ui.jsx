import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

export function Sheet({ title, onClose, children }) {
  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Check({ on, onClick, label }) {
  return (
    <button className={`check ${on ? 'on' : ''}`} onClick={onClick} aria-label={label} aria-pressed={on}>
      {on ? '✓' : ''}
    </button>
  );
}

export function Stat({ value, label, delta, deltaGood }) {
  return (
    <div className="card stat">
      <div className="val num">{value}</div>
      <div className="lbl">{label}</div>
      {delta != null && (
        <div className={`delta num ${deltaGood == null ? 'muted' : deltaGood ? 'pos' : 'neg'}`}>{delta}</div>
      )}
    </div>
  );
}

const fmtDate = (d) => {
  const [y, m, dd] = String(d).split('-');
  return `${dd}.${m}.${String(y).slice(2)}`;
};

export function TrendChart({ data, dataKey = 'value', unit = '', height = 200, color = 'var(--accent)' }) {
  if (!data?.length) return <div className="empty">אין עדיין נתונים להצגה</div>;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            formatter={(v) => [`${v} ${unit}`, '']}
            labelFormatter={fmtDate}
            contentStyle={{ background: 'var(--card)', border: 'none', borderRadius: 12, boxShadow: 'var(--shadow)', direction: 'rtl', fontSize: 13 }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 0, fill: color }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Delta({ curr, prev, unit = '', invert = false }) {
  if (curr == null || prev == null) return <span className="tiny">—</span>;
  const d = +(curr - prev).toFixed(1);
  if (d === 0) return <span className="tiny num">ללא שינוי</span>;
  const good = invert ? d < 0 : d > 0;
  return (
    <span className={`num bold ${good ? 'pos' : 'neg'}`} style={{ fontSize: 13 }}>
      {d > 0 ? '+' : ''}{d} {unit}
    </span>
  );
}

export { fmtDate };
