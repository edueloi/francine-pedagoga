/**
 * Reminder scheduler — Espaço Aprender a Ser (francine-pedagoga)
 *
 * Single cron job (every minute) that sends WhatsApp reminders for this one clinic:
 *   (a) 24h-before appointment reminder
 *   (b) 60min-before appointment reminder
 *   (c) birthday message to patients on their birthday
 *
 * Ported the structure (cron schedule, dedup-via-flag-column, timezone handling) from
 * psi-painel-karen/backend/services/cronJobs.js, heavily simplified: no tenant loop,
 * no email fallback, no multi-channel preference toggles — just WhatsApp for one clinic.
 */
import cron from "node-cron";
import { pool } from "../db";
import { sendText } from "./whatsappService";
import { sendEmail } from "./emailService";

const TIMEZONE = "America/Sao_Paulo";

let started = false;

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TIMEZONE });
}

// Renders a stored template (with {nome}/{hora}/{data} placeholders) into a final message.
function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

async function getSetting(key: "reminder_24h" | "reminder_1h" | "birthday" | "insurance_expiring"): Promise<{ enabled: boolean; template: string } | null> {
  const [rows]: any = await pool.query(
    "SELECT enabled, message_template FROM whatsapp_settings WHERE setting_key = ?",
    [key]
  );
  if (rows.length === 0) return null;
  return { enabled: !!rows[0].enabled, template: rows[0].message_template };
}

async function getEmailSetting(
  key: "reminder_24h" | "reminder_1h" | "appointment_confirmed" | "appointment_thanks" | "form_result" | "password_reset" | "user_invite"
): Promise<{ enabled: boolean; subject: string; template: string } | null> {
  const [rows]: any = await pool.query(
    "SELECT enabled, subject, message_template FROM email_settings WHERE setting_key = ?",
    [key]
  );
  if (rows.length === 0) return null;
  return { enabled: !!rows[0].enabled, subject: rows[0].subject, template: rows[0].message_template };
}

// ─── Lembretes de atendimento (24h e 1h antes) ─────────────────────────────
async function checkAppointmentReminders() {
  try {
    await checkReminderWindow({
      windowStartHours: 23,
      windowEndHours: 25,
      sentColumn: "reminder_24h_sent",
      settingKey: "reminder_24h",
    });

    await checkReminderWindow({
      windowStartHours: 55 / 60,
      windowEndHours: 65 / 60,
      sentColumn: "reminder_1h_sent",
      settingKey: "reminder_1h",
    });
  } catch (err: any) {
    console.error("❌ [ReminderScheduler] Erro ao verificar lembretes de atendimento:", err.message);
  }
}

async function checkReminderWindow(opts: {
  windowStartHours: number;
  windowEndHours: number;
  sentColumn: "reminder_24h_sent" | "reminder_1h_sent";
  settingKey: "reminder_24h" | "reminder_1h";
}) {
  const { windowStartHours, windowEndHours, sentColumn, settingKey } = opts;

  const setting = await getSetting(settingKey);
  if (setting && !setting.enabled) return; // lembrete desativado pela clínica

  const template = setting?.template ||
    "🔔 *Lembrete de Atendimento — Espaço Aprender a Ser*\n\nOlá! O atendimento de *{nome}* está agendado para {data} às {hora}.";

  const emailSetting = await getEmailSetting(settingKey);

  const [rows]: any = await pool.query(
    `SELECT a.id, a.start_time, p.nome AS patient_name, p.telefone AS patient_phone, p.email AS patient_email
     FROM agenda_events a
     JOIN patients p ON p.id = a.patient_id
     WHERE a.status IN ('confirmado', 'pendente')
       AND a.${sentColumn} = FALSE
       AND a.start_time BETWEEN DATE_ADD(NOW(), INTERVAL ? HOUR) AND DATE_ADD(NOW(), INTERVAL ? HOUR)`,
    [windowStartHours, windowEndHours]
  );

  for (const row of rows) {
    const start = new Date(row.start_time);
    const phone = (row.patient_phone || "").trim();
    const email = (row.patient_email || "").trim();
    const vars = {
      nome: row.patient_name || "Paciente",
      hora: fmtTime(start),
      data: fmtDate(start),
    };

    if (!phone) {
      console.warn(`[ReminderScheduler] Evento #${row.id}: paciente "${row.patient_name}" sem telefone cadastrado — lembrete WhatsApp não enviado.`);
    } else {
      const message = renderTemplate(template, vars);
      try {
        const sent = await sendText(phone, message);
        if (!sent) {
          console.warn(`[ReminderScheduler] Evento #${row.id}: falha ao enviar lembrete via WhatsApp para "${row.patient_name}".`);
        }
      } catch (err: any) {
        console.error(`[ReminderScheduler] Evento #${row.id}: erro inesperado ao enviar lembrete via WhatsApp:`, err.message);
      }
    }

    if (emailSetting && emailSetting.enabled) {
      if (!email) {
        console.warn(`[ReminderScheduler] Evento #${row.id}: paciente "${row.patient_name}" sem e-mail cadastrado — lembrete por e-mail não enviado.`);
      } else {
        const subject = emailSetting.subject || "Lembrete de Atendimento";
        const html = renderTemplate(emailSetting.template, vars);
        try {
          const sent = await sendEmail(email, subject, html);
          if (!sent) {
            console.warn(`[ReminderScheduler] Evento #${row.id}: falha ao enviar lembrete por e-mail para "${row.patient_name}".`);
          }
        } catch (err: any) {
          console.error(`[ReminderScheduler] Evento #${row.id}: erro inesperado ao enviar lembrete por e-mail:`, err.message);
        }
      }
    }

    // Marks as sent regardless of outcome (no phone / send failure) to avoid retry-spam
    // on rows that will never succeed — the cron runs every minute.
    try {
      await pool.query(`UPDATE agenda_events SET ${sentColumn} = TRUE WHERE id = ?`, [row.id]);
    } catch (err: any) {
      console.error(`[ReminderScheduler] Evento #${row.id}: falha ao marcar ${sentColumn}:`, err.message);
    }
  }
}

