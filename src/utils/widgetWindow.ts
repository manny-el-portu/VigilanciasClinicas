import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import { emit, listen, UnlistenFn } from '@tauri-apps/api/event';

export function isTauriEnv(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function getCurrentWindowLabel(): string {
  if (!isTauriEnv()) return 'main';
  try {
    const win = getCurrentWindow();
    return win.label || 'main';
  } catch (err) {
    console.warn('Could not determine Tauri window label:', err);
    return 'main';
  }
}

export async function showWidgetWindow(): Promise<boolean> {
  if (!isTauriEnv()) return false;
  try {
    let widgetWin = await Window.getByLabel('widget');
    if (widgetWin) {
      await widgetWin.show();
      await widgetWin.setFocus();
      return true;
    } else {
      widgetWin = new Window('widget', {
        title: 'Vigilâncias - Widget',
        width: 380,
        height: 520,
        resizable: false,
        decorations: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        visible: true,
      });
      return true;
    }
  } catch (err) {
    console.error('Failed to show widget window:', err);
    return false;
  }
}

export async function hideWidgetWindow(): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    const widgetWin = await Window.getByLabel('widget');
    if (widgetWin) {
      await widgetWin.hide();
    }
  } catch (err) {
    console.error('Failed to hide widget window:', err);
  }
}

export async function focusMainWindow(): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    const mainWin = await Window.getByLabel('main');
    if (mainWin) {
      await mainWin.show();
      await mainWin.unminimize();
      await mainWin.setFocus();
    }
  } catch (err) {
    console.error('Failed to focus main window:', err);
  }
}

export async function emitDataChanged(): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    await emit('vigilancias://data-changed');
  } catch (err) {
    console.warn('Failed to emit data-changed event:', err);
  }
}

export async function listenDataChanged(callback: () => void): Promise<UnlistenFn | null> {
  if (!isTauriEnv()) return null;
  try {
    return await listen('vigilancias://data-changed', () => {
      callback();
    });
  } catch (err) {
    console.warn('Failed to listen data-changed event:', err);
    return null;
  }
}

export async function emitWidgetAction(action: string, payload?: any): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    await emit(`vigilancias://${action}`, payload);
  } catch (err) {
    console.warn(`Failed to emit widget action ${action}:`, err);
  }
}

export async function listenWidgetAction(action: string, callback: (payload?: any) => void): Promise<UnlistenFn | null> {
  if (!isTauriEnv()) return null;
  try {
    return await listen(`vigilancias://${action}`, (event) => {
      callback(event.payload);
    });
  } catch (err) {
    console.warn(`Failed to listen widget action ${action}:`, err);
    return null;
  }
}
