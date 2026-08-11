import { emit, listen, UnlistenFn } from '@tauri-apps/api/event';

// Eventos Tauri padronizados com o domínio da aplicação
export const EVENT_DATA_CHANGED = 'vigilancias://data-changed';
export const EVENT_OPEN_NEW_SURVEILLANCE = 'vigilancias://open-new-surveillance';
export const EVENT_WIDGET_VISIBILITY_CHANGED = 'vigilancias://widget-visibility-changed';

export function isTauriEnv(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function getCurrentWindowLabel(): string {
  if (!isTauriEnv()) return 'main';
  try {
    if (window.location.hash.includes('widget')) return 'widget';
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.metadata?.currentWindow?.label) {
      return internals.metadata.currentWindow.label;
    }
    return 'main';
  } catch (err) {
    console.warn('Não foi possível determinar o label da janela Tauri:', err);
    return 'main';
  }
}

// Criar ou mostrar a janela flutuante independente "widget"
export async function showWidgetWindow(): Promise<boolean> {
  if (!isTauriEnv()) return false;
  try {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    let widgetWin = await WebviewWindow.getByLabel('widget');
    if (widgetWin) {
      await widgetWin.show();
      await widgetWin.setFocus();
    } else {
      widgetWin = new WebviewWindow('widget', {
        url: 'index.html#widget',
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
    }
    await emitWidgetVisibilityChanged(true);
    return true;
  } catch (err) {
    console.error('Erro ao abrir janela do widget:', err);
    return false;
  }
}

// Esconder a janela do widget
export async function hideWidgetWindow(): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const widgetWin = await WebviewWindow.getByLabel('widget');
    if (widgetWin) {
      await widgetWin.hide();
    }
    await emitWidgetVisibilityChanged(false);
  } catch (err) {
    console.error('Erro ao esconder janela do widget:', err);
  }
}

// Focar a janela principal "main"
export async function focusMainWindow(): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const mainWin = await WebviewWindow.getByLabel('main');
    if (mainWin) {
      await mainWin.show();
      await mainWin.unminimize();
      await mainWin.setFocus();
    }
  } catch (err) {
    console.error('Erro ao focar janela principal:', err);
  }
}

// Emitir e escutar alteração de dados
export async function emitDataChanged(): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    await emit(EVENT_DATA_CHANGED);
  } catch (err) {
    console.warn('Falha ao emitir evento data-changed:', err);
  }
}

export async function listenDataChanged(callback: () => void): Promise<UnlistenFn | null> {
  if (!isTauriEnv()) return null;
  try {
    return await listen(EVENT_DATA_CHANGED, () => {
      callback();
    });
  } catch (err) {
    console.warn('Falha ao escutar evento data-changed:', err);
    return null;
  }
}

// Emitir e escutar pedido de nova vigilância
export async function emitOpenNewSurveillance(): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    await emit(EVENT_OPEN_NEW_SURVEILLANCE);
  } catch (err) {
    console.warn('Falha ao emitir pedido de nova vigilância:', err);
  }
}

export async function listenOpenNewSurveillance(callback: () => void): Promise<UnlistenFn | null> {
  if (!isTauriEnv()) return null;
  try {
    return await listen(EVENT_OPEN_NEW_SURVEILLANCE, () => {
      callback();
    });
  } catch (err) {
    console.warn('Falha ao escutar pedido de nova vigilância:', err);
    return null;
  }
}

// Emitir e escutar visibilidade do widget
export async function emitWidgetVisibilityChanged(visible: boolean): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    await emit(EVENT_WIDGET_VISIBILITY_CHANGED, { visible });
  } catch (err) {
    console.warn('Falha ao emitir alteração de visibilidade do widget:', err);
  }
}

export async function listenWidgetVisibilityChanged(callback: (visible: boolean) => void): Promise<UnlistenFn | null> {
  if (!isTauriEnv()) return null;
  try {
    return await listen<{ visible: boolean }>(EVENT_WIDGET_VISIBILITY_CHANGED, (event) => {
      callback(event.payload.visible);
    });
  } catch (err) {
    console.warn('Falha ao escutar alteração de visibilidade do widget:', err);
    return null;
  }
}