// ─── Mensagens de aniversário ───────────────────────────────────────────────
async function checkBirthdays() {
  try {
    const setting = await getSetting("birthday");
    if (setting && !setting.enabled) return; // mensagem de aniversário desativada pela clínica

    const template = setting?.template ||
      "🎉 Parabéns, {nome}! 🎂\n\nA equipe do Espaço Aprender a Ser deseja um dia repleto de alegria!";

    const [patients]: any = await pool.query(
      `SELECT id, nome, telefone
       FROM patients
       WHERE MONTH(data_nascimento) = MONTH(CURDATE())
         AND DAY(data_nascimento) = DAY(CURDATE())
         AND (birthday_reminder_sent_year IS NULL OR birthday_reminder_sent_year != YEAR(CURDATE()))`
    );

    for (const patient of patients) {
      const phone = (patient.telefone || "").trim();
      const firstName = (patient.nome || "Paciente").split(" ")[0];

      if (!phone) {
        console.warn(`[ReminderScheduler] Aniversário de "${patient.nome}": sem telefone cadastrado — mensagem não enviada.`);
      } else {
        const message = renderTemplate(template, { nome: firstName });

        try {
          const sent = await sendText(phone, message);
          if (!sent) {
            console.warn(`[ReminderScheduler] Aniversário de "${patient.nome}": falha ao enviar mensagem via WhatsApp.`);
          }
        } catch (err: any) {
          console.error(`[ReminderScheduler] Aniversário de "${patient.nome}": erro inesperado ao enviar mensagem:`, err.message);
        }
      }

      // Marks as sent for this year regardless of outcome — avoids resending every minute
      // for the rest of the day, and needs no separate annual-reset job.
      try {
        await pool.query(`UPDATE patients SET birthday_reminder_sent_year = YEAR(CURDATE()) WHERE id = ?`, [patient.id]);
      } catch (err: any) {
        console.error(`[ReminderScheduler] Aniversário de "${patient.nome}": falha ao marcar birthday_reminder_sent_year:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("❌ [ReminderScheduler] Erro ao verificar aniversariantes:", err.message);
  }
}

// ─── Alerta de guias de convênio (vencendo ou com poucas sessões) ─────────
async function checkInsuranceGuides() {
  try {
    const setting = await getSetting("insurance_expiring");
    if (setting && !setting.enabled) return; // alerta desativado pela clínica

    const template = setting?.template ||
      "📋 *Aviso de Guia — Espaço Aprender a Ser*\n\nOlá! A guia do convênio *{convenio}* de *{nome}* está com {sessoes_restantes} sessão(ões) restante(s) e vencimento em {validade}.";

    const [rows]: any = await pool.query(
      `SELECT i.id, i.nome AS convenio, i.numero_guia, i.sessoes_autorizadas, i.sessoes_utilizadas, i.validade,
              p.nome AS patient_name, p.telefone AS patient_phone
       FROM insurances i
       JOIN patients p ON p.id = i.patient_id
       WHERE i.alert_sent = FALSE
         AND (
           i.validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
           OR (i.sessoes_autorizadas - i.sessoes_utilizadas) <= 2
         )`
    );

    for (const row of rows) {
      const phone = (row.patient_phone || "").trim();
      const sessoesRestantes = Math.max(0, row.sessoes_autorizadas - row.sessoes_utilizadas);
      const validade = row.validade ? fmtDate(new Date(row.validade)) : "não informado";

      if (!phone) {
        console.warn(`[ReminderScheduler] Guia #${row.id} (${row.convenio}): paciente "${row.patient_name}" sem telefone cadastrado — alerta não enviado.`);
      } else {
        const message = renderTemplate(template, {
          nome: row.patient_name || "Paciente",
          convenio: row.convenio || "Convênio",
          sessoes_restantes: String(sessoesRestantes),
          validade,
        });
        try {
          const sent = await sendText(phone, message);
          if (!sent) {
            console.warn(`[ReminderScheduler] Guia #${row.id}: falha ao enviar alerta via WhatsApp para "${row.patient_name}".`);
          }
        } catch (err: any) {
          console.error(`[ReminderScheduler] Guia #${row.id}: erro inesperado ao enviar alerta:`, err.message);
        }
      }

      // Marks as sent regardless of outcome — a one-time alert per guide, not repeated every minute.
      try {
        await pool.query(`UPDATE insurances SET alert_sent = TRUE WHERE id = ?`, [row.id]);
      } catch (err: any) {
        console.error(`[ReminderScheduler] Guia #${row.id}: falha ao marcar alert_sent:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("❌ [ReminderScheduler] Erro ao verificar guias de convênio:", err.message);
  }
}

// Guards against the cron being scheduled twice (e.g. under `tsx watch` hot-reload).
export function startReminderScheduler() {
  if (started) return;
  started = true;

  cron.schedule("* * * * *", checkAppointmentReminders, { timezone: TIMEZONE });
  cron.schedule("* * * * *", checkBirthdays, { timezone: TIMEZONE });
  cron.schedule("*/15 * * * *", checkInsuranceGuides, { timezone: TIMEZONE });

  console.log("✅ Agendador de lembretes (WhatsApp) iniciado.");
}
