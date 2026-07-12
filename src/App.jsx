import React, { useEffect, useState } from 'react';
import { db, seedIfNeeded } from './db/db';
import Dashboard from './components/Dashboard';
import Workouts from './components/Workouts';
import Roadmap from './components/Roadmap';
import Nutrition from './components/Nutrition';
import Weight from './components/Weight';
import Measurements from './components/Measurements';
import History from './components/History';
import Settings from './components/Settings';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const TABS = [
  { id: 'home',      label: 'בית',     icon: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5' },
  { id: 'workouts',  label: 'אימונים', icon: 'M6.5 6.5v11M17.5 6.5v11M2.5 9.5v5M21.5 9.5v5M6.5 12h11' },
  { id: 'roadmap',   label: 'מסלול',   icon: 'M4 5.5h16v15H4zM4 9.5h16M8.5 3v4M15.5 3v4' },
  { id: 'nutrition', label: 'תזונה',   icon: 'M12 3c-4 3.5-6 6.5-6 10a6 6 0 0 0 12 0c0-3.5-2-6.5-6-10ZM12 9v8' },
  { id: 'weight',    label: 'משקל',    icon: 'M4 6h16v14H4zM4 6l2-3h12l2 3M12 13l3-4' },
  { id: 'measure',   label: 'מדידות',  icon: 'M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4' },
  { id: 'history',   label: 'היסטוריה', icon: 'M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 7v5l3.5 2' },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('home');
  const [workoutDay, setWorkoutDay] = useState(null);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const theme = await db.settings.get('theme');
      if (theme?.value && theme.value !== 'auto') document.documentElement.dataset.theme = theme.value;
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  const go = (t, day = null) => { setWorkoutDay(day); setTab(t); window.scrollTo(0, 0); };

  return (
    <>
      {tab === 'home'      && <Dashboard go={go} />}
      {tab === 'workouts'  && <Workouts initialDay={workoutDay} key={workoutDay || 'w'} />}
      {tab === 'roadmap'   && <Roadmap />}
      {tab === 'nutrition' && <Nutrition />}
      {tab === 'weight'    && <Weight />}
      {tab === 'measure'   && <Measurements />}
      {tab === 'history'   && <History />}
      {tab === 'settings'  && <Settings />}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => go(t.id)}>
            <Icon d={t.icon} />
            {t.label}
          </button>
        ))}
        <button className={`tab ${tab === 'settings' ? 'on' : ''}`} onClick={() => go('settings')}>
          <Icon d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />
          עוד
        </button>
      </nav>
    </>
  );
}
