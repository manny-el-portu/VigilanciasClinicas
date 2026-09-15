export type Sex = 'Feminino' | 'Masculino' | 'Outro';

export type PriorityLevel = 'baixa' | 'normal' | 'alta' | 'urgente';

export type SurveillanceStatus = 'pendente' | 'agendado' | 'realizado' | 'atrasado';

export interface Patient {
  id: string;
  sns: string; // Mandatory: 9 digits SNS user number
  sex: Sex; // Mandatory
  age: number; // Mandatory
  name?: string; // Optional
  processNumber?: string; // Optional (Nº Processo Hospitalar/CSP)
  phone?: string; // Optional
  email?: string; // Optional
  notes?: string; // Optional clinical background
  createdAt: string;
  updatedAt: string;
}

export type ExamCategory =
  | 'Ecocardiograma'
  | 'Colonoscopia'
  | 'Endoscopia Digestiva Alta'
  | 'TAC (Tomografia Computorizada)'
  | 'Ressonância Magnética'
  | 'Analítica / Rastreio Renal'
  | 'Mamografia'
  | 'Densitometria Óssea'
  | 'Ecografia Abdominal'
  | 'Ecografia Carotídea / Doppler'
  | 'Holter 24h / MAPA'
  | 'Espirometria'
  | 'Rastreio Retinopatia Diabética'
  | 'Consulta Especialidade'
  | 'Outro Exame / Vigilância';

export interface SurveillanceItem {
  id: string;
  patientId: string;
  patientSns: string; // Cached for quick lookup & filtering
  patientAge: number;
  patientSex: Sex;
  patientName?: string;
  examType: ExamCategory;
  customExamType?: string;
  diagnosis: string; // Clinical indication, e.g., "Regurgitação Mitral Moderada", "Pólipo Serreado 11mm"
  lastExamDate: string; // ISO string date YYYY-MM-DD
  intervalValue: number; // e.g., 2
  intervalUnit: 'months' | 'years'; // 'months' or 'years'
  targetDate: string; // ISO string calculated date YYYY-MM-DD
  recurring: boolean; // Auto-renew interval when completed
  priority: PriorityLevel;
  status: SurveillanceStatus;
  scheduledDate?: string; // If booked
  completedDate?: string; // Last done date
  clinicalNotes?: string;
  guidelineReference?: string; // e.g., "ESC Guidelines 2021", "ESGE 2020"
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  autostartWindows: boolean;
  startMinimizedTray: boolean;
  desktopNotifications: boolean;
  notificationSound: boolean;
  leadDaysNotice: number; // Days before target date to flag as "Due soon" (default 30)
  autoCheckIntervalMinutes: number;
  clinicalNoteTemplateFormat: 'compact' | 'detailed' | 'bullet';
}

export interface MedicalPreset {
  id: string;
  category: ExamCategory;
  title: string;
  indicationExample: string;
  defaultIntervalValue: number;
  defaultIntervalUnit: 'months' | 'years';
  guidelineSource: string;
  priority: PriorityLevel;
  notes: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface GuidelineResponse {
  suggestedIntervalYears: number;
  suggestedIntervalMonths: number;
  recommendationText: string;
  guidelineSource: string;
  urgency: PriorityLevel;
}

export type IndicatorDimension =
  | 'Acesso'
  | 'Gestão da Saúde'
  | 'Gestão da Doença'
  | 'Qualificação da Prescrição'
  | 'Integração de Cuidados';

export interface USFIndicator {
  number: number;
  name: string;
  dimension: IndicatorDimension;
  weight: number;
  expectedValues: string;
  acceptableVariations: string;
  unit?: string;
  targetCohort?: string;
  clinicalObjective?: string;
  calculationSummary?: string;
  importGuidance?: string;
  sdmUrl?: string;
}
