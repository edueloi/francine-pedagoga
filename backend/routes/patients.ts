import express from "express";
import crypto from "crypto";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
router.use(authMiddleware);

const COLUMNS = [
  "nome",
  "data_nascimento",
  "foto",
  "responsavel",
  "responsavel_parentesco",
  "responsavel_cpf",
  "responsavel_financeiro_nome",
  "responsavel_financeiro_cpf",
  "responsavel_financeiro_telefone",
  "tipo_pagamento",
  "convenio_carteirinha",
  "convenio_validade",
  "telefone",
  "email",
  "escola",
  "ano_serie",
  "professor",
  "coordenador",
  "medico",
  "diagnostico",
  "cid",
  "convenio",
  "medicamentos",
  "historico_clinico",
  "data_inicio",
  "status",
];

async function attachDocuments(patients: any[]) {
  if (patients.length === 0) return patients;
  const ids = patients.map((p) => p.id);
  const [docs]: any = await pool.query(
    `SELECT id, patient_id, nome, tipo, data_upload FROM patient_documents WHERE patient_id IN (?)`,
    [ids]
  );
  const byPatient = new Map<number, any[]>();
  for (const doc of docs) {
    if (!byPatient.has(doc.patient_id)) byPatient.set(doc.patient_id, []);
    byPatient.get(doc.patient_id)!.push(doc);
  }
  return patients.map((p) => ({
    ...p,
    documentos: (byPatient.get(p.id) ?? []).filter((d) => d.tipo === "medico"),
    documentos_pais: (byPatient.get(p.id) ?? []).filter((d) => d.tipo === "pais"),
  }));
}

router.get("/", async (_req, res) => {
  const [rows]: any = await pool.query("SELECT * FROM patients ORDER BY nome ASC");
  res.json(await attachDocuments(rows));
});

router.get("/:id", async (req, res) => {
  const [rows]: any = await pool.query("SELECT * FROM patients WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });
  const [withDocs] = await attachDocuments(rows);
  res.json(withDocs);
});

router.post("/", async (req, res) => {
  const values = COLUMNS.map((col) => req.body[col] ?? null);
  const placeholders = COLUMNS.map(() => "?").join(", ");
  const [result]: any = await pool.query(
    `INSERT INTO patients (${COLUMNS.join(", ")}) VALUES (${placeholders})`,
    values
  );
  const [rows]: any = await pool.query("SELECT * FROM patients WHERE id = ?", [result.insertId]);
  res.status(201).json({ ...rows[0], documentos: [], documentos_pais: [] });
});

router.put("/:id", async (req, res) => {
  const values = COLUMNS.map((col) => req.body[col] ?? null);
  const setClause = COLUMNS.map((col) => `${col} = ?`).join(", ");
  await pool.query(`UPDATE patients SET ${setClause} WHERE id = ?`, [...values, req.params.id]);
  const [rows]: any = await pool.query("SELECT * FROM patients WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });
  const [withDocs] = await attachDocuments(rows);
  res.json(withDocs);
});

router.delete("/:id", async (req, res) => {
  const [result]: any = await pool.query("DELETE FROM patients WHERE id = ?", [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Não encontrado" });
  res.status(204).end();
});

// POST /:id/anamnese-share-link -> generates (or reuses) a public share token for this
// patient's anamnese fill-out link. Idempotent: once a token exists it is never
// regenerated, so a link already shared with a family keeps working indefinitely.
router.post("/:id/anamnese-share-link", async (req, res) => {
  const [rows]: any = await pool.query(
    "SELECT id, anamnese_share_token FROM patients WHERE id = ?",
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });

  let token = rows[0].anamnese_share_token;
  if (!token) {
    token = crypto.randomBytes(16).toString("hex");
    await pool.query("UPDATE patients SET anamnese_share_token = ? WHERE id = ?", [token, req.params.id]);
  }

  res.json({ token, url: `/anamnese/${token}` });
});

export default router;
