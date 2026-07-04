import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

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

export default router;
