import React, { useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';

/* ==================================================================
   אייקונים — קו אחיד 1.75, 24x24. משמשים רק היכן שהם משפרים סריקה.
   ================================================================== */
const paths = {
  home:     'M3 10.6 12 3.5l9 7.1M5.5 9.4V20h13V9.4',
  dumbbell: 'M6.5 7v10M17.5 7v10M3 10v4M21 10v4M6.5 12h11',
  apple:    'M12 7.5c-3.4-2.3-7 .3-7 4.3 0 3.4 2.6 7.7 5 7.7 1 0 1.4-.6 2-.6s1 .6 2 .6c2.4 0 5-4.3 5-7.7 0-4-3.6-6.6-7-4.3ZM12 7.5V4.8c0-1 .8-1.8 1.8-1.8',
  shake:    'M7 8h10l-1 12H8L7 8ZM6 8c0-2.2 2.7-4 6-4s6 1.8 6 4M9.5 4.6 10 2M14.5 4.6 14 2',
  body:     'M12 5.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM9 22v-5.5L7.5 13V9a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 16.5 9v4L15 16.5V22',
  more:     'M4 7h16M4 12h16M4 17h10',
  clock:    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3 1.8',
  ruler:    'M3 8.5h18v7H3zM7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v4',
  gear:     'M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8ZM19.2 12c0-.5 0-.9-.1-1.3l2-1.5-2-3.4-2.3.9c-.6-.5-1.3-.9-2-1.2L14.3 3H9.7l-.5 2.5c-.7.3-1.4.7-2 1.2l-2.3-.9-2 3.4 2 1.5c0 .4-.1.8-.1 1.3s0 .9.1 1.3l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2l.5 2.5h4.6l.5-2.5c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.3Z',
  trophy:   'M8 4h8v5a4 4 0 0 1-8 0V4ZM8 5.5H5.5v1A3.5 3.5 0 0 0 9 10M16 5.5h2.5v1A3.5 3.5 0 0 1 15 10M10 13v3h4v-3M8 20h8',
  check:    'M4.5 12.5 9.5 17.5 19.5 7',
  flame:    'M12 21c3.3 0 6-2.4 6-5.6 0-3.9-3.4-5.8-3.4-9.4-2 .8-2.9 2.4-2.9 4.2 0 1.4-1 2-1.8 1.2C9 10.4 9 8.8 9.3 8 7.3 9.4 6 11.9 6 15.4 6 18.6 8.7 21 12 21Z',
  chart:    'M4 19V6M4 19h16M8 16v-4M12 16V9M16 16v-6',
  plus:     'M12 5v14M5 12h14',
  back:     'M9 5l7 7-7 7',
  close:    'M6 6l12 12M18 6L6 18',
  scale:    'M4 7h16M12 7V4.5M6.5 7 4 14a3.2 3.2 0 0 0 5 0L6.5 7ZM17.5 7 15 14a3.2 3.2 0 0 0 5 0L17.5 7ZM9 20h6',
  note:     'M6 3.5h9L19 8v12.5H6zM14.5 3.5V8H19',
};

export function Icon({ name, size = 24, style }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ==================================================================
   תאריכים
   ================================================================== */
export const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, dd] = String(d).split('-');
  return `${dd}.${m}.${String(y).slice(2)}`;
};
export const fmtShort = (d) => {
  if (!d) return '';
  const [, m, dd] = String(d).split('-');
  return `${+dd}.${+m}`;
};
export const dayKey = (dt) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
};

/* ==================================================================
   גיליון מודאלי
   ================================================================== */
