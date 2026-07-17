import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";
import { sendEmail } from "../services/emailService";

const router = express.Router();
router.use(authMiddleware);

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

router.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, role, active, created_at FROM users ORDER BY name ASC"
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password e role são obrigatórios" });
  }
  const hashed = await bcrypt.hash(password, 10);
  const [result]: any = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashed, role]
  );
  const [rows]: any = await pool.query(
    "SELECT id, name, email, role, active, created_at FROM users WHERE id = ?",
    [result.insertId]
  );
  res.status(201).json(rows[0]);
});

router.put("/:id", async (req, res) => {
  const { name, email, role, active, password } = req.body;
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET name = ?, email = ?, role = ?, active = ?, password = ? WHERE id = ?",
      [name, email, role, active, hashed, req.params.id]
    );
  } else {
    await pool.query(
      "UPDATE users SET name = ?, email = ?, role = ?, active = ? WHERE id = ?",
      [name, email, role, active, req.params.id]
    );
  }
  const [rows]: any = await pool.query(
    "SELECT id, name, email, role, active, created_at FROM users WHERE id = ?",
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });
  res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
  const [result]: any = await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Não encontrado" });
  res.status(204).end();
});

// POST /api/users/:id/invite — (re)sends an access-invite e-mail with a link to set the
// first password, reusing the same reset-token mechanism as forgot-password.
router.post("/:id/invite", async (req, res) => {
  const [rows]: any = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });
  const user = rows[0];

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await pool.query("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?", [token, expires, user.id]);

  const [settingRows]: any = await pool.query(
    "SELECT enabled, subject, message_template FROM email_settings WHERE setting_key = 'user_invite'"
  );
  const setting = settingRows[0];
  if (!setting || !setting.enabled) {
    return res.status(422).json({ error: "O envio de convite por e-mail está desativado nas configurações." });
  }

  const link = `${process.env.APP_URL || ""}/reset-senha?token=${token}`;
  const html = (setting.message_template as string)
    .replace(/\{nome\}/g, user.name || "Usuário")
    .replace(/\{link\}/g, link);

  const sent = await sendEmail(user.email, setting.subject, html);
  if (!sent) {
    return res.status(422).json({ error: "Não foi possível enviar o e-mail de convite. Verifique o endereço informado." });
  }
  res.json({ success: true });
});

export default router;
