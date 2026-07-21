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
  sendFormResultEmail(patientId, matched, totalScore);
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
