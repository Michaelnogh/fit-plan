import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './fonts.js';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
