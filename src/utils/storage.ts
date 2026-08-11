import { Patient, SurveillanceItem, AppSettings, MedicalPreset } from '../types';
import { INITIAL_PATIENTS, INITIAL_SURVEILLANCE_ITEMS } from '../data/mockInitialData';

const STORAGE_KEYS = {
  PATIENTS: 'vigilancias_patients_v1',
  SURVEILLANCE: 'vigilancias_items_v1',
  SETTINGS: 'vigilancias_settings_v1',
  CUSTOM_PRESETS: 'vigilancias_custom_presets_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  autostartWindows: true,
  startMinimizedTray: true,
  desktopNotifications: true,
  notificationSound: true,
  leadDaysNotice: 30,
  autoCheckIntervalMinutes: 60,
  clinicalNoteTemplateFormat: 'compact',
};

// Validate Portuguese SNS number (9 digits)
export function isValidSns(sns: string): boolean {
  const cleaned = sns.trim().replace(/\s+/g, '');
  if (!/^\d{9}$/.test(cleaned)) return false;
  return true;
}

// Format SNS nicely as 9 digits
export function formatSns(sns: string): string {
  const cleaned = sns.trim().replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
  }
  return sns;
}

// Calculate target date based on last exam date + interval value/unit
export function calculateTargetDate(lastExamDate: string, intervalValue: number, intervalUnit: 'months' | 'years'): string {
  if (!lastExamDate) return new Date().toISOString().split('T')[0];
  const d = new Date(lastExamDate);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

  if (intervalUnit === 'years') {
    d.setFullYear(d.getFullYear() + Number(intervalValue));
  } else {
    d.setMonth(d.getMonth() + Number(intervalValue));
  }

  return d.toISOString().split('T')[0];
}

// Calculate days remaining to target date
export function getDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Compute status based on target date and completed status
export function resolveItemStatus(item: SurveillanceItem, leadDays: number = 30): SurveillanceItem['status'] {
  if (item.status === 'realizado') return 'realizado';
  if (item.status === 'agendado') return 'agendado';

  const daysLeft = getDaysRemaining(item.targetDate);
  if (daysLeft < 0) {
    return 'atrasado';
  }
  return 'pendente';
}

// API / Native Disk Storage Persistence (Supports both Tauri Desktop Executable and Web Dev Server)
export async function fetchDatabaseFromDisk(): Promise<{
  patients: Patient[];
  surveillanceItems: SurveillanceItem[];
  settings: AppSettings;
  customPresets?: MedicalPreset[];
  storagePath?: string;
  lastSaved?: string;
} | null> {
  // 1. Try Tauri native invoke('load_db') first if running in Tauri desktop environment
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<{
        data: {
          patients?: Patient[];
          surveillanceItems?: SurveillanceItem[];
          settings?: AppSettings;
          customPresets?: MedicalPreset[];
          lastSaved?: string;
        };
        storagePath: string;
      }>('load_db');

      if (result && result.data) {
        return {
          patients: result.data.patients || [],
          surveillanceItems: result.data.surveillanceItems || [],
          settings: { ...DEFAULT_SETTINGS, ...(result.data.settings || {}) },
          customPresets: result.data.customPresets || [],
          storagePath: result.storagePath,
          lastSaved: result.data.lastSaved,
        };
      }
    } catch (tauriErr) {
      console.warn('Tauri invoke load_db failed:', tauriErr);
    }
  }

  // 2. Try Express API (/api/db) if running web/dev server
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          patients: json.data.patients || [],
          surveillanceItems: json.data.surveillanceItems || [],
          settings: { ...DEFAULT_SETTINGS, ...(json.data.settings || {}) },
          customPresets: json.data.customPresets || [],
          storagePath: json.storagePath,
          lastSaved: json.data.lastSaved,
        };
      }
    }
  } catch (e) {
    // API server not active
  }

  // 3. Fallback to browser/webview localStorage cache
  try {
    const p = loadPatients();
    const s = loadSurveillanceItems();
    const st = loadAppSettings();
    const cp = loadCustomPresets();
    return {
      patients: p,
      surveillanceItems: s,
      settings: st,
      customPresets: cp,
      storagePath: 'Armazenamento Local (localStorage)',
      lastSaved: new Date().toISOString(),
    };
  } catch (e) {
    console.error('Failed to load fallback localStorage data', e);
  }

  return null;
}

