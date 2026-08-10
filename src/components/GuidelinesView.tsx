import React, { useState } from 'react';
import { consultGuidelineAi } from '../utils/aiGuidelineService';
import {
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Filter,
  Search,
  ArrowRight,
  X,
  Calendar,
  ShieldCheck,
  Tag,
  Star,
} from 'lucide-react';
import { MEDICAL_PRESETS } from '../data/medicalPresets';
import { MedicalPreset, ExamCategory, PriorityLevel, GuidelineResponse } from '../types';

interface GuidelinesViewProps {
  customPresets?: MedicalPreset[];
  onSaveCustomPreset?: (preset: MedicalPreset) => void;
  onDeleteCustomPreset?: (id: string) => void;
  onApplyPreset?: (presetId: string) => void;
}

export const GuidelinesView: React.FC<GuidelinesViewProps> = ({
  customPresets = [],
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onApplyPreset,
}) => {
  // AI Query state
  const [queryDiagnosis, setQueryDiagnosis] = useState('');
  const [queryExam, setQueryExam] = useState('Colonoscopia');
  const [queryAge, setQueryAge] = useState<number>(60);
  const [querySex, setQuerySex] = useState('Feminino');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<GuidelineResponse | null>(null);

  // Filter state
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'official'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal / Form state for Custom Protocol Creation / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<MedicalPreset | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ExamCategory>('Colonoscopia');
  const [formIndication, setFormIndication] = useState('');
  const [formIntervalValue, setFormIntervalValue] = useState<number>(1);
  const [formIntervalUnit, setFormIntervalUnit] = useState<'months' | 'years'>('years');
  const [formSource, setFormSource] = useState('');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('normal');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  const handleQueryAi = async () => {
    if (!queryDiagnosis.trim()) return;

    setIsLoading(true);
    setAiResponse(null);

    try {
      const data = await consultGuidelineAi(
        queryDiagnosis,
        queryExam,
        queryAge,
        querySex,
        customPresets
      );
      setAiResponse(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPreset(null);
    setFormTitle('');
    setFormCategory('Colonoscopia');
    setFormIndication('');
    setFormIntervalValue(1);
    setFormIntervalUnit('years');
    setFormSource('Protocolo de Serviço / Personalizado');
    setFormPriority('normal');
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (preset: MedicalPreset) => {
    setEditingPreset(preset);
    setFormTitle(preset.title);
    setFormCategory(preset.category);
    setFormIndication(preset.indicationExample);
    setFormIntervalValue(preset.defaultIntervalValue);
    setFormIntervalUnit(preset.defaultIntervalUnit);
    setFormSource(preset.guidelineSource);
    setFormPriority(preset.priority);
    setFormNotes(preset.notes);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Por favor insira um título para o protocolo.');
      return;
    }
    if (!formIndication.trim()) {
      setFormError('Por favor insira uma indicação clínica de exemplo.');
      return;
    }
    if (formIntervalValue <= 0) {
      setFormError('O intervalo de vigilância deve ser superior a zero.');
      return;
    }

    const newPreset: MedicalPreset = {
      id: editingPreset ? editingPreset.id : `custom_preset_${Date.now()}`,
      category: formCategory,
      title: formTitle.trim(),
      indicationExample: formIndication.trim(),
      defaultIntervalValue: Number(formIntervalValue),
      defaultIntervalUnit: formIntervalUnit,
      guidelineSource: formSource.trim() || 'Personalizado',
      priority: formPriority,
      notes: formNotes.trim(),
      isCustom: true,
      createdAt: editingPreset?.createdAt || new Date().toISOString(),
    };

    if (onSaveCustomPreset) {
      onSaveCustomPreset(newPreset);
    }

    setIsModalOpen(false);
  };

  // Merge official and custom presets
  const officialList = MEDICAL_PRESETS.map((p) => ({ ...p, isCustom: false }));
  const customList = customPresets.map((p) => ({ ...p, isCustom: true }));

  let combinedList: MedicalPreset[] = [];
  if (activeTab === 'custom') {
    combinedList = customList;
  } else if (activeTab === 'official') {
    combinedList = officialList;
  } else {
    combinedList = [...customList, ...officialList];
  }

  // Filter by category and search
  const filteredList = combinedList.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.indicationExample.toLowerCase().includes(q) ||
      p.guidelineSource.toLowerCase().includes(q) ||
      p.notes.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white p-5 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Suporte à Decisão Clínica & Protocolos de Serviço</span>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Protocolo</span>
          </button>
        </div>
        <h2 className="text-lg font-bold tracking-tight">
          Directrizes de Vigilância & Gestor de Protocolos Personalizados
        </h2>
        <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
          Consulte normas internacionais (ESGE, ESC, DGS) ou adicione os seus próprios protocolos clínicos para automatizar o agendamento de exames e consultas no seu serviço.
        </p>
      </div>

      {/* Interactive AI Query Box */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-zinc-100 pb-3">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Consultar Intervalo Recomendado por Inteligência Artificial
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Diagnóstico / Achado / Lesão
            </label>
            <input
              type="text"
              placeholder="Ex: Pólipo serreado 12mm em cólon transverso OR Insuficiência aórtica moderada"
              value={queryDiagnosis}
              onChange={(e) => setQueryDiagnosis(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Tipo de Exame</label>
            <select
              value={queryExam}
              onChange={(e) => setQueryExam(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="Colonoscopia">Colonoscopia</option>
              <option value="Ecocardiograma">Ecocardiograma</option>
              <option value="Ecografia Abdominal">Ecografia Abdominal</option>
              <option value="TAC (Tomografia Computorizada)">TAC</option>
              <option value="Mamografia">Mamografia</option>
              <option value="Rastreio Retinopatia Diabética">Retinopatia DM</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleQueryAi}
              disabled={isLoading || !queryDiagnosis.trim()}
              className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'A analisar...' : 'Analisar Directriz'}</span>
            </button>
          </div>
        </div>

        {aiResponse && (
          <div className="bg-sky-50/90 p-4 rounded-xl border border-sky-200 space-y-2 text-xs text-sky-950 animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-bold">
              <span>
                {aiResponse.suggestedIntervalYears === 0 && aiResponse.suggestedIntervalMonths === 0
                  ? 'Recomendação: Regresso ao Rastreio Populacional (Sem vigilância intermédia)'
                  : `Intervalo Recomendado: ${aiResponse.suggestedIntervalYears} anos (${aiResponse.suggestedIntervalMonths} meses)`}
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-sky-300 text-[10px] font-mono">
                Fonte: {aiResponse.guidelineSource}
              </span>
            </div>
            <p className="text-sky-900 leading-relaxed">{aiResponse.recommendationText}</p>
          </div>
        )}
      </div>

      {/* Protocols Filter & Management Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-zinc-200/60 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Todos os Protocolos ({customList.length + officialList.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                activeTab === 'custom'
                  ? 'bg-white text-indigo-900 font-semibold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Meus Protocolos ({customList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('official')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'official'
                  ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Directrizes Oficiais ({officialList.length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Pesquisar protocolo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-zinc-200 text-xs rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Colonoscopia">Colonoscopia</option>
              <option value="Ecocardiograma">Ecocardiograma</option>
              <option value="Ecografia Abdominal">Ecografia Abdominal</option>
              <option value="TAC (Tomografia Computorizada)">TAC</option>
              <option value="Mamografia">Mamografia</option>
              <option value="Rastreio Retinopatia Diabética">Retinopatia DM</option>
              <option value="Endoscopia Digestiva Alta">Endoscopia Digestiva Alta</option>
              <option value="Densitometria Óssea">Densitometria Óssea</option>
            </select>
          </div>
        </div>

        {/* Protocols List */}
        {filteredList.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-zinc-300 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-semibold text-zinc-700">Nenhum protocolo encontrado.</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              {activeTab === 'custom'
                ? 'Ainda não criou protocolos personalizados. Clique no botão "Criar Novo Protocolo" acima para criar o primeiro.'
                : 'Tente alterar os termos de pesquisa ou o filtro de categoria.'}
            </p>
            {activeTab === 'custom' && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-2xs cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeiro Protocolo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredList.map((preset) => (
              <div
                key={preset.id}
                className={`p-4 rounded-xl border transition space-y-3 relative group ${
                  preset.isCustom
                    ? 'bg-amber-50/30 border-amber-200/90 hover:border-amber-300'
                    : 'bg-white border-zinc-200/80 hover:border-zinc-300'
                }`}
              >
                {/* Top Badge & Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {preset.category}
                      </span>
                      {preset.isCustom && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 flex items-center">
                          <Star className="w-3 h-3 mr-0.5 text-amber-600 fill-amber-600" /> Personalizado
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 mt-1.5">{preset.title}</h4>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-extrabold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                      {preset.defaultIntervalValue} {preset.defaultIntervalUnit === 'years' ? 'Anos' : 'Meses'}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-1">{preset.guidelineSource}</span>
                  </div>
                </div>

                {/* Indication & Notes */}
                <p className="text-[11px] text-zinc-600 italic bg-zinc-50/80 p-2 rounded-md border border-zinc-100">
                  Indicação Exemplo: "{preset.indicationExample}"
                </p>
                {preset.notes && <p className="text-xs text-zinc-700 leading-relaxed">{preset.notes}</p>}

                {/* Action Footer */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  {preset.isCustom && onDeleteCustomPreset ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(preset)}
                        className="px-2 py-1 text-[11px] font-medium text-zinc-700 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-zinc-200 transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Tem a certeza que deseja eliminar o protocolo "${preset.title}"?`)) {
                            onDeleteCustomPreset(preset.id);
                          }
                        }}
                        className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Diretriz Oficial
                    </span>
                  )}

                  {onApplyPreset && (
                    <button
                      onClick={() => onApplyPreset(preset.id)}
                      className="ml-auto px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Aplicar num Novo Utente</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Custom Protocol */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    {editingPreset ? 'Editar Protocolo Personalizado' : 'Criar Novo Protocolo de Vigilância'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Defina intervalos específicos e diretrizes do seu serviço de saúde.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Título do Protocolo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ecografia Renal em Quisto Bosniak IIF"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Categoria de Exame / Consulta <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ExamCategory)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
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

              {/* Indication example */}
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Indicação / Diagnóstico Típico de Exemplo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Quisto renal Bosniak IIF com septos finos"
                  value={formIndication}
                  onChange={(e) => setFormIndication(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Interval & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">
                    Intervalo Padrão <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={formIntervalValue}
                      onChange={(e) => setFormIntervalValue(Number(e.target.value))}
                      className="w-1/2 px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-bold text-center focus:bg-white"
                    />
                    <select
                      value={formIntervalUnit}
                      onChange={(e) => setFormIntervalUnit(e.target.value as 'months' | 'years')}
                      className="w-1/2 px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none"
                    >
                      <option value="years">Anos</option>
                      <option value="months">Meses</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Prioridade Padrão</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:bg-white font-medium"
                  >
                    <option value="normal font-normal">Normal</option>
                    <option value="alta font-bold">Alta</option>
                    <option value="urgente font-bold text-rose-600">Urgente</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              {/* Guideline Source */}
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Fonte da Directriz / Origem
                </label>
                <input
                  type="text"
                  placeholder="Ex: Protocolo do Serviço de Urologia / Clas. Bosniak 2019"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Instruções Clínicas / Recomendações
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Realizar ecografia semestral nos primeiros 2 anos e posteriormente anual se estável."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition cursor-pointer"
                >
                  {editingPreset ? 'Guardar Alterações' : 'Criar Protocolo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
