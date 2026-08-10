import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getCurrentPRs } from '../db/db';
import { PRCard, Icon, Empty, TrendChart, fmtDate } from './ui';

export default function Records() {
  const prs = useLiveQuery(() => getCurrentPRs(), []);
  const all = useLiveQuery(() => db.personalRecords.orderBy('date').toArray(), []);

  if (!prs || !all) return null;

  // סך המשקל שנוסף מאז השיא הראשון בכל תרגיל
  const totalGain = prs.reduce(
    (s, p) => s + (p.previousWeight ? p.weight - p.previousWeight : 0), 0);

  return (
    <div className="screen enter">
      <header className="screen-head">
        <h1 className="title-lg">שיאים אישיים</h1>
        <p className="body-2">המשקל הגבוה ביותר שהרמת בכל תרגיל</p>
      </header>

      {prs.length === 0 ? (
        <div className="card">
          <Empty icon="trophy">
            שיא נרשם אוטומטית כשאתה מסמן תרגיל כהושלם במשקל גבוה מבעבר
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid-2">
            <div className="card">
              <div className="row" style={{ gap: 6 }}>
                <span className="brass"><Icon name="trophy" size={17} /></span>
                <span className="metric metric-lg">{prs.length}</span>
              </div>
              <div className="caption" style={{ marginTop: 4 }}>תרגילים עם שיא</div>
            </div>
            <div className="card">
              <div className="metric metric-lg good">
                <span className="sn">+{totalGain.toFixed(1)}</span><span className="unit">ק"ג</span>
              </div>
              <div className="caption" style={{ marginTop: 4 }}>סך שיפור</div>
            </div>
          </div>

          <section className="section">
            <div className="section-head">
              <span className="eyebrow">שיאים נוכחיים</span>
              <span className="caption num">{prs.length}</span>
            </div>
            <div className="stack">
              {prs.map((p) => <PRCard key={p.id} pr={p} />)}
            </div>
          </section>

          {all.length > 1 && (
            <section className="section">
              <span className="eyebrow">ציר הזמן</span>
              <div className="list">
                {[...all].reverse().map((p) => (
                  <div key={p.id} className="list-row">
                    <span className="brass"><Icon name="trophy" size={16} /></span>
                    <div className="grow">
                      <div className="title-sm">{p.name}</div>
                      <div className="caption num" style={{ marginTop: 2 }}>{fmtDate(p.date)}</div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <div className="metric metric-md brass">{p.weight}<span className="unit">ק"ג</span></div>
                      {p.previousWeight != null && (
                        <div className="caption num good sn">+{+(p.weight - p.previousWeight).toFixed(1)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