export function Sheet({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        {title && <h2 className="title-md">{title}</h2>}
        {subtitle && <p className="body-2" style={{ marginTop: 2 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/* ==================================================================
   סימון ✓
   ================================================================== */
export function Check({ on, onClick, label }) {
  return (
    <button className={`check ${on ? 'on' : ''}`} onClick={onClick} aria-label={label} aria-pressed={on}>
      <Icon name="check" size={15} />
    </button>
  );
}

/* ==================================================================
   טבעת מדד — בסגנון Apple Fitness, נמשכת פעם אחת בטעינה
   ================================================================== */
export function Ring({ value, max, size = 60, stroke = 5, color = 'var(--ember)', label, center }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="ring-wrap">
      <div className="ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
          <circle className="value" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
            stroke={color} strokeDasharray={c} strokeDashoffset={c * (1 - drawn)} />
        </svg>
        <div className="ring-center">{center}</div>
      </div>
      {label && <div className="caption" style={{ textAlign: 'center' }}>{label}</div>}
    </div>
  );
}

/* ==================================================================
   רשת העקביות — אלמנט החתימה של האפליקציה.
   כל עמודה = שבוע, כל תא = יום. עוצמת הגוון = מספר התרגילים שהושלמו.
   ================================================================== */
export function ConsistencyGrid({ countsByDate, weeks = 13, onCellTap }) {
  const today = new Date();
  const cols = [];
  // מיישרים לתחילת שבוע (ראשון) כדי שכל עמודה תהיה שבוע מלא
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);

  for (let w = 0; w < weeks; w++) {
    const cells = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + d);
      const key = dayKey(dt);
      const future = dt > today;
      const n = countsByDate[key] || 0;
      const lvl = future ? 0 : n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4;
      cells.push(
        <div key={key} className={`heat-cell ${lvl ? `heat-${lvl}` : ''}`}
          style={future ? { opacity: .25 } : undefined}
          onClick={() => !future && onCellTap?.(key, n)}
          title={`${fmtDate(key)} · ${n} תרגילים`} />
      );
    }
    cols.push(<div key={w} className="heat-col">{cells}</div>);
  }
  return <div className="grid-heat">{cols}</div>;
}

export function HeatLegend() {
  return (
    <div className="heat-legend caption">
      <span>פחות</span>
      <div className="heat-cell" />
      <div className="heat-cell heat-1" />
      <div className="heat-cell heat-2" />
      <div className="heat-cell heat-3" />
      <div className="heat-cell heat-4" />
      <span>יותר</span>
    </div>
  );
}

/* ==================================================================
   מספר עם ספירה עולה — פעם אחת, רק על מדד ראשי
   ================================================================== */
export function CountUp({ to, decimals = 1, duration = 650 }) {
  const [n, setN] = useState(to);
  const prev = useRef(null);
  useEffect(() => {
    if (to == null) return;
    if (prev.current === null && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const from = 0, t0 = performance.now();
      let raf;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(from + (to - from) * eased);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      prev.current = to;
      return () => cancelAnimationFrame(raf);
    }
    setN(to);
    prev.current = to;
  }, [to, duration]);
  if (to == null) return <>—</>;
  return <>{n.toFixed(decimals)}</>;
}

/* ==================================================================
   הפרש בין שתי מדידות
   ================================================================== */
export function Delta({ curr, prev, unit = '', invert = false, size = 12.5 }) {
  if (curr == null || prev == null) return <span className="caption">—</span>;
  const d = +(curr - prev).toFixed(1);
  if (d === 0) return <span className="caption num">0</span>;
  const good = invert ? d < 0 : d > 0;
  return (
    <span className={good ? 'good' : 'bad'} style={{ fontSize: size, fontWeight: 600 }}>
      <span className="num sn">{d > 0 ? '+' : ''}{d}</span>{unit ? ` ${unit}` : ''}
    </span>
  );
}

/* ==================================================================
   גרף מגמה
   ================================================================== */
export function TrendChart({ data, unit = '', height = 190, color = 'var(--ember)', goal = null }) {
  if (!data?.length) {
    return <div className="empty"><Icon name="chart" /> אין עדיין מספיק נתונים</div>;
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--hairline)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmtShort} tickLine={false} axisLine={false}
            tick={{ fontSize: 10.5, fill: 'var(--text-3)', fontFamily: 'JetBrains Mono' }} minTickGap={24} />
          <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} width={44}
            tick={{ fontSize: 10.5, fill: 'var(--text-3)', fontFamily: 'JetBrains Mono' }} />
          <Tooltip
            formatter={(v) => [`${v}${unit ? ` ${unit}` : ''}`, '']}
            labelFormatter={fmtDate}
            cursor={{ stroke: 'var(--hairline-2)' }}
            contentStyle={{
              background: 'var(--surface)', border: '1px solid var(--hairline)',
              borderRadius: 12, direction: 'rtl', fontSize: 12.5, fontFamily: 'Assistant',
            }}
            itemStyle={{ color: 'var(--text)' }} labelStyle={{ color: 'var(--text-3)' }} />
          {goal != null && (
            <ReferenceLine y={goal} stroke="var(--brass)" strokeDasharray="4 4" strokeWidth={1.25} />
          )}
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0, fill: color }} activeDot={{ r: 4.5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ==================================================================
   שיא אישי — הטיפול הוויזואלי היחיד שמשתמש ב-brass
   ================================================================== */
export function PRCard({ pr }) {
  return (
    <div className="pr-card">
      <div className="row between top">
        <div className="grow">
          <div className="pr-mark"><Icon name="trophy" size={13} /> שיא אישי</div>
          <div className="title-sm" style={{ marginTop: 6 }}>{pr.name}</div>
          <div className="caption num" style={{ marginTop: 2 }}>{fmtDate(pr.date)}</div>
        </div>
        <div style={{ textAlign: 'end' }}>
          <div className="metric metric-lg brass">{pr.weight}<span className="unit">ק"ג</span></div>
          {pr.previousWeight != null && (
            <div className="caption num">קודם {pr.previousWeight} · <span className="good sn">+{+(pr.weight - pr.previousWeight).toFixed(1)}</span></div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   הודעת שיא — מופיעה לרגע אחרי שבירת שיא
   ================================================================== */
export function PRToast({ pr, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [pr, onDone]);
  return (
    <div style={{
      position: 'fixed', insetInline: 16, bottom: 'calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 12px)',
      zIndex: 80, background: 'var(--surface)', border: '1px solid var(--brass-dim)',
      borderRadius: 'var(--r-card)', padding: '14px 16px',
      animation: 'sheet 280ms var(--ease)',
    }}>
      <div className="row">
        <span className="brass"><Icon name="trophy" size={20} /></span>
        <div className="grow">
          <div className="title-sm brass">שיא אישי חדש</div>
          <div className="body-2">{pr.name} · <span className="num">{pr.weight} ק"ג</span>
            {pr.previousWeight ? <span className="num"> (קודם {pr.previousWeight})</span> : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   מצב ריק
   ================================================================== */
export function Empty({ icon = 'chart', children }) {
  return <div className="empty"><Icon name={icon} /> {children}</div>;
}
