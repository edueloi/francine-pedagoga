import express from "express";
import crypto from "crypto";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";
import { sendEmail } from "../services/emailService";

const router = express.Router();
router.use(authMiddleware);

// Router for the public, unauthenticated share-link endpoints (mounted separately in server.ts,
// WITHOUT authMiddleware). Only exposes what a public respondent needs — never interpretations,
// scores, or internal fields.
export const publicFormsRouter = express.Router();

interface QuestionInput {
  type: string;
  text: string;
  required?: boolean;
  options?: { label: string; value: number }[];
  section?: string;
}

interface DefaultFormTemplate {
  title: string;
  description: string;
  category: string;
  theme: { primaryColor: string; accentColor: string; backgroundColor: string; cardColor: string; buttonColor: string };
  questions: QuestionInput[];
}

// Biblioteca inicial de modelos clínicos. Todos ficam editáveis na tela
// "Formulários" e também podem ser enviados por link para a família ou escola.
const MONITORING_FORM_TITLE = "Registro de Monitoramento Comportamental";
const DEFAULT_FORMS: DefaultFormTemplate[] = [
  {
    title: MONITORING_FORM_TITLE,
    description: "Um registro simples e acolhedor para acompanhar comportamentos, contexto e evolução ao longo do tempo.",
    category: "Acompanhamento clínico",
    theme: { primaryColor: "#2563eb", accentColor: "#8b5cf6", backgroundColor: "#f5f7ff", cardColor: "#ffffff", buttonColor: "#2563eb" },
    questions: [
      { type: "text", text: "Quem está preenchendo este registro?", required: true, section: "Identificação" },
      { type: "text", text: "Qual é sua relação com o paciente?", section: "Identificação" },
      { type: "text", text: "Data da observação", required: true, section: "Registro da ocorrência" },
      { type: "text", text: "Horário aproximado", section: "Registro da ocorrência" },
      { type: "textarea", text: "Comportamento observado", required: true, section: "Registro da ocorrência" },
      { type: "number", text: "Frequência registrada (quantas vezes ocorreu?)", section: "Frequência e duração" },
      { type: "number", text: "Duração registrada (em minutos)", section: "Frequência e duração" },
      { type: "radio", text: "Intensidade percebida", required: true, section: "Frequência e duração", options: [{ label: "Leve", value: 1 }, { label: "Moderada", value: 2 }, { label: "Alta", value: 3 }] },
      { type: "textarea", text: "Contexto da ocorrência", required: true, section: "Contexto e evolução" },
      { type: "radio", text: "Evolução observada", section: "Contexto e evolução", options: [{ label: "Melhora", value: 1 }, { label: "Estável", value: 2 }, { label: "Oscilação", value: 3 }, { label: "Aumento", value: 4 }] },
      { type: "textarea", text: "Observações adicionais", section: "Contexto e evolução" },
    ],
  },
  {
    title: "Triagem de Dificuldades de Aprendizagem",
    description: "Mapeie as principais necessidades de aprendizagem percebidas pela família ou escola.",
    category: "Acompanhamento clínico",
    theme: { primaryColor: "#0f766e", accentColor: "#f59e0b", backgroundColor: "#f4fbfa", cardColor: "#ffffff", buttonColor: "#0f766e" },
    questions: [
      { type: "text", text: "Quem está respondendo?", required: true, section: "Identificação" },
      { type: "textarea", text: "Qual é a principal preocupação em relação à aprendizagem?", required: true, section: "Percepção inicial" },
      { type: "checkbox", text: "Em quais áreas percebe mais dificuldade?", section: "Percepção inicial", options: [{ label: "Leitura e compreensão", value: 1 }, { label: "Escrita e ortografia", value: 2 }, { label: "Matemática", value: 3 }, { label: "Atenção e concentração", value: 4 }, { label: "Organização e planejamento", value: 5 }] },
      { type: "textarea", text: "Como essas dificuldades aparecem no dia a dia?", section: "Observações" },
      { type: "textarea", text: "Quais estratégias ou apoios já foram tentados?", section: "Observações" },
      { type: "textarea", text: "O que a família espera conquistar com o acompanhamento?", section: "Objetivos" },
    ],
  },
  {
    title: "Rotina de Estudos e Organização",
    description: "Conheça a rotina de tarefas, estudos, materiais e autonomia do estudante.",
    category: "Acompanhamento clínico",
    theme: { primaryColor: "#7c3aed", accentColor: "#ec4899", backgroundColor: "#faf7ff", cardColor: "#ffffff", buttonColor: "#7c3aed" },
    questions: [
      { type: "text", text: "Quem está respondendo?", required: true, section: "Identificação" },
      { type: "textarea", text: "Como é a rotina de estudos durante a semana?", required: true, section: "Rotina" },
      { type: "textarea", text: "Onde realiza as tarefas e quais materiais tem disponíveis?", section: "Rotina" },
      { type: "radio", text: "Como avalia a autonomia para iniciar e concluir tarefas?", section: "Autonomia", options: [{ label: "Precisa de muito apoio", value: 1 }, { label: "Precisa de algum apoio", value: 2 }, { label: "É bastante autônomo(a)", value: 3 }] },
      { type: "textarea", text: "Quais são as maiores dificuldades de organização ou planejamento?", section: "Autonomia" },
      { type: "textarea", text: "Que mudanças na rotina seriam mais úteis neste momento?", section: "Plano de apoio" },
    ],
  },
  {
    title: "Acompanhamento Escolar",
    description: "Formulário para receber observações da escola sobre participação, aprendizagem e adaptação.",
    category: "Acompanhamento clínico",
    theme: { primaryColor: "#0369a1", accentColor: "#14b8a6", backgroundColor: "#f2faff", cardColor: "#ffffff", buttonColor: "#0369a1" },
    questions: [
      { type: "text", text: "Nome de quem responde e função na escola", required: true, section: "Identificação" },
      { type: "textarea", text: "Como está a participação em sala de aula?", required: true, section: "Vivência escolar" },
      { type: "textarea", text: "Quais habilidades acadêmicas se destacam?", section: "Aprendizagem" },
      { type: "textarea", text: "Quais desafios de aprendizagem ou comportamento são observados?", section: "Aprendizagem" },
      { type: "textarea", text: "Como acontece a interação com colegas e adultos?", section: "Convivência" },
      { type: "textarea", text: "Que adaptações ou estratégias funcionam melhor na escola?", section: "Parceria" },
    ],
  },
  {
    title: "Observação Socioemocional",
    description: "Registre emoções, frustrações, relações e estratégias de regulação percebidas no cotidiano.",
    category: "Acompanhamento clínico",
    theme: { primaryColor: "#db2777", accentColor: "#f59e0b", backgroundColor: "#fff6fa", cardColor: "#ffffff", buttonColor: "#db2777" },
    questions: [
      { type: "text", text: "Quem está preenchendo?", required: true, section: "Identificação" },
      { type: "textarea", text: "Como você descreveria o estado emocional atual?", required: true, section: "Emoções" },
      { type: "radio", text: "Como lida com frustrações?", section: "Emoções", options: [{ label: "Boa tolerância", value: 1 }, { label: "Tolerância variável", value: 2 }, { label: "Baixa tolerância", value: 3 }] },
      { type: "textarea", text: "Como estão as relações com familiares, colegas e adultos?", section: "Relações" },
      { type: "textarea", text: "O que costuma ajudar a se acalmar ou se reorganizar?", section: "Regulação" },
      { type: "textarea", text: "Quais situações merecem atenção especial?", section: "Regulação" },
    ],
  },
  {
    title: "Orientação Parental",
    description: "Organize demandas da família, estratégias combinadas e próximos passos da orientação parental.",
    category: "Acompanhamento clínico",
    theme: { primaryColor: "#b45309", accentColor: "#059669", backgroundColor: "#fffbf5", cardColor: "#ffffff", buttonColor: "#b45309" },
    questions: [
      { type: "text", text: "Responsável que participa da orientação", required: true, section: "Identificação" },
      { type: "textarea", text: "Qual situação familiar precisa de apoio neste momento?", required: true, section: "Demanda" },
      { type: "textarea", text: "O que já foi tentado e como a criança respondeu?", section: "Demanda" },
      { type: "textarea", text: "Quais estratégias foram combinadas para a próxima semana?", section: "Plano prático" },
      { type: "textarea", text: "Quais sinais de avanço a família vai observar?", section: "Plano prático" },
      { type: "textarea", text: "Dúvidas ou observações para a próxima conversa", section: "Próximo encontro" },
    ],
  },
  {
    title: "Devolutiva da Família",
    description: "Escute a percepção da família sobre avanços, dificuldades e prioridades do acompanhamento.",
    category: "Acompanhamento clínico",
    theme: { primaryColor: "#4f46e5", accentColor: "#f97316", backgroundColor: "#f7f7ff", cardColor: "#ffffff", buttonColor: "#4f46e5" },
    questions: [
      { type: "text", text: "Quem está respondendo?", required: true, section: "Identificação" },
      { type: "textarea", text: "Que avanços você percebeu desde o início do acompanhamento?", required: true, section: "Percepção da família" },
      { type: "textarea", text: "O que ainda preocupa ou precisa de mais apoio?", section: "Percepção da família" },
      { type: "radio", text: "Como avalia a comunicação com a equipe?", section: "Parceria", options: [{ label: "Muito boa", value: 1 }, { label: "Boa", value: 2 }, { label: "Pode melhorar", value: 3 }] },
      { type: "textarea", text: "O que gostaria de conversar na próxima devolutiva?", section: "Próximos passos" },
    ],
  },
  {
    title: "Registro de Reunião Escola e Família",
    description: "Documente alinhamentos, decisões e combinados entre família, escola e equipe clínica.",
    category: "Acompanhamento clínico",
    theme: { primaryColor: "#15803d", accentColor: "#0ea5e9", backgroundColor: "#f5fff7", cardColor: "#ffffff", buttonColor: "#15803d" },
    questions: [
      { type: "text", text: "Data da reunião", required: true, section: "Identificação" },
      { type: "textarea", text: "Participantes e seus papéis", required: true, section: "Identificação" },
      { type: "textarea", text: "Pautas e observações principais", required: true, section: "Reunião" },
      { type: "textarea", text: "Avanços relatados", section: "Reunião" },
      { type: "textarea", text: "Decisões, adaptações e combinados", required: true, section: "Plano de ação" },
      { type: "textarea", text: "Responsáveis por cada ação e data de revisão", section: "Plano de ação" },
    ],
  },
];

