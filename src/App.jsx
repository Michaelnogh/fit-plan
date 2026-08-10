import React, { useEffect, useState } from 'react';
import { db, seedIfNeeded } from './db/db';
import { Icon } from './components/ui';
import Dashboard from './components/Dashboard';
import Workouts from './components/Workouts';
import Nutrition from './components/Nutrition';
import Shakes from './components/Shakes';
import Body from './components/Body';
import History from './components/History';
import Records from './components/Records';
import Settings from './components/Settings';

/* ששה טאבים ראשיים; היסטוריה, שיאים והגדרות יושבים תחת "עוד". */
const TABS = [
  { id: 'home',      label: 'בית',    icon: 'home' },
  { id: 'workouts',  label: 'אימונים', icon: 'dumbbell' },
  { id: 'nutrition', label: 'תזונה',  icon: 'apple' },
  { id: 'shake',     label: 'שייק',   icon: 'shake' },
  { id: 'body',      label: 'גוף',    icon: 'body' },
  { id: 'more',      label: 'עוד',    icon: 'more' },
];

const MORE_ITEMS = [
  { id: 'history', label: 'היסטוריה',      desc: 'רשת אימונים, גרפים ויומן', icon: 'clock' },
  { id: 'records', label: 'שיאים אישיים',  desc: 'המשקל הגבוה ביותר בכל תרגיל', icon: 'trophy' },
  { id: 'settings', label: 'הגדרות',       desc: 'יעדים, שייק, גיבוי ותצוגה', icon: 'gear' },
];

function MoreMenu({ go }) {
  return (
    <div className="screen enter">
      <header className="screen-head">
        <h1 className="title-lg">עוד</h1>
      </header>
      <div className="list">
        {MORE_ITEMS.map((m) => (
          <button key={m.id} className="list-row" onClick={() => go(m.id)}>
            <span className="dim"><Icon name={m.icon} size={20} /></span>
            <div className="grow">
              <div className="title-sm">{m.label}</div>
              <div className="caption" style={{ marginTop: 2 }}>{m.desc}</div>
            </div>
            <span className="dim"><Icon name="back" size={16} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SubScreen({ title, onBack, children }) {
  return (
    <>
      <button
        onClick={onBack}
        style={{
          position: 'fixed', insetInlineEnd: 16, top: 'calc(env(safe-area-inset-top) + 14px)',
          zIndex: 40, width: 38, height: 38, borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--hairline)',
          display: 'grid', placeItems: 'center', color: 'var(--text-2)',
        }}
        aria-label={`סגירת ${title}`}>
        <Icon name="close" size={17} />
      </button>
      {children}
    </>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('home');
  const [sub, setSub] = useState(null);
  const [workoutDay, setWorkoutDay] = useState(null);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const theme = await db.settings.get('theme');
      // ברירת המחדל היא כהה; "auto" מכבד את העדפת המערכת.
      const v = theme?.value || 'dark';
      document.documentElement.dataset.theme = v === 'auto' ? '' : v;
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  const go = (target, day = null) => {
    const isSub = MORE_ITEMS.some((m) => m.id === target);
    if (isSub) {
      setSub(target);
    } else {
      setSub(null);
      setWorkoutDay(day);
      setTab(target);
    }
    window.scrollTo(0, 0);
  };

  const back = () => { setSub(null); window.scrollTo(0, 0); };

  let screen;
  if (sub === 'history')       screen = <SubScreen title="היסטוריה" onBack={back}><History /></SubScreen>;
  else if (sub === 'records')  screen = <SubScreen title="שיאים" onBack={back}><Records /></SubScreen>;
  else if (sub === 'settings') screen = <SubScreen title="הגדרות" onBack={back}><Settings /></SubScreen>;
  else if (tab === 'home')      screen = <Dashboard go={go} />;
  else if (tab === 'workouts')  screen = <Workouts key={workoutDay || 'w'} initialDay={workoutDay} />;
  else if (tab === 'nutrition') screen = <Nutrition />;
  else if (tab === 'shake')     screen = <Shakes />;
  else if (tab === 'body')      screen = <Body />;
  else if (tab === 'more')      screen = <MoreMenu go={go} />;

  return (
    <>
      {screen}
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id}
            className={`tab ${tab === t.id && !sub ? 'on' : ''}`}
            onClick={() => go(t.id)}
            aria-current={tab === t.id && !sub ? 'page' : undefined}>
            <Icon name={t.icon} size={22} />
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}
