import { USFIndicator, IndicatorDimension } from '../types';

export const getSdmBiUrl = (indicatorNumber: number): string => {
  return `https://sdm.min-saude.pt/bi.aspx?id=${indicatorNumber}&clusters=S`;
};

export interface DimensionSummary {
  dimension: IndicatorDimension;
  count: number;
  totalWeight: number;
  description: string;
}

export const DIMENSION_SUMMARIES: DimensionSummary[] = [
  {
    dimension: 'Acesso',
    count: 5,
    totalWeight: 20.0,
    description: 'Avaliação da acessibilidade da população à equipa de saúde familiar (consultas médicas, de enfermagem, domicílios e renovação de receituário).',
  },
  {
    dimension: 'Gestão da Saúde',
    count: 20,
    totalWeight: 24.0,
    description: 'Acompanhamento preventivo e promoção da saúde ao longo do ciclo de vida (saúde infantil, materna, rastreios oncológicos, vacinação e cessação tabágica).',
  },
  {
    dimension: 'Gestão da Doença',
    count: 14,
    totalWeight: 21.0,
    description: 'Monitorização e controlo clínico rigoroso de patologias crónicas de elevada prevalência (Diabetes Mellitus, Hipertensão Arterial, DPOC e Asma).',
  },
  {
    dimension: 'Qualificação da Prescrição',
    count: 2,
    totalWeight: 18.0,
    description: 'Eficiência e racionalidade na prescrição farmacológica e de Meios Complementares de Diagnóstico e Terapêutica (MCDT) por utente padrão.',
  },
  {
    dimension: 'Integração de Cuidados',
    count: 2,
    totalWeight: 17.0,
    description: 'Capacidade resolutiva da unidade nos cuidados de saúde agudos e prevenção de internamentos hospitalares potencialmente evitáveis.',
  },
];

