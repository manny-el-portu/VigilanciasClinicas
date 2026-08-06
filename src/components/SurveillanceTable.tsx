import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  ChevronRight,
  User,
  ExternalLink,
  Sparkles,
  Check
} from 'lucide-react';
import { SurveillanceItem, ExamCategory, PriorityLevel, SurveillanceStatus } from '../types';
import { formatSns, getDaysRemaining, generateClinicalNoteText } from '../utils/storage';

interface SurveillanceTableProps {
  items: SurveillanceItem[];
  onEdit: (item: SurveillanceItem) => void;
  onDelete: (id: string) => void;
  onMarkCompleted: (item: SurveillanceItem) => void;
  onCopyClinicalNoteSingle: (item: SurveillanceItem) => void;
  onOpenGuidelineModal: (diagnosis: string, examType: string) => void;
  searchQuery: string;
}

export const SurveillanceTable: React.FC<SurveillanceTableProps> = ({
  items,
  onEdit,
  onDelete,
  onMarkCompleted,
  onCopyClinicalNoteSingle,
  onOpenGuidelineModal,
  searchQuery,
}) => {
  const [selectedExamType, setSelectedExamType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSns = item.patientSns.toLowerCase().includes(q);
      const matchName = item.patientName?.toLowerCase().includes(q) || false;
      const matchDiag = item.diagnosis.toLowerCase().includes(q);
      const matchExam = item.examType.toLowerCase().includes(q);
      if (!matchSns && !matchName && !matchDiag && !matchExam) return false;
    }

    // Category filter
    if (selectedExamType !== 'all' && item.examType !== selectedExamType) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && item.status !== selectedStatus) {
      return false;
    }

    // Priority filter
    if (selectedPriority !== 'all' && item.priority !== selectedPriority) {
      return false;
    }

    return true;
  });

  const handleCopySingle = (item: SurveillanceItem) => {
    onCopyClinicalNoteSingle(item);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgente':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      case 'alta':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      case 'normal':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'baixa':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  const getStatusBadge = (status: SurveillanceStatus, targetDate: string) => {
    const daysLeft = getDaysRemaining(targetDate);

    if (status === 'realizado') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
          <CheckCircle className="w-3 h-3 text-emerald-500 mr-1" />
          Realizado
        </span>
      );
    }

    if (status === 'agendado') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700 border border-sky-200 font-medium">
          <Calendar className="w-3 h-3 text-sky-500 mr-1" />
          Agendado
        </span>
      );
    }

    if (daysLeft < 0 || status === 'atrasado') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 border border-rose-200 font-bold animate-pulse">
          <AlertCircle className="w-3 h-3 text-rose-600 mr-1" />
          Atrasado ({Math.abs(daysLeft)}d)
        </span>
      );
    }

    if (daysLeft <= 60) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
          <Clock className="w-3 h-3 text-amber-600 mr-1" />
          Em prazo ({daysLeft} dias)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-700 border border-zinc-200">
        <Clock className="w-3 h-3 text-zinc-400 mr-1" />
        Em vigilância
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Quick Filters Bar (Notion Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 flex items-center mr-1">
            <Filter className="w-3.5 h-3.5 mr-1" /> Filtrar por:
          </span>

          {/* Exam type filter */}
          <select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            className="text-xs bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-lg px-2.5 py-1 text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Todos os Exames</option>
            <option value="Colonoscopia">Colonoscopia</option>
            <option value="Ecocardiograma">Ecocardiograma</option>
            <option value="Ecografia Abdominal">Ecografia Abdominal</option>
            <option value="TAC (Tomografia Computorizada)">TAC</option>
            <option value="Mamografia">Mamografia</option>
            <option value="Rastreio Retinopatia Diabética">Retinopatia DM</option>
            <option value="Analítica / Rastreio Renal">Analítica / Renal</option>
            <option value="Densitometria Óssea">Densitometria</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-lg px-2.5 py-1 text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Todos os Estados</option>
            <option value="atrasado">🔴 Atrasados</option>
            <option value="pendente">⏳ Pendentes</option>
            <option value="agendado">🗓️ Agendados</option>
            <option value="realizado">✅ Realizados</option>
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-lg px-2.5 py-1 text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        <div className="text-xs text-zinc-500 font-medium">
          Exibindo <span className="text-zinc-900 font-semibold">{filteredItems.length}</span> de{' '}
          {items.length} registos
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-zinc-700">Nenhuma vigilância encontrada</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Tente ajustar os seus filtros de pesquisa ou adicionar um novo registo de vigilância médica.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Utente SNS & Identificação</th>
                  <th className="py-3 px-4">Exame / Vigilância</th>
                  <th className="py-3 px-4">Indicação Clínica / Diagnóstico</th>
                  <th className="py-3 px-4">Intervalo</th>
                  <th className="py-3 px-4">Data Alvo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {filteredItems.map((item) => {
                  const daysLeft = getDaysRemaining(item.targetDate);
                  const isOverdue = daysLeft < 0 && item.status !== 'realizado';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-50/70 transition-colors ${
                        isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Patient Details (Mandatory SNS, Sex, Age) */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-mono text-xs font-bold text-zinc-900 flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span>SNS {formatSns(item.patientSns)}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5 space-x-1">
                          <span className="font-medium text-zinc-700">{item.patientSex}</span>
                          <span>•</span>
                          <span>{item.patientAge} anos</span>
                        </div>
                        {item.patientName && (
                          <div className="text-[11px] text-zinc-800 font-medium truncate max-w-[160px] mt-0.5">
                            {item.patientName}
                          </div>
                        )}
                      </td>

                      {/* Exam Category */}
                      <td className="py-3 px-4 align-top">
                        <span className="inline-block font-medium text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60 text-xs">
                          {item.examType}
                        </span>
                        {item.guidelineReference && (
                          <div className="text-[10px] text-indigo-600 font-medium mt-1">
                            {item.guidelineReference}
                          </div>
                        )}
                      </td>

                      {/* Diagnosis / Indication */}
                      <td className="py-3 px-4 align-top max-w-xs">
                        <p className="font-medium text-zinc-900 text-xs leading-snug">
                          {item.diagnosis}
                        </p>
                        {item.clinicalNotes && (
                          <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">
                            {item.clinicalNotes}
                          </p>
                        )}
                      </td>

                      {/* Interval & Recurrence */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-semibold text-zinc-800">
                          {item.intervalValue} {item.intervalUnit === 'years' ? 'ano(s)' : 'mês(es)'}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {item.recurring ? '🔄 Recorrente' : '1️⃣ Exame único'}
                        </div>
                      </td>

                      {/* Target Date */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-medium text-zinc-900">
                          {new Date(item.targetDate).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Último: {new Date(item.lastExamDate).toLocaleDateString('pt-PT', { month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {getStatusBadge(item.status, item.targetDate)}
                        <div className="mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getPriorityBadge(item.priority)}`}>
                            Prioridade: {item.priority}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Mark done */}
                          {item.status !== 'realizado' && (
                            <button
                              onClick={() => onMarkCompleted(item)}
                              title="Marcar como Realizado (Renova se for recorrente)"
                              className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Copy Clinical Note */}
                          <button
                            onClick={() => handleCopySingle(item)}
                            title="Copiar resumo para colar no diário clínico"
                            className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* AI Guideline query */}
                          <button
                            onClick={() => onOpenGuidelineModal(item.diagnosis, item.examType)}
                            title="Consultar recomendações por Diretriz / IA"
                            className="p-1.5 text-zinc-500 hover:text-sky-600 hover:bg-sky-50 rounded transition"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEdit(item)}
                            title="Editar este registo"
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDelete(item.id)}
                            title="Eliminar este registo"
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
