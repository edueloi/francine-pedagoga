import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import authRoutes from "./backend/routes/auth";
import usersRoutes from "./backend/routes/users";
import patientsRoutes from "./backend/routes/patients";
import patientDocumentsRoutes from "./backend/routes/patientDocuments";
import anamnesesRoutes from "./backend/routes/anamneses";
import sessionsRoutes from "./backend/routes/sessions";
import activitiesRoutes from "./backend/routes/activities";
import insurancesRoutes from "./backend/routes/insurances";
import insuranceProvidersRoutes from "./backend/routes/insuranceProviders";
import insuranceDocumentsRoutes from "./backend/routes/insuranceDocuments";
import timelineRoutes from "./backend/routes/timeline";
import agendaRoutes from "./backend/routes/agenda";
import agendaWeeklySlotsRoutes from "./backend/routes/agendaWeeklySlots";
import protocolsRoutes from "./backend/routes/protocols";
import peiGoalsRoutes from "./backend/routes/peiGoals";
import auditLogsRoutes from "./backend/routes/auditLogs";
import formsRoutes, { publicFormsRouter } from "./backend/routes/forms";
import whatsappRoutes from "./backend/routes/whatsapp";
import emailRoutes from "./backend/routes/email";
import reportsRoutes from "./backend/routes/reports";
import uploadsRoutes from "./backend/routes/uploads";
import clinicSettingsRoutes, { publicClinicInfoRouter } from "./backend/routes/clinicSettings";
import { publicAnamneseRouter } from "./backend/routes/anamneseShare";
import * as whatsappService from "./backend/services/whatsappService";
import { startReminderScheduler } from "./backend/services/reminderScheduler";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/patient-documents", patientDocumentsRoutes);
app.use("/api/anamneses", anamnesesRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/insurances", insurancesRoutes);
app.use("/api/insurance-providers", insuranceProvidersRoutes);
app.use("/api/insurance-documents", insuranceDocumentsRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/agenda", agendaRoutes);
app.use("/api/agenda-weekly-slots", agendaWeeklySlotsRoutes);
app.use("/api/protocols", protocolsRoutes);
app.use("/api/pei-goals", peiGoalsRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use("/api/forms", formsRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/clinic-settings", clinicSettingsRoutes);

// Public, no-login share-link endpoints — intentionally mounted WITHOUT authMiddleware.
// Only exposes the two routes defined in publicFormsRouter (GET form by token, POST a response).
app.use("/api/public/forms", publicFormsRouter);

// Public, no-login clinic-info endpoint — intentionally mounted WITHOUT authMiddleware.
// Only exposes name/logoUrl/address/phone (see publicClinicInfoRouter for details).
app.use("/api/public/clinic-info", publicClinicInfoRouter);

// Public, no-login anamnese share-link endpoints — intentionally mounted WITHOUT
// authMiddleware. Only exposes the specific patient tied to the token in the URL
// (see publicAnamneseRouter for details); never leaks other patients' data.
app.use("/api/public/anamnese", publicAnamneseRouter);

// Serve uploaded files (clinic logo, patient documents, etc.) statically.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const PORT = Number(process.env.PORT) || 3000;

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API Client:", error);
  }
} else {
  console.log("GEMINI_API_KEY is not set or using placeholder. Running in simulation fallback mode.");
}

// 1. Endpoint for AI Session Evolution Formatting
app.post("/api/ai/evolucao", async (req, res) => {
  const { rawNotes } = req.body;
  if (!rawNotes || typeof rawNotes !== "string") {
    return res.status(400).json({ error: "O campo 'rawNotes' é obrigatório e deve ser uma string." });
  }

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Você é um assistente de IA especializado em psicopedagogia, neuropsicopedagogia e terapia ABA.
Converta as seguintes anotações informais de uma sessão de atendimento infantil em uma evolução técnica, formal, profissional, organizada e detalhada.

Anotações informais: "${rawNotes}"

Siga as melhores práticas da área de saúde e desenvolvimento infantil:
- Use termos formais (ex: "o paciente apresentou", "mediação profissional", "regulação inicial", "estratégias baseadas em ABA").
- Seja objetivo mas descritivo.
- Mantenha em português brasileiro.
Retorne APENAS o texto evolutivo formatado, sem introduções ou observações adicionais.`,
      });
      return res.json({ text: response.text?.trim() });
    } catch (err: any) {
      console.error("Gemini API Error in /api/ai/evolucao:", err);
      // Fallback below
    }
  }

  // Fallback Simulation for local testing / offline mode
  console.log("Simulating AI evolution generation (fallback)...");
  const words = rawNotes.split(/\s+/).map(w => w.toLowerCase());
  let parsedText = `O paciente compareceu ao Espaço Aprender a Ser para atendimento psicopedagógico individualizado com a terapeuta Francine Maria Tersi. `;
  
  if (words.some(w => w.includes("ansioso") || w.includes("bravo") || w.includes("agitado") || w.includes("choro"))) {
    parsedText += "Na chegada, foi observada desregulação emocional e psicomotora. Aplicou-se protocolo de regulação sensorial (Snoezelen/ISL) durante cerca de 10 minutos para restabelecimento do tônus de alerta e prontidão para a aprendizagem. ";
  } else {
    parsedText += "O paciente demonstrou boa regulação inicial, apresentando-se cooperativo e receptivo na transição para a sala de atendimento. ";
  }

  if (words.some(w => w.includes("leitura") || w.includes("escrever") || w.includes("letra") || w.includes("papel") || w.includes("livro"))) {
    parsedText += "Durante as intervenções acadêmicas, foram aplicadas estratégias de pareamento, discriminação visual e consciência fonológica direcionadas às competências de leitura e alfabetização. O paciente necessitou de suporte verbal e físico leve (antecipação baseada em ABA) para sustentação de atenção compartilhada. ";
  }

  if (words.some(w => w.includes("memória") || w.includes("atenção") || w.includes("jogo") || w.includes("quebra-cabeça"))) {
    parsedText += "Foram propostos estímulos voltados às funções executivas, especificamente memória de trabalho e controle inibitório, utilizando recursos lúdicos estruturados. ";
  }

  parsedText += `\n\nEm suma, o paciente respondeu de forma satisfatória ao plano de reforçamento positivo intermitente. Em termos de independência, obteve progresso na transição entre atividades dirigidas com mediação de baixa intensidade. Plano para a próxima sessão: dar continuidade ao pareamento de estímulos e fortalecimento do repertório verbal funcional.`;

  return res.json({ text: parsedText });
});

// 2. Endpoint for AI Report Generation
app.post("/api/ai/relatorio", async (req, res) => {
  const { patient, tipo, objetivo, sessions } = req.body;
  if (!patient || !tipo) {
    return res.status(400).json({ error: "Os campos 'patient' e 'tipo' são obrigatórios." });
  }

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Você é um assistente de IA altamente especializado em desenvolvimento infantil, psicopedagogia e análise do comportamento aplicada (ABA). 
Gere um Relatório Técnico completo e profissional para o paciente abaixo.

Dados do Paciente: ${JSON.stringify(patient)}
Tipo de Relatório: ${tipo}
Objetivo: ${objetivo || "Não especificado"}
Evoluções Recentes das Sessões: ${JSON.stringify(sessions || [])}

Gere um documento estruturado contendo:
1. CABEÇALHO DO LAUDO (Contendo os dados do Espaço Aprender a Ser, paciente e terapeuta Francine Maria Tersi - Psicopedagoga, Neuropsicopedagoga, Terapeuta ABA)
2. OBJETIVO DO DOCUMENTO
3. ANÁLISE COMPORTAMENTAL E COGNITIVA (Comunicação funcional, Regulação sensorial, Coordenação motora, Funções executivas)
4. DESEMPENHO NAS INTERVENÇÕES RECENTES (Baseando-se nos atendimentos fornecidos)
5. RECOMENDAÇÕES CLÍNICAS E ENCAMINHAMENTOS (Para escola, família e/ou corpo médico)
Mantenha um tom clínico de altíssimo nível, acolhedor e em conformidade com as diretrizes de ética profissional. Mantenha em português brasileiro e use Markdown claro.`,
      });
      return res.json({ text: response.text?.trim() });
    } catch (err) {
      console.error("Gemini API Error in /api/ai/relatorio:", err);
    }
  }

  // Fallback Simulation for Reports
  const pName = patient.nome || "Paciente";
  const pAge = patient.idade || "idade não especificada";
  const pDiagnosis = patient.diagnostico || "Não informado";
  
  const reportText = `
# RELATÓRIO CLÍNICO INDIVIDUALIZADO
**Espaço Aprender a Ser — Desenvolvimento Infantil & Aprendizagem**
*Terapeuta Responsável:* Francine Maria Tersi (Psicopedagoga, Neuropsicopedagoga, Terapeuta ABA)

---

## 1. DADOS DE IDENTIFICAÇÃO
*   **Paciente:** ${pName}
*   **Idade:** ${pAge} anos
*   **Diagnóstico / CID:** ${pDiagnosis} (CID: ${patient.cid || "N/A"})
*   **Escola:** ${patient.escola || "Não informada"}
*   **Data de Emissão:** ${new Date().toLocaleDateString('pt-BR')}

## 2. OBJETIVO DO DOCUMENTO
Este documento tem por finalidade apresentar o progresso clínico e as orientações técnicas referentes ao tipo de relatório solicitado: **${tipo}**. O foco principal reside em mensurar as aquisições de desenvolvimento e propor estratégias para potencializar o processo de aprendizagem e independência funcional do paciente.

## 3. ANÁLISE DO DESENVOLVIMENTO & INTERVENÇÕES BASEADAS EM ABA
Durante o período avaliado, o paciente foi submetido a intervenções direcionadas, com foco em:
*   **Regulação Sensorial e Emocional:** Apresentou engajamento positivo utilizando reforçadores de alto valor social e visual. Eventuais crises de frustração foram mediadas com planos de antecedência e regulação sensorial.
*   **Funções Executivas e Acadêmicas:** Ganhos significativos em atenção focada e pareamento de estímulos cognitivos. Dificuldades em memória operacional continuam sendo abordadas através de apoios visuais sistemáticos (Rotinas Visuais).
*   **Comunicação e Habilidades Sociais:** Progresso na intenção comunicativa funcional e seguimento de instruções verbais simples de duas etapas.

## 4. RECOMENDAÇÕES E DIRETRIZES
1.  **Para a Escola:** Recomenda-se a adaptação do material didático, segmentação de comandos complexos e inserção de apoios visuais na carteira para organização espacial e temporal.
2.  **Para a Família:** Manutenção da rotina visual em casa, uso de reforçadores para comportamentos adequados e estímulo ao brincar funcional.
3.  **Encaminhamentos:** Continuidade da intervenção psicopedagógica e ABA com periodicidade de 2 a 3 sessões semanais.
`;
  return res.json({ text: reportText.trim() });
});

