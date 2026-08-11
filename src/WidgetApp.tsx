import React, { useState, useEffect } from 'react';
import { FloatingDesktopWidget } from './components/FloatingDesktopWidget';
import { SurveillanceItem, Patient, AppSettings } from './types';
import {
  fetchDatabaseFromDisk,
  generateClinicalNoteText,
  loadSurveillanceItems,
  loadPatients,
  loadAppSettings,
} from './utils/storage';
import {
  hideWidgetWindow,
  focusMainWindow,
  EVENT_DATA_UPDATED,
  EVENT_OPEN_NEW_VIGILANCIA,
  EVENT_WIDGET_VISIBILITY_CHANGED,
} from './utils/widgetWindow';
import { emit, listen } from '@tauri-apps/api/event';
import { isTauriEnvironment } from './utils/tauriWindow';

interface DataUpdatedPayload {
  patients?: Patient[];
  surveillanceItems?: SurveillanceItem[];
  settings?: AppSettings;
}

export default function WidgetApp() {
  const [items, setItems] = useState<SurveillanceItem[]>(() =>
    loadSurveillanceItems()
  );
  const [patients, setPatients] = useState<Patient[]>(() => loadPatients());
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  useEffect(() => {
    // Initial fetch from disk database via backend endpoint invoke / fetch
    async function init() {
      const db = await fetchDatabaseFromDisk();
      if (db) {
        if (db.surveillanceItems) setItems(db.surveillanceItems);
        if (db.patients) setPatients(db.patients);
        if (db.settings) setSettings(db.settings);
      }
    }
    init();

    // Listen for data updates emitted from the main window
    let unlisten: (() => void) | undefined;
    if (isTauriEnvironment()) {
      listen<DataUpdatedPayload>(EVENT_DATA_UPDATED, (event) => {
        if (event.payload) {
          if (event.payload.surveillanceItems) {
            setItems(event.payload.surveillanceItems);
          }
          if (event.payload.patients) {
            setPatients(event.payload.patients);
          }
          if (event.payload.settings) {
            setSettings(event.payload.settings);
          }
        }
      }).then((un) => {
        unlisten = un;
      }).catch((err) => {
        console.warn('Failed to listen to EVENT_DATA_UPDATED:', err);
      });
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleClose = async () => {
    await hideWidgetWindow();
    if (isTauriEnvironment()) {
      await emit(EVENT_WIDGET_VISIBILITY_CHANGED, { visible: false });
    }
  };

  const handleOpenFullApp = async () => {
    await focusMainWindow();
  };

  const handleOpenNewModal = async () => {
    await focusMainWindow();
    if (isTauriEnvironment()) {
      await emit(EVENT_OPEN_NEW_VIGILANCIA, {});
    }
  };

  const handleCopySingleClinicalNote = (item: SurveillanceItem) => {
    const patient = patients.find((p) => p.sns === item.patientSns) || {
      id: item.patientId || `pat-${item.patientSns}`,
      sns: item.patientSns,
      sex: item.patientSex,
      age: item.patientAge,
      name: item.patientName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const note = generateClinicalNoteText(patient, [item]);
    navigator.clipboard.writeText(note);
  };

  return (
    <div className="w-screen h-screen bg-transparent select-none overflow-hidden p-1">
      <FloatingDesktopWidget
        items={items}
        isOpen={true}
        onClose={handleClose}
        onOpenFullApp={handleOpenFullApp}
        onCopyClinicalNoteSingle={handleCopySingleClinicalNote}
        onOpenNewModal={handleOpenNewModal}
      />
    </div>
  );
}