async function ensureDefaultForms() {
  for (const form of DEFAULT_FORMS) {
    const [existing]: any = await pool.query("SELECT id FROM forms WHERE title = ? LIMIT 1", [form.title]);
    if (existing.length > 0) continue;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result]: any = await connection.query(
        `INSERT INTO forms (title, description, category, theme, interpretations, share_token) VALUES (?, ?, ?, ?, ?, ?)`,
        [form.title, form.description, form.category, JSON.stringify(form.theme), JSON.stringify([]), generateShareToken()]
      );
      for (let position = 0; position < form.questions.length; position++) {
        const question = form.questions[position];
        await connection.query(
          `INSERT INTO form_questions (form_id, position, type, text, required, options, section) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [result.insertId, position, question.type, question.text, question.required ?? false, JSON.stringify(question.options ?? []), question.section ?? null]
        );
      }
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

function parseJsonField(value: any) {
  if (value == null) return value;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function mapFormRow(row: any) {
  return {
    ...row,
    theme: parseJsonField(row.theme),
    interpretations: parseJsonField(row.interpretations) ?? [],
  };
}

function mapQuestionRow(row: any) {
  return {
    ...row,
    options: parseJsonField(row.options) ?? [],
  };
}

function generateShareToken() {
  return crypto.randomBytes(16).toString("hex");
}

// Shared scoring logic used by both the authenticated and public response endpoints.
//
// Scoring rule (documented judgment call):
//  - radio/select questions: add the value of the chosen option
//  - checkbox questions: sum the values of all checked options
//  - number questions: add the raw numeric value typed by the respondent
//  - text/textarea questions: contribute 0 to the score (free text has no numeric weight)
function computeScoreAndInterpretation(form: any, questions: any[], answerMap: Record<string, any>) {
  let totalScore = 0;
  for (const q of questions) {
    const answer = answerMap[String(q.id)];
    if (answer === undefined || answer === null) continue;

    if ((q.type === "radio" || q.type === "select") && Array.isArray(q.options)) {
      const chosen = q.options.find((o: any) => String(o.value) === String(answer) || o.label === answer);
      if (chosen) totalScore += Number(chosen.value) || 0;
    } else if (q.type === "checkbox" && Array.isArray(q.options)) {
      const chosenValues: any[] = Array.isArray(answer) ? answer : [answer];
      for (const val of chosenValues) {
        const chosen = q.options.find((o: any) => String(o.value) === String(val) || o.label === val);
        if (chosen) totalScore += Number(chosen.value) || 0;
      }
    } else if (q.type === "number") {
      totalScore += Number(answer) || 0;
    }
    // text/textarea: no numeric contribution
  }

  const interpretations: any[] = Array.isArray(form.interpretations) ? form.interpretations : [];
  const matched =
    interpretations.find((rule) => totalScore >= rule.minScore && totalScore <= rule.maxScore) ?? null;

  return { totalScore, matched };
}

// Fire-and-forget e-mail with the form result, sent to the linked patient (if any and if
// they have an e-mail on file). Failures are logged only — never affects the response
// already sent to the client, which already happened by the time this runs.
async function sendFormResultEmail(patientId: any, matched: any, totalScore: number) {
  if (!patientId) return;
  try {
    const [settingRows]: any = await pool.query(
      "SELECT enabled, subject, message_template FROM email_settings WHERE setting_key = 'form_result'"
    );
    const setting = settingRows[0];
    if (!setting || !setting.enabled) return;

    const [patientRows]: any = await pool.query("SELECT nome, email FROM patients WHERE id = ?", [patientId]);
    const patient = patientRows[0];
    const email = (patient?.email || "").trim();
    if (!email) return;

    const resultado = matched?.label || matched?.title || `Pontuação total: ${totalScore}`;
    const html = (setting.message_template as string)
      .replace(/\{nome\}/g, patient.nome || "Paciente")
      .replace(/\{resultado\}/g, resultado);
    await sendEmail(email, setting.subject, html);
  } catch (err: any) {
    console.error(`[Forms] Falha ao enviar e-mail de resultado para paciente #${patientId}:`, err.message);
  }
}

// Persists a form response row and returns the mapped record. Shared by the authenticated
// and public POST .../responses handlers so scoring/storage logic lives in one place.
// professionalName is the logged-in staff member's name (blank for public/external fill-outs,
// since those have no user session).
async function storeFormResponse(formId: string, patientId: any, answerMap: Record<string, any>, form: any, questions: any[], professionalName?: string) {
  const { totalScore, matched } = computeScoreAndInterpretation(form, questions, answerMap);

  const [result]: any = await pool.query(
    `INSERT INTO form_responses (form_id, patient_id, answers, total_score, matched_interpretation, professional_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [formId, patientId ?? null, JSON.stringify(answerMap), totalScore, matched ? JSON.stringify(matched) : null, professionalName ?? null]
  );

  const [rows]: any = await pool.query("SELECT * FROM form_responses WHERE id = ?", [result.insertId]);
  // O registro de monitoramento é descritivo, não uma escala com resultado.
  // Portanto, não enviamos por e-mail uma "pontuação" que poderia ser interpretada incorretamente.
  if (form.category !== "Acompanhamento clínico") {
    sendFormResultEmail(patientId, matched, totalScore);
  }
  return {
    ...rows[0],
    answers: parseJsonField(rows[0].answers) ?? {},
    matched_interpretation: parseJsonField(rows[0].matched_interpretation),
  };
}

// Recomputes score/interpretation and overwrites an existing response's answers.
// Shared shape with storeFormResponse, but UPDATE instead of INSERT — used by the
// patient chart's "edit a past ficha" flow.
async function updateFormResponse(responseId: string, answerMap: Record<string, any>, form: any, questions: any[]) {
  const { totalScore, matched } = computeScoreAndInterpretation(form, questions, answerMap);

  await pool.query(
    `UPDATE form_responses SET answers = ?, total_score = ?, matched_interpretation = ? WHERE id = ?`,
    [JSON.stringify(answerMap), totalScore, matched ? JSON.stringify(matched) : null, responseId]
  );

  const [rows]: any = await pool.query("SELECT * FROM form_responses WHERE id = ?", [responseId]);
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    answers: parseJsonField(rows[0].answers) ?? {},
    matched_interpretation: parseJsonField(rows[0].matched_interpretation),
  };
}

// ── Simple in-memory sliding-window rate limiter for the public POST endpoint ──
// This is a single-clinic app with modest traffic, so an in-process Map is sufficient;
// no Redis/external store needed. Not shared across multiple server instances, which is
// an acceptable trade-off here.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitHits = new Map<string, number[]>();

function publicSubmitRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const hits = (rateLimitHits.get(ip) || []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: "Muitas tentativas. Aguarde um instante e tente novamente." });
  }

  hits.push(now);
  rateLimitHits.set(ip, hits);
  next();
}

// GET / -> list all forms with question_count, no question bodies
router.get("/", async (_req, res) => {
  try {
    await ensureDefaultForms();
  } catch (err) {
    console.error("Erro ao preparar a biblioteca de formulários:", err);
  }
  const [rows]: any = await pool.query(`
    SELECT f.*, COUNT(q.id) AS question_count
    FROM forms f
    LEFT JOIN form_questions q ON q.form_id = f.id
    GROUP BY f.id
    ORDER BY f.created_at DESC
  `);
  res.json(rows.map(mapFormRow));
});

// GET /:id -> one form with its questions
router.get("/:id", async (req, res) => {
  const [rows]: any = await pool.query("SELECT * FROM forms WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });

  const [questions]: any = await pool.query(
    "SELECT * FROM form_questions WHERE form_id = ? ORDER BY position ASC",
    [req.params.id]
  );

  res.json({
    ...mapFormRow(rows[0]),
    questions: questions.map(mapQuestionRow),
  });
});

// POST / -> create form + questions (transaction)
router.post("/", async (req, res) => {
  const { title, description, category, questions, interpretations, theme } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "O campo 'title' é obrigatório" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result]: any = await connection.query(
      `INSERT INTO forms (title, description, category, theme, interpretations, share_token) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title,
        description ?? null,
        category ?? null,
        theme ? JSON.stringify(theme) : null,
        interpretations ? JSON.stringify(interpretations) : JSON.stringify([]),
        generateShareToken(),
      ]
    );
    const formId = result.insertId;

    const questionList: QuestionInput[] = Array.isArray(questions) ? questions : [];
    for (let i = 0; i < questionList.length; i++) {
      const q = questionList[i];
      await connection.query(
        `INSERT INTO form_questions (form_id, position, type, text, required, options, section) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [formId, i, q.type, q.text, q.required ?? false, JSON.stringify(q.options ?? []), q.section ?? null]
      );
    }

    await connection.commit();

    const [rows]: any = await pool.query("SELECT * FROM forms WHERE id = ?", [formId]);
    const [savedQuestions]: any = await pool.query(
      "SELECT * FROM form_questions WHERE form_id = ? ORDER BY position ASC",
      [formId]
    );
    res.status(201).json({ ...mapFormRow(rows[0]), questions: savedQuestions.map(mapQuestionRow) });
  } catch (err) {
    await connection.rollback();
    console.error("Erro ao criar formulário:", err);
    res.status(500).json({ error: "Falha ao criar formulário" });
  } finally {
    connection.release();
  }
});

// PUT /:id -> replace form + questions (transaction)
router.put("/:id", async (req, res) => {
  const { title, description, category, questions, interpretations, theme } = req.body;
  const formId = req.params.id;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "O campo 'title' é obrigatório" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing]: any = await connection.query("SELECT id FROM forms WHERE id = ?", [formId]);
    if (existing.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Não encontrado" });
    }

    await connection.query(
      `UPDATE forms SET title = ?, description = ?, category = ?, theme = ?, interpretations = ? WHERE id = ?`,
      [
        title,
        description ?? null,
        category ?? null,
        theme ? JSON.stringify(theme) : null,
        interpretations ? JSON.stringify(interpretations) : JSON.stringify([]),
        formId,
      ]
    );

    // Replace questions: delete all, re-insert with fresh positions
    await connection.query("DELETE FROM form_questions WHERE form_id = ?", [formId]);

    const questionList: QuestionInput[] = Array.isArray(questions) ? questions : [];
    for (let i = 0; i < questionList.length; i++) {
      const q = questionList[i];
      await connection.query(
        `INSERT INTO form_questions (form_id, position, type, text, required, options, section) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [formId, i, q.type, q.text, q.required ?? false, JSON.stringify(q.options ?? []), q.section ?? null]
      );
    }

    await connection.commit();

    const [rows]: any = await pool.query("SELECT * FROM forms WHERE id = ?", [formId]);
    const [savedQuestions]: any = await pool.query(
      "SELECT * FROM form_questions WHERE form_id = ? ORDER BY position ASC",
      [formId]
    );
    res.json({ ...mapFormRow(rows[0]), questions: savedQuestions.map(mapQuestionRow) });
  } catch (err) {
    await connection.rollback();
    console.error("Erro ao atualizar formulário:", err);
    res.status(500).json({ error: "Falha ao atualizar formulário" });
  } finally {
    connection.release();
  }
});

