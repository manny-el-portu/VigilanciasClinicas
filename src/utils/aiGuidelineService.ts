import { MEDICAL_PRESETS } from '../data/medicalPresets';
import { GuidelineResponse, MedicalPreset } from '../types';

export async function consultGuidelineAi(
  diagnosis: string,
  examType?: string,
  patientAge?: number | string,
  patientSex?: string,
  customPresets: MedicalPreset[] = []
): Promise<GuidelineResponse> {
  // 1. Try Tauri native command invoke('consult_gemini_guideline') if running as native app
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const data = await invoke<any>('consult_gemini_guideline', {
        diagnosis,
        examType,
        patientAge,
        patientSex,
      });

      if (
        data &&
        typeof (data.suggestedIntervalYears ?? data.suggested_interval_years) === 'number' &&
        (data.recommendationText || data.recommendation_text)
      ) {
        return {
          suggestedIntervalYears: data.suggestedIntervalYears ?? data.suggested_interval_years,
          suggestedIntervalMonths: data.suggestedIntervalMonths ?? data.suggested_interval_months,
          recommendationText: data.recommendationText || data.recommendation_text,
          guidelineSource: data.guidelineSource || data.guideline_source || 'Diretrizes Médicas',
          urgency: data.urgency || 'normal',
        };
      }
    } catch (tauriErr) {
      console.warn('Tauri invoke consult_gemini_guideline skipped/failed, trying Express API or local engine:', tauriErr);
    }
  }

  // 2. Try Express backend API (/api/gemini/guideline) if running with active server
  try {
    const res = await fetch('/api/gemini/guideline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnosis,
        examType,
        patientAge,
        patientSex,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.suggestedIntervalYears === 'number' && data.recommendationText) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend API /api/gemini/guideline not reachable, using local intelligent guidelines matching engine:', err);
  }

  // 2. Local Intelligent Guidelines Matching Engine (Standalone Desktop / Offline)
  const queryStr = `${diagnosis} ${examType || ''}`.toLowerCase();
  const allPresets = [...MEDICAL_PRESETS, ...customPresets];

  let bestMatch: MedicalPreset | null = null;
  let maxScore = 0;

  for (const preset of allPresets) {
    let score = 0;
    const titleLower = preset.title.toLowerCase();
    const indLower = preset.indicationExample.toLowerCase();
    const notesLower = (preset.notes || '').toLowerCase();
    const catLower = preset.category.toLowerCase();

    // Key token matching
    const tokens = queryStr.split(/[\s,./\-+]+/).filter(t => t.length > 2);
    for (const token of tokens) {
      if (titleLower.includes(token)) score += 3;
      if (indLower.includes(token)) score += 2;
      if (notesLower.includes(token)) score += 1;
      if (catLower.includes(token)) score += 1;
    }

    // Specific high-value medical keywords
    if (queryStr.includes('pólipo') || queryStr.includes('polipo') || queryStr.includes('adenoma') || queryStr.includes('piecemeal')) {
      if (preset.category === 'Colonoscopia') score += 4;
    }
    if (queryStr.includes('aórtic') || queryStr.includes('aortic') || queryStr.includes('mitral') || queryStr.includes('valv')) {
      if (preset.category === 'Ecocardiograma') score += 4;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = preset;
    }
  }

  if (bestMatch && maxScore >= 2) {
    const isYears = bestMatch.defaultIntervalUnit === 'years';
    const intervalYears = isYears ? bestMatch.defaultIntervalValue : Number((bestMatch.defaultIntervalValue / 12).toFixed(2));
    const intervalMonths = isYears ? bestMatch.defaultIntervalValue * 12 : bestMatch.defaultIntervalValue;

    return {
      suggestedIntervalYears: intervalYears,
      suggestedIntervalMonths: intervalMonths,
      recommendationText: `${bestMatch.title}: ${bestMatch.notes || bestMatch.indicationExample}`,
      guidelineSource: bestMatch.guidelineSource,
      urgency: bestMatch.priority,
    };
  }

  // General default fallback recommendation
  return {
    suggestedIntervalYears: 1,
    suggestedIntervalMonths: 12,
    recommendationText: `Vigilância médica regular sugerida para "${diagnosis}". Intervalo recomendado de 1 ano com base nos protocolos gerais de seguimento clínico em cuidados de saúde primários.`,
    guidelineSource: 'Protocolo de Cuidados de Saúde Primários (Modo Local)',
    urgency: 'normal',
  };
}