export const USF_INDICATORS: USFIndicator[] = [
  // ----------------------------------------------------
  // 1. ACESSO (5 indicadores, soma = 20.0 pontos)
  // ----------------------------------------------------
  {
    number: 8,
    name: 'Utilização de consultas de planeamento familiar',
    dimension: 'Acesso',
    weight: 4.0,
    expectedValues: '[60; 100]',
    acceptableVariations: '[38; 60[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Mulheres em idade fértil (15-49 anos) inscritas na USF',
    clinicalObjective: 'Garantir cobertura em saúde reprodutiva e planeamento familiar com pelo menos uma consulta nos últimos 3 anos.',
    calculationSummary: 'Proporção de utentes do sexo feminino (15-49 anos) com pelo menos 1 consulta de planeamento familiar nos últimos 36 meses.',
    importGuidance: 'Lista de mulheres 15-49 anos sem registo de consulta de PF nos últimos 3 anos para convocatória antes do encerramento do ano civil.'
  },
  {
    number: 294,
    name: 'Domicílios de enfermagem',
    dimension: 'Acesso',
    weight: 4.0,
    expectedValues: '[500; 1500]',
    acceptableVariations: '[150; 500[ U ]1500; 1500]',
    unit: 'por 1000 utentes dependentes',
    targetCohort: 'Utentes em situação de dependência ou com incapacidade de deslocação',
    clinicalObjective: 'Assegurar cuidados de enfermagem domiciliários estruturados aos doentes dependentes.',
    calculationSummary: 'Taxa de consultas/atos de enfermagem domiciliários ponderados pela população dependente da lista.',
    importGuidance: 'Lista de utentes inscritos no programa de dependentes/acamados e periodicidade de visitas domiciliárias agendadas.'
  },
  {
    number: 330,
    name: 'Utilização de consultas médicas',
    dimension: 'Acesso',
    weight: 5.0,
    expectedValues: '[0,82; 2]',
    acceptableVariations: '[0,7; 0,82[ U ]2; 2]',
    unit: 'consultas/utente/ano',
    targetCohort: 'Totalidade de utentes inscritos na lista da USF',
    clinicalObjective: 'Equilíbrio e garantia de acesso de todos os utentes a cuidados médicos ao longo do ano.',
    calculationSummary: 'Rácio médio de consultas médicas presenciais ou não presenciais efetuadas por utente inscrito na lista.',
    importGuidance: 'Identificação de utentes frequentes e utentes sem contacto nos últimos 2-3 anos.'
  },
  {
    number: 331,
    name: 'Utilização de consultas de enfermagem',
    dimension: 'Acesso',
    weight: 5.0,
    expectedValues: '[0,76; 2]',
    acceptableVariations: '[0,6; 0,76[ U ]2; 2]',
    unit: 'consultas/utente/ano',
    targetCohort: 'Totalidade de utentes inscritos na lista da USF',
    clinicalObjective: 'Garantir intervenção e acompanhamento de enfermagem contínuo à população.',
    calculationSummary: 'Rácio médio de consultas e intervenções de enfermagem realizadas por utente inscrito.',
    importGuidance: 'Monitorização da taxa de cobertura de consultas de enfermagem no plano de vigilâncias.'
  },
  {
    number: 335,
    name: 'Renovação do receituário crónico em 3 dias úteis',
    dimension: 'Acesso',
    weight: 2.0,
    expectedValues: '[85; 100]',
    acceptableVariations: '[80; 85[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Todos os pedidos de renovação de medicação crónica rececionados',
    clinicalObjective: 'Celeridade e segurança na resposta a pedidos de renovação de terapêutica crónica.',
    calculationSummary: 'Percentagem de prescrições de receita crónica emitidas no prazo máximo de 72 horas úteis após pedido.',
    importGuidance: 'Relatório de pedidos pendentes no SClínico / módulo de receituário não presencial.'
  },

  // ----------------------------------------------------
  // 2. GESTÃO DA SAÚDE (20 indicadores, soma = 24.0 pontos)
  // ----------------------------------------------------
  {
    number: 11,
    name: 'Consulta de vigilância da gravidez no 1.º trimestre',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[91; 100]',
    acceptableVariations: '[85; 91[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Grávidas com parto no ano civil com vigilância na USF',
    clinicalObjective: 'Início precoce da vigilância pré-natal antes das 12 semanas de gestação.',
    calculationSummary: 'Proporção de grávidas vigiadas com 1.ª consulta médica/enfermagem realizada até à 11ª semana + 6 dias.',
    importGuidance: 'Grávidas com primeira consulta tardia ou recém-inscritas sem primeira consulta registada no 1.º trimestre.'
  },
  {
    number: 34,
    name: 'Realização de consulta em utentes com obesidade',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[72; 100]',
    acceptableVariations: '[55; 72[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com diagnóstico de obesidade (IMC ≥ 30 kg/m²)',
    clinicalObjective: 'Vigilância regular e intervenção no estilo de vida em utentes obesos.',
    calculationSummary: 'Percentagem de utentes com obesidade ativa que tiveram consulta médica ou de enfermagem nos últimos 12 meses.',
    importGuidance: 'Export do BI-CSP de utentes com código ICPC-2 T82 sem consulta há mais de 1 ano para convocatória.'
  },
  {
    number: 45,
    name: 'Rastreio do cancro colo do útero',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[60; 100]',
    acceptableVariations: '[37; 60[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Mulheres dos 25 aos 64 anos elegíveis sem histerectomia total',
    clinicalObjective: 'Deteção precoce de lesões pré-malignas e cancro do colo do útero por citologia/HPV nos últimos 3 a 5 anos.',
    calculationSummary: 'Percentagem de mulheres entre os 25 e 64 anos com rastreio de cancro do colo do útero atualizado.',
    importGuidance: 'Ficheiro Excel de mulheres dos 25-64 anos em falta para colpocitologia/rastreio organizado.'
  },
  {
    number: 46,
    name: 'Rastreio do cancro do cólon e reto',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[65; 100]',
    acceptableVariations: '[45; 65[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes de ambos os sexos entre os 50 e os 74 anos',
    clinicalObjective: 'Rastreio sistemático por pesquisa de sangue oculto nas fezes (PSOF bienal) ou colonoscopia total nos últimos 5 anos.',
    calculationSummary: 'Proporção de utentes dos 50 aos 74 anos com teste PSOF nos últimos 2 anos ou colonoscopia válida.',
    importGuidance: 'Excel de utentes 50-74 anos sem PSOF ou colonoscopia recente para envio de kit ou convocatória.'
  },
  {
    number: 54,
    name: 'Realização de consulta em utentes com alcoolismo',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[60; 100]',
    acceptableVariations: '[40; 60[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com registo ativo de consumo abusivo ou dependência de álcool (P15/P16)',
    clinicalObjective: 'Acompanhamento clínico continuado e apoio à abstinência.',
    calculationSummary: 'Utentes com diagnóstico codificado com pelo menos uma consulta médica/enfermagem no ano.',
    importGuidance: 'Lista de utentes com registo de etilismo crónico sem contacto clínico nos últimos 12 meses.'
  },
  {
    number: 63,
    name: 'Plano Nacional de Vacinação e consulta de vigilância aos 7 anos',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[80; 100]',
    acceptableVariations: '[65; 80[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Crianças que completam 7 anos no ano de avaliação',
    clinicalObjective: 'Cumprimento do PNV (vacina DTPa-VIP) e avaliação global de saúde infantil na transição escolar.',
    calculationSummary: 'Proporção de crianças aos 7 anos com PNV atualizado e consulta de saúde infantil aos 7 anos registada.',
    importGuidance: 'Crianças da coorte de 7 anos em falta para reforço vacinal e exame de saúde escolar.'
  },
  {
    number: 95,
    name: 'Plano Nacional de Vacinação e consulta de vigilância aos 14 anos',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[95; 100]',
    acceptableVariations: '[90; 95[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Jovens que completam 14 anos no ano de avaliação',
    clinicalObjective: 'Vacinação (Td / HPV) e consulta de vigilância da saúde do adolescente aos 14 anos.',
    calculationSummary: 'Percentagem de adolescentes de 14 anos com esquema vacinal completo e consulta realizada.',
    importGuidance: 'Listagem de jovens da coorte de 14 anos pendentes de reforço vacinal ou vigilância juvenil.'
  },
  {
    number: 98,
    name: 'Proporção utentes com vacina tétano',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[93; 100]',
    acceptableVariations: '[80; 93[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Totalidade de utentes inscritos elegíveis para vacina do tétano (Td)',
    clinicalObjective: 'Manter imunidade protetora contra o tétano em toda a população adulta e idosa.',
    calculationSummary: 'Utentes com vacina antitetânica válida de acordo com as normas da DGS (a cada 10 anos ou 20 anos segundo idade).',
    importGuidance: 'Ficheiro de utentes com vacina do tétano caducada para vacinação nas vindas à unidade ou agendamento.'
  },
  {
    number: 269,
    name: 'Vigilância saúde infantil 2.º ano de vida',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[0,87; 1]',
    acceptableVariations: '[0,7; 0,87[ U ]1; 1]',
    unit: 'índice [0-1]',
    targetCohort: 'Crianças entre os 12 e os 24 meses de idade',
    clinicalObjective: 'Cumprimento das consultas do Programa Nacional de Saúde Infantil (15 e 18 meses).',
    calculationSummary: 'Rácio de consultas de saúde infantil programadas e realizadas durante o segundo ano de vida.',
    importGuidance: 'Crianças de 1 a 2 anos com consultas dos 15m ou 18m em atraso.'
  },
  {
    number: 295,
    name: 'Realização de consultas de enfermagem durante gravidez e puerpério',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[77; 100]',
    acceptableVariations: '[51; 77[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Puérperas e grávidas acompanhadas na USF',
    clinicalObjective: 'Apoio de enfermagem à amamentação, cuidados pós-parto e adaptação à parentalidade.',
    calculationSummary: 'Grávidas/puérperas com consultas de enfermagem de saúde materna registadas durante o ciclo gravídico-puerperal.',
    importGuidance: 'Puérperas sem consulta de revisão pós-parto de enfermagem agendada até ao 42º dia.'
  },
  {
    number: 302,
    name: 'Vigilância saúde infantil 1.º ano de vida',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[0,93; 1]',
    acceptableVariations: '[0,82; 0,93[ U ]1; 1]',
    unit: 'índice [0-1]',
    targetCohort: 'Bebés dos 0 aos 12 meses',
    clinicalObjective: 'Cumprimento escrupuloso das consultas dos 1, 2, 4, 6 e 9 meses de vida.',
    calculationSummary: 'Índice de assiduidade e realização das consultas-chave de saúde infantil no primeiro ano.',
    importGuidance: 'Lactentes sem consulta de desenvolvimento ou vacinas do 1.º ano em falta.'
  },
  {
    number: 308,
    name: 'Ecografia morfológica na gravidez',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[80; 100]',
    acceptableVariations: '[60; 80[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Grávidas acompanhadas na USF entre as 20 e as 22 semanas + 6 dias',
    clinicalObjective: 'Rastreio ecográfico de malformações anatómicas fetais no 2.º trimestre.',
    calculationSummary: 'Percentagem de grávidas vigiadas que realizaram e registaram ecografia morfológica no tempo certo.',
    importGuidance: 'Grávidas entre as 18 e 22 semanas sem registo do resultado da ecografia morfológica.'
  },
  {
    number: 310,
    name: 'Exames laboratoriais no 1.º trimestre da gravidez',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[0,79; 1]',
    acceptableVariations: '[0,62; 0,79[ U ]1; 1]',
    unit: 'índice [0-1]',
    targetCohort: 'Grávidas vigiadas no 1.º trimestre',
    clinicalObjective: 'Prescrição e avaliação atempada da bateria analítica obrigatória (hemograma, glicemia, tipagem, serologias).',
    calculationSummary: 'Taxa de cumprimento do protocolo de exames laboratoriais do 1.º trimestre.',
    importGuidance: 'Grávidas no 1.º trimestre com MCDTs pendentes ou sem registo de resultados.'
  },
  {
    number: 311,
    name: 'Exames laboratoriais no 2.º trimestre da gravidez',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[0,54; 1]',
    acceptableVariations: '[0,4; 0,54[ U ]1; 1]',
    unit: 'índice [0-1]',
    targetCohort: 'Grávidas vigiadas entre as 24 e 28 semanas',
    clinicalObjective: 'Rastreio analítico do 2.º trimestre, incluindo PTGO para diagnóstico de diabetes gestacional.',
    calculationSummary: 'Taxa de cumprimento da bateria analítica do 2.º trimestre.',
    importGuidance: 'Grávidas que atingiram as 24 semanas sem agendamento/registo da PTGO e hemograma.'
  },
  {
    number: 312,
    name: 'Exames laboratoriais no 3.º trimestre da gravidez',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[0,43; 1]',
    acceptableVariations: '[0,3; 0,43[ U ]1; 1]',
    unit: 'índice [0-1]',
    targetCohort: 'Grávidas entre as 32 e as 37 semanas',
    clinicalObjective: 'Pesquisa de estreptococo grupo B (SGB), hemograma e serologias finais pré-parto.',
    calculationSummary: 'Taxa de cumprimento dos exames laboratoriais e zaragatoa retovaginal no 3.º trimestre.',
    importGuidance: 'Grávidas no 3.º trimestre sem rastreio de SGB ou analítica pré-parto registada.'
  },
  {
    number: 384,
    name: 'Recém-nascidos cuja mãe tem registo de gravidez',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[90; 100]',
    acceptableVariations: '[80; 90[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Todos os recém-nascidos inscritos na USF',
    clinicalObjective: 'Articulação entre a vigilância pré-natal e a inscrição atempada do recém-nascido.',
    calculationSummary: 'Recém-nascidos cujo processo clínico se encontra devidamente associado ao processo materno com gravidez codificada.',
    importGuidance: 'Inscrições recentes de bebés sem ligação ao processo materno ou sem codificação de gravidez anterior.'
  },
  {
    number: 397,
    name: 'Fumadores com interações breves ou muito breves',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[25; 100]',
    acceptableVariations: '[15; 25[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes registados com hábitos tabágicos ativos (P17)',
    clinicalObjective: 'Intervenção breve sistemática de cessação tabágica segundo a DGS.',
    calculationSummary: 'Fumadores com intervenção breve ou muito breve documentada nos últimos 12 meses.',
    importGuidance: 'Utentes fumadores com consulta recente mas sem código de intervenção breve registado.'
  },
  {
    number: 404,
    name: 'Pessoas com abstinência tabágica',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[60; 10000]',
    acceptableVariations: '[20; 60[ U ]10000; 10000]',
    unit: 'por 1000 fumadores',
    targetCohort: 'Fumadores inscritos em programas ou acompanhados para cessação',
    clinicalObjective: 'Taxa de sucesso na cessação tabágica sustentada por mais de 6 meses.',
    calculationSummary: 'Rácio de ex-fumadores com abstinência confirmada no período de avaliação.',
    importGuidance: 'Utentes em fase de desmame ou processo de cessação tabágica para consulta de seguimento.'
  },
  {
    number: 435,
    name: 'Utentes com vacina da gripe',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[66; 100]',
    acceptableVariations: '[62; 66[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com 65 ou mais anos e grupos de risco prioritários',
    clinicalObjective: 'Cobertura vacinal sazonal contra a gripe na população idosa de acordo com metas da OMS/DGS.',
    calculationSummary: 'Percentagem de utentes ≥ 65 anos com vacina da gripe administrada na época vacinal corrente.',
    importGuidance: 'Utentes ≥ 65 anos sem registo de vacinação antigripal durante o período de campanha de outono/inverno.'
  },
  {
    number: 409,
    name: 'Utentes sem prescrição prolongada de ansiolíticos, sedativos e hipnóticos ajustada à população padrão',
    dimension: 'Gestão da Saúde',
    weight: 1.2,
    expectedValues: '[91,5; 100]',
    acceptableVariations: '[89; 91,5[ U ]100; 100]',
    unit: '%',
    targetCohort: 'População padrão da USF',
    clinicalObjective: 'Evitar o uso crónico e dependência de benzodiazepinas e fármacos Z.',
    calculationSummary: 'Percentagem de utentes que NÃO recebem prescrição prolongada (>6 meses contínuos) de BZD ou similares.',
    importGuidance: 'Doentes com consumo crónico de BZD há mais de 180 dias para plano de desmame gradual com o médico de família.'
  },

  // ----------------------------------------------------
  // 3. GESTÃO DA DOENÇA (14 indicadores, soma = 21.0 pontos)
  // ----------------------------------------------------
  {
    number: 20,
    name: 'Utentes com hipertensão com pressão arterial controlada',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[67; 100]',
    acceptableVariations: '[45; 67[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com diagnóstico codificado de Hipertensão Arterial (K86/K87)',
    clinicalObjective: 'Controlo tensional eficaz (PA < 140/90 mmHg ou valor alvo individualizado) na última medição.',
    calculationSummary: 'Hipertensos com valor de PA registado nos últimos 12 meses em nível controlado.',
    importGuidance: 'Excel de hipertensos sem medição de PA no último ano ou com último registo descontrolado (≥140/90).'
  },
  {
    number: 23,
    name: 'Utentes com hipertensão com registo de risco cardiovascular',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[80; 100]',
    acceptableVariations: '[60; 80[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes hipertensos dos 40 aos 65 anos',
    clinicalObjective: 'Estratificação do risco cardiovascular global através da ferramenta SCORE / SCORE2.',
    calculationSummary: 'Hipertensos com cálculo e registo do risco cardiovascular atualizado nos últimos 3 anos.',
    importGuidance: 'Utentes hipertensos sem cálculo SCORE/SCORE2 atualizado no SClínico para cálculo na próxima consulta.'
  },
  {
    number: 36,
    name: 'Utentes com diabetes com registo de Gestão de Regime Terapêutico',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[75; 100]',
    acceptableVariations: '[60; 75[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com Diabetes Mellitus (T89/T90)',
    clinicalObjective: 'Capacitação do utente diabético para autogestão da medicação, hipoglicemias e estilo de vida.',
    calculationSummary: 'Diabéticos com intervenção e diagnóstico de enfermagem de adesão terapêutica no ano civil.',
    importGuidance: 'Diabéticos sem consulta de enfermagem com intervenção de Regime Terapêutico no ano corrente.'
  },
  {
    number: 37,
    name: 'Utentes com diabetes com consulta de enfermagem de vigilância',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[87; 100]',
    acceptableVariations: '[70; 87[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Totalidade dos utentes diabéticos inscritos',
    clinicalObjective: 'Garantir vigilância multidisciplinar de enfermagem periódica aos diabéticos.',
    calculationSummary: 'Proporção de diabéticos que realizaram pelo menos 1 consulta de enfermagem de vigilância nos últimos 12 meses.',
    importGuidance: 'Ficheiro de doentes diabéticos sem consulta de enfermagem no último ano civil.'
  },
  {
    number: 39,
    name: 'Utentes com diabetes com última HbA1c controlada',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[70; 100]',
    acceptableVariations: '[50; 70[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Diabéticos com doseamento de HbA1c nos últimos 12 meses',
    clinicalObjective: 'Controlo glicémico com HbA1c em valor ótimo (em regra ≤ 7.0% ou ≤ 8.0% em idosos/comorbilidades).',
    calculationSummary: 'Percentagem de diabéticos vigiados com o último valor de HbA1c dentro do alvo terapêutico.',
    importGuidance: 'Lista de diabéticos com HbA1c descontrolada (>8.0%) ou sem HbA1c nos últimos 12 meses para ajuste terapêutico.'
  },
  {
    number: 49,
    name: 'Utentes com doença pulmonar obstrutiva crónica com espirometria',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[60; 100]',
    acceptableVariations: '[30; 60[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com diagnóstico codificado de DPOC (R95)',
    clinicalObjective: 'Confirmação diagnóstica e estadiamento da limitação do débito aéreo por espirometria.',
    calculationSummary: 'Utentes com DPOC com pelo menos uma espirometria registada com prova de broncodilatação.',
    importGuidance: 'Doentes com DPOC sem prova de função respiratória no processo para prescrição de espirometria.'
  },
  {
    number: 261,
    name: 'Utentes com avaliação do risco de úlcera de pé',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[87; 100]',
    acceptableVariations: '[70; 87[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com diagnóstico de Diabetes Mellitus',
    clinicalObjective: 'Exame podológico anual sistemático (monofilamento, palpação de pulsos, inspeção de deformidades).',
    calculationSummary: 'Diabéticos com avaliação formal e registo de estratificação do pé de risco nos últimos 12 meses.',
    importGuidance: 'Doentes diabéticos sem registo de exame aos pés nos últimos 12 meses para agendamento com enfermagem.'
  },
  {
    number: 274,
    name: 'Utentes com diabetes tipo 2 e indicação para insulinoterapia, a fazer terapêutica adequada',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[82; 100]',
    acceptableVariations: '[65; 82[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Diabéticos tipo 2 com falência de antidiabéticos orais',
    clinicalObjective: 'Instituição atempada de insulina e titulação terapêutica sem inércia clínica.',
    calculationSummary: 'Diabéticos tipo 2 elegíveis para insulinoterapia a cumprir plano adequado.',
    importGuidance: 'Utentes diabéticos com HbA1c persistente elevada com terapêutica oral máxima para ponderar insulinização.'
  },
  {
    number: 275,
    name: 'Novos utentes com diabetes tipo 2 em terapêutica com metformina em monoterapia',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[70; 100]',
    acceptableVariations: '[50; 70[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Novos diagnósticos de Diabetes tipo 2 no ano civil',
    clinicalObjective: 'Cumprimento das recomendações de primeira linha farmacológica (metformina) na ausência de contraindicação.',
    calculationSummary: 'Percentagem de novos diabéticos iniciados com metformina como fármaco de 1.ª linha.',
    importGuidance: 'Novos diagnósticos de diabetes sem prescrição ativa de metformina para revisão de contraindicações.'
  },
  {
    number: 314,
    name: 'Utentes com diabetes com pressão arterial controlada',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[0; 15]',
    acceptableVariations: '[0; 0[ U ]15; 28]',
    unit: '% (taxa de não controlo)',
    targetCohort: 'Diabéticos com hipertensão arterial concomitante',
    clinicalObjective: 'Minimizar a percentagem de diabéticos com PA não controlada (alvo < 130/80 mmHg).',
    calculationSummary: 'Taxa de doentes com PA descontrolada (quanto menor melhor, dentro do intervalo [0; 15]).',
    importGuidance: 'Diabéticos com pressão arterial superior aos limites de segurança para reforço anti-hipertensor.'
  },
  {
    number: 315,
    name: 'Utentes com diabetes com valores controlados de colesterol LDL',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[48; 100]',
    acceptableVariations: '[33; 48[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes diabéticos com perfil lipídico avaliado',
    clinicalObjective: 'Controlo do c-LDL (<70 mg/dL ou <55 mg/dL consoante risco) para redução de eventos coronários.',
    calculationSummary: 'Percentagem de diabéticos com doseamento de LDL nos últimos 12 meses dentro do alvo.',
    importGuidance: 'Diabéticos sem perfil lipídico recente ou com c-LDL acima da meta para estatinas/ezetimiba.'
  },
  {
    number: 380,
    name: 'Utentes adultos com evidência de asma ou DPOC ou bronquite crónica, com diagnóstico registado',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[81; 100]',
    acceptableVariations: '[74; 81[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com prescrição frequente de broncodilatadores/corticoides inalados',
    clinicalObjective: 'Evitar subdiagnóstico e garantir codificação formal na lista de problemas ativos.',
    calculationSummary: 'Rácio de doentes sob medicação respiratória com diagnóstico ICPC-2 (R95/R96) registado no processo.',
    importGuidance: 'Utentes que levantam inaladores crónicos sem código diagnóstico associado na ficha clínica.'
  },
  {
    number: 436,
    name: 'Utentes com DPOC com consulta de vigilância',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[70; 100]',
    acceptableVariations: '[35; 70[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com diagnóstico codificado de DPOC',
    clinicalObjective: 'Consulta programada anual com avaliação do impacto da dispneia (mMRC/CAT), técnica inalatória e exacerbações.',
    calculationSummary: 'Proporção de doentes com DPOC com consulta médica ou de enfermagem nos últimos 12 meses.',
    importGuidance: 'Utentes com DPOC sem consulta médica há mais de um ano para convocatória e revisão de inaladores.'
  },
  {
    number: 437,
    name: 'Utentes com asma, com consulta de vigilância',
    dimension: 'Gestão da Doença',
    weight: 1.5,
    expectedValues: '[49; 100]',
    acceptableVariations: '[35; 49[ U ]100; 100]',
    unit: '%',
    targetCohort: 'Utentes com diagnóstico de Asma brônquica (R96)',
    clinicalObjective: 'Avaliação anual do controlo dos sintomas asmáticos (ACT/GINA) e revisão do plano de ação para crises.',
    calculationSummary: 'Percentagem de asmáticos com pelo menos uma consulta de vigilância realizada no último ano.',
    importGuidance: 'Lista de asmáticos sem consulta nos últimos 12 meses ou com registo de idas frequentes à urgência.'
  },

  // ----------------------------------------------------
  // 4. QUALIFICAÇÃO DA PRESCRIÇÃO (2 indicadores, soma = 18.0 pontos)
  // ----------------------------------------------------
  {
    number: 341,
    name: 'Prescrição de medicamentos por utente padrão',
    dimension: 'Qualificação da Prescrição',
    weight: 8.0,
    expectedValues: '[0; 133]',
    acceptableVariations: '[0; 0[ U ]133; 163]',
    unit: '€ / utente padrão',
    targetCohort: 'População padrão ajustada da lista da USF',
    clinicalObjective: 'Uso racional de medicamentos, fomento de genéricos e prescrição eficiente de acordo com as normas.',
    calculationSummary: 'Despesa média com medicamentos prescritos por utente padrão ponderado pelo risco.',
    importGuidance: 'Análise de prescrições de custo elevado e fármacos sem ganho terapêutico comprovado.'
  },
  {
    number: 354,
    name: 'Prescrição de MCDT por utente padrão',
    dimension: 'Qualificação da Prescrição',
    weight: 10.0,
    expectedValues: '[0; 47]',
    acceptableVariations: '[0; 0[ U ]47; 57]',
    unit: '€ / utente padrão',
    targetCohort: 'População padrão ajustada da lista da USF',
    clinicalObjective: 'Adequação técnico-científica na solicitação de exames laboratoriais e radiológicos sem sobrediagnóstico.',
    calculationSummary: 'Custo médio com Meios Complementares de Diagnóstico e Terapêutica prescritos por utente padrão.',
    importGuidance: 'Monitorização da periodicidade e conformidade de requisições de análises e exames com os protocolos clínicos.'
  },

  // ----------------------------------------------------
  // 5. INTEGRAÇÃO DE CUIDADOS (2 indicadores, soma = 17.0 pontos)
  // ----------------------------------------------------
  {
    number: 365,
    name: 'Internamentos evitáveis',
    dimension: 'Integração de Cuidados',
    weight: 7.0,
    expectedValues: '[0; 480]',
    acceptableVariations: '[0; 0[ U ]480; 620]',
    unit: 'por 100.000 utentes padrão',
    targetCohort: 'População inscrita com condições sensíveis aos cuidados ambulatórios',
    clinicalObjective: 'Redução de hospitalizações por descompensação de insuficiência cardíaca, DPOC, diabetes ou infeções tratáveis.',
    calculationSummary: 'Taxa padronizada de internamentos hospitalares por causas passíveis de prevenção nos CSP.',
    importGuidance: 'Revisão clínica pós-alta de doentes que estiveram internados para reforço de vigilância domiciliária/USF.'
  },
  {
    number: 412,
    name: 'Resolutividade da unidade funcional para doença aguda',
    dimension: 'Integração de Cuidados',
    weight: 10.0,
    expectedValues: '[60; 85]',
    acceptableVariations: '[40; 60[ U ]85; 95]',
    unit: '%',
    targetCohort: 'Episódios de doença aguda da população inscrita',
    clinicalObjective: 'Resposta rápida a agudizações na USF no próprio dia, evitando o recurso desnecessário à urgência hospitalar.',
    calculationSummary: 'Proporção de consultas de doença aguda atendidas na USF versus idas ao Serviço de Urgência.',
    importGuidance: 'Gestão das vagas de intersubstituição e consulta aberta da equipa de família.'
  }
];