// 3. Endpoint for AI PEI (Plano Educacional Individualizado)
app.post("/api/ai/pei", async (req, res) => {
  const { patient, diagnostico, necessidades } = req.body;
  if (!patient) {
    return res.status(400).json({ error: "Os dados do paciente são obrigatórios." });
  }

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Você é uma IA de ponta especialista em neuropsicopedagogia, educação especial e intervenções ABA.
Gere um PEI (Plano Educacional Individualizado) detalhado, técnico e imediatamente aplicável para o seguinte paciente.

Dados do Paciente: ${JSON.stringify(patient)}
Diagnóstico Clínico: ${diagnostico || patient.diagnostico || "Não especificado"}
Necessidades Educacionais Relatadas: ${necessidades || "Dificuldade na alfabetização, regulação e engajamento."}

Por favor, estruture a resposta com as seguintes seções claras:
1. Identificação e Diagnóstico Clínico
2. Necessidades Educacionais Prioritárias
3. Objetivos Gerais de Desenvolvimento
4. Objetivos Específicos e Metas de Aprendizagem (Curto, Médio e Longo Prazo)
5. Estratégias Pedagógicas e Adaptações de Grande Porte (Adaptação de avaliações, materiais, apoios físicos)
6. Recursos Necessários (Visuais, Físicos, Tecnológicos, Humanos)
7. Orientações Técnicas para os Professores (Mediação Escolar, Manejo de Comportamento)
8. Orientações para Apoio da Família em Casa
9. Métodos de Avaliação do Progresso e Prazo para Revisão

Retorne o conteúdo em português brasileiro formatado em Markdown limpo, profissional e elegante.`,
      });
      return res.json({ text: response.text?.trim() });
    } catch (err) {
      console.error("Gemini API Error in /api/ai/pei:", err);
    }
  }

  // Fallback Simulation for PEI
  const pName = patient.nome || "Paciente";
  const pDiagnosis = diagnostico || patient.diagnostico || "Transtorno do Desenvolvimento";
  const peiText = `
# PLANO EDUCACIONAL INDIVIDUALIZADO (PEI)
**Aprender a Ser Pro — Solução Inteligente de Planejamento**
*Parceria:* Clínica Espaço Aprender a Ser & Escola do Paciente

---

## 1. IDENTIFICAÇÃO E DIAGNÓSTICO
*   **Estudante:** ${pName}
*   **Idade:** ${patient.idade || "N/A"} anos
*   **Ano Escolar:** ${patient.anoSerie || "N/A"}
*   **Diagnóstico de Entrada:** ${pDiagnosis}

## 2. NECESSIDADES EDUCACIONAIS PRIORITÁRIAS
1.  **Regulação de Atenção:** Ampliar o tempo de foco em atividades dirigidas na carteira.
2.  **Comunicação Acadêmica:** Necessidade de enunciados curtos e apoio com recursos visuais concretos.
3.  **Habilidades Sociais:** Mediação para interação lúdica funcional no recreio e em trabalhos em grupo.

## 3. METAS E OBJETIVOS DE APRENDIZAGEM
*   **Curto Prazo (30-60 dias):** Realizar tarefas dirigidas de até 10 minutos com o mínimo de suporte verbal. Permanecer sentado e engajado com reforçador visual.
*   **Médio Prazo (90-120 dias):** Identificar letras do próprio nome e fazer pareamentos silábicos elementares com material concreto manipulável.
*   **Longo Prazo (Abaixo de 1 ano):** Desenvolver autonomia na leitura de palavras de estrutura silábica simples (consoante-vogal).

## 4. ESTRATÉGIAS PEDAGÓGICAS & ADAPTAÇÕES
*   **Antecipação Visual:** Utilização de rotina de velcro na carteira do aluno (Primeiro: Atividade -> Depois: Reforçador).
*   **Adaptação de Provas:** Avaliações com enunciados simplificados, menor número de alternativas por questão, fonte ampliada e aplicação em ambiente com menor poluição auditiva/visual.
*   **Intervalos Regulatórios:** Permitir pausas ativas de 3 minutos a cada 20 minutos de foco estruturado.

## 5. RECOMENDAÇÕES PARA A FAMÍLIA & ESCOLA
*   **Escola:** Evitar punições por falta de atenção; reforçar socialmente toda tentativa de engajamento produtivo.
*   **Família:** Alinhamento de comandos diretos e suporte à rotina escolar em ambiente doméstico calmo.
`;
  return res.json({ text: peiText.trim() });
});

// 4. Endpoint for AI School or Family Guidance Documents
app.post("/api/ai/escola-familia", async (req, res) => {
  const { patient, target, objective } = req.body;
  if (!patient || !target || !objective) {
    return res.status(400).json({ error: "Os campos 'patient', 'target' (escola ou familia) e 'objective' são obrigatórios." });
  }

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Você é um assistente de IA especialista em psicopedagogia e desenvolvimento infantil.
Gere um guia oficial e detalhado direcionado à ${target === "escola" ? "Escola (Coordenadores, Professores e Mediadores)" : "Família (Pais e Responsáveis)"}.

Dados do Paciente: ${JSON.stringify(patient)}
Objetivo do Documento: ${objective}

O documento deve ser prático, carinhoso, extremamente claro e baseado em evidências (ABA e intervenções estruturadas).
Divida-o em:
1. Objetivo do Documento
2. Comportamentos e Perfis Observados
3. Estratégias Práticas Passo a Passo (Rotinas, jogos ou adaptações)
4. Formas de Comunicação e Feedback
Gere em português brasileiro formatado em Markdown limpo e atrativo.`,
      });
      return res.json({ text: response.text?.trim() });
    } catch (err) {
      console.error("Gemini API Error in /api/ai/escola-familia:", err);
    }
  }

  // Fallback simulation for school/family orientation
  const isEscola = target === "escola";
  const pName = patient.nome || "Paciente";
  const docText = `
# ORIENTAÇÕES TÉCNICAS DIRECIONADAS À ${target.toUpperCase()}
**Espaço Aprender a Ser — Intervenção Prática Baseada em Evidências**
*Especialista Responsável:* Francine Maria Tersi (Psicopedagoga, Neuropsicopedagoga, Terapeuta ABA)

---

## 1. OBJETIVO DO DOCUMENTO
Proporcionar à ${isEscola ? "equipe pedagógica" : "família"} orientações estratégicas individualizadas para apoiar o desenvolvimento e a aprendizagem de **${pName}**, alinhando as intervenções clínicas realizadas no Espaço Aprender a Ser com o ambiente ${isEscola ? "escolar" : "doméstico"}.

## 2. ESTRATÉGIAS PRÁTICAS PASSO A PASSO
${isEscola ? `
*   **Uso de Pistas Visuais:** Sempre apresente as instruções de forma visual concomitante à verbal. Use cartões ilustrativos para as regras da sala.
*   **Simplificação de Comandos:** Reduza a complexidade das frases. Em vez de "Abra a mochila, pegue o caderno azul e comece a lição", divida em "Pegue o caderno", espere a ação, e depois dê a instrução acadêmica.
*   **Posicionamento Estratégico:** Sente o estudante na primeira fila, longe de portas, janelas e ventiladores barulhentos para minimizar desvios atencionais.
*   **Parceiro de Dupla:** Posicione ao lado de colegas com perfil empático e cooperativo que sirvam de modelo positivo de comportamento.
` : `
*   **Rotina Diária Estruturada:** Monte um painel visual de rotina (pode ser com desenhos ou fotos reais) listando a sequência do dia: Acordar -> Café da manhã -> Escola -> Almoço -> Terapia -> Banho -> Brincar -> Dormir.
*   **Uso de Temporizadores (Timer):** Utilize cronômetros visuais para indicar o fim de atividades prazerosas. Ex: "Temos 5 minutos de celular", ative o timer e avise que quando tocar, o celular será guardado.
*   **Facilitadores de Regulação:** Tenha em casa um "cantinho da calma" com almofadas, brinquedos sensoriais (fidgets, garrafas de purpurina) para autorregulação em momentos de frustração intensa.
*   **Brincadeiras Funcionais:** Dedique pelo menos 20 minutos por dia de atenção exclusiva livre de telas para brincar no chão com a criança, estimulando o contato visual e a imitação.
`}

## 3. FEEDBACK E ALINHAMENTO
Qualquer dúvida sobre as orientações acima ou novas demandas comportamentais devem ser prontamente comunicadas à terapeuta Francine Maria Tersi, visando o ajuste contínuo dos protocolos.
`;
  return res.json({ text: docText.trim() });
});

// Serve API routes first, then Vite dev middleware
async function initializeViteAndListen() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on port ${PORT}`);
  });

  // Only auto-connect if a previously-authenticated session exists on disk — a fresh
  // install has no session yet and should wait for staff to scan a QR code from the UI.
  if (whatsappService.hasStoredSession()) {
    whatsappService.connect().catch((err) => console.error("[WhatsApp] Falha ao restaurar sessão:", err.message));
  }

  startReminderScheduler();
}

initializeViteAndListen();

