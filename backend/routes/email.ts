import express from "express";
import { authMiddleware } from "../middleware/auth";
import { sendEmail } from "../services/emailService";
import { pool } from "../db";

const router = express.Router();
router.use(authMiddleware);

const VALID_KEYS = [
  "reminder_24h",
  "reminder_1h",
  "appointment_confirmed",
  "appointment_thanks",
  "form_result",
  "password_reset",
  "user_invite",
] as const;

// GET /api/email/settings — the 7 editable notification templates.
router.get("/settings", async (_req, res) => {
  const [rows]: any = await pool.query(
    `SELECT setting_key, enabled, subject, message_template, updated_at FROM email_settings
     ORDER BY FIELD(setting_key, ${VALID_KEYS.map(() => "?").join(", ")})`,
    [...VALID_KEYS]
  );
  res.json(rows);
});

// PUT /api/email/settings/:key — update one template's subject/body and/or enabled flag.
router.put("/settings/:key", async (req, res) => {
  const { key } = req.params;
  if (!VALID_KEYS.includes(key as any)) {
    return res.status(400).json({ error: "Chave de configuração inválida" });
  }
  const { enabled, subject, messageTemplate } = req.body || {};
  if (typeof subject !== "string" || !subject.trim()) {
    return res.status(400).json({ error: "O campo 'subject' é obrigatório" });
  }
  if (typeof messageTemplate !== "string" || !messageTemplate.trim()) {
    return res.status(400).json({ error: "O campo 'messageTemplate' é obrigatório" });
  }

  await pool.query(
    "UPDATE email_settings SET enabled = ?, subject = ?, message_template = ? WHERE setting_key = ?",
    [enabled ?? true, subject, messageTemplate, key]
  );

  const [rows]: any = await pool.query(
    "SELECT setting_key, enabled, subject, message_template, updated_at FROM email_settings WHERE setting_key = ?",
    [key]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Configuração não encontrada" });
  res.json(rows[0]);
});

// POST /api/email/test — sends a one-off test message so staff can verify SMTP works.
router.post("/test", async (req, res) => {
  const { to, subject, message } = req.body || {};
  if (!to || !subject || !message) {
    return res.status(400).json({ error: "Os campos 'to', 'subject' e 'message' são obrigatórios" });
  }

  const sent = await sendEmail(to, subject, message);
  if (!sent) {
    return res.status(422).json({ error: "Não foi possível enviar o e-mail. Verifique a configuração SMTP e o endereço informado." });
  }
  res.json({ success: true });
});

export default router;
