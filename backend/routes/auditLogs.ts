import express from "express";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { usuario, perfil, acao, detalhes, ip_simulado } = req.body;
  const [result]: any = await pool.query(
    "INSERT INTO audit_logs (usuario, perfil, acao, detalhes, ip_simulado) VALUES (?, ?, ?, ?, ?)",
    [usuario ?? null, perfil ?? null, acao, detalhes ?? null, ip_simulado ?? null]
  );
  const [rows]: any = await pool.query("SELECT * FROM audit_logs WHERE id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
});

export default router;
