import express from "express";
import { authMiddleware } from "../middleware/auth";
import * as whatsappService from "../services/whatsappService";
import { pool } from "../db";

const router = express.Router();
router.use(authMiddleware);

const VALID_KEYS = ["reminder_24h", "reminder_1h", "birthday"] as const;

// GET /api/whatsapp/settings — the 3 editable message templates (24h/1h/birthday).
router.get("/settings", async (_req, res) => {
  const [rows]: any = await pool.query(
    "SELECT setting_key, enabled, message_template, updated_at FROM whatsapp_settings ORDER BY FIELD(setting_key, 'reminder_24h', 'reminder_1h', 'birthday')"
  );
  res.json(rows);
});

// PUT /api/whatsapp/settings/:key — update one template's text and/or enabled flag.
router.put("/settings/:key", async (req, res) => {
  const { key } = req.params;
  if (!VALID_KEYS.includes(key as any)) {
    return res.status(400).json({ error: "Chave de configuração inválida" });
  }
  const { enabled, messageTemplate } = req.body || {};
  if (typeof messageTemplate !== "string" || !messageTemplate.trim()) {
    return res.status(400).json({ error: "O campo 'messageTemplate' é obrigatório" });
  }

  await pool.query(
    "UPDATE whatsapp_settings SET enabled = ?, message_template = ? WHERE setting_key = ?",
    [enabled ?? true, messageTemplate, key]
  );

  const [rows]: any = await pool.query(
    "SELECT setting_key, enabled, message_template, updated_at FROM whatsapp_settings WHERE setting_key = ?",
    [key]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Configuração não encontrada" });
  res.json(rows[0]);
});

// GET /api/whatsapp/status — current connection status + pending QR code (if any).
router.get("/status", (_req, res) => {
  res.json(whatsappService.getStatus());
});

// POST /api/whatsapp/connect — triggers a connection attempt (idempotent).
router.post("/connect", async (_req, res) => {
  await whatsappService.connect();
  res.json(whatsappService.getStatus());
});

// POST /api/whatsapp/disconnect — logs out and clears the local session.
router.post("/disconnect", async (_req, res) => {
  await whatsappService.disconnect();
  res.json(whatsappService.getStatus());
});

// POST /api/whatsapp/test — sends a one-off test message so staff can verify the bot works.
router.post("/test", async (req, res) => {
  const { phone, message } = req.body || {};
  if (!phone || !message) {
    return res.status(400).json({ error: "Os campos 'phone' e 'message' são obrigatórios" });
  }

  const sent = await whatsappService.sendText(phone, message);
  if (!sent) {
    return res.status(422).json({ error: "Não foi possível enviar a mensagem. Verifique a conexão e o número informado." });
  }
  res.json({ success: true });
});

export default router;
