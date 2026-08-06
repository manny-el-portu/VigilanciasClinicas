import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, UserCheck, AlertCircle, Calendar, Check, HelpCircle } from 'lucide-react';
import { SurveillanceItem, Patient, ExamCategory, PriorityLevel, Sex, GuidelineResponse, MedicalPreset } from '../types';
import { MEDICAL_PRESETS } from '../data/medicalPresets';
import { isValidSns, calculateTargetDate } from '../utils/storage';

interface SurveillanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>, surveillance: Partial<SurveillanceItem>) => void;
  initialItem?: SurveillanceItem | null;
  existingPatients: Patient[];
  customPresets?: MedicalPreset[];
}

export const SurveillanceModal: React.FC<SurveillanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingPatients,
  customPresets = [],
}) => {
  // Form State
  const [sns, setSns] = useState('');
  const [sex, setSex] = useState<Sex>('Feminino');
  const [age, setAge] = useState<number | ''>(50);
  const [name, setName] = useState('');
  const [processNumber, setProcessNumber] = useState('');
  const [phone, setPhone] = useState('');

  const [examType, setExamType] = useState<ExamCategory>('Colonoscopia');
  const [diagnosis, setDiagnosis] = useState('');
  const [lastExamDate, setLastExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [intervalValue, setIntervalValue] = useState<number>(2);
  const [intervalUnit, setIntervalUnit] = useState<'months' | 'years'>('years');
  const [recurring, setRecurring] = useState<boolean>(true);
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [guidelineReference, setGuidelineReference] = useState('');

  // AI & Validation State
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiResult, setAiResult] = useState<GuidelineResponse | null>(null);
  const [errors, setErrors] = useState<{ sns?: string; age?: string; diagnosis?: string }>({});
  const [autoFilledNotice, setAutoFilledNotice] = useState(false);

  // Populate when initialItem changes (editing mode)
  useEffect(() => {
    if (initialItem) {
      setSns(initialItem.patientSns);
      setSex(initialItem.patientSex);
      setAge(initialItem.patientAge);
      setName(initialItem.patientName || '');
      setExamType(initialItem.examType);
      setDiagnosis(initialItem.diagnosis);
      setLastExamDate(initialItem.lastExamDate);
      setIntervalValue(initialItem.intervalValue);
      setIntervalUnit(initialItem.intervalUnit);
      setRecurring(initialItem.recurring);
      setPriority(initialItem.priority);
      setClinicalNotes(initialItem.clinicalNotes || '');
      setGuidelineReference(initialItem.guidelineReference || '');
    } else {
      // Reset defaults
      setSns('');
      setSex('Feminino');
      setAge(50);
      setName('');
      setProcessNumber('');
      setPhone('');
      setExamType('Colonoscopia');
      setDiagnosis('');
      setLastExamDate(new Date().toISOString().split('T')[0]);
      setIntervalValue(2);
      setIntervalUnit('years');
      setRecurring(true);
      setPriority('normal');
      setClinicalNotes('');
      setGuidelineReference('');
      setErrors({});
      setAiResult(null);
    }
  }, [initialItem, isOpen]);

  // Auto-fill existing patient if SNS matches
  const handleSnsChange = (value: string) => {
    setSns(value);
    const cleaned = value.trim().replace(/\s+/g, '');

    if (cleaned.length === 9) {
      const match = existingPatients.find(p => p.sns === cleaned);
      if (match) {
        setSex(match.sex);
        setAge(match.age);
        if (match.name) setName(match.name);
        if (match.processNumber) setProcessNumber(match.processNumber);
        if (match.phone) setPhone(match.phone);
        setAutoFilledNotice(true);
        setTimeout(() => setAutoFilledNotice(false), 3000);
      }
    }
  };

  // Select Preset
  const handleSelectPreset = (presetId: string) => {
    const allPresets = [...customPresets, ...MEDICAL_PRESETS];
    const preset = allPresets.find(p => p.id === presetId);
    if (!preset) return;

    setExamType(preset.category);
    if (!diagnosis) {
      setDiagnosis(preset.indicationExample);
    }
    setIntervalValue(preset.defaultIntervalValue);
    setIntervalUnit(preset.defaultIntervalUnit);
    setPriority(preset.priority);
    setGuidelineReference(preset.guidelineSource);
    setClinicalNotes(preset.notes);
  };

  // AI Guideline query
  const handleConsultAiGuideline = async () => {
    if (!diagnosis) {
      setErrors(prev => ({ ...prev, diagnosis: 'Por favor introduza primeiro a indicação clínica/diagnóstico.' }));
      return;
    }

    setIsLoadingAi(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/gemini/guideline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis,
          examType,
          patientAge: age,
          patientSex: sex,
        }),
      });

      if (!res.ok) throw new Error('Falha na resposta do servidor');

      const data: GuidelineResponse = await res.json();
      setAiResult(data);

      // Auto apply suggested values
      if (data.suggestedIntervalYears > 0) {
        setIntervalValue(data.suggestedIntervalYears);
        setIntervalUnit('years');
      } else if (data.suggestedIntervalMonths > 0) {
        setIntervalValue(data.suggestedIntervalMonths);
        setIntervalUnit('months');
      }

      if (data.guidelineSource) {
        setGuidelineReference(data.guidelineSource);
      }

      if (data.urgency) {
        setPriority(data.urgency);
      }
    } catch (err) {
      console.error('Erro ao consultar IA:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!sns || !isValidSns(sns)) {
      newErrors.sns = 'O Número de Utente do SNS deve conter 9 dígitos numéricos.';
    }

    if (!age || Number(age) <= 0 || Number(age) > 120) {
      newErrors.age = 'A idade é obrigatória (ex: 50).';
    }

    if (!diagnosis.trim()) {
      newErrors.diagnosis = 'A indicação clínica/diagnóstico é obrigatória.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const calculatedTarget = calculateTargetDate(lastExamDate, intervalValue, intervalUnit);

    const patientData: Partial<Patient> = {
      sns: sns.trim(),
      sex,
      age: Number(age),
      name: name.trim() || undefined,
      processNumber: processNumber.trim() || undefined,
      phone: phone.trim() || undefined,
    };

    const surveillanceData: Partial<SurveillanceItem> = {
      examType,
      diagnosis: diagnosis.trim(),
      lastExamDate,
      intervalValue,
      intervalUnit,
      targetDate: calculatedTarget,
      recurring,
      priority,
      clinicalNotes: clinicalNotes.trim(),
      guidelineReference: guidelineReference.trim(),
    };

    onSave(patientData, surveillanceData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-2xl my-8 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              {initialItem ? 'Editar Vigilância Clínica' : 'Novo Registo de Vigilância Médica'}
            </h2>
            <p className="text-xs text-zinc-500">
              Preencha os dados obrigatórios do Utente SNS para agendar lembretes periódicos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-zinc-700">
          {/* Preset Selector */}
          <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-950 flex items-center">
                <BookOpen className="w-4 h-4 text-indigo-600 mr-1.5" />
                Predefinições Rápidas de Vigilância (Directrizes Clínicas)
              </span>
              <span className="text-[10px] text-indigo-600 font-medium">Opcional</span>
            </div>
            <select
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full bg-white border border-indigo-200 text-zinc-800 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            >
              <option value="">-- Seleccionar um protocolo predefinido (ex: ESGE, ESC, DGS ou Personalizado) --</option>
              {customPresets && customPresets.length > 0 && (
                <optgroup label="⭐ Os Meus Protocolos Personalizados">
                  {customPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.category}: {p.title} ({p.defaultIntervalValue} {p.defaultIntervalUnit === 'years' ? 'anos' : 'meses'})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="📋 Protocolos Oficiais Pré-carregados">
                {MEDICAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.category}: {p.title} ({p.defaultIntervalValue} {p.defaultIntervalUnit === 'years' ? 'anos' : 'meses'})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Section 1: Mandatory Patient Information */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
              <h3 className="font-semibold text-zinc-900 text-xs flex items-center">
                <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>
                Dados Obrigatorios do Utente SNS
              </h3>
              {autoFilledNotice && (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <UserCheck className="w-3 h-3 mr-1" /> Utente existente carregado
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* SNS Number */}
              <div>
                <label className="block font-medium text-zinc-800 mb-1">
                  N.º SNS do Paciente <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 123456789"
                  maxLength={9}
                  value={sns}
                  onChange={(e) => handleSnsChange(e.target.value)}
                  className={`w-full px-3 py-1.5 bg-zinc-50 border rounded-lg text-xs font-mono font-bold focus:outline-none focus:bg-white focus:ring-2 ${
                    errors.sns ? 'border-rose-400 focus:ring-rose-200' : 'border-zinc-300 focus:ring-indigo-100'
                  }`}
                />
                {errors.sns && <p className="text-[10px] text-rose-600 mt-1">{errors.sns}</p>}
              </div>

              {/* Sex */}
              <div>
                <label className="block font-medium text-zinc-800 mb-1">
                  Sexo do Utente <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as Sex)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 font-medium"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block font-medium text-zinc-800 mb-1">
                  Idade <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  placeholder="Ex: 64"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3 py-1.5 bg-zinc-50 border rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-2 ${
                    errors.age ? 'border-rose-400 focus:ring-rose-200' : 'border-zinc-300 focus:ring-indigo-100'
                  }`}
                />
                {errors.age && <p className="text-[10px] text-rose-600 mt-1">{errors.age}</p>}
              </div>
            </div>

            {/* Optional Patient Name & Process Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-medium text-zinc-600 mb-1">
                  Nome do Doente <span className="text-zinc-400 font-normal">(facultativo)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: António Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-600 mb-1">
                  N.º Processo / Hospitalar <span className="text-zinc-400 font-normal">(facultativo)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: PROC-84920"
                  value={processNumber}
                  onChange={(e) => setProcessNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Surveillance Details */}
          <div className="space-y-3 pt-2">
            <div className="border-b border-zinc-200 pb-1.5 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 text-xs">Detalhes do Exame & Periodicidade</h3>
              <button
                type="button"
                onClick={handleConsultAiGuideline}
                disabled={isLoadingAi}
                className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>{isLoadingAi ? 'A analisar diretrizes...' : 'Sugerir Intervalo por IA'}</span>
              </button>
            </div>

            {/* AI Recommendation Banner */}
            {aiResult && (
              <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-200 space-y-1">
                <div className="flex items-center justify-between font-semibold text-sky-900">
                  <span>Recomendação IA ({aiResult.guidelineSource}):</span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-sky-200 uppercase">
                    Prioridade {aiResult.urgency}
                  </span>
                </div>
                <p className="text-[11px] text-sky-800">{aiResult.recommendationText}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Exam Category */}
              <div>
                <label className="block font-medium text-zinc-800 mb-1">
                  Tipo de Exame / Consulta <span className="text-rose-500">*</span>
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as ExamCategory)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 font-medium"
                >
                  <option value="Colonoscopia">Colonoscopia</option>
                  <option value="Ecocardiograma">Ecocardiograma</option>
                  <option value="Ecografia Abdominal">Ecografia Abdominal</option>
                  <option value="TAC (Tomografia Computorizada)">TAC (Tomografia Computorizada)</option>
                  <option value="Mamografia">Mamografia</option>
                  <option value="Rastreio Retinopatia Diabética">Rastreio Retinopatia Diabética</option>
                  <option value="Analítica / Rastreio Renal">Analítica / Rastreio Renal</option>
                  <option value="Densitometria Óssea">Densitometria Óssea</option>
                  <option value="Endoscopia Digestiva Alta">Endoscopia Digestiva Alta</option>
                  <option value="Ressonância Magnética">Ressonância Magnética</option>
                  <option value="Ecografia Carotídea / Doppler">Ecografia Carotídea</option>
                  <option value="Holter 24h / MAPA">Holter 24h / MAPA</option>
                  <option value="Espirometria">Espirometria</option>
                  <option value="Consulta Especialidade">Consulta Especialidade</option>
                  <option value="Outro Exame / Vigilância">Outro Exame / Vigilância</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block font-medium text-zinc-800 mb-1">Prioridade / Urgência</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 font-medium"
                >
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>

            {/* Diagnosis / Clinical Indication */}
            <div>
              <label className="block font-medium text-zinc-800 mb-1">
                Diagnóstico / Indicação Clínica Específica <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Regurgitação mitral moderada OR Pólipo serreado 11mm em cólon ascendente"
                value={diagnosis}
                onChange={(e) => {
                  setDiagnosis(e.target.value);
                  if (errors.diagnosis) setErrors(prev => ({ ...prev, diagnosis: undefined }));
                }}
                className={`w-full px-3 py-1.5 bg-zinc-50 border rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-2 ${
                  errors.diagnosis ? 'border-rose-400 focus:ring-rose-200' : 'border-zinc-300 focus:ring-indigo-100'
                }`}
              />
              {errors.diagnosis && <p className="text-[10px] text-rose-600 mt-1">{errors.diagnosis}</p>}
            </div>

            {/* Date & Interval setup */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Last Exam Date */}
              <div>
                <label className="block font-medium text-zinc-800 mb-1">Data do Último Exame</label>
                <input
                  type="date"
                  value={lastExamDate}
                  onChange={(e) => setLastExamDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Interval Value */}
              <div>
                <label className="block font-medium text-zinc-800 mb-1">Intervalo de Vigilância</label>
                <div className="flex space-x-1">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(Number(e.target.value))}
                    className="w-1/2 px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-bold text-center focus:outline-none focus:bg-white"
                  />
                  <select
                    value={intervalUnit}
                    onChange={(e) => setIntervalUnit(e.target.value as 'months' | 'years')}
                    className="w-1/2 px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none"
                  >
                    <option value="years">Anos</option>
                    <option value="months">Meses</option>
                  </select>
                </div>
              </div>

              {/* Recurrence & Calculated Target Date */}
              <div>
                <label className="block font-medium text-zinc-800 mb-1">Data Prevista Próxima</label>
                <div className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-indigo-900 flex items-center justify-between">
                  <span>{new Date(calculateTargetDate(lastExamDate, intervalValue, intervalUnit)).toLocaleDateString('pt-PT')}</span>
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Recurrence Checkbox */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="recurring-check"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-400 cursor-pointer"
              />
              <label htmlFor="recurring-check" className="text-xs font-medium text-zinc-700 cursor-pointer">
                Recorrente (renovar automaticamente este intervalo após a realização do exame)
              </label>
            </div>

            {/* Guideline Source & Clinical Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-medium text-zinc-600 mb-1">Fonte / Guideline Médica</label>
                <input
                  type="text"
                  placeholder="Ex: ESGE Guidelines 2020 OR ESC 2021"
                  value={guidelineReference}
                  onChange={(e) => setGuidelineReference(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-600 mb-1">Notas / Observações Adicionais</label>
                <input
                  type="text"
                  placeholder="Ex: Requer preparação prévia ou pedido de contraste"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition cursor-pointer"
            >
              {initialItem ? 'Guardar Alterações' : 'Criar Vigilância'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
