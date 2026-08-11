import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import WidgetApp from './WidgetApp.tsx';
import { getCurrentWindowLabel } from './utils/widgetWindow.ts';
import './index.css';

function MainRouter() {
  const [windowLabel, setWindowLabel] = useState<string>(() => getCurrentWindowLabel());

  useEffect(() => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      import('@tauri-apps/api/webviewWindow').then(({ getCurrentWebviewWindow }) => {
        try {
          const win = getCurrentWebviewWindow();
          if (win && win.label) {
            setWindowLabel(win.label);
          }
        } catch (e) {
          console.warn('Erro ao verificar o label da WebviewWindow:', e);
        }
      });
    }
  }, []);

  if (windowLabel === 'widget' || window.location.hash.includes('widget')) {
    return <WidgetApp />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainRouter />
  </StrictMode>,
);
