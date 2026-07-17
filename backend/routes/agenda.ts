import { createCrudRouter } from "./crudFactory";
import { pool } from "../db";
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

export default createCrudRouter({
  table: "agenda_events",
  columns: ["title", "patient_id", "start_time", "end_time", "tipo", "status", "alertas", "insurance_id"],
  filterableBy: ["patient_id", "status"],
  orderBy: "start_time ASC",
  onAfterUpdate: onAgendaEventUpdated,
});
