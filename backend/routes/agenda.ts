import express from "express";
import crypto from "crypto";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";
import { sendEmail } from "../services/emailService";

// Renders a stored template (with {nome}/{data}/{hora} placeholders) into a final message.
function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
}

async function getEmailSetting(key: "appointment_confirmed" | "appointment_thanks") {
  const [rows]: any = await pool.query(
    "SELECT enabled, subject, message_template FROM email_settings WHERE setting_key = ?",
    [key]
  );
  if (rows.length === 0) return null;
  return { enabled: !!rows[0].enabled, subject: rows[0].subject, template: rows[0].message_template };
}

// Fires a transactional e-mail when an appointment transitions into "confirmado" or
// "realizado" (fire-and-forget: logged on failure, never blocks/breaks the PUT response
// which has already been sent to the client by the time this hook runs).
async function onAgendaEventUpdated(before: any, after: any) {
  if (before.status === after.status) return;

  const key =
    after.status === "confirmado" ? "appointment_confirmed" :
    after.status === "realizado" ? "appointment_thanks" :
    null;
  if (!key) return;

  try {
    const setting = await getEmailSetting(key);
    if (!setting || !setting.enabled) return;

    const [patientRows]: any = await pool.query(
      "SELECT nome, email FROM patients WHERE id = ?",
      [after.patient_id]
    );
    const patient = patientRows[0];
    const email = (patient?.email || "").trim();
    if (!email) return;

    const start = new Date(after.start_time);
    const html = renderTemplate(setting.template, {
      nome: patient.nome || "Paciente",
      data: fmtDate(start),
      hora: fmtTime(start),
    });
    await sendEmail(email, setting.subject, html);
  } catch (err: any) {
    console.error(`[Agenda] Falha ao processar e-mail transacional para evento #${after.id}:`, err.message);
  }
}

const router = express.Router();
router.use(authMiddleware);

const COLUMNS = [
  "title", "patient_id", "start_time", "end_time", "tipo", "status", "alertas",
  "insurance_id", "type", "modality", "professional_id", "service_id",
];

// Non-time-of-day fields: safe to copy as-is to every future occurrence in a series.
const NON_TEMPORAL_COLUMNS = COLUMNS.filter((c) => c !== "start_time" && c !== "end_time");

