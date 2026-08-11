pub mod db;

use serde_json::{json, Value};

#[tauri::command]
pub async fn consult_gemini_guideline(
    diagnosis: String,
    exam_type: Option<String>,
    patient_age: Option<Value>,
    patient_sex: Option<String>,
    api_key: Option<String>,
) -> Result<Value, String> {
    let key = api_key
        .or_else(|| std::env::var("GEMINI_API_KEY").ok())
        .filter(|k| !k.trim().is_empty());

    let key = match key {
        Some(k) => k,
        None => {
            return Ok(json!({
                "suggestedIntervalMonths": 12,
                "suggestedIntervalYears": 1,
                "recommendationText": "Recomendação predefinida (Modo Nativo Offline): vigilância anual padrão. Para consultas avançadas com diretrizes internacionais DGS/ESGE/ESC via IA Gemini, configure a sua chave API.",
                "guidelineSource": "Prática Clínica Padrão (Nativo)",
                "urgency": "normal"
            }));
        }
    };

    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
        key
    );

    let age_str = patient_age.map(|v| v.to_string()).unwrap_or_else(|| "Não informada".into());
    let sex_str = patient_sex.unwrap_or_else(|| "Não informado".into());
    let exam_str = exam_type.unwrap_or_else(|| "Não especificado".into());

    let prompt = format!(
        r#"Como assistente médico especializado em medicina geral e familiar e especialidades hospitalares (com elevado rigor técnico nas diretrizes DGS, ESGE 2020, ESC/EHA 2025, USMSTF), analisa a seguinte indicação clínica para propor um intervalo de vigilância regular para o paciente:
- Diagnóstico / Lesão / Achado: "{diagnosis}"
- Tipo de Exame / Consulta: "{exam_str}"
- Idade do Utente: {age_str} anos
- Sexo do Utente: {sex_str}

Instruções e Regras Clínicas Obrigatórias de Alto Rigor:
1. COLONOSCOPIA E PÓLIPOS DE CÓLON (Diretrizes ESGE 2020 e USMSTF 2020):
   - REGRESSO AO RASTREIO POPULACIONAL (Sem vigilância endoscópica / Intervalo 0 anos):
     * Doentes com excisão completa de 1 a 4 adenomas < 10 mm com displasia de baixo grau (LGD) - INDEPENDENTEMENTE de apresentarem componentes vilosos ou tubulovilosos - OU qualquer pólipo serreado < 10 mm sem displasia, SÃO DE BAIXO RISCO, NÃO requerem vigilância colonoscópica e DEVEM REGRESSAR AO RASTREIO POPULACIONAL (definir suggestedIntervalYears = 0 e suggestedIntervalMonths = 0).
   - VIGILÂNCIA AOS 3 ANOS (Alto Risco):
     * Pelo menos 1 adenoma ≥ 10 mm OU com displasia de alto grau (HGD);
     * OU 5 ou mais (≥ 5) adenomas de qualquer tamanho;
     * OU qualquer pólipo serreado ≥ 10 mm OU com displasia.
2. VALVOPATIAS CARDÍACAS (Diretrizes ESC / EHA 2025):
   - Estenose Aórtica: Ligeira (2-3 anos), Moderada (1 ano), Grave Assintomática (0.5 anos).
3. RASTREIOS NACIONAIS DGS (PORTUGAL):
   - Cancro da Mama: Rastreio bienal (2 anos) para mulheres dos 45 aos 74 anos.

Responde num JSON estruturado com as chaves: "suggestedIntervalYears" (número), "suggestedIntervalMonths" (inteiro), "recommendationText" (string em Português de Portugal), "guidelineSource" (string ex: ESGE 2020), "urgency" (string: baixa, normal, alta, urgente)."#
    );

    let body = json!({
        "contents": [{
            "parts": [{ "text": prompt }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    });

    let res = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await;

    match res {
        Ok(resp) => {
            if let Ok(json_res) = resp.json::<Value>().await {
                if let Some(text) = json_res["candidates"][0]["content"]["parts"][0]["text"].as_str() {
                    if let Ok(parsed_gemini) = serde_json::from_str::<Value>(text) {
                        return Ok(parsed_gemini);
                    }
                }
            }
            Err("Não foi possível processar a resposta da API Gemini.".into())
        }
        Err(e) => Err(format!("Erro na chamada de rede Gemini: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            db::load_db,
            db::save_db,
            consult_gemini_guideline
        ])
        .run(tauri::generate_context())?;
    Ok(())
}