// DELETE /:id -> cascades to questions/responses via FK
router.delete("/:id", async (req, res) => {
  const [result]: any = await pool.query("DELETE FROM forms WHERE id = ?", [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Não encontrado" });
  res.status(204).end();
});

// GET /:id/responses -> list responses for a form, optionally filtered to one patient
// (?patientId=X) — used by the patient chart's "Ficha AT" tab to show only that
// patient's history instead of every response ever submitted for the form.
router.get("/:id/responses", async (req, res) => {
  const { patientId } = req.query;
  const conditions = ["r.form_id = ?"];
  const params: any[] = [req.params.id];
  if (patientId) {
    conditions.push("r.patient_id = ?");
    params.push(patientId);
  }

  const [rows]: any = await pool.query(
    `SELECT r.*, p.nome AS patient_nome
     FROM form_responses r
     LEFT JOIN patients p ON p.id = r.patient_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY r.submitted_at DESC`,
    params
  );
  res.json(
    rows.map((row: any) => ({
      ...row,
      answers: parseJsonField(row.answers) ?? {},
      matched_interpretation: parseJsonField(row.matched_interpretation),
    }))
  );
});

// PUT /responses/:id -> re-score and overwrite an existing response's answers.
// Mounted before /:id/responses so the literal "responses" segment isn't swallowed
// by the :id param of other routes.
router.put("/responses/:id", async (req, res) => {
  const { answers } = req.body;

  const [responseRows]: any = await pool.query("SELECT * FROM form_responses WHERE id = ?", [req.params.id]);
  if (responseRows.length === 0) return res.status(404).json({ error: "Resposta não encontrada" });
  const formId = responseRows[0].form_id;

  const [formRows]: any = await pool.query("SELECT * FROM forms WHERE id = ?", [formId]);
  if (formRows.length === 0) return res.status(404).json({ error: "Formulário não encontrado" });
  const form = mapFormRow(formRows[0]);

  const [questionRows]: any = await pool.query(
    "SELECT * FROM form_questions WHERE form_id = ? ORDER BY position ASC",
    [formId]
  );
  const questions = questionRows.map(mapQuestionRow);

  const answerMap: Record<string, any> = answers && typeof answers === "object" ? answers : {};
  const saved = await updateFormResponse(req.params.id, answerMap, form, questions);
  res.json(saved);
});

// POST /:id/responses -> compute score, find matching interpretation, store response
router.post("/:id/responses", async (req, res) => {
  const formId = req.params.id;
  const { patientId, answers } = req.body;

  const [formRows]: any = await pool.query("SELECT * FROM forms WHERE id = ?", [formId]);
  if (formRows.length === 0) return res.status(404).json({ error: "Formulário não encontrado" });
  const form = mapFormRow(formRows[0]);

  const [questionRows]: any = await pool.query(
    "SELECT * FROM form_questions WHERE form_id = ? ORDER BY position ASC",
    [formId]
  );
  const questions = questionRows.map(mapQuestionRow);

  const answerMap: Record<string, any> = answers && typeof answers === "object" ? answers : {};
  const saved = await storeFormResponse(formId, patientId, answerMap, form, questions, req.user?.name);
  res.status(201).json(saved);
});

export default router;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC (no-auth) routes — reachable via the clinic's shareable form link.
// Mounted separately in server.ts at /api/public/forms, without authMiddleware.
// These must NEVER leak interpretations, scores, or internal/administrative fields.
// ─────────────────────────────────────────────────────────────────────────────

// GET /public/:token -> public form shape: title/description/theme/questions only
publicFormsRouter.get("/:token", async (req, res) => {
  const [rows]: any = await pool.query("SELECT * FROM forms WHERE share_token = ?", [req.params.token]);
  if (rows.length === 0) return res.status(404).json({ error: "Link inválido ou expirado" });
  const form = mapFormRow(rows[0]);

  const [questions]: any = await pool.query(
    "SELECT * FROM form_questions WHERE form_id = ? ORDER BY position ASC",
    [form.id]
  );

  // Only expose what a public respondent needs — never interpretations or internal fields.
  res.json({
    id: form.id,
    title: form.title,
    description: form.description,
    theme: form.theme,
    questions: questions.map((q: any) => {
      const mapped = mapQuestionRow(q);
      return {
        id: mapped.id,
        type: mapped.type,
        text: mapped.text,
        required: !!mapped.required,
        options: mapped.options,
        section: mapped.section ?? undefined,
      };
    }),
  });
});

// POST /public/:token/responses -> same scoring/storage as the authenticated endpoint,
// resolved by share_token instead of numeric id. Rate-limited per IP to deter abuse.
publicFormsRouter.post("/:token/responses", publicSubmitRateLimiter, async (req, res) => {
  const { patientId, answers } = req.body;

  const [formRows]: any = await pool.query("SELECT * FROM forms WHERE share_token = ?", [req.params.token]);
  if (formRows.length === 0) return res.status(404).json({ error: "Link inválido ou expirado" });
  const form = mapFormRow(formRows[0]);

  const [questionRows]: any = await pool.query(
    "SELECT * FROM form_questions WHERE form_id = ? ORDER BY position ASC",
    [form.id]
  );
  const questions = questionRows.map(mapQuestionRow);

  const answerMap: Record<string, any> = answers && typeof answers === "object" ? answers : {};
  const saved = await storeFormResponse(form.id, patientId, answerMap, form, questions);

  // Public respondents never see score/interpretation — that is clinical staff information.
  res.status(201).json({ id: saved.id, submitted_at: saved.submitted_at });
});
