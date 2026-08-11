import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SurveillanceTable } from './components/SurveillanceTable';
import { PatientsView } from './components/PatientsView';
import { TimelineView } from './components/TimelineView';
import { GuidelinesView } from './components/GuidelinesView';
import { WindowsSettingsView } from './components/WindowsSettingsView';
import { SurveillanceModal } from './components/SurveillanceModal';
import { ClinicalNoteExportModal } from './components/ClinicalNoteExportModal';
import { SystemTrayPopover } from './components/SystemTrayPopover';
import { Patient, SurveillanceItem, AppSettings, MedicalPreset } from './types';
import {
  loadPatients,
  savePatients,
  loadSurveillanceItems,
  saveSurveillanceItems,
  loadAppSettings,
  saveAppSettings,
  loadCustomPresets,
  saveCustomPresets,
  fetchDatabaseFromDisk,
  saveDatabaseToDisk,
  generateClinicalNoteText,
  calculateTargetDate,
  resolveItemStatus,
} from './utils/storage';
import { setAlwaysOnTop, isTauriEnvironment } from './utils/tauriWindow';
import {
  openOrCreateWidgetWindow,
  hideWidgetWindow,
  EVENT_DATA_UPDATED,
  EVENT_OPEN_NEW_VIGILANCIA,
  EVENT_WIDGET_VISIBILITY_CHANGED,
} from './utils/widgetWindow';
import { emit, listen } from '@tauri-apps/api/event';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(() => loadPatients());
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [surveillanceItems, setSurveillanceItems] = useState<SurveillanceItem[]>(() =>
    loadSurveillanceItems(settings.leadDaysNotice)
  );
  const [customPresets, setCustomPresets] = useState<MedicalPreset[]>(() => loadCustomPresets());
  const [isDiskLoaded, setIsDiskLoaded] = useState<boolean>(false);
  const [diskPath, setDiskPath] = useState<string>('data/vigilancias_db.json');

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Floating Desktop Widget & System Tray states
  const [isFloatingWidgetOpen, setIsFloatingWidgetOpen] = useState<boolean>(true);
  const [isSystemTrayPopoverOpen, setIsSystemTrayPopoverOpen] = useState<boolean>(false);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<SurveillanceItem | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  // Initial load from server-side disk database (data/vigilancias_db.json)
  useEffect(() => {
    // Keep window on top over SClínico and other programs by default
    setAlwaysOnTop(true);

    async function initFromDisk() {
      const diskData = await fetchDatabaseFromDisk();
      if (diskData) {
        setPatients(diskData.patients || []);
        setSurveillanceItems(
          (diskData.surveillanceItems || []).map((item) => ({
            ...item,
            status: resolveItemStatus(item, diskData.settings.leadDaysNotice || 30),
          }))
        );
        if (diskData.settings) {
          setSettings(diskData.settings);
        }
        if (diskData.customPresets && diskData.customPresets.length > 0) {
          setCustomPresets(diskData.customPresets);
        }
        if (diskData.storagePath) {
          setDiskPath(diskData.storagePath);
        }
      }
      setIsDiskLoaded(true);
    }
    initFromDisk();
  }, []);

  // Sync to disk database and localStorage on state changes
  useEffect(() => {
    savePatients(patients);
    if (isDiskLoaded) {
      saveDatabaseToDisk(patients, surveillanceItems, settings, customPresets);
    }
  }, [patients, isDiskLoaded]);

  useEffect(() => {
    saveSurveillanceItems(surveillanceItems);
    if (isDiskLoaded) {
      saveDatabaseToDisk(patients, surveillanceItems, settings, customPresets);
    }
  }, [surveillanceItems, isDiskLoaded]);

  useEffect(() => {
    saveAppSettings(settings);
    if (isDiskLoaded) {
      saveDatabaseToDisk(patients, surveillanceItems, settings, customPresets);
    }
  }, [settings, isDiskLoaded]);

  useEffect(() => {
    saveCustomPresets(customPresets);
    if (isDiskLoaded) {
      saveDatabaseToDisk(patients, surveillanceItems, settings, customPresets);
    }
  }, [customPresets, isDiskLoaded]);

  // Emit data update events to Widget Window
  useEffect(() => {
    if (isTauriEnvironment() && isDiskLoaded) {
      emit(EVENT_DATA_UPDATED, {
        patients,
        surveillanceItems,
        settings,
      }).catch((err) => console.warn('Failed to emit data updated event:', err));
    }
  }, [patients, surveillanceItems, settings, isDiskLoaded]);

  // Manage Widget Window creation/hiding based on state
  useEffect(() => {
    if (isDiskLoaded) {
      if (isFloatingWidgetOpen) {
        openOrCreateWidgetWindow();
      } else {
        hideWidgetWindow();
      }
    }
  }, [isFloatingWidgetOpen, isDiskLoaded]);

  // Listen to events emitted from the Widget Window
  useEffect(() => {
    let unlistenVisibility: (() => void) | undefined;
    let unlistenNewModal: (() => void) | undefined;

    if (isTauriEnvironment()) {
      listen<{ visible: boolean }>(EVENT_WIDGET_VISIBILITY_CHANGED, (event) => {
        if (event.payload && typeof event.payload.visible === 'boolean') {
          setIsFloatingWidgetOpen(event.payload.visible);
        }
      }).then((un) => {
        unlistenVisibility = un;
      });

      listen(EVENT_OPEN_NEW_VIGILANCIA, () => {
        setEditingItem(null);
        setIsNewModalOpen(true);
      }).then((un) => {
        unlistenNewModal = un;
      });
    }

    return () => {
      if (unlistenVisibility) unlistenVisibility();
      if (unlistenNewModal) unlistenNewModal();
    };
  }, []);

  const handleSaveCustomPreset = (preset: MedicalPreset) => {
    setCustomPresets((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === preset.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = preset;
        return copy;
      } else {
        return [preset, ...prev];
      }
    });
    showToast('Protocolo personalizado guardado!');
  };

  const handleDeleteCustomPreset = (id: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
    showToast('Protocolo personalizado removido.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add / Save Surveillance item
  const handleSaveSurveillance = (
    patientData: Partial<Patient>,
    surveillanceData: Partial<SurveillanceItem>
  ) => {
    const snsClean = patientData.sns!.trim();

    // 1. Ensure patient exists or update
    let existingPatient = patients.find((p) => p.sns === snsClean);
    let updatedPatients = [...patients];

    if (existingPatient) {
      updatedPatients = updatedPatients.map((p) =>
        p.sns === snsClean
          ? {
              ...p,
              sex: patientData.sex || p.sex,
              age: patientData.age || p.age,
              name: patientData.name || p.name,
              processNumber: patientData.processNumber || p.processNumber,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      existingPatient = updatedPatients.find((p) => p.sns === snsClean)!;
    } else {
      const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        sns: snsClean,
        sex: patientData.sex || 'Feminino',
        age: patientData.age || 50,
        name: patientData.name,
        processNumber: patientData.processNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedPatients.push(newPatient);
      existingPatient = newPatient;
    }

    setPatients(updatedPatients);

    // 2. Save or update surveillance item
    if (editingItem) {
      setSurveillanceItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? ({
                ...item,
                ...surveillanceData,
                patientId: existingPatient!.id,
                patientSns: existingPatient!.sns,
                patientSex: existingPatient!.sex,
                patientAge: existingPatient!.age,
                patientName: existingPatient!.name,
                status: resolveItemStatus(
                  { ...item, ...surveillanceData } as SurveillanceItem,
                  settings.leadDaysNotice
                ),
                updatedAt: new Date().toISOString(),
              } as SurveillanceItem)
            : item
        )
      );
      showToast('Vigilância atualizada com sucesso!');
    } else {
      const newItem: SurveillanceItem = {
        id: `surv-${Date.now()}`,
        patientId: existingPatient.id,
        patientSns: existingPatient.sns,
        patientSex: existingPatient.sex,
        patientAge: existingPatient.age,
        patientName: existingPatient.name,
        examType: surveillanceData.examType || 'Colonoscopia',
        diagnosis: surveillanceData.diagnosis || '',
        lastExamDate: surveillanceData.lastExamDate || new Date().toISOString().split('T')[0],
        intervalValue: surveillanceData.intervalValue || 1,
        intervalUnit: surveillanceData.intervalUnit || 'years',
        targetDate:
          surveillanceData.targetDate ||
          calculateTargetDate(
            surveillanceData.lastExamDate || new Date().toISOString().split('T')[0],
            surveillanceData.intervalValue || 1,
            surveillanceData.intervalUnit || 'years'
          ),
        recurring: surveillanceData.recurring !== undefined ? surveillanceData.recurring : true,
        priority: surveillanceData.priority || 'normal',
        status: resolveItemStatus(surveillanceData as any, settings.leadDaysNotice),
        clinicalNotes: surveillanceData.clinicalNotes,
        guidelineReference: surveillanceData.guidelineReference,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSurveillanceItems((prev) => [newItem, ...prev]);
      showToast('Nova vigilância registada!');
    }
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    if (window.confirm('Tem a certeza que pretende eliminar este registo de vigilância?')) {
      setSurveillanceItems((prev) => prev.filter((i) => i.id !== id));
      showToast('Registo eliminado.');
    }
  };

  // Mark Completed & Renew if recurring
  const handleMarkCompleted = (item: SurveillanceItem) => {
    const todayIso = new Date().toISOString().split('T')[0];

    if (item.recurring) {
      const nextTarget = calculateTargetDate(todayIso, item.intervalValue, item.intervalUnit);
      setSurveillanceItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                lastExamDate: todayIso,
                targetDate: nextTarget,
                status: 'pendente',
                completedDate: todayIso,
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );
      showToast(`Exame marcado como realizado! Próxima vigilância agendada para ${new Date(nextTarget).toLocaleDateString('pt-PT')}.`);
    } else {
      setSurveillanceItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'realizado',
                completedDate: todayIso,
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );
      showToast('Exame marcado como concluído.');
    }
  };

  // Copy Clinical note formatted text for single item
  const handleCopySingleClinicalNote = (item: SurveillanceItem) => {
    const patient = patients.find((p) => p.sns === item.patientSns) || {
      sns: item.patientSns,
      sex: item.patientSex,
      age: item.patientAge,
      name: item.patientName,
    };
    const text = generateClinicalNoteText(patient as Patient, [item]);
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
    showToast('Resumo clínico copiado para a área de transferência!');
  };

  // Export JSON Backup
  const handleExportJson = async () => {
    const data = {
      patients,
      surveillanceItems,
      settings,
      customPresets,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const defaultFilename = `Vigilancias_Backup_${new Date().toISOString().split('T')[0]}.json`;

    // Try native Tauri File Explorer Save Dialog if in desktop app
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');

        const filePath = await save({
          defaultPath: defaultFilename,
          filters: [
            {
              name: 'Ficheiros JSON',
              extensions: ['json'],
            },
          ],
        });

        if (filePath) {
          await writeTextFile(filePath, jsonStr);
          showToast('Cópia de segurança guardada no local selecionado!');
          return;
        } else {
          // User cancelled save dialog
          return;
        }
      } catch (err) {
        console.warn('Tauri dialog save fallback to browser download:', err);
      }
    }

    // Browser download fallback
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON descarregado com sucesso.');
  };

  // Import JSON Backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.patients && parsed.surveillanceItems) {
          setPatients(parsed.patients);
          setSurveillanceItems(parsed.surveillanceItems);
          if (parsed.settings) setSettings(parsed.settings);
          if (parsed.customPresets) setCustomPresets(parsed.customPresets);
          showToast('Dados importados com sucesso!');
        } else {
          alert('Ficheiro de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler o ficheiro JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Test Notification
  const handleTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Vigilâncias (Alerta de Teste)', {
        body: 'O sistema de notificações no segundo plano do Windows 11 está a funcionar corretamente.',
        icon: '/index.html',
      });
    }
    showToast('Alerta de notificação de teste acionado!');
  };

  // Filter items according to active tab
  const getDisplayedItems = () => {
    if (activeTab === 'overdue') {
      return surveillanceItems.filter((i) => i.status === 'atrasado');
    }
    if (activeTab === 'duesoon') {
      return surveillanceItems.filter((i) => {
        if (i.status === 'atrasado' || i.status === 'realizado') return false;
        const target = new Date(i.targetDate).getTime();
        const now = new Date().getTime();
        const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 60;
      });
    }
    return surveillanceItems;
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-zinc-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <Header
        settings={settings}
        surveillanceItems={surveillanceItems}
        onOpenNewModal={() => {
          setEditingItem(null);
          setIsNewModalOpen(true);
        }}
        onOpenClinicalNoteExport={() => setIsExportModalOpen(true)}
        onToggleTraySim={() =>
          setSettings((prev) => ({ ...prev, startMinimizedTray: !prev.startMinimizedTray }))
        }
        onToggleAutostart={() =>
          setSettings((prev) => ({ ...prev, autostartWindows: !prev.autostartWindows }))
        }
        onToggleFloatingWidget={() => setIsFloatingWidgetOpen((prev) => !prev)}
        onToggleSystemTrayPopover={() => setIsSystemTrayPopoverOpen((prev) => !prev)}
        isWidgetOpen={isFloatingWidgetOpen}
        onSelectTab={(tab) => setActiveTab(tab)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        copiedNotice={copiedNotice}
      />

      {/* System Tray Popover Window */}
      <SystemTrayPopover
        items={surveillanceItems}
        isOpen={isSystemTrayPopoverOpen}
        onClose={() => setIsSystemTrayPopoverOpen(false)}
        onOpenFullApp={() => setActiveTab('all')}
        onToggleFloatingWidget={() => setIsFloatingWidgetOpen((prev) => !prev)}
        isWidgetOpen={isFloatingWidgetOpen}
      />

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(t) => setActiveTab(t)}
          surveillanceItems={surveillanceItems}
          onOpenNewModal={() => {
            setEditingItem(null);
            setIsNewModalOpen(true);
          }}
        />

        {/* Main View Container */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          {activeTab === 'patients' ? (
            <PatientsView
              patients={patients}
              surveillanceItems={surveillanceItems}
              onSelectPatient={(sns) => {
                setSearchQuery(sns);
                setActiveTab('all');
              }}
              onOpenNewModalForPatient={(p) => {
                setEditingItem(null);
                setIsNewModalOpen(true);
              }}
            />
          ) : activeTab === 'timeline' ? (
            <TimelineView
              items={surveillanceItems}
              onEdit={(item) => {
                setEditingItem(item);
                setIsNewModalOpen(true);
              }}
            />
          ) : activeTab === 'guidelines' ? (
            <GuidelinesView
              customPresets={customPresets}
              onSaveCustomPreset={handleSaveCustomPreset}
              onDeleteCustomPreset={handleDeleteCustomPreset}
              onApplyPreset={() => {
                setEditingItem(null);
                setIsNewModalOpen(true);
              }}
            />
          ) : activeTab === 'settings' ? (
            <WindowsSettingsView
              settings={settings}
              onUpdateSettings={(newS) => setSettings(newS)}
              onExportData={handleExportJson}
              onImportData={handleImportJson}
              onTestNotification={handleTestNotification}
            />
          ) : (
            <SurveillanceTable
              items={getDisplayedItems()}
              onEdit={(item) => {
                setEditingItem(item);
                setIsNewModalOpen(true);
              }}
              onDelete={handleDeleteItem}
              onMarkCompleted={handleMarkCompleted}
              onCopyClinicalNoteSingle={handleCopySingleClinicalNote}
              onOpenGuidelineModal={(diag, exam) => {
                setActiveTab('guidelines');
              }}
              searchQuery={searchQuery}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <SurveillanceModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleSaveSurveillance}
        initialItem={editingItem}
        existingPatients={patients}
        customPresets={customPresets}
      />

      <ClinicalNoteExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        patients={patients}
        surveillanceItems={surveillanceItems}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-zinc-700 text-xs font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
