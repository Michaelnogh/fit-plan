import React from 'react';
import { resetAllData } from './db/db';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }
  handleReset = async () => {
    if (!confirm('פעולה זו תמחק את כל הנתונים המקומיים ותטען מחדש את נתוני האקסל המקוריים. להמשיך?')) return;
    await resetAllData();
    window.location.reload();
  };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center', direction: 'rtl', fontFamily: '-apple-system, sans-serif' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>האפליקציה נתקלה בתקלה</h1>
        <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.5 }}>
          זה קרה בגלל בעיה בטעינת הנתונים המקומיים. אפשר לנסות לרענן, ואם זה חוזר —
          איפוס הנתונים יטען מחדש את התוכנית המקורית מהאקסל (הגיבוי שלך ב-JSON לא נפגע).
        </p>
        <button onClick={() => window.location.reload()}
          style={{ display: 'block', width: '100%', maxWidth: 320, margin: '0 auto 10px', padding: 14, borderRadius: 12, background: '#FF7A2C', color: '#fff', border: 'none', fontSize: 16, fontWeight: 600 }}>
          רענון
        </button>
        <button onClick={this.handleReset}
          style={{ display: 'block', width: '100%', maxWidth: 320, margin: '0 auto', padding: 14, borderRadius: 12, background: '#eee', color: '#333', border: 'none', fontSize: 16, fontWeight: 600 }}>
          איפוס נתונים וטעינה מחדש
        </button>
      </div>
    );
  }
}
