import express from "express";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
router.use(authMiddleware);

// Router for the public, unauthenticated clinic-info endpoint (mounted separately in
// server.ts, WITHOUT authMiddleware). Only exposes name/logo/address/phone — never
// document_number, description or activities, which are staff-only.
export const publicClinicInfoRouter = express.Router();

const DEFAULT_SETTINGS = {
  id: null as number | null,
  name: "Espaço Aprender a Ser",
  document_number: null as string | null,
  address: null as string | null,
  phone: null as string | null,
  email: null as string | null,
  description: null as string | null,
  activities: null as string | null,
  logo_url: null as string | null,
  cover_image_url: null as string | null,
  updated_at: null as string | null,
};

async function getSettingsRow() {
  const [rows]: any = await pool.query("SELECT * FROM clinic_settings ORDER BY id ASC LIMIT 1");
  return rows.length > 0 ? rows[0] : null;
}

// GET / -> the single clinic settings row (there is always exactly one after migrate.js
// runs; fall back to a sensible default object if somehow none exists yet).
router.get("/", async (_req, res) => {
  const row = await getSettingsRow();
  res.json(row ?? DEFAULT_SETTINGS);
});

// PUT / -> update the single settings row (fetch id first, then update by id)
router.put("/", async (req, res) => {
  const {
    name,
    documentNumber,
    address,
    phone,
    email,
    description,
    activities,
    logoUrl,
    coverImageUrl,
  } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "O campo 'name' é obrigatório" });
  }

  try {
    const existing = await getSettingsRow();

    if (!existing) {
      // Should not normally happen (migrate.js seeds one row), but handle gracefully.
      await pool.query(
        `INSERT INTO clinic_settings (name, document_number, address, phone, email, description, activities, logo_url, cover_image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          documentNumber ?? null,
          address ?? null,
          phone ?? null,
          email ?? null,
          description ?? null,
          activities ?? null,
          logoUrl ?? null,
          coverImageUrl ?? null,
        ]
      );
    } else {
      await pool.query(
        `UPDATE clinic_settings
         SET name = ?, document_number = ?, address = ?, phone = ?, email = ?, description = ?, activities = ?, logo_url = ?, cover_image_url = ?
         WHERE id = ?`,
        [
          name,
          documentNumber ?? null,
          address ?? null,
          phone ?? null,
          email ?? null,
          description ?? null,
          activities ?? null,
          logoUrl ?? null,
          coverImageUrl ?? null,
          existing.id,
        ]
      );
    }

    const updated = await getSettingsRow();
    res.json(updated ?? DEFAULT_SETTINGS);
  } catch (err) {
    console.error("Erro ao atualizar configurações da clínica:", err);
    res.status(500).json({ error: "Falha ao atualizar configurações da clínica" });
  }
});

export default router;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC (no-auth) route — for public-facing pages (e.g. share-link forms) that
// need to display clinic name/logo. Mounted separately in server.ts at
// /api/public/clinic-info, without authMiddleware. Never exposes document_number,
// description or activities — those are staff-only.
// ─────────────────────────────────────────────────────────────────────────────
publicClinicInfoRouter.get("/", async (_req, res) => {
  const row = await getSettingsRow();
  const source = row ?? DEFAULT_SETTINGS;
  res.json({
    name: source.name,
    logoUrl: source.logo_url,
    address: source.address,
    phone: source.phone,
  });
});
