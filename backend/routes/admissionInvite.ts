import express from "express";
import crypto from "crypto";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

// Router for the public, unauthenticated pre-admission fill-out endpoint (mounted
// separately in server.ts, WITHOUT authMiddleware). Unlike the anamnese share link
// (which requires an existing patient), this one has no patient yet — filling it in
// CREATES a new patient record.
export const publicAdmissionRouter = express.Router();

// ── Authenticated: staff generates a fresh, single-use admission link (valid 7 days) ──
router.use(authMiddleware);

router.post("/", async (req, res) => {
  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  const [result]: any = await pool.query(
    "INSERT INTO admission_invites (token, created_by, expires_at) VALUES (?, ?, ?)",
    [token, req.user!.id, expiresAt]
  );
  res.status(201).json({ id: result.insertId, token, expiresAt, url: `/pre-admissao/${token}` });
});

// GET /api/admission-invites — list recent invites (used/unused/expired) so staff can see history.
router.get("/", async (_req, res) => {
  const [rows]: any = await pool.query(
    `SELECT ai.id, ai.token, ai.used_at, ai.expires_at, ai.created_at, p.nome AS created_patient_nome
     FROM admission_invites ai
     LEFT JOIN patients p ON p.id = ai.created_patient_id
     ORDER BY ai.created_at DESC LIMIT 50`
  );
  res.json(rows);
});

// ── Public, no-login endpoints ──

// Same in-process sliding-window rate limiter pattern used by the public forms and
// anamnese endpoints (backend/routes/forms.ts, backend/routes/anamneseShare.ts).
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

// GET /:token — checks the link is valid, not expired, and not yet used, before rendering the form.
publicAdmissionRouter.get("/:token", async (req, res) => {
  const [rows]: any = await pool.query(
    "SELECT id, used_at, expires_at FROM admission_invites WHERE token = ?",
    [req.params.token]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Link inválido" });
  if (rows[0].used_at) return res.status(410).json({ error: "Este link já foi utilizado. Solicite um novo à clínica." });
  if (new Date(rows[0].expires_at) < new Date()) return res.status(410).json({ error: "Este link expirou. Solicite um novo à clínica." });
  res.json({ valid: true });
});

// POST /:token — creates a brand-new patient from the family-submitted basics, then
// marks the invite as used (single-use, never reusable after a successful submission —
// and never reusable past its 7-day expiration either).
publicAdmissionRouter.post("/:token", publicSubmitRateLimiter, async (req, res) => {
  const [inviteRows]: any = await pool.query(
    "SELECT id, used_at, expires_at FROM admission_invites WHERE token = ?",
    [req.params.token]
  );
  if (inviteRows.length === 0) return res.status(404).json({ error: "Link inválido" });
  if (inviteRows[0].used_at) return res.status(410).json({ error: "Este link já foi utilizado. Solicite um novo à clínica." });
  if (new Date(inviteRows[0].expires_at) < new Date()) return res.status(410).json({ error: "Este link expirou. Solicite um novo à clínica." });

  const {
    nomeCrianca,
    dataNascimento,
    cidade,
    escola,
    anoSerie,
    nomeResponsavel,
    parentescoResponsavel,
    telefoneResponsavel,
    emailResponsavel,
  } = req.body || {};

  if (!nomeCrianca || typeof nomeCrianca !== "string" || !nomeCrianca.trim()) {
    return res.status(400).json({ error: "O nome da criança é obrigatório" });
  }
  if (!nomeResponsavel || typeof nomeResponsavel !== "string" || !nomeResponsavel.trim()) {
    return res.status(400).json({ error: "O nome do responsável é obrigatório" });
  }

  const historico =
    "Cadastro criado pela família via formulário de pré-admissão online. " +
    "Revisar e complementar diagnóstico, convênio e demais dados clínicos." +
    (cidade ? ` Cidade informada: ${cidade}.` : "");

  try {
    const [result]: any = await pool.query(
      `INSERT INTO patients (
        nome, data_nascimento, responsavel, responsavel_parentesco, telefone,
        escola, ano_serie, historico_clinico, data_inicio, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'Ativo')`,
      [
        nomeCrianca.trim(),
        dataNascimento || null,
        nomeResponsavel.trim(),
        parentescoResponsavel || null,
        telefoneResponsavel || null,
        escola || null,
        anoSerie || null,
        historico,
      ]
    );

    await pool.query(
      "UPDATE admission_invites SET used_at = NOW(), created_patient_id = ? WHERE id = ?",
      [result.insertId, inviteRows[0].id]
    );

    if (emailResponsavel) {
      // Best-effort: store contact e-mail on the timeline note since patients has no
      // dedicated "responsavel_email" column — avoids a schema change for a field only
      // used here today. Staff can copy it into the patient record during review.
      await pool.query(
        `INSERT INTO timeline_items (patient_id, data, tipo, titulo, descricao, profissional)
         VALUES (?, NOW(), 'Avaliação', 'Pré-admissão preenchida pela família', ?, NULL)`,
        [result.insertId, `E-mail de contato informado pela família: ${emailResponsavel}`]
      );
    }

    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error("Erro ao criar paciente via link de pré-admissão:", err.message);
    res.status(500).json({ error: "Não foi possível concluir o cadastro agora. Tente novamente." });
  }
});

export default router;
