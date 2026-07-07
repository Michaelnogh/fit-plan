import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, setSetting, exportJSON, importJSON, todayStr } from '../db/db';

export default function Settings() {
  const theme = useLiveQuery(() => db.settings.get('theme'), []);
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');

  const setTheme = async (v) => {
    await setSetting('theme', v);
    document.documentElement.dataset.theme = v === 'auto' ? '' : v;
  };

  const doExport = async () => {
    const json = await exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fit-plan-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('הגיבוי ירד לקבצים. שמור אותו במקום בטוח (iCloud Drive מומלץ).');
  };

  const doImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('שחזור ידרוס את כל הנתונים הנוכחיים באפליקציה. להמשיך?')) { e.target.value = ''; return; }
    try {
      await importJSON(await file.text());
      setMsg('השחזור הושלם בהצלחה ✓');
    } catch (err) {
      setMsg(`השחזור נכשל: ${err.message}`);
    }
    e.target.value = '';
  };

  const current = theme?.value || 'auto';

  return (
    <div className="screen">
      <h1 className="large-title">הגדרות</h1>
      <p className="subtitle">Fit Plan · גרסה 1.0 · שימוש אישי</p>

      <div className="section-title">תצוגה</div>
      <div className="card">
        <div className="small" style={{ marginBottom: 10 }}>מצב תצוגה</div>
        <div className="seg">
          {[['auto', 'אוטומטי'], ['light', 'בהיר'], ['dark', 'כהה']].map(([v, l]) => (
            <button key={v} className={current === v ? 'on' : ''} onClick={() => setTheme(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="section-title">גיבוי הנתונים</div>
      <div className="card">
        <p className="small" style={{ lineHeight: 1.5, marginBottom: 14 }}>
          כל הנתונים נשמרים מקומית על המכשיר. מומלץ לייצא גיבוי מדי פעם — במיוחד לפני עדכון iOS.
        </p>
        <button className="btn primary" style={{ width: '100%' }} onClick={doExport}>ייצוא גיבוי (JSON)</button>
        <button className="btn gray" style={{ width: '100%', marginTop: 10 }} onClick={() => fileRef.current?.click()}>
          שחזור מגיבוי
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={doImport} />
        {msg && <div className="small" style={{ marginTop: 12 }}>{msg}</div>}
      </div>

      <div className="section-title">אודות</div>
      <div className="card small" style={{ lineHeight: 1.6 }}>
        האפליקציה נבנתה מקובץ האקסל "תכנית אימון ותזונה" — כל הנתונים המקוריים נשמרו במלואם.
        עובדת גם ללא אינטרנט לאחר ההתקנה.
      </div>
    </div>
  );
}
