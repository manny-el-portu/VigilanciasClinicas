import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Minimize2,
  Maximize2,
  X,
  Copy,
  ChevronRight,
  Plus,
  Pin,
  PinOff
} from 'lucide-react';
import { SurveillanceItem } from '../types';
import { formatSns, getDaysRemaining } from '../utils/storage';
import { isTauriEnv } from '../utils/widgetWindow';

interface FloatingDesktopWidgetProps {
  items: SurveillanceItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpenFullApp: () => void;
  onCopyClinicalNoteSingle: (item: SurveillanceItem) => void;
  onOpenNewModal: () => void;
}

export const FloatingDesktopWidget: React.FC<FloatingDesktopWidgetProps> = ({
  items,
  isOpen,
  onClose,
  onOpenFullApp,
  onCopyClinicalNoteSingle,
  onOpenNewModal,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'overdue' | 'dueSoon'>('dueSoon');

  if (!isOpen) return null;

  const handleToggleAlwaysOnTop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isAlwaysOnTop;
    setIsAlwaysOnTop(nextState);
    if (isTauriEnv()) {
      try {
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        await getCurrentWebviewWindow().setAlwaysOnTop(nextState);
      } catch (err) {
        console.warn('Não foi possível alterar sempre no topo nativamente:', err);
      }
    }
  };

  // Filtrar itens
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

  // Ordenar por data alvo
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  return (
    <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-300 shadow-2xl transition-all duration-200 overflow-hidden font-sans flex flex-col">
      {/* Barra de Título com Região de Arrasto para o SO */}
      <div
        data-tauri-drag-region
        className="bg-zinc-900 text-white px-3.5 py-2.5 flex items-center justify-between select-none cursor-move shrink-0"
      >
        <div data-tauri-drag-region className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span data-tauri-drag-region className="text-xs font-bold font-mono tracking-tight">Widget Vigilâncias</span>
          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
            {sorted.length}
          </span>
        </div>

        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          {/* Alternar Sempre no Topo */}
          <button
            onClick={handleToggleAlwaysOnTop}
            title={
              isAlwaysOnTop
                ? 'Sempre no topo ativado'
                : 'Fixar sempre no topo'
            }
            className={`p-1 rounded transition cursor-pointer ${
              isAlwaysOnTop
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {isAlwaysOnTop ? <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-300" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            title={isMinimized ? 'Expandir Widget' : 'Minimizar Widget'}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition cursor-pointer"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Fechar Widget"
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Corpo do Widget */}
      {!isMinimized && (
        <div className="p-3 space-y-3 flex-1 overflow-hidden flex flex-col">
          {/* Botões Principais */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenNewModal}
              title="Adicionar nova vigilância na aplicação"
              className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Vigilância</span>
            </button>

            <div
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1 border shrink-0 ${
                isAlwaysOnTop
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
            >
              <Pin className="w-3 h-3 text-amber-600" />
              <span>{isAlwaysOnTop ? 'Topo' : 'Normal'}</span>
            </div>
          </div>

          {/* Filtros Rápidos */}
          <div className="flex items-center justify-between bg-zinc-100 p-1 rounded-lg text-[11px] font-medium shrink-0">
            <button
              onClick={() => setFilterMode('dueSoon')}
              className={`flex-1 py-1 px-2 rounded-md transition cursor-pointer ${
                filterMode === 'dueSoon'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Próximas (60d)
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

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-0">
            {sorted.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 italic">
                Sem vigilâncias neste filtro.
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
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-zinc-50/80 border-zinc-200/80 hover:bg-zinc-100/80'
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
                          {daysLeft} dias
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
                        onClick={() => onCopyClinicalNoteSingle(item)}
                        title="Copiar texto formatado"
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs shrink-0">
            <span className="text-[10px] text-zinc-400">Janela Nativa Flutuante</span>
            <button
              onClick={onOpenFullApp}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
            >
              <span>Abrir App Completa</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