router.get("/", async (req, res) => {
  const { patient_id, status } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  if (patient_id !== undefined) { conditions.push("patient_id = ?"); params.push(patient_id); }
  if (status !== undefined) { conditions.push("status = ?"); params.push(status); }

  let query = "SELECT * FROM agenda_events";
  if (conditions.length) query += ` WHERE ${conditions.join(" AND ")}`;
  query += " ORDER BY start_time ASC";

  const [rows] = await pool.query(query, params);
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const [rows]: any = await pool.query("SELECT * FROM agenda_events WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });
  res.json(rows[0]);
});

// Resolves the professional to assign: uses the given id, or auto-picks the sole
// Profissional/Administrador on staff when none was given and there's exactly one.
async function resolveProfessionalId(professionalId: any): Promise<number | null> {
  if (professionalId) return Number(professionalId);
  const [rows]: any = await pool.query(
    "SELECT id FROM users WHERE role IN ('Profissional','Administrador') ORDER BY id LIMIT 2"
  );
  return rows.length === 1 ? rows[0].id : null;
}

const MAX_OCCURRENCES = 104; // safety cap (~2 years of weekly sessions)

// Formats a Date using its LOCAL (not UTC) components — start_time/end_time are stored
// as timezone-naive "wall clock" strings (see backend/db.ts dateStrings:true), so any
// conversion through toISOString()/UTC here would reintroduce the 3-hour offset bug.
function toSqlDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Steps `start` forward by `i` occurrences according to the recurrence frequency —
// same date-stepping approach as the reference psi-painel-karen system.
function stepOccurrence(start: Date, freq: string, interval: number, i: number): Date {
  const d = new Date(start);
  if (freq === "DAILY") d.setDate(start.getDate() + i * interval);
  else if (freq === "WEEKLY") d.setDate(start.getDate() + i * 7 * interval);
  else if (freq === "TWICE_WEEKLY") {
    const weekIdx = Math.floor(i / 2);
    const dayOffset = i % 2 === 0 ? 0 : 3;
    d.setDate(start.getDate() + weekIdx * 7 + dayOffset);
  } else if (freq === "THREE_WEEKLY") {
    const weekIdx = Math.floor(i / 3);
    const dayOffsets = [0, 2, 4];
    d.setDate(start.getDate() + weekIdx * 7 + dayOffsets[i % 3]);
  } else if (freq === "MONTHLY") d.setMonth(start.getMonth() + i * interval);
  else if (freq === "YEARLY") d.setFullYear(start.getFullYear() + i * interval);
  return d;
}

router.post("/", async (req, res) => {
  try {
    const {
      title, patient_id, start_time, end_time, tipo, status, alertas, insurance_id,
      type, modality, professional_id, service_id,
      recurrence_freq, recurrence_interval, recurrence_count, recurrence_end_date,
    } = req.body;

    const finalProfessionalId = await resolveProfessionalId(professional_id);
    const durationMs = new Date(end_time).getTime() - new Date(start_time).getTime();

    const freq = recurrence_freq || null;
    const interval = parseInt(recurrence_interval) || 1;
    // "YYYY-MM-DD" alone parses as UTC midnight in JS — force local noon to avoid an
    // off-by-one-day shift depending on the server's timezone.
    const until = recurrence_end_date ? new Date(`${recurrence_end_date}T12:00:00`) : null;
    const parsedCount = parseInt(recurrence_count);
    const count = freq
      ? Math.min(MAX_OCCURRENCES, (!isNaN(parsedCount) && parsedCount > 0) ? parsedCount : (until ? MAX_OCCURRENCES : 1))
      : 1;

    const recurrenceGroupId = freq ? crypto.randomUUID() : null;
    const recurrenceRule = freq ? JSON.stringify({ freq, interval, count, until: recurrence_end_date || null }) : null;

    const baseStart = new Date(start_time);
    const created: any[] = [];

    for (let i = 0; i < count; i++) {
      const occStart = freq ? stepOccurrence(baseStart, freq, interval, i) : baseStart;
      if (until && occStart >= until) break;
      const occEnd = new Date(occStart.getTime() + durationMs);

      const values = [
        title, patient_id ?? null,
        toSqlDateTime(occStart),
        toSqlDateTime(occEnd),
        tipo ?? "Sessão", status ?? "pendente", alertas ?? null, insurance_id ?? null,
        type ?? "consulta", modality ?? "presencial", finalProfessionalId, service_id ?? null,
        recurrenceGroupId, recurrenceRule,
      ];

      const [result]: any = await pool.query(
        `INSERT INTO agenda_events
          (title, patient_id, start_time, end_time, tipo, status, alertas, insurance_id,
           type, modality, professional_id, service_id, recurrence_group_id, recurrence_rule)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values
      );
      const [rows]: any = await pool.query("SELECT * FROM agenda_events WHERE id = ?", [result.insertId]);
      created.push(rows[0]);
    }

    res.status(201).json({ event: created[0], events: created, created_count: created.length });
  } catch (err: any) {
    console.error("[Agenda] Falha ao criar agendamento:", err.message);
    res.status(400).json({ error: "Falha ao criar agendamento de agenda" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const scope = req.query.scope === "future" ? "future" : "only";
    const [beforeRows]: any = await pool.query("SELECT * FROM agenda_events WHERE id = ?", [req.params.id]);
    if (beforeRows.length === 0) return res.status(404).json({ error: "Não encontrado" });
    const before = beforeRows[0];

    // Merge with the existing row: callers like "link insurance" or "change status"
    // send a partial payload (only the field that changed), so any column missing
    // from req.body must fall back to its current value — not null/a hardcoded
    // default, which would blank out unrelated fields (and violate NOT NULL columns
    // like start_time/end_time). before.* is already a plain "YYYY-MM-DD HH:MM:SS"
    // string (backend/db.ts sets dateStrings:true), matching the format we write.
    const merged: Record<string, any> = {};
    for (const col of COLUMNS) {
      merged[col] = col in req.body ? req.body[col] : before[col];
    }

    const values = COLUMNS.map((col) => merged[col] ?? null);

    if (scope === "future" && before.recurrence_group_id) {
      // Apply the time-of-day/duration CHANGE (delta) to every future occurrence,
      // preserving each one's own date — not the literal start_time/end_time from
      // the edited row, which would collapse every future session onto one date.
      const oldStart = new Date(before.start_time);
      const newStart = new Date(merged.start_time);
      const newEnd = new Date(merged.end_time);
      const startDeltaMs = newStart.getTime() - oldStart.getTime();
      const durationMs = newEnd.getTime() - newStart.getTime();

      const nonTemporalSet = NON_TEMPORAL_COLUMNS.map((col) => `${col} = ?`).join(", ");
      const nonTemporalValues = NON_TEMPORAL_COLUMNS.map((col) => merged[col] ?? null);

      const [futureRows]: any = await pool.query(
        `SELECT id, start_time FROM agenda_events
         WHERE recurrence_group_id = ? AND start_time >= NOW() AND status != 'realizado'`,
        [before.recurrence_group_id]
      );

      for (const row of futureRows) {
        const occStart = new Date(new Date(row.start_time).getTime() + startDeltaMs);
        const occEnd = new Date(occStart.getTime() + durationMs);
        await pool.query(
          `UPDATE agenda_events SET ${nonTemporalSet}, start_time = ?, end_time = ? WHERE id = ?`,
          [...nonTemporalValues, toSqlDateTime(occStart), toSqlDateTime(occEnd), row.id]
        );
      }
    } else {
      const setClause = COLUMNS.map((col) => `${col} = ?`).join(", ");
      await pool.query(`UPDATE agenda_events SET ${setClause} WHERE id = ?`, [...values, req.params.id]);
    }

    const [rows]: any = await pool.query("SELECT * FROM agenda_events WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });
    res.json(rows[0]);
    onAgendaEventUpdated(before, rows[0]);
  } catch (err: any) {
    console.error("[Agenda] Falha ao atualizar agendamento:", err.message);
    res.status(400).json({ error: "Falha ao atualizar evento de agenda" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const scope = req.query.scope === "future" ? "future" : "only";
    const [beforeRows]: any = await pool.query("SELECT * FROM agenda_events WHERE id = ?", [req.params.id]);
    if (beforeRows.length === 0) return res.status(404).json({ error: "Não encontrado" });
    const before = beforeRows[0];

    if (scope === "future" && before.recurrence_group_id) {
      await pool.query(
        `DELETE FROM agenda_events WHERE recurrence_group_id = ? AND start_time >= NOW() AND status != 'realizado'`,
        [before.recurrence_group_id]
      );
    } else {
      await pool.query("DELETE FROM agenda_events WHERE id = ?", [req.params.id]);
    }

    res.status(204).end();
  } catch (err: any) {
    console.error("[Agenda] Falha ao remover agendamento:", err.message);
    res.status(400).json({ error: "Falha ao remover evento de agenda" });
  }
});

export default router;
