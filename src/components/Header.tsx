import React from 'react';
import { Plus, Bell, Shield, Laptop, Copy, Check, Search, Calendar, Sliders, Layout } from 'lucide-react';
import { AppSettings, SurveillanceItem } from '../types';
import appLogo from '../assets/images/app_icon_1786371578784.jpg';

interface HeaderProps {
  settings: AppSettings;
  surveillanceItems: SurveillanceItem[];
  onOpenNewModal: () => void;
  onOpenClinicalNoteExport: () => void;
  onToggleTraySim: () => void;
  onToggleAutostart: () => void;
  onToggleFloatingWidget: () => void;
  onToggleSystemTrayPopover: () => void;
  isWidgetOpen: boolean;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  copiedNotice: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  surveillanceItems,
  onOpenNewModal,
  onOpenClinicalNoteExport,
  onToggleTraySim,
  onToggleAutostart,
  onToggleFloatingWidget,
  onToggleSystemTrayPopover,
  isWidgetOpen,
  onSelectTab,
  searchQuery,
  setSearchQuery,
  copiedNotice,
}) => {
  const overdueCount = surveillanceItems.filter(i => i.status === 'atrasado').length;
  const pendingCount = surveillanceItems.filter(i => i.status === 'pendente' || i.status === 'atrasado').length;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-30 transition-all">
      {/* Windows 11 Simulated Top Status Bar */}
      <div className="bg-zinc-900 text-zinc-300 text-xs px-4 py-1.5 flex items-center justify-between font-mono">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            Armazenamento Disco PC: data/vigilancias_db.json
          </span>
          <span className="text-zinc-500">|</span>
          <button
            onClick={onToggleSystemTrayPopover}
            title="Abrir Painel da Bandeja do Sistema (System Tray)"
            className="hover:text-white text-sky-300 font-semibold transition flex items-center space-x-1 focus:outline-none"
          >
            <Laptop className="w-3 h-3 text-sky-400 mr-1" />
            <span>Painel Tray (Windows)</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleFloatingWidget}
            className={`transition flex items-center space-x-1 focus:outline-none ${
              isWidgetOpen ? 'text-amber-300 font-bold' : 'hover:text-white text-zinc-300'
            }`}
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>Widget Secretária:</span>
            <span className={isWidgetOpen ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
              {isWidgetOpen ? 'ABERTO' : 'FECHADO'}
            </span>
          </button>
          <span className="text-zinc-500">|</span>
          <button
            onClick={() => onSelectTab('settings')}
            className="hover:text-white transition flex items-center space-x-1"
          >
            <Bell className="w-3 h-3 text-sky-400" />
            <span>Notificações:</span>
            <span className="text-zinc-200">{settings.desktopNotifications ? 'LIGADAS' : 'DESLIGADAS'}</span>
          </button>
        </div>
      </div>

      {/* Main Clean Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-zinc-200 flex-shrink-0">
            <img
              src={appLogo}
              alt="Vigilâncias Clínicas Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-zinc-900 tracking-tight font-sans">
                Vigilâncias Clínicas
              </h1>
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                Registo Clínico
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Lembretes de vigilâncias médicas regulares (SNS, Idade, Sexo)
            </p>
          </div>
        </div>

        {/* Global Search & Action Buttons */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por SNS, paciente, exame..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-zinc-800 rounded-lg border border-zinc-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition focus:outline-none"
            />
          </div>

          {/* Widget Toggle Button in Header */}
          <button
            onClick={onToggleFloatingWidget}
            title="Ativar/Ocultar Widget Flutuante para a secretária"
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition active:scale-95 ${
              isWidgetOpen
                ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 border-zinc-300/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>Widget Secretária</span>
          </button>

          {/* Clinical Note Export Button */}
          <button
            onClick={onOpenClinicalNoteExport}
            title="Gerar texto formatado para colar no diário clínico"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200/70 border border-zinc-300/60 rounded-lg transition active:scale-95"
          >
            {copiedNotice ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-600" />
                <span className="hidden md:inline">Copiar Registo</span>
                <span className="md:hidden">Registo</span>
              </>
            )}
          </button>


        </div>
      </div>
    </header>
  );
};