export async function saveDatabaseToDisk(
  patients: Patient[],
  surveillanceItems: SurveillanceItem[],
  settings: AppSettings,
  customPresets?: MedicalPreset[]
): Promise<{ success: boolean; lastSaved?: string; storagePath?: string }> {
  // Always update localStorage synchronously so user data is instantly saved in webview
  savePatients(patients);
  saveSurveillanceItems(surveillanceItems);
  saveAppSettings(settings);
  if (customPresets) saveCustomPresets(customPresets);

  // 1. Try Tauri native invoke('save_db') first if running as native app
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<{
        success: boolean;
        lastSaved: string;
        storagePath: string;
      }>('save_db', {
        patients,
        surveillanceItems,
        settings,
        customPresets: customPresets || [],
      });
      if (result && result.success) {
        return {
          success: true,
          lastSaved: result.lastSaved,
          storagePath: result.storagePath,
        };
      }
    } catch (tauriErr) {
      console.warn('Tauri invoke save_db failed:', tauriErr);
    }
  }

  const payload = {
    patients,
    surveillanceItems,
    settings,
    customPresets: customPresets || [],
    lastSaved: new Date().toISOString(),
  };

  // 2. Try Express API (/api/db)
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (e) {
    // API server not active
  }

  return {
    success: true,
    lastSaved: payload.lastSaved,
    storagePath: 'Armazenamento Local (localStorage)',
  };
}


// Load custom user presets from localStorage
export function loadCustomPresets(): MedicalPreset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRESETS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load custom presets', e);
  }
  return [];
}

export function saveCustomPresets(presets: MedicalPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save custom presets', e);
  }
}

// Load patients from storage or initialize defaults
export function loadPatients(): Patient[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load patients', e);
  }
  return INITIAL_PATIENTS;
}

export function savePatients(patients: Patient[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  } catch (e) {
    console.error('Failed to save patients', e);
  }
}

// Load surveillance items
export function loadSurveillanceItems(leadDays: number = 30): SurveillanceItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SURVEILLANCE);
    if (data) {
      const items: SurveillanceItem[] = JSON.parse(data);
      // Auto-update status for overdue items
      return items.map(item => ({
        ...item,
        status: resolveItemStatus(item, leadDays),
      }));
    }
  } catch (e) {
    console.error('Failed to load surveillance items', e);
  }

  return INITIAL_SURVEILLANCE_ITEMS.map(item => ({
    ...item,
    status: resolveItemStatus(item, leadDays),
  }));
}

export function saveSurveillanceItems(items: SurveillanceItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SURVEILLANCE, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save surveillance items', e);
  }
}

// Load App Settings
export function loadAppSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

// Clinical Note Text Formatter
export function generateClinicalNoteText(patient: Patient, items: SurveillanceItem[]): string {
  const patientItems = items.filter(i => i.patientSns === patient.sns);

  let text = `[PROGRAMAÇÃO DE VIGILÂNCIAS CLÍNICAS REGULARES]\n`;
  text += `UTENTE: SNS ${formatSns(patient.sns)} | Sexo: ${patient.sex} | Idade: ${patient.age}a`;
  if (patient.name) text += ` | ${patient.name}`;
  if (patient.processNumber) text += ` (${patient.processNumber})`;
  text += `\n----------------------------------------------------------------------\n`;

  if (patientItems.length === 0) {
    text += `Sem vigilâncias específicas ativas registadas.\n`;
    return text;
  }

  patientItems.forEach((item, index) => {
    const days = getDaysRemaining(item.targetDate);
    let statusLabel = '';
    if (item.status === 'atrasado') statusLabel = '🔴 ATRASADO / PENDENTE URGENTE';
    else if (item.status === 'agendado') statusLabel = '🗓️ AGENDADO';
    else if (item.status === 'realizado') statusLabel = '✅ REALIZADO';
    else if (days <= 30) statusLabel = '⚠️ A REQUERER MARCAÇÃO (Próximo)';
    else statusLabel = '⏳ EM VIGILÂNCIA REGULAR';

    const targetFormatted = new Date(item.targetDate).toLocaleDateString('pt-PT', { month: '2-digit', year: 'numeric' });

    text += `${index + 1}. EXAME: ${item.examType.toUpperCase()}\n`;
    text += `   - Indicação/Diagnóstico: ${item.diagnosis}\n`;
    text += `   - Periodicidade: Cada ${item.intervalValue} ${item.intervalUnit === 'years' ? 'ano(s)' : 'mês(es)'} (${item.recurring ? 'Recorrente' : 'Único'})\n`;
    text += `   - Data Alvo Prevista: ${targetFormatted} (${statusLabel})\n`;
    if (item.clinicalNotes) text += `   - Notas: ${item.clinicalNotes}\n`;
    if (item.guidelineReference) text += `   - Guideline: ${item.guidelineReference}\n`;
    text += `\n`;
  });

  text += `----------------------------------------------------------------------\n`;
  text += `Registado via Vigilâncias Clínicas em ${new Date().toLocaleDateString('pt-PT')}`;
  return text;
}

// Deprecated backward compatibility alias
export const generateSClinicoNoteText = generateClinicalNoteText;
