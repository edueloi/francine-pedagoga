/**
 * Email transport — Espaço Aprender a Ser (francine-pedagoga)
 *
 * Thin SMTP wrapper (nodemailer) mirroring the defensive contract of
 * whatsappService.sendText(): never throws, only logs and returns false on failure.
 */
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: SMTP_SECURE !== "false",
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const dest = (to || "").trim();
  if (!dest) {
    console.warn("[Email] Envio ignorado: destinatário vazio.");
    return false;
  }

  const t = getTransporter();
  if (!t) {
    console.warn("[Email] Envio ignorado: SMTP não configurado (SMTP_HOST/SMTP_USER/SMTP_PASSWORD ausentes).");
    return false;
  }

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: dest,
      subject,
      html,
    });
    return true;
  } catch (err: any) {
    console.error(`[Email] Falha ao enviar para "${dest}":`, err.message);
    return false;
  }
}
