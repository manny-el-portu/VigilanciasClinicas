import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure local data directory and database file exist on disk
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "vigilancias_db.json");

function ensureDbFileExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      patients: [],
      surveillanceItems: [],
      settings: {
        autostartWindows: true,
        startMinimizedTray: true,
        desktopNotifications: true,
        notificationSound: true,
        leadDaysNotice: 30,
        autoCheckIntervalMinutes: 60,
        clinicalNoteTemplateFormat: "compact",
      },
      lastSaved: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
  }
}

function loadDbFromDisk() {
  ensureDbFileExists();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database file from disk:", err);
    return { patients: [], surveillanceItems: [], settings: {} };
  }
}

function saveDbToDisk(data: any) {
  ensureDbFileExists();
  const payload = {
    ...data,
    lastSaved: new Date().toISOString(),
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), "utf-8");
  return payload;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini client lazily/safely if API key exists
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // REST API: Load Database from PC Disk (Outside Browser)
  app.get("/api/db", (_req, res) => {
    try {
      const dbData = loadDbFromDisk();
      res.json({
        success: true,
        storagePath: DB_FILE,
        data: dbData,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // REST API: Save Database directly to PC Disk
  app.post("/api/db", (req, res) => {
    try {
      const { patients, surveillanceItems, settings } = req.body;
      const updated = saveDbToDisk({ patients, surveillanceItems, settings });
      res.json({
        success: true,
        message: "Dados guardados com sucesso no disco rígido local do computador.",
        storagePath: DB_FILE,
        lastSaved: updated.lastSaved,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // REST API: Download Portable Batch Installer for Windows PC
  app.get("/api/installer/batch", (_req, res) => {
    const currentHost = _req.get("host") || "localhost:3000";
    const batchContent = `@echo off
TITLE Vigilancias - Aplicacao Clinica Nativa
COLOR 0A
cls
echo ======================================================================
echo    VIGILANCIAS - APLICACAO NATIVA E MODO OFF-LINE PARA PC
echo ======================================================================
echo.
echo [1/3] A verificar ligacao e servico local na porta 3000...
set APP_URL=http://${currentHost}
set DB_PATH=%CD%\\data\\vigilancias_db.json

echo [2/3] Ficheiro de Base de Dados no Disco do Computador:
echo       %DB_PATH%
echo.
echo [3/3] A iniciar o Vigilancias em Janela Nativa...
start msedge --app="%APP_URL%" || start chrome --app="%APP_URL%" || start %APP_URL%

echo.
echo [SUCESSO] A aplicacao esta a ser executada nativamente no PC.
echo Os dados estao guardados diretamente no ficheiro %DB_PATH% (fora do navegador).
timeout /t 5
`;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="Iniciar_Vigilancias_PC.bat"');
    res.send(batchContent);
  });

  // Clinical guideline suggestion endpoint
  app.post("/api/gemini/guideline", async (req, res) => {
    try {
      const { diagnosis, examType, patientAge, patientSex } = req.body;

      if (!diagnosis) {
        return res.status(400).json({ error: "Diagnóstico/indicação é obrigatório" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback response if API key is not configured
        return res.json({
          suggestedIntervalMonths: 12,
          suggestedIntervalYears: 1,
          recommendationText: "Recomendação predefinida: vigilância anual padrão. (Para sugestão avançada via IA por diretrizes internacionais, configure a chave Gemini).",
          guidelineSource: "Prática Clínica Padrão",
          urgency: "normal",
        });
      }

      const prompt = `Como assistente médico especializado em medicina geral e familiar e especialidades hospitalares (com elevado rigor técnico nas diretrizes DGS, ESGE 2020, ESC/EHA 2025, USMSTF), analisa a seguinte indicação clínica para propor um intervalo de vigilância regular para o paciente:
- Diagnóstico / Lesão / Achado: "${diagnosis}"
- Tipo de Exame / Consulta: "${examType || 'Não especificado'}"
- Idade do Utente: ${patientAge || 'Não informada'} anos
- Sexo do Utente: ${patientSex || 'Não informado'}

Instruções e Regras Clínicas Obrigatórias de Alto Rigor:
1. COLONOSCOPIA E PÓLIPOS DE CÓLON (Diretrizes ESGE 2020 e USMSTF 2020):
   - REGRESSO AO RASTREIO POPULACIONAL (Sem vigilância endoscópica / Intervalo 0 anos):
     * Citação Oficial ESGE 2020: "ESGE recommends that patients with complete removal of 1 – 4 < 10 mm adenomas with low grade dysplasia, irrespective of villous components, or any serrated polyp < 10 mm without dysplasia, do not require endoscopic surveillance and should be returned to screening."
     * Doentes com excisão completa de 1 a 4 adenomas < 10 mm com displasia de baixo grau (LGD) - INDEPENDENTEMENTE de apresentarem componentes vilosos ou tubulovilosos - OU qualquer pólipo serreado < 10 mm sem displasia, SÃO DE BAIXO RISCO, NÃO requerem vigilância colonoscópica e DEVEM REGRESSAR AO RASTREIO POPULACIONAL (definir suggestedIntervalYears = 0 e suggestedIntervalMonths = 0).
     * NUNCA recomendar vigilância aos 3 anos para 1, 2, 3 ou 4 adenomas < 10 mm com displasia de baixo grau!
   - VIGILÂNCIA AOS 3 ANOS (Alto Risco - Indicação Estrita):
     * Pelo menos 1 adenoma ≥ 10 mm OU com displasia de alto grau (HGD);
     * OU 5 ou mais (≥ 5) adenomas de qualquer tamanho;
     * OU qualquer pólipo serreado ≥ 10 mm OU com displasia.
   - RESSEÇÃO FRAGMENTADA (PIECEMEAL) DE PÓLIPOS ≥ 20 mm:
     * Repetição precoce em 3 a 6 meses (0.25 a 0.5 anos).
     * 1ª vigilância subsequente aos 12 meses (1 ano).
   - VIGILÂNCIA SUBSEQUENTE (ESGE 2020):
     * Se 1ª vigilância for negativa (sem pólipos de risco): 2ª vigilância aos 5 anos.
     * Se 1ª vigilância detetar novos pólipos de risco: repetir aos 3 anos.

2. VALVOPATIAS CARDÍACAS (Diretrizes ESC / EHA 2025):
   - Estenose Aórtica (EA): Ligeira (2-3 anos), Moderada (1 ano), Grave Assintomática (6 meses / 0.5 anos).
   - Regurgitação Aórtica (IAo): Moderada (2 anos), Grave Assintomática (1 ano; 3-6 meses se próxima de critérios cirúrgicos ou Aorta >45mm).
   - Regurgitação Mitral (RM): Moderada (1-2 anos), Grave Assintomática (6 meses). Pós-plastia bem sucedida (2-3 anos), Pós-TEER/MitraClip (1 ano).
   - Estenose Mitral (EM): Moderada Assintomática (2-3 anos), Grave Assintomática (1 ano).

3. RASTREIOS NACIONAIS DGS (PORTUGAL):
   - Cancro da Mama: Rastreio bienal (2 anos) para mulheres assintomáticas dos 45 aos 74 anos.

Responde num JSON estruturado com o intervalo recomendado em anos e meses (se a recomendação for 'Regresso ao Rastreio Populacional sem vigilância especial', define suggestedIntervalYears = 0 e suggestedIntervalMonths = 0), a fonte da diretriz clínica (ex: "ESGE Guidelines 2020", "ESC/EHA Guidelines 2025", "DGS"), uma explicação/justificação resumida, rigorosa e clara em português (Portugal) citando exatamente a norma correta, e a prioridade recomendada (baixa, normal, alta, urgente).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedIntervalYears: {
                type: Type.NUMBER,
                description: "Intervalo recomendado em anos (ex: 2 ou 3 ou 0.5)",
              },
              suggestedIntervalMonths: {
                type: Type.INTEGER,
                description: "Intervalo equivalente em meses (ex: 24 ou 36)",
              },
              recommendationText: {
                type: Type.STRING,
                description: "Explicação sucinta e rigorosa da recomendação técnica baseada em evidência",
              },
              guidelineSource: {
                type: Type.STRING,
                description: "Nome da diretriz/sociedade médica de referência (ex: ESGE, ESC, DGS, EAU)",
              },
              urgency: {
                type: Type.STRING,
                description: "Nível de prioridade: baixa, normal, alta, urgente",
              },
            },
            required: ["suggestedIntervalYears", "suggestedIntervalMonths", "recommendationText", "guidelineSource", "urgency"],
          },
        },
      });

      const jsonText = response.text || "{}";
      const parsedData = JSON.parse(jsonText);

      res.json(parsedData);
    } catch (error: any) {
      console.error("Erro na rota /api/gemini/guideline:", error);
      res.status(500).json({
        error: "Não foi possível obter a recomendação de guideline no momento.",
        details: error.message,
      });
    }
  });

  // Clinical note formatted text generator route
  app.post("/api/gemini/clinical-note", async (req, res) => {
    try {
      const { patient, surveillanceItems } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Simple manual format
        let note = `=== VIGILÂNCIAS REGULARES (PENDENTES / PROGRAMADAS) ===\n`;
        note += `Utente SNS: ${patient.sns} | Sexo: ${patient.sex} | Idade: ${patient.age} anos\n`;
        if (patient.name) note += `Nome: ${patient.name}\n`;
        note += `--------------------------------------------------\n`;
        (surveillanceItems || []).forEach((item: any, idx: number) => {
          note += `${idx + 1}. [${item.examType.toUpperCase()}] Data limite: ${item.targetDate} | Indicação: ${item.diagnosis} | Estado: ${item.status}\n`;
        });
        return res.json({ formattedNote: note });
      }

      const prompt = `Gera uma nota resumida e limpa no formato ideal para colar no diário clínico de consulta.
Dados do paciente:
SNS: ${patient.sns}, Sexo: ${patient.sex}, Idade: ${patient.age}${patient.name ? `, Nome: ${patient.name}` : ''}

Itens de Vigilância:
${JSON.stringify(surveillanceItems, null, 2)}

Escreve um texto compacto, claro e profissional em português de Portugal, pronto a ser colado nas notas de consulta.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({ formattedNote: response.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for dev or static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Vigilâncias] Servidor a correr em http://localhost:${PORT}`);
  });
}

startServer();
