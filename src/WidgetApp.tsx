import React, { useState, useEffect } from 'react';
import { FloatingDesktopWidget } from './components/FloatingDesktopWidget';
import { Patient, SurveillanceItem } from './types';
import {
  fetchDatabaseFromDisk,
  loadSurveillanceItems,
  resolveItemStatus,
  generateClinicalNoteText,
} from './utils/storage';
import {
  isTauriEnv,
  hideWidgetWindow,
  focusMainWindow,
  listenDataChanged,
  emitOpenNewSurveillance,
} from './utils/widgetWindow';

export default function WidgetApp() {
  const [items, setItems] = useState<SurveillanceItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      if (isTauriEnv()) {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke<any>('load_db');
        if (result && result.data) {
          const loadedPatients = result.data.patients || [];
          const loadedItems = result.data.surveillanceItems || [];
          const leadNotice = result.data.settings?.leadDaysNotice || 30;
          setPatients(loadedPatients);
          setItems(
            loadedItems.map((item: SurveillanceItem) => ({
              ...item,
              status: resolveItemStatus(item, leadNotice),
            }))
          );
          return;
        }
      }
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
      console.warn('Erro ao carregar dados no WidgetApp:', err);
      const localItems = loadSurveillanceItems();
      setItems(localItems);
    }
  };

  useEffect(() => {
    loadData();

    let unlisten: (() => void) | null = null;
    listenDataChanged(() => {
      loadData();
    }).then((unlistener) => {
      if (unlistener) unlisten = unlistener;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleClose = async () => {
    await hideWidgetWindow();
  };

  const handleOpenFullApp = async () => {
    await focusMainWindow();
  };

  const handleOpenNewModal = async () => {
    await focusMainWindow();
    await emitOpenNewSurveillance();
  };

  const handleCopySingle = (item: SurveillanceItem) => {
    const patient = patients.find((p) => p.sns === item.patientSns) || {
      sns: item.patientSns,
      sex: item.patientSex,
      age: item.patientAge,
      name: item.patientName,
    };
    const text = generateClinicalNoteText(patient as Patient, [item]);
    navigator.clipboard.writeText(text);
    setToastMessage('Nota clínica copiada!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="w-screen h-screen bg-transparent p-2 flex flex-col antialiased">
      <FloatingDesktopWidget
        items={items}
        isOpen={true}
        onClose={handleClose}
        onOpenFullApp={handleOpenFullApp}
        onCopyClinicalNoteSingle={handleCopySingle}
        onOpenNewModal={handleOpenNewModal}
      />

      {toastMessage && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium flex items-center space-x-1.5 animate-in fade-in zoom-in-95 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
