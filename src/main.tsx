import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import WidgetApp from './WidgetApp.tsx';
import './index.css';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { isTauriEnvironment } from './utils/tauriWindow.ts';

let isWidgetWindow = false;

if (isTauriEnvironment()) {
  try {
    const currentWindow = getCurrentWebviewWindow();
    if (currentWindow && currentWindow.label === 'widget') {
      isWidgetWindow = true;
    }
  } catch (err) {
    console.warn('Could not determine window label:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isWidgetWindow ? <WidgetApp /> : <App />}
  </StrictMode>
);

