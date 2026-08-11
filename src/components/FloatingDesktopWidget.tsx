import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Minimize2,
  Maximize2,
  X,
  ExternalLink,
  Move,
  CheckCircle,
  Copy,
  ChevronRight,
  Sparkles,
  Plus,
  Pin,
  PinOff,
  Minimize
} from 'lucide-react';
import { SurveillanceItem } from '../types';
import { formatSns, getDaysRemaining } from '../utils/storage';
import { setAlwaysOnTop as setNativeAlwaysOnTop, toggleCompactWidgetMode, isTauriEnvironment } from '../utils/tauriWindow';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

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
  const [isAlwaysOnTop, setIsAlwaysOnTopState] = useState(true);
  const [isCompactWindow, setIsCompactWindow] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'overdue' | 'dueSoon'>('dueSoon');

  useEffect(() => {
    if (isOpen) {
      if (isTauriEnvironment()) {
        try {
          const appWindow = getCurrentWebviewWindow();
          appWindow.setAlwaysOnTop(isAlwaysOnTop);
        } catch (e) {
          console.warn('Failed to set initial alwaysOnTop:', e);
        }
      } else {
        setNativeAlwaysOnTop(isAlwaysOnTop);
      }
    }
  }, [isOpen]);

  const handleToggleAlwaysOnTop = async () => {
    const next = !isAlwaysOnTop;
    setIsAlwaysOnTopState(next);
    if (isTauriEnvironment()) {
      try {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setAlwaysOnTop(next);
      } catch (e) {
        console.warn('Tauri setAlwaysOnTop error:', e);
      }
    } else {
      await setNativeAlwaysOnTop(next);
    }
  };

  const handleToggleCompactWindow = async () => {
    const next = !isCompactWindow;
    setIsCompactWindow(next);
    await toggleCompactWidgetMode(next);
  };

  const handleOpenFull = async () => {
    setIsCompactWindow(false);
    await toggleCompactWidgetMode(false);
    onOpenFullApp();
  };

  if (!isOpen) return null;

  // Filter items: Only show items that are pending, overdue or due soon
  const filtered = items.filter((item) => {
    if (item.status === 'realizado') return false;
    const daysLeft = getDaysRemaining(item.targetDate);

    if (filterMode === 'overdue') {
      return daysLeft < 0 || item.status === 'atrasado';
    }
    if (filterMode === 'dueSoon') {
      return daysLeft >= 0 && daysLeft <= 60;
    }
    return true; // all active
  });

  // Sort by target date (nearest first)
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  return (
    <div
      className="w-full h-full flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-300 shadow-2xl transition-all duration-200 overflow-hidden font-sans"
    >
      {/* Widget Drag & Header Bar */}
      <div
        data-tauri-drag-region
        className="bg-zinc-900 text-white px-3.5 py-2.5 flex items-center justify-between select-none cursor-move shrink-0"
      >
        <div data-tauri-drag-region className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-bold font-mono tracking-tight">Widget Vigilâncias</span>
          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
            {sorted.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Always-on-Top Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleAlwaysOnTop();
            }}
            title={
              isAlwaysOnTop
                ? 'Sempre no topo ativado (janela sobre o SClínico e outros programas)'
                : 'Fixar sempre no topo do ambiente de trabalho'
            }
            className={`p-1 rounded transition ${
              isAlwaysOnTop
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {isAlwaysOnTop ? <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-300" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          {/* Compact Native Window Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCompactWindow();
            }}
            title={isCompactWindow ? 'Restaurar Janela Completa' : 'Redimensionar para Janela Flutuante Compacta'}
            className={`p-1 rounded transition ${
              isCompactWindow
                ? 'bg-indigo-500/30 text-indigo-300'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            title={isMinimized ? 'Expandir Widget' : 'Minimizar Widget no ecrã'}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Ocultar Widget"
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>


      {/* Widget Body */}
      {!isMinimized && (
        <div className="p-3 space-y-3">
          {/* Action Row: Nova Vigilância & Filter Tabs */}
          <div className="flex items-center space-x-2">
            {/* Direct New Surveillance Button from Widget */}
            <button
              onClick={onOpenNewModal}
              title="Adicionar nova vigilância sem maximizar a app"
              className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Vigilância</span>
            </button>

            {/* Always-on-top Indicator status */}
            <button
              onClick={handleToggleAlwaysOnTop}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1 border cursor-pointer transition ${
                isAlwaysOnTop
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
              }`}
              title="Clique para alternar o modo Sempre no Topo (janela visível por cima do SClínico / Chrome)"
            >
              <Pin className="w-3 h-3 text-amber-600" />
              <span>{isAlwaysOnTop ? 'Sempre no Topo' : 'Modo Normal'}</span>
            </button>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center justify-between bg-zinc-100 p-1 rounded-lg text-[11px] font-medium">
            <button
              onClick={() => setFilterMode('dueSoon')}
              className={`flex-1 py-1 px-2 rounded-md transition ${
                filterMode === 'dueSoon'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Próximas (60d)
            </button>
            <button
              onClick={() => setFilterMode('overdue')}
              className={`flex-1 py-1 px-2 rounded-md transition ${
                filterMode === 'overdue'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Atrasadas
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1 px-2 rounded-md transition ${
                filterMode === 'all'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Todas
            </button>
          </div>

          {/* List of Surveillance Items: Strictly SNS, Exame and Data Alvo */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-0.5">
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
                      {/* 1. NÚMERO DE SNS */}
                      <span className="font-bold text-zinc-900 text-xs">
                        SNS {formatSns(item.patientSns)}
                      </span>

                      {/* Status / Days badge */}
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
                      {/* 2. EXAME */}
                      <span className="font-semibold text-zinc-800 text-xs truncate max-w-[190px]">
                        {item.examType}
                      </span>

                      {/* 3. DATA ALVO */}
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
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
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

          {/* Footer Action */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-[10px] text-zinc-400">Base de Dados Local</span>
            <button
              onClick={handleOpenFull}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[11px] rounded-lg transition flex items-center space-x-1"
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

