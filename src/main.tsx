import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dev-only global settings button that works on any screen
if (import.meta.env.DEV) {
  const btn = document.createElement('button');
  btn.setAttribute('title', 'Open Settings (dev)');
  btn.className = 'fixed bottom-4 right-4 z-50 p-3 bg-slate-900 text-white rounded-full shadow-lg hover:scale-105 transition-transform';
  btn.style.border = 'none';
  btn.style.cursor = 'pointer';
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.2 4.2l1.4 1.4"/><path d="M18.4 18.4l1.4 1.4"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.2 19.8l1.4-1.4"/><path d="M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="3"/></svg>';
  btn.addEventListener('click', () => window.dispatchEvent(new Event('openDebugSettings')));
  document.body.appendChild(btn);
}

// Register service worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // registration successful
      console.log('Service worker registered:', reg.scope);
    }).catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
