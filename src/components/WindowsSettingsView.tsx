import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Bell,
  Volume2,
  Shield,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Play,
  RefreshCw,
  Info,
  Check
} from 'lucide-react';
import { AppSettings } from '../types';
import { enable as enableAutostart, disable as disableAutostart, isEnabled as isAutostartEnabled } from '@tauri-apps/plugin-autostart';

interface WindowsSettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTestNotification: () => void;
}

export const WindowsSettingsView: React.FC<WindowsSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onTestNotification,
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isTauriEnv, setIsTauriEnv] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function checkTauriAutostart() {
      try {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const enabled = await isAutostartEnabled();
          if (isMounted) {
            setIsTauriEnv(true);
            onUpdateSettings({ ...settings, autostartWindows: enabled });
          }
        }
      } catch (e) {
        // Web mode fallback
      }
    }
    checkTauriAutostart();
    return () => { isMounted = false; };
  }, []);

  const handleToggleAutostart = async (checked: boolean) => {
    onUpdateSettings({ ...settings, autostartWindows: checked });
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        if (checked) {
          await enableAutostart();
        } else {
          await disableAutostart();
        }
      }
    } catch (err) {
      console.error('Tauri autostart error:', err);
    }
  };

  const requestWebNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      if (result === 'granted') {
        onUpdateSettings({ ...settings, desktopNotifications: true });
        onTestNotification();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-2">
        <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
          <Laptop className="w-4 h-4" />
          <span>Configuração de Sistema Windows 11 & Notificações</span>
        </div>
        <h2 className="text-base font-bold text-zinc-900 tracking-tight">
          Arranque Automático com o Computador & Bandeja do Sistema (System Tray)
        </h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Configure o comportamento em segundo plano da aplicação para complementar o seu fluxo de trabalho clínico.
        </p>
      </div>

      {/* Section 1: Windows 11 Startup */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center">
              <Laptop className="w-4 h-4 text-emerald-600 mr-2" />
              1. Iniciar com o arranque do Windows 11 ({isTauriEnv ? 'Plugin Nativo Tauri' : 'Modo Web / Desktop'})
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed max-w-xl">
              Permite que o Vigilâncias seja lançado automaticamente em segundo plano assim que liga o computador do consultório (sem necessidade de privilégios de administrador).
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autostartWindows}
              onChange={(e) => handleToggleAutostart(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {isTauriEnv && (
          <div className="bg-emerald-50 text-emerald-900 p-3 rounded-lg text-xs flex items-center space-x-2 border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Plugin de arranque automático detetado e ativo no ambiente de trabalho.</span>
          </div>
        )}
      </div>

      {/* Section 2: Background Tray & Desktop Notifications */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center">
          <Bell className="w-4 h-4 text-sky-600 mr-2" />
          2. Notificações e Rodar na Bandeja do Sistema (System Tray)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Permission Card */}
          <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-950">Notificações Nativas do Ambiente de Trabalho</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-white border border-sky-200">
                {notificationPermission === 'granted' ? 'Permitido' : 'Pendente'}
              </span>
            </div>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              Receba popups no canto inferior direito do Windows 11 sempre que uma vigilância atingir a data limite.
            </p>
            <div className="flex items-center space-x-2">
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestWebNotifications}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition shadow-2xs"
                >
                  Ativar Permissão Notificações
                </button>
              )}
              <button
                onClick={onTestNotification}
                className="px-3 py-1.5 bg-white hover:bg-zinc-50 border border-sky-200 text-sky-900 font-medium text-xs rounded-lg transition"
              >
                Testar Alerta Sonoro/Visual
              </button>
            </div>
          </div>

          {/* Lead days card */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
            <span className="text-xs font-semibold text-zinc-800 block">
              Antecedência dos Avisos de Vigilância
            </span>
            <p className="text-[11px] text-zinc-500">
              Defina quantos dias antes da data alvo do exame pretende receber alerta de aviso prévio.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={1}
                max={180}
                value={settings.leadDaysNotice}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, leadDaysNotice: Number(e.target.value) })
                }
                className="w-20 px-3 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-bold text-center"
              />
              <span className="text-xs font-medium text-zinc-700">dias antes da data alvo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Local Disk Persistence (Outside Browser) */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center">
            <Shield className="w-4 h-4 text-emerald-600 mr-2" />
            3. Armazenamento Permanente no Disco Rígido Local (Fora do Browser)
          </h3>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
            Guarda em: data/vigilancias_db.json
          </span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 space-y-2 text-xs text-emerald-950">
          <div className="flex items-center space-x-2 font-bold text-emerald-900">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Imune à Limpeza Automática do Navegador e Reinício do PC do Serviço</span>
          </div>
          <p className="text-emerald-800 text-[11px] leading-relaxed">
            Como os computadores clínicos e terminais do SNS eliminam automaticamente os cookies e o histórico do browser a cada reinício de sessão por motivos de segurança informática, esta aplicação escreve todos os registos de doentes e vigilâncias diretamente no ficheiro do disco <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900 border border-emerald-300">data/vigilancias_db.json</code> mantido pelo serviço nativo do computador.
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <button
            onClick={onExportData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Cópia de Segurança (JSON)</span>
          </button>

          <label className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-lg transition border border-zinc-300 flex items-center space-x-1.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Importar Ficheiro Backup</span>
            <input type="file" accept=".json" onChange={onImportData} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
