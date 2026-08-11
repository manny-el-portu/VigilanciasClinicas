import React, { useState, useEffect } from 'react';
import {
  Calendar,
  AlertTriangle,
  Minimize2,
  Maximize2,
  X,
  Copy,
  ChevronRight,
  Plus,
  Pin,
  PinOff,
  RefreshCw,
  Check
} from 'lucide-react';
import { SurveillanceItem, Patient } from './types';
import {
  fetchDatabaseFromDisk,
  loadSurveillanceItems,
  getDaysRemaining,
  formatSns,
  generateClinicalNoteText,
  resolveItemStatus
} from './utils/storage';
import {
  isTauriEnv,
  focusMainWindow,
  listenDataChanged,
  emitWidgetAction,
} from './utils/widgetWindow';

export default function WidgetApp() {
  const [items, setItems] = useState<SurveillanceItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'all' | 'overdue' | 'dueSoon'>('dueSoon');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const diskData = await fetchDatabaseFromDisk();
      if (diskData && diskData.surveillanceItems) {
        setPatients(diskData.patients || []);
        const leadNotice = diskData.settings?.leadDaysNotice || 30;
        setItems(
          diskData.surveillanceItems.map((item) => ({
            ...item,
            status: resolveItemStatus(item, leadNotice),
          }))
        );
      } else {
        const localItems = loadSurveillanceItems();
        setItems(localItems);
      }
    } catch (err) {
      console.warn('Widget data load error:', err);
      const localItems = loadSurveillanceItems();
      setItems(localItems);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for data-changed event from main window
    let unlisten: (() => void) | null = null;
    listenDataChanged(() => {
      loadData();
    }).then((unlistener) => {
      if (unlistener) unlisten = unlistener;
    });

    // Also listen for localStorage updates
    const handleStorageChange = () => {
      loadData();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (unlisten) unlisten();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle native always-on-top toggle
  const toggleAlwaysOnTop = async () => {
    const nextState = !isAlwaysOnTop;
    setIsAlwaysOnTop(nextState);
    if (isTauriEnv()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().setAlwaysOnTop(nextState);
      } catch (err) {
        console.warn('Could not set alwaysOnTop natively:', err);
      }
    }
  };

  // Close widget window natively
  const handleClose = async () => {
    if (isTauriEnv()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().hide();
      } catch (err) {
        console.warn('Could not hide window natively:', err);
      }
    }
  };

  // Open main app and focus it
  const handleOpenFullApp = async () => {
    await focusMainWindow();
    await emitWidgetAction('open-full-app');
  };

  // Open New Surveillance modal in main app
  const handleOpenNewModal = async () => {
    await focusMainWindow();
    await emitWidgetAction('open-new-modal');
  };

  // Copy clinical note text
  const handleCopyNote = (item: SurveillanceItem) => {
    const patient = patients.find((p) => p.sns === item.patientSns) || {
      sns: item.patientSns,
      sex: item.patientSex,
      age: item.patientAge,
      name: item.patientName,
    };
    const text = generateClinicalNoteText(patient as Patient, [item]);
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);

    setToastMessage('Resumo copiado!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter items
  const filtered = items.filter((item) => {
    if (item.status === 'realizado') return false;
    const daysLeft = getDaysRemaining(item.targetDate);

    if (filterMode === 'overdue') {
      return daysLeft < 0 || item.status === 'atrasado';
    }
    if (filterMode === 'dueSoon') {
      return daysLeft >= 0 && daysLeft <= 60;
    }
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  return (
    <div className="w-full h-screen bg-transparent p-2 flex flex-col justify-start select-none font-sans antialiased">
      <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-zinc-300 shadow-2xl overflow-hidden flex flex-col transition-all duration-200">
        {/* Header Bar with data-tauri-drag-region for OS dragging */}
        <div
          data-tauri-drag-region
          className="bg-zinc-900 text-white px-3.5 py-2.5 flex items-center justify-between cursor-move select-none"
        >
          <div data-tauri-drag-region className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span data-tauri-drag-region className="text-xs font-bold font-mono tracking-tight">
              Vigilâncias
            </span>
            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
              {sorted.length}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={loadData}
              title="Atualizar dados"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
            >
              <RefreshCw className="w-3 h-3" />
            </button>

            <button
              onClick={toggleAlwaysOnTop}
              title={
                isAlwaysOnTop
                  ? 'Sempre no topo ativado'
                  : 'Ativar Sempre no Topo'
              }
              className={`p-1 rounded transition ${
                isAlwaysOnTop
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {isAlwaysOnTop ? (
                <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-300" />
              ) : (
                <PinOff className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Expandir' : 'Minimizar'}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleClose}
              title="Ocultar Widget"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Widget Body */}
        {!isMinimized && (
          <div className="p-3 space-y-2.5 flex-1 overflow-hidden flex flex-col">
            {/* Quick Actions Bar */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenNewModal}
                title="Abrir formulário de nova vigilância"
                className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Vigilância</span>
              </button>

              <button
                onClick={handleOpenFullApp}
                title="Abrir aplicação principal"
                className="py-1.5 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs rounded-lg transition border border-zinc-200 flex items-center space-x-1 cursor-pointer"
              >
                <span>App</span>
                <ChevronRight className="w-3 h-3 text-zinc-500" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between bg-zinc-100 p-1 rounded-lg text-[11px] font-medium">
              <button
                onClick={() => setFilterMode('dueSoon')}
                className={`flex-1 py-1 px-2 rounded-md transition cursor-pointer ${
                  filterMode === 'dueSoon'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Próximas
              </button>
              <button
                onClick={() => setFilterMode('overdue')}
                className={`flex-1 py-1 px-2 rounded-md transition cursor-pointer ${
                  filterMode === 'overdue'
                    ? 'bg-rose-600 text-white shadow-2xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Atrasadas
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1 px-2 rounded-md transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Todas
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-0">
              {sorted.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-400 italic">
                  Sem vigilâncias pendentes para esta vista.
                </div>
              ) : (
                sorted.map((item) => {
                  const daysLeft = getDaysRemaining(item.targetDate);
                  const isOverdue = daysLeft < 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border text-xs transition space-y-1.5 ${
                        isOverdue
                          ? 'bg-rose-50/80 border-rose-200'
                          : 'bg-zinc-50/90 border-zinc-200/80 hover:bg-zinc-100/90'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-zinc-900 text-xs">
                          SNS {formatSns(item.patientSns)}
                        </span>

                        {isOverdue ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Atrasado ({Math.abs(daysLeft)}d)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-zinc-600 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                            {daysLeft}d restantes
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800 text-xs truncate max-w-[190px]">
                          {item.examType}
                        </span>

                        <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">
                          {new Date(item.targetDate).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-200/50">
                        <span>{item.patientSex}, {item.patientAge} anos</span>
                        <button
                          onClick={() => handleCopyNote(item)}
                          title="Copiar texto da nota clínica"
                          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[10px] text-zinc-500">
              <span className="font-mono">Sincronização em tempo real</span>
              <button
                onClick={handleOpenFullApp}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-0.5 cursor-pointer"
              >
                <span>Expandir App</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toast inside Widget */}
      {toastMessage && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-[11px] font-medium flex items-center space-x-1.5 animate-in fade-in zoom-in-95 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