// Dados dos Incentivos Institucionais (Anexo IV, V e VI)
export interface InstitutionalIncentiveCategory {
  dimension: string;
  weightPercentage: number;
  description: string;
}

export const INSTITUTIONAL_INCENTIVES_CATEGORIES: InstitutionalIncentiveCategory[] = [
  {
    dimension: 'Satisfação dos Utentes',
    weightPercentage: 20,
    description: 'Inquérito de satisfação aos utentes da USF, contratualizado e negociado com a ULS.',
  },
  {
    dimension: 'Satisfação dos Profissionais',
    weightPercentage: 20,
    description: 'Avaliação do clima e satisfação dos profissionais da equipa multiprofissional.',
  },
  {
    dimension: 'Melhoria Contínua do Desempenho (6 Indicadores)',
    weightPercentage: 60,
    description: '6 indicadores negociados entre a USF e a ULS (10% cada) nas áreas de acesso, saúde, doença ou prescrição.',
  },
];

export const INSTITUTIONAL_INCENTIVE_SCALES = [
  { rank: '1.º', result: '< 50', consequence: 'Sem direito a incentivos — intervenção da ULS e da ENA', payout: '0%' },
  { rank: '2.º', result: '≥ 50 e < 60', consequence: 'Sem direito a incentivos institucionais', payout: '0%' },
  { rank: '3.º', result: '≥ 60 e < 95', consequence: 'Direito a incentivos institucionais', payout: 'Função linear' },
  { rank: '4.º', result: '≥ 95', consequence: 'Direito a incentivos institucionais', payout: '100% do valor máximo' },
];

export const INSTITUTIONAL_INCENTIVE_AMOUNTS = [
  { upRange: '< 8.500 UP', maxAmount: '9.600 €' },
  { upRange: '8.500 - 15.500 UP', maxAmount: '15.200 €' },
  { upRange: '≥ 15.500 UP', maxAmount: '20.000 €' },
];
