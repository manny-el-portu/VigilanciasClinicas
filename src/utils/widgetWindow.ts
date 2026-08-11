import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { isTauriEnvironment } from './tauriWindow';

export const EVENT_DATA_UPDATED = 'vigilancias:data-updated';
export const EVENT_OPEN_NEW_VIGILANCIA = 'vigilancias:open-new-vigilancia';
export const EVENT_WIDGET_VISIBILITY_CHANGED = 'vigilancias:widget-visibility-changed';

export async function openOrCreateWidgetWindow(): Promise<void> {
  if (!isTauriEnvironment()) {
    console.log('[WidgetWindow] openOrCreateWidgetWindow called outside Tauri runtime');
    return;
  }

  try {
    const existing = await WebviewWindow.getByLabel('widget');
    if (existing) {
      await existing.show();
      await existing.unminimize();
      await existing.setFocus();
      return;
    }

    const widget = new WebviewWindow('widget', {
      url: 'index.html',
      title: 'Widget Secretária - Vigilâncias',
      width: 400,
      height: 520,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      center: true,
    });

    widget.once('tauri://created', () => {
      console.log('[WidgetWindow] Widget window created successfully');
    });

    widget.once('tauri://error', (e) => {
      console.error('[WidgetWindow] Error creating widget window:', e);
    });
  } catch (err) {
    console.error('[WidgetWindow] Failed to open/create widget window:', err);
  }
}

export async function hideWidgetWindow(): Promise<void> {
  if (!isTauriEnvironment()) return;

  try {
    const widget = await WebviewWindow.getByLabel('widget');
    if (widget) {
      await widget.hide();
    }
  } catch (err) {
    console.error('[WidgetWindow] Failed to hide widget window:', err);
  }
}

export async function focusMainWindow(): Promise<void> {
  if (!isTauriEnvironment()) return;

  try {
    const main = await WebviewWindow.getByLabel('main');
    if (main) {
      if (await main.isMinimized()) {
        await main.unminimize();
      }
      await main.show();
      await main.setFocus();
    }
  } catch (err) {
    console.error('[WidgetWindow] Failed to focus main window:', err);
  }
}
