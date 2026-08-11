import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize } from '@tauri-apps/api/dpi';

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function setAlwaysOnTop(onTop: boolean): Promise<boolean> {
  if (isTauriEnvironment()) {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.setAlwaysOnTop(onTop);
      return true;
    } catch (e) {
      console.warn('Tauri setAlwaysOnTop error:', e);
    }
  }
  return false;
}

export async function toggleCompactWidgetMode(compact: boolean): Promise<boolean> {
  if (isTauriEnvironment()) {
    try {
      const appWindow = getCurrentWindow();
      if (compact) {
        await appWindow.setSize(new LogicalSize(420, 720));
        await appWindow.setAlwaysOnTop(true);
      } else {
        await appWindow.setSize(new LogicalSize(1280, 800));
        await appWindow.center();
      }
      return true;
    } catch (e) {
      console.warn('Tauri toggleCompactWidgetMode error:', e);
    }
  }
  return false;
}

export async function minimizeWindow(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (e) {
      console.warn('Tauri minimizeWindow error:', e);
    }
  }
}

export async function hideWindowToTray(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    } catch (e) {
      console.warn('Tauri hideWindowToTray error:', e);
    }
  }
}
