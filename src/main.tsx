import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Silence Three.js Clock deprecation warning until R3F migrates to THREE.Timer
const origWarn = console.warn.bind(console);
console.warn = (...args: any[]) => {
  for (const a of args) {
    if (typeof a === 'string' && a.includes('THREE.Clock')) return;
    if (a?.toString?.().includes?.('THREE.Clock')) return;
  }
  origWarn(...args);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
