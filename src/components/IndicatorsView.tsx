import React, { useState, useMemo } from 'react';
import {
  Target,
  Search,
  FileSpreadsheet,
  Upload,
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock,
  UserCheck,
  Scale
} from 'lucide-react';
import { USFIndicator, IndicatorDimension } from '../types';
import {
  USF_INDICATORS,
  DIMENSION_SUMMARIES,
  INSTITUTIONAL_INCENTIVES_CATEGORIES,
  INSTITUTIONAL_INCENTIVE_SCALES,
  INSTITUTIONAL_INCENTIVE_AMOUNTS,
  getSdmBiUrl,
} from '../data/indicatorsData';

interface IndicatorsViewProps {
  onNavigateToSurveillances?: () => void;
}

export const IndicatorsView: React.FC<IndicatorsViewProps> = ({
  onNavigateToSurveillances,
}) => {
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'ide' | 'incentivos'>('ide');
  const [selectedIndicator, setSelectedIndicator] = useState<USFIndicator | null>(null);

  // Filter indicators
  const filteredIndicators = useMemo(() => {
    return USF_INDICATORS.filter((ind) => {
      const matchesDim =
        selectedDimension === 'all' || ind.dimension === selectedDimension;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        ind.number.toString().includes(query) ||
        ind.name.toLowerCase().includes(query) ||
        ind.dimension.toLowerCase().includes(query) ||
        (ind.clinicalObjective && ind.clinicalObjective.toLowerCase().includes(query));
      return matchesDim && matchesQuery;
    });
  }, [selectedDimension, searchQuery]);

  // Dimension color helpers
  const getDimensionBadgeColor = (dim: IndicatorDimension) => {
    switch (dim) {
      case 'Acesso':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Gestão da Saúde':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Gestão da Doença':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Qualificação da Prescrição':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Integração de Cuidados':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getDimensionNumberColor = (dim: IndicatorDimension) => {
    switch (dim) {
      case 'Acesso':
        return 'bg-blue-600 text-white';
      case 'Gestão da Saúde':
        return 'bg-emerald-600 text-white';
      case 'Gestão da Doença':
        return 'bg-violet-600 text-white';
      case 'Qualificação da Prescrição':
        return 'bg-amber-600 text-white';
      case 'Integração de Cuidados':
        return 'bg-teal-600 text-white';
      default:
        return 'bg-zinc-700 text-white';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Official Regulatory Framework */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-indigo-300" />
                <span>Portaria n.º 411-A/2023 de 5 de dezembro</span>
              </span>
              <span className="text-zinc-400 text-xs">•</span>
              <span className="text-xs text-zinc-300 font-medium">USF Modelo B & UCSP</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
              <Target className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>Indicadores de Desempenho da USF (IDE)</span>
            </h1>
            <p className="text-xs md:text-sm text-indigo-200/80 max-w-3xl leading-relaxed">
              Matriz oficial de 39 indicadores distribuídos por 5 dimensões contratuais (100 pontos de ponderação global).
              Regulação do apuramento anual pela ACSS com base nas regras do Decreto-Lei n.º 103/2023.
            </p>
          </div>

          {/* Sub-tabs switch */}
          <div className="flex items-center p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('ide')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeSubTab === 'ide'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Matriz do IDE (39 Ind.)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('incentivos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeSubTab === 'incentivos'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Incentivos Institucionais</span>
            </button>
          </div>
        </div>

        {/* Global IDE Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-indigo-800/60 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-indigo-300 block text-[11px] font-medium">Total de Indicadores</span>
            <span className="text-lg font-bold text-white">39</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Anexo II da Portaria</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-indigo-300 block text-[11px] font-medium">Ponderação Total</span>
            <span className="text-lg font-bold text-emerald-400">100,0 pts</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Escala IDE de 0 a 100</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-indigo-300 block text-[11px] font-medium">Ciclo de Apuramento</span>
            <span className="text-lg font-bold text-amber-300">Até 31 Março</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Ano civil anterior (ACSS)</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-indigo-300 block text-[11px] font-medium">Cálculo de Grau</span>
            <span className="text-lg font-bold text-sky-300">Anexo III</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Linear nas variações aceitáveis</span>
          </div>
        </div>
      </div>

      {/* Distinction & Scope Notice */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">
            Separação Conceptual: Gestão de Indicadores da USF vs. Vigilâncias Clínicas Individuais
          </p>
          <p className="text-amber-800 leading-relaxed">
            Esta secção gere as metas institucionais e contratuais da equipa de saúde de acordo com o calendário e intervalos do BI-CSP/ACSS (corte anual a 31 de dezembro).
            As <strong>Vigilâncias de Utentes</strong> (na barra lateral) continuam dedicadas ao seguimento individualizado de cada utente segundo protocolos clínicos (ex: colonoscopias a 3 ou 5 anos, ecocardiogramas periódicos, citologias de rastreio).
          </p>
          {onNavigateToSurveillances && (
            <button
              onClick={onNavigateToSurveillances}
              className="inline-flex items-center space-x-1 text-amber-900 font-semibold hover:underline pt-1 text-[11px]"
            >
              <span>Ir para as Vigilâncias Clínicas Individuais</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'ide' ? (
        <>
          {/* Dimension Cards / Quick Filter Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <button
              onClick={() => setSelectedDimension('all')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedDimension === 'all'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-white text-zinc-800 border-zinc-200/90 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Todas</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-zinc-800/10 dark:bg-white/20">39</span>
              </div>
              <div className="mt-2">
                <span className="text-base font-bold">100 pts</span>
                <span className="text-[10px] block opacity-70">Todas as dimensões</span>
              </div>
            </button>

            {DIMENSION_SUMMARIES.map((dim) => {
              const isSelected = selectedDimension === dim.dimension;
              return (
                <button
                  key={dim.dimension}
                  onClick={() => setSelectedDimension(dim.dimension)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white text-zinc-800 border-zinc-200/90 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-semibold truncate mr-1">{dim.dimension}</span>
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {dim.count}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-base font-bold">{dim.totalWeight.toFixed(1)} pts</span>
                    <span className="text-[10px] block opacity-70 truncate">{dim.count} indicadores</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Helper */}
          <div className="bg-white rounded-xl p-3 border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por número (ex: 39, 45, 20) ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 w-full sm:w-auto justify-between sm:justify-end">
              <span>A exibir <strong>{filteredIndicators.length}</strong> de 39 indicadores</span>
              <span className="text-zinc-300 hidden sm:inline">|</span>
              <span className="text-sky-700 font-medium flex items-center space-x-1 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                <ExternalLink className="w-3 h-3 text-sky-600" />
                <span>Links SDM Ativos</span>
              </span>
            </div>
          </div>

          {/* Indicators List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredIndicators.map((ind) => (
              <div
                key={ind.number}
                onClick={() => setSelectedIndicator(ind)}
                className="bg-white rounded-xl border border-zinc-200/90 hover:border-indigo-300 p-4 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${getDimensionNumberColor(
                          ind.dimension
                        )}`}
                      >
                        {ind.number}
                      </span>
                      <div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDimensionBadgeColor(
                            ind.dimension
                          )}`}
                        >
                          {ind.dimension}
                        </span>
                      </div>
                    </div>

                    {/* Weight Badge & Direct SDM Link */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <a
                        href={getSdmBiUrl(ind.number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`Abrir Bilhete de Identidade (BI) oficial do Indicador ${ind.number} no portal SDM / Ministério da Saúde`}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-900 border border-sky-200 flex items-center space-x-1 transition"
                      >
                        <span>SDM</span>
                        <ExternalLink className="w-2.5 h-2.5 text-sky-600" />
                      </a>
                      <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                        {ind.weight.toFixed(1)} pts
                      </span>
                    </div>
                  </div>

                  {/* Indicator Title */}
                  <h3 className="font-semibold text-xs text-zinc-900 group-hover:text-indigo-600 transition leading-snug">
                    {ind.name}
                  </h3>

                  {/* Target Cohort & Clinical Objective */}
                  {ind.clinicalObjective && (
                    <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                      {ind.clinicalObjective}
                    </p>
                  )}
                </div>

                {/* Values & Action footer */}
                <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Valor Esperado</span>
                      <span className="font-semibold text-emerald-700 font-mono text-[11px]">
                        {ind.expectedValues}
                      </span>
                    </div>
                    <div className="border-l border-zinc-200 pl-3">
                      <span className="text-[10px] text-zinc-400 block font-medium">Variação Aceitável</span>
                      <span className="font-mono text-zinc-600 text-[11px]">
                        {ind.acceptableVariations}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={getSdmBiUrl(ind.number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Ver fórmula e BI completo no SDM"
                      className="text-[11px] text-sky-700 hover:text-sky-900 font-medium hover:underline flex items-center space-x-0.5"
                    >
                      <span>Fórmula SDM</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                    <span className="text-zinc-300">|</span>
                    <div className="text-indigo-600 group-hover:translate-x-0.5 transition flex items-center space-x-0.5 text-xs font-semibold">
                      <span>Detalhe</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Incentivos Institucionais Tab (Anexos IV, V e VI) */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-zinc-200/90 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Atribuição dos Incentivos Institucionais (Capítulo III & Anexos IV a VI)</span>
              </h2>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                Os incentivos institucionais destinam-se a reconhecer o impacto do desempenho da equipa multiprofissional da USF Modelo B e UCSP,
                conforme definido nos artigos 8.º a 11.º da Portaria n.º 411-A/2023.
              </p>
            </div>

            {/* Repartição de Ponderação */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {INSTITUTIONAL_INCENTIVES_CATEGORIES.map((cat, idx) => (
                <div key={idx} className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800">{cat.dimension}</span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                      {cat.weightPercentage}%
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{cat.description}</p>
                </div>
              ))}
            </div>

            {/* Condição de Acesso: IDE >= 60% */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Cláusula de Barreira (Artigo 10.º, n.º 2):</span> Não há lugar ao pagamento de incentivos institucionais,
                independentemente do grau de cumprimento dos indicadores, quando o resultado do <strong>IDE da equipa for inferior a 60%</strong>.
              </div>
            </div>

            {/* Escalões de Desempenho e Pagamento */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>Escalões e Níveis de Atribuição (Anexo V)</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/80 text-zinc-700 font-semibold border-b border-zinc-200">
                    <tr>
                      <th className="p-3">Escalão</th>
                      <th className="p-3">Resultado do IDE</th>
                      <th className="p-3">Consequência / Decisão</th>
                      <th className="p-3 text-right">% do Valor Máximo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-700">
                    {INSTITUTIONAL_INCENTIVE_SCALES.map((scale, i) => (
                      <tr key={i} className="hover:bg-zinc-50">
                        <td className="p-3 font-semibold text-zinc-900">{scale.rank}</td>
                        <td className="p-3 font-mono font-medium">{scale.result}</td>
                        <td className="p-3">{scale.consequence}</td>
                        <td className="p-3 text-right font-bold text-indigo-700">{scale.payout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela de Valores Máximos */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Valores Máximos de Incentivos por Dimensão da Unidade (Anexo VI)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {INSTITUTIONAL_INCENTIVE_AMOUNTS.map((amt, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-zinc-200 shadow-2xs text-center space-y-1">
                    <span className="text-[11px] text-zinc-500 font-medium block">{amt.upRange}</span>
                    <span className="text-xl font-bold text-emerald-600 block">{amt.maxAmount}</span>
                    <span className="text-[10px] text-zinc-400 block">por unidade funcional / ano</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicator Detail & Future Excel Import Placeholder Modal */}
      {selectedIndicator && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 bg-zinc-50/70 flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${getDimensionNumberColor(
                    selectedIndicator.dimension
                  )}`}
                >
                  {selectedIndicator.number}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDimensionBadgeColor(
                        selectedIndicator.dimension
                      )}`}
                    >
                      {selectedIndicator.dimension}
                    </span>
                    <span className="text-xs font-bold text-zinc-900 bg-zinc-200/80 px-2 py-0.5 rounded-md">
                      Ponderação: {selectedIndicator.weight.toFixed(1)} pts
                    </span>
                  </div>
                  <h2 className="text-sm md:text-base font-bold text-zinc-900 mt-1 leading-snug">
                    {selectedIndicator.name}
                  </h2>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={getSdmBiUrl(selectedIndicator.number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-semibold flex items-center space-x-1 transition"
                  title="Abrir Bilhete de Identidade do Indicador no SDM"
                >
                  <span>BI no SDM</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setSelectedIndicator(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Official SDM Link & Technical Formula Card */}
              <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white rounded-xl border border-sky-200 p-4 space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-600 text-white uppercase tracking-wider">
                        Bilhete de Identidade (BI) Oficial
                      </span>
                      <span className="text-xs font-semibold text-zinc-800">
                        SDM • Ministério da Saúde
                      </span>
                    </div>
                    <p className="text-zinc-600 text-[11px] mt-1 leading-relaxed">
                      Aceda à descrição detalhada, fórmula matemática de cálculo, numeradores, denominadores, regras de inclusão/exclusão e fontes de informação oficiais do BI-CSP.
                    </p>
                  </div>
                  <a
                    href={getSdmBiUrl(selectedIndicator.number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs transition shrink-0 shadow-xs"
                  >
                    <span>Abrir Ficha no SDM</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="pt-2 border-t border-sky-100 flex items-center justify-between text-[10px] text-sky-800 font-mono">
                  <span className="truncate max-w-md">{getSdmBiUrl(selectedIndicator.number)}</span>
                  <span className="shrink-0 text-sky-600 font-sans font-medium">ID: {selectedIndicator.number}</span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Intervalo de Valor Esperado (100% Pontuação)
                  </span>
                  <div className="text-emerald-700 font-mono text-base font-bold">
                    {selectedIndicator.expectedValues}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Conjunto de resultados tendo por base uma boa prática clínica organizada e eficiente.
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Intervalo de Variação Aceitável (0% a 100% Linear)
                  </span>
                  <div className="text-indigo-700 font-mono text-base font-bold">
                    {selectedIndicator.acceptableVariations}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Desvios tecnicamente admissíveis em relação à boa prática (função linear do Anexo III).
                  </p>
                </div>
              </div>

              {/* Target Population & Calculation */}
              <div className="space-y-3 bg-white rounded-xl border border-zinc-200 p-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">População Alvo / Denominador:</span>
                  <p className="font-medium text-zinc-800 mt-0.5">{selectedIndicator.targetCohort}</p>
                </div>
                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Modo de Apuramento & Regras:</span>
                  <p className="text-zinc-600 mt-0.5 leading-relaxed">{selectedIndicator.calculationSummary}</p>
                </div>
              </div>

              {/* Placeholder for Excel Import & Convocatórias */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/70 rounded-xl border-2 border-dashed border-indigo-300 p-5 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm flex items-center space-x-2">
                      <span>Importação de Utentes em Falta (Ficheiro Excel)</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-semibold border border-indigo-200">
                        Próxima Fase
                      </span>
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {selectedIndicator.importGuidance}
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs rounded-xl p-4 border border-indigo-100 space-y-3 text-[11px] text-zinc-600">
                  <div className="font-semibold text-zinc-800 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Como funcionará o seguimento e convocatórias temporais:</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4 text-zinc-600">
                    <li>
                      <strong>Importação de Listas Excel:</strong> Importará o ficheiro exportado do BI-CSP / MIM@UF com os utentes em incumprimento para este indicador.
                    </li>
                    <li>
                      <strong>Planeamento Temporal Trimestral:</strong> O sistema dividirá automaticamente os utentes por prazos de convocatória para assegurar que a meta seja alcançada antes do fecho do ano civil (31 de dezembro).
                    </li>
                    <li>
                      <strong>Geração de Convocatórias:</strong> Identificação de contactos telefónicos, cartas-tipo e registo de agendamentos prioritários para a equipa médica e de enfermagem da USF.
                    </li>
                  </ul>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 justify-between border-t border-indigo-100">
                    <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Compatível com formatos padrão BI-CSP (.xlsx / .csv)</span>
                    </div>

                    <button
                      disabled
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-zinc-200 text-zinc-500 text-xs font-semibold cursor-not-allowed flex items-center justify-center space-x-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importar Ficheiro Excel (Placeholder)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <span className="text-[11px] text-zinc-500">
                Portaria n.º 411-A/2023 • Indicador N.º {selectedIndicator.number}
              </span>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <a
                  href={getSdmBiUrl(selectedIndicator.number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-xs flex items-center space-x-1.5 transition"
                >
                  <span>Ver Fórmula no SDM</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setSelectedIndicator(null)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white font-semibold text-xs transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
