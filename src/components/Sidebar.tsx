import React from 'react';
import {
  ListFilter,
  AlertTriangle,
  Clock,
  Users,
  Calendar,
  BookOpen,
  Settings,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  BellRing,
  Target,
  Award
} from 'lucide-react';
import { SurveillanceItem } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  surveillanceItems: SurveillanceItem[];
  onOpenNewModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  surveillanceItems,
  onOpenNewModal,
}) => {
  const overdueCount = surveillanceItems.filter((i) => i.status === 'atrasado').length;
  const dueSoonCount = surveillanceItems.filter((i) => {
    if (i.status === 'atrasado' || i.status === 'realizado') return false;
    const target = new Date(i.targetDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 60;
  }).length;
  const totalActive = surveillanceItems.filter((i) => i.status !== 'realizado').length;

  const surveillanceNavItems = [
    {
      id: 'all',
      label: 'Todas as Vigilâncias',
      icon: ListFilter,
      badge: totalActive > 0 ? totalActive : undefined,
      badgeColor: 'bg-zinc-100 text-zinc-700',
    },
    {
      id: 'overdue',
      label: 'Atrasadas / Urgentes',
      icon: AlertTriangle,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 font-bold',
    },
    {
      id: 'duesoon',
      label: 'Próximos 60 Dias',
      icon: Clock,
      badge: dueSoonCount > 0 ? dueSoonCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 font-medium',
    },
    {
      id: 'patients',
      label: 'Lista de Utentes (SNS)',
      icon: Users,
    },
    {
      id: 'timeline',
      label: 'Cronograma Mensal',
      icon: Calendar,
    },
    {
      id: 'guidelines',
      label: 'Protocolos & Assistente IA',
      icon: BookOpen,
    },
  ];

  const contractNavItems = [
    {
      id: 'indicators',
      label: 'Indicadores USF (IDE)',
      icon: Target,
      badge: '39 Ind.',
      badgeColor: 'bg-indigo-100 text-indigo-800 font-semibold',
      sublabel: 'Portaria 411-A/2023',
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-zinc-50/70 border-r border-zinc-200/80 p-3.5 flex flex-col justify-between shrink-0">
      <div className="space-y-4">
        {/* Quick action button */}
        <button
          onClick={onOpenNewModal}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs rounded-lg text-xs font-semibold transition active:scale-98 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Nova Vigilância</span>
        </button>

        {/* Section 1: Vigilâncias Clínicas Individuais */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Vigilâncias Clínicas
          </p>
          {surveillanceNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-zinc-200/80 text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-zinc-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full border border-zinc-200/60 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Section 2: Desempenho e Contratualização USF (Separated functionality) */}
        <div className="space-y-1 pt-2 border-t border-zinc-200/70">
          <div className="px-2 flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">
              Desempenho da USF
            </p>
            <span className="text-[9px] text-zinc-400 font-medium">Portaria 411-A</span>
          </div>
          {contractNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-950 border border-indigo-200/80 shadow-2xs font-semibold'
                    : 'text-zinc-700 hover:bg-zinc-200/40 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-600' : 'text-indigo-500'
                    }`}
                  />
                  <div className="text-left">
                    <span className="block">{item.label}</span>
                  </div>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full border border-indigo-200 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Section 3: Sistema & Configurações */}
        <div className="space-y-1 pt-2 border-t border-zinc-200/70">
          <p className="px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Geral
          </p>
          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'settings'
                ? 'bg-zinc-200/80 text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Settings
                className={`w-4 h-4 ${
                  activeTab === 'settings' ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-zinc-600'
                }`}
              />
              <span>Configurações</span>
            </div>
          </button>
        </div>
      </div>

      {/* System Card Info */}
      <div className="mt-6 pt-4 border-t border-zinc-200/70 space-y-2">
        <div className="bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs text-xs space-y-2">
          <div className="flex items-center space-x-2 text-zinc-800 font-medium">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Compatibilidade Diário Clínico</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Formatado para diários clínicos e registos de medicina geral e familiar do SNS.
          </p>
          <div className="pt-1 flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Dados SNS Obrigatorios</span>
          </div>
        </div>

        {/* Desktop Tray Banner */}
        <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 flex items-center space-x-2">
          <BellRing className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="leading-tight">
            Executa em 2.º plano no Windows 11 para notificações de prazos.
          </span>
        </div>
      </div>
    </aside>
  );
};
