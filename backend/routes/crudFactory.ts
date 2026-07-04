import express from "express";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";

interface CrudOptions {
  table: string;
  columns: string[];
  filterableBy?: string[];
  orderBy?: string;
}

export function createCrudRouter({ table, columns, filterableBy = [], orderBy = "id DESC" }: CrudOptions) {
  const router = express.Router();
  router.use(authMiddleware);

  router.get("/", async (req, res) => {
    let query = `SELECT * FROM ${table}`;
    const params: any[] = [];
    const conditions: string[] = [];

    for (const field of filterableBy) {
      const value = req.query[field];
      if (value !== undefined) {
        conditions.push(`${field} = ?`);
        params.push(value);
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY ${orderBy}`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  });

  router.get("/:id", async (req, res) => {
    const [rows]: any = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });
    res.json(rows[0]);
  });

  router.post("/", async (req, res) => {
    const values = columns.map((col) => req.body[col] ?? null);
    const placeholders = columns.map(() => "?").join(", ");
    const [result]: any = await pool.query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
    const [rows]: any = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  });

  router.put("/:id", async (req, res) => {
    const values = columns.map((col) => req.body[col] ?? null);
    const setClause = columns.map((col) => `${col} = ?`).join(", ");
    await pool.query(`UPDATE ${table} SET ${setClause} WHERE id = ?`, [...values, req.params.id]);
    const [rows]: any = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });
    res.json(rows[0]);
  });

  router.delete("/:id", async (req, res) => {
    const [result]: any = await pool.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Não encontrado" });
    res.status(204).end();
  });

  return router;
}
