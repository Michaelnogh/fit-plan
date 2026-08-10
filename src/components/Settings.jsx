import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, setSetting, exportJSON, importJSON, todayStr, resetAllData } from '../db/db';
import { Icon } from './ui';

export default function Settings() {
  const theme = useLiveQuery(() => db.settings.get('theme'), []);
  const goal = useLiveQuery(() => db.settings.get('goalWeight'), []);
  const preset = useLiveQuery(() => db.settings.get('shakePreset'), []);
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');

  const current = theme?.value || 'dark';
  const p = preset?.value ?? { protein: 50, creatine: 5, fruit: '' };

  const setTheme = async (v) => {
    await setSetting('theme', v);
    document.documentElement.dataset.theme = v === 'auto' ? '' : v;
  };

  const doExport = async () => {
    const json = await exportJSON();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `fit-plan-backup-${todayStr()}.json`; a.click();
    URL.revokeObjectURL(url);
    setMsg('הגיבוי ירד לקבצים. שמור אותו ב-iCloud Drive.');
  };

  const doImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('שחזור ידרוס את כל הנתונים הנוכחיים. להמשיך?')) { e.target.value = ''; return; }
    try {
      await importJSON(await file.text());
      setMsg('השחזור הושלם.');
    } catch (err) {
      setMsg(`השחזור נכשל: ${err.message}`);
    }
    e.target.value = '';
  };

  return (
    <div className="screen enter">
      <header className="screen-head">
        <h1 className="title-lg">הגדרות</h1>
        <p className="body-2">Fit Plan · גרסה 2.0</p>
      </header>

      <section>
        <span className="eyebrow">יעדים</span>
        <div className="card">
          <label className="field-label">משקל יעד (ק"ג)</label>
          <input type="number" inputMode="decimal" step="0.5" value={goal?.value ?? 70}
            onChange={(e) => setSetting('goalWeight', parseFloat(e.target.value) || 70)} />
          <p className="caption" style={{ marginTop: 8 }}>
            מוצג כקו מקווקו בגרף המשקל וכטבעת ההתקדמות במסך הבית.
          </p>
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">ברירת מחדל לשייק</span>
        <div className="card">
          <div className="grid-2">
            <div>
              <label className="field-label">חלבון (גרם)</label>
              <input type="number" inputMode="decimal" value={p.protein}
                onChange={(e) => setSetting('shakePreset', { ...p, protein: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="field-label">קריאטין (גרם)</label>
              <input type="number" inputMode="decimal" step="0.5" value={p.creatine}
                onChange={(e) => setSetting('shakePreset', { ...p, creatine: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <label className="field-label">פירות קבועים</label>
          <input value={p.fruit} placeholder="לא חובה"
            onChange={(e) => setSetting('shakePreset', { ...p, fruit: e.target.value })} />
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">תצוגה</span>
        <div className="card">
          <div className="seg">
            {[['dark', 'כהה'], ['auto', 'אוטומטי'], ['light', 'בהיר']].map(([v, l]) => (
              <button key={v} className={current === v ? 'on' : ''} onClick={() => setTheme(v)}>{l}</button>
            ))}
          </div>
          <p className="caption" style={{ marginTop: 10 }}>האפליקציה תוכננה למצב כהה.</p>
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">גיבוי</span>
        <div className="card">
          <p className="body-2" style={{ marginBottom: 14 }}>
            הנתונים נשמרים על המכשיר בלבד. ייצא גיבוי מדי פעם — במיוחד לפני עדכון iOS.
          </p>
          <button className="btn primary block" onClick={doExport}>
            <Icon name="note" size={17} /> ייצוא גיבוי
          </button>
          <button className="btn quiet block" style={{ marginTop: 8 }} onClick={() => fileRef.current?.click()}>
            שחזור מגיבוי
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json"
            style={{ display: 'none' }} onChange={doImport} />
          {msg && <p className="body-2" style={{ marginTop: 12 }}>{msg}</p>}
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">שחזור במקרה תקלה</span>
        <div className="card">
          <p className="body-2" style={{ marginBottom: 14 }}>
            אם המסך נטען ריק — נסה לרענן. איפוס יטען מחדש את תוכנית האקסל המקורית
            וימחק שינויים שלא גובו.
          </p>
          <button className="btn danger block" onClick={async () => {
            if (!confirm('פעולה זו תמחק את כל הנתונים המקומיים. להמשיך?')) return;
            await resetAllData();
            window.location.reload();
          }}>
            איפוס נתונים
          </button>
        </div>
      </section>
    </div>
  );
}
