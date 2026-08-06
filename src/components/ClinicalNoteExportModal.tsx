import React, { useState } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import { Patient, SurveillanceItem } from '../types';
import { generateClinicalNoteText, formatSns } from '../utils/storage';

interface ClinicalNoteExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  surveillanceItems: SurveillanceItem[];
}

export const ClinicalNoteExportModal: React.FC<ClinicalNoteExportModalProps> = ({
  isOpen,
  onClose,
  patients,
  surveillanceItems,
}) => {
  const [selectedSns, setSelectedSns] = useState<string>(patients[0]?.sns || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentPatient = patients.find((p) => p.sns === selectedSns) || patients[0];

  const formattedText = currentPatient
    ? generateClinicalNoteText(currentPatient, surveillanceItems)
    : 'Nenhum utente selecionado.';

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center">
              <FileText className="w-4 h-4 text-indigo-600 mr-2" /> Copiar Registo para Diário Clínico
            </h2>
            <p className="text-xs text-zinc-500">
              Gera texto limpo e estruturado para colar diretamente no diário clínico da consulta.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Seleccionar Utente SNS:
            </label>
            <select
              value={selectedSns}
              onChange={(e) => setSelectedSns(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.sns}>
                  SNS {formatSns(p.sns)} - {p.sex}, {p.age}a {p.name ? `(${p.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={formattedText}
              rows={12}
              className="w-full bg-zinc-900 text-zinc-100 font-mono text-xs p-4 rounded-xl border border-zinc-800 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <span className="text-xs text-zinc-500">
              Pronto a colar com <kbd className="bg-zinc-100 px-1.5 py-0.5 rounded border text-zinc-800 font-mono">Ctrl + V</kbd> no diário clínico de consulta.
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
              >
                Fechar
              </button>
              <button
                onClick={handleCopy}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto Formatado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
