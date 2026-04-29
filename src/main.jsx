import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Captura o prompt de instalação o mais cedo possível, antes do React montar
window.__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
  // Dispara evento customizado para que componentes já montados possam reagir
  window.dispatchEvent(new Event('pwa-prompt-ready'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)