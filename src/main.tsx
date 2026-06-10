import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';

console.log("main.tsx: script starting");
(window as any).appStarted = true;

const updateStatus = (text: string) => {
  console.log("main.tsx status:", text);
  const el = document.getElementById('loading-status');
  if (el) el.innerText = "KB: " + text;
};

const hideInitialLoader = () => {
  const el = document.getElementById('initial-loader');
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 600);
  }
};

async function init() {
  updateStatus("Initializing...");
  try {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = createRoot(rootElement);
      updateStatus("Starting React...");
      
      root.render(
        <App />
      );
      console.log("main.tsx: render initiated");
      
      // Hide loader after a short delay to allow React to mount
      setTimeout(() => {
        updateStatus("Ready");
        hideInitialLoader();
      }, 1000);
    } else {
      throw new Error("Root element not found");
    }
  } catch (err) {
    console.error("main.tsx: init error:", err);
    updateStatus("Critical Init Error");
    hideInitialLoader();
  }
}

// Small delay to ensure index.html script is ready is not needed, call init immediately
init();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('✅ Service Worker registered successfully:', registration.scope);
    }).catch(registrationError => {
      console.log('❌ Service Worker registration failed:', registrationError);
    });
  });
}
