import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";
import { sendEmail } from "../services/emailService";

const router = express.Router();

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

async function getEmailSetting(key: "password_reset" | "user_invite") {
  const [rows]: any = await pool.query(
    "SELECT enabled, subject, message_template FROM email_settings WHERE setting_key = ?",
    [key]
  );
  if (rows.length === 0) return null;
  return { enabled: !!rows[0].enabled, subject: rows[0].subject, template: rows[0].message_template };
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  const [rows]: any = await pool.query(
    "SELECT * FROM users WHERE (email = ? OR name = ?) AND active = true",
    [email, email]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/forgot-password — generates a reset token and e-mails a reset link.
// Always responds with a generic success message, whether or not the e-mail exists,
// to avoid leaking which addresses are registered in the system.
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  const generic = { message: "Se o e-mail informado estiver cadastrado, você receberá as instruções de redefinição." };

  if (!email || typeof email !== "string") {
    return res.json(generic);
  }

  try {
    const [rows]: any = await pool.query("SELECT id, name, email FROM users WHERE email = ? AND active = true", [email]);
    if (rows.length === 0) return res.json(generic);

    const user = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await pool.query("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?", [token, expires, user.id]);

    const setting = await getEmailSetting("password_reset");
    if (setting && setting.enabled) {
      const link = `${process.env.APP_URL || ""}/reset-senha?token=${token}`;
      const html = setting.template
        .replace(/\{nome\}/g, user.name || "Usuário")
        .replace(/\{link\}/g, link);
      await sendEmail(user.email, setting.subject, html);
    }
  } catch (err: any) {
    console.error("[Auth] Falha ao processar forgot-password:", err.message);
  }

  res.json(generic);
});

// POST /api/auth/reset-password — consumes a valid, non-expired reset token to set a new password.
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: "Token e nova senha (mínimo 6 caracteres) são obrigatórios" });
  }

  const [rows]: any = await pool.query(
    "SELECT id, reset_token_expires FROM users WHERE reset_token = ?",
    [token]
  );
  if (rows.length === 0) {
    return res.status(400).json({ error: "Link de redefinição inválido ou já utilizado" });
  }

  const user = rows[0];
  if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: "Link de redefinição expirado. Solicite um novo." });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query(
    "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
    [hashed, user.id]
  );

  res.json({ message: "Senha redefinida com sucesso." });
});

// GET /api/auth/invite/:token — public lookup so the accept-invite page can show the
// invited e-mail/role before the person fills in their name and password.
router.get("/invite/:token", async (req, res) => {
  const [rows]: any = await pool.query(
    "SELECT email, role, expires_at FROM pending_invites WHERE token = ?",
    [req.params.token]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: "Convite não encontrado ou já utilizado" });
  }
  const invite = rows[0];
  if (new Date(invite.expires_at) < new Date()) {
    return res.status(400).json({ error: "Este convite expirou. Solicite um novo à administração." });
  }
  res.json({ email: invite.email, role: invite.role });
});

// POST /api/auth/accept-invite — the invitee sets their name/password and the account
// is created for the first time (nothing exists in `users` until this point).
router.post("/accept-invite", async (req, res) => {
  const { token, name, password } = req.body || {};
  if (!token || !name || !password || String(password).length < 6) {
    return res.status(400).json({ error: "Token, nome e senha (mínimo 6 caracteres) são obrigatórios" });
  }

  const [rows]: any = await pool.query("SELECT * FROM pending_invites WHERE token = ?", [token]);
  if (rows.length === 0) {
    return res.status(400).json({ error: "Convite inválido ou já utilizado" });
  }
  const invite = rows[0];
  if (new Date(invite.expires_at) < new Date()) {
    return res.status(400).json({ error: "Este convite expirou. Solicite um novo à administração." });
  }

  const [existingUser]: any = await pool.query("SELECT id FROM users WHERE email = ?", [invite.email]);
  if (existingUser.length > 0) {
    await pool.query("DELETE FROM pending_invites WHERE id = ?", [invite.id]);
    return res.status(409).json({ error: "Já existe uma conta cadastrada com este e-mail" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const [result]: any = await pool.query(
    "INSERT INTO users (name, email, password, role, permissions) VALUES (?, ?, ?, ?, ?)",
    [name, invite.email, hashed, invite.role, invite.permissions]
  );
  await pool.query("DELETE FROM pending_invites WHERE id = ?", [invite.id]);

  const token2 = jwt.sign(
    { id: result.insertId, name, email: invite.email, role: invite.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    token: token2,
    user: { id: result.insertId, name, email: invite.email, role: invite.role },
  });
});

export default router;
