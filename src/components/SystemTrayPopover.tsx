import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Laptop,
  Maximize2,
  Sliders,
  X
} from 'lucide-react';
import { SurveillanceItem } from '../types';
import { formatSns, getDaysRemaining } from '../utils/storage';

interface SystemTrayPopoverProps {
  items: SurveillanceItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpenFullApp: () => void;
  onToggleFloatingWidget: () => void;
  isWidgetOpen: boolean;
}

export const SystemTrayPopover: React.FC<SystemTrayPopoverProps> = ({
  items,
  isOpen,
  onClose,
  onOpenFullApp,
  onToggleFloatingWidget,
  isWidgetOpen,
}) => {
  if (!isOpen) return null;

  const overdueItems = items.filter((i) => i.status === 'atrasado');
  const dueSoonItems = items.filter((i) => {
    if (i.status === 'atrasado' || i.status === 'realizado') return false;
    const daysLeft = getDaysRemaining(i.targetDate);
    return daysLeft >= 0 && daysLeft <= 60;
  });

  return (
    <div className="fixed top-12 right-4 z-50 w-80 bg-white rounded-2xl border border-zinc-300 shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150">
      {/* Tray Header */}
      <div className="bg-zinc-900 text-white p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Laptop className="w-4 h-4 text-emerald-400" />
          <div>
            <h4 className="text-xs font-bold leading-none">Bandeja de Sistema (System Tray)</h4>
            <span className="text-[10px] text-zinc-400 font-mono">Windows 11 Background Service</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tray Content */}
      <div className="p-3.5 space-y-3">
        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
            <span className="block text-rose-800 font-extrabold text-base">{overdueItems.length}</span>
            <span className="text-[10px] text-rose-700 font-medium">Atrasados</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
            <span className="block text-amber-800 font-extrabold text-base">{dueSoonItems.length}</span>
            <span className="text-[10px] text-amber-700 font-medium">Próximos (60d)</span>
          </div>
        </div>

        {/* List preview: SNS, Exame, Data Alvo */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Vigilâncias Prioritárias
          </span>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
            {[...overdueItems, ...dueSoonItems].slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="bg-zinc-50 p-2 rounded-lg border border-zinc-200 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-mono font-bold text-zinc-900 text-[11px]">
                    SNS {formatSns(item.patientSns)}
                  </div>
                  <div className="text-[11px] text-zinc-700 font-medium truncate max-w-[150px]">
                    {item.examType}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {new Date(item.targetDate).toLocaleDateString('pt-PT', { month: '2-digit', year: '2-digit' })}
                  </div>
                  <span className="text-[9px] text-zinc-500">
                    {getDaysRemaining(item.targetDate)}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-zinc-100 space-y-2">
          <button
            onClick={onToggleFloatingWidget}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition ${
              isWidgetOpen
                ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isWidgetOpen ? 'Ocultar Widget Flutuante' : 'Ativar Widget Flutuante de Secretária'}</span>
          </button>

          <button
            onClick={() => {
              onOpenFullApp();
              onClose();
            }}
            className="w-full py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-2xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Abrir Aplicação Completa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
