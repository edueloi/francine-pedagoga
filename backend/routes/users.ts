import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
router.use(authMiddleware);

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

export default router;
