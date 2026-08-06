import React from 'react';
import { Calendar, Clock, AlertTriangle, User, ChevronRight } from 'lucide-react';
import { SurveillanceItem } from '../types';
import { formatSns, getDaysRemaining } from '../utils/storage';

interface TimelineViewProps {
  items: SurveillanceItem[];
  onEdit: (item: SurveillanceItem) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ items, onEdit }) => {
  // Sort items by target date
  const sorted = [...items].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  // Group by Month & Year (e.g. "Agosto 2026")
  const grouped: { [key: string]: SurveillanceItem[] } = {};

  sorted.forEach((item) => {
    const dateObj = new Date(item.targetDate);
    const monthYear = dateObj.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    const capitalized = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    if (!grouped[capitalized]) {
      grouped[capitalized] = [];
    }
    grouped[capitalized].push(item);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center">
            <Calendar className="w-4 h-4 text-indigo-600 mr-2" /> Cronograma de Vigilâncias Agendadas
          </h2>
          <p className="text-xs text-zinc-500">
            Linha temporal dos exames e consultas organizados pela data prevista de realização.
          </p>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-zinc-200/80">
        {Object.keys(grouped).map((monthGroup) => (
          <div key={monthGroup} className="relative pl-9 space-y-3">
            {/* Timeline node */}
            <div className="absolute left-2.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-600 border-4 border-white shadow-2xs"></div>

            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider bg-zinc-100 inline-block px-2.5 py-0.5 rounded border border-zinc-200/80">
              {monthGroup} ({grouped[monthGroup].length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {grouped[monthGroup].map((item) => {
                const daysLeft = getDaysRemaining(item.targetDate);
                const isOverdue = daysLeft < 0 && item.status !== 'realizado';

                return (
                  <div
                    key={item.id}
                    onClick={() => onEdit(item)}
                    className={`bg-white p-3.5 rounded-xl border shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between ${
                      isOverdue
                        ? 'border-rose-300 bg-rose-50/20'
                        : daysLeft <= 60
                        ? 'border-amber-200'
                        : 'border-zinc-200/80'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">
                          {item.examType}
                        </span>
                        {isOverdue ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Atrasado
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {daysLeft} dias restantes
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-zinc-800 line-clamp-2">
                        {item.diagnosis}
                      </p>

                      <div className="text-[11px] text-zinc-500 flex items-center space-x-2 font-mono">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>SNS {formatSns(item.patientSns)}</span>
                        <span>•</span>
                        <span>{item.patientSex}, {item.patientAge}a</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Periodicidade: cada {item.intervalValue} {item.intervalUnit === 'years' ? 'ano(s)' : 'mês(es)'}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
