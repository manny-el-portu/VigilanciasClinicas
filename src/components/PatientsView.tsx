import React from 'react';
import { Users, User, Plus, Calendar, FileText, ChevronRight } from 'lucide-react';
import { Patient, SurveillanceItem } from '../types';
import { formatSns } from '../utils/storage';

interface PatientsViewProps {
  patients: Patient[];
  surveillanceItems: SurveillanceItem[];
  onSelectPatient: (sns: string) => void;
  onOpenNewModalForPatient: (patient: Patient) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  surveillanceItems,
  onSelectPatient,
  onOpenNewModalForPatient,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center">
            <Users className="w-4 h-4 text-indigo-600 mr-2" /> Utentes Registados na Aplicação
          </h2>
          <p className="text-xs text-zinc-500">
            Cada registo clínico contém obrigatoriamente SNS, Sexo e Idade.
          </p>
        </div>
        <div className="text-xs font-semibold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-lg border border-zinc-200">
          Total: {patients.length} doentes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {patients.map((patient) => {
          const patientSurveillances = surveillanceItems.filter((s) => s.patientSns === patient.sns);
          const activeCount = patientSurveillances.filter((s) => s.status !== 'realizado').length;
          const overdueCount = patientSurveillances.filter((s) => s.status === 'atrasado').length;

          return (
            <div
              key={patient.id}
              className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xs">
                      {patient.sex === 'Feminino' ? 'F' : patient.sex === 'Masculino' ? 'M' : 'O'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900 font-mono">
                        SNS {formatSns(patient.sns)}
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        {patient.sex} • <span className="font-semibold text-zinc-700">{patient.age} anos</span>
                      </p>
                    </div>
                  </div>

                  {overdueCount > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                      {overdueCount} Atrasado
                    </span>
                  ) : activeCount > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                      {activeCount} Ativo(s)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-full">
                      Sem pendentes
                    </span>
                  )}
                </div>

                {patient.name && (
                  <p className="text-xs font-medium text-zinc-800 truncate">
                    {patient.name}
                  </p>
                )}

                {patient.processNumber && (
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Proc: {patient.processNumber}
                  </p>
                )}

                {/* Surveillance list preview */}
                <div className="pt-2 border-t border-zinc-100 space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Vigilâncias ({patientSurveillances.length})
                  </span>
                  {patientSurveillances.length === 0 ? (
                    <p className="text-[11px] text-zinc-400 italic">Nenhum exame agendado</p>
                  ) : (
                    <div className="space-y-1">
                      {patientSurveillances.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className="text-[11px] bg-zinc-50 p-1.5 rounded border border-zinc-100 flex items-center justify-between"
                        >
                          <span className="font-medium text-zinc-800 truncate max-w-[170px]">
                            {s.examType} ({s.intervalValue}{s.intervalUnit === 'years' ? 'a' : 'm'})
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(s.targetDate).toLocaleDateString('pt-PT', { month: '2-digit', year: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => onSelectPatient(patient.sns)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
                >
                  <span>Ver Todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenNewModalForPatient(patient)}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded-md transition flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Nova Vigilância</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
