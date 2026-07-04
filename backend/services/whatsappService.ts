/**
 * WhatsApp connection manager — Espaço Aprender a Ser (francine-pedagoga)
 *
 * Single-clinic Baileys wrapper. Unlike a multi-tenant setup (Map keyed by tenantId),
 * this clinic has exactly one WhatsApp connection, so plain module-level state is enough.
 *
 * Exposes: connect(), disconnect(), getStatus(), sendText().
 * Session credentials persist to backend/whatsapp-session/ via useMultiFileAuthState.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SESSION_DIR = path.join(__dirname, "..", "whatsapp-session");

export type WhatsAppStatus = "disconnected" | "connecting" | "connected";

let sock: WASocket | null = null;
let status: WhatsAppStatus = "disconnected";
let qrCodeDataUrl: string | null = null;
let phone: string | null = null;

let manualDisconnect = false;
let reconnectTimer: NodeJS.Timeout | null = null;
// Guards against connect()/createSocket() being invoked concurrently (e.g. UI double-click).
let connecting = false;

function makeSilentLogger(): any {
  const noop = () => {};
  const logger: any = {
    level: "silent",
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  };
  logger.child = () => makeSilentLogger();
  return logger;
}

function jidToPhone(jid: string): string {
  return String(jid || "").replace(/@.*/, "").replace(/:[0-9]+$/, "");
}

/**
 * Normalizes a raw phone number (as stored in `patients.telefone`) into a plain
 * digit string with the Brazilian country code (55) prefixed when appropriate.
 * Ported from psi-painel-karen/backend/services/whatsappService.js — pure function,
 * no tenant dependency.
 */
export function normalizePhoneDigits(phoneNumber: string): string {
  const raw = String(phoneNumber || "").trim();
  const isInternational = raw.startsWith("+");
  const clean = raw.replace(/\D/g, "");

  // Explicit international number (stored with a leading +): keep digits as-is.
  if (isInternational && clean.length >= 7) {
    return clean;
  }
  // Already has the BR country code.
  if (clean.startsWith("55") && (clean.length === 12 || clean.length === 13)) {
    return clean;
  }
  // Brazilian number without country code: 10 digits (landline) or 11 (mobile with the 9th digit).
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  // 9 digits: mobile without area code — cannot be normalized reliably, return as-is.
  return clean;
}

/**
 * Brazilian JID variants: with and without the 9th digit.
 * Older WhatsApp registrations may exist without the 9 (or the phone was saved without it).
 */
export function brazilJidCandidates(digits: string): string[] {
  if (!digits.startsWith("55")) return [digits];
  // 55 + DDD (2) + 9 digits = 13 → also try without the 9
  if (digits.length === 13 && digits[4] === "9") {
    return [digits, digits.slice(0, 4) + digits.slice(5)];
  }
  // 55 + DDD (2) + 8 digits = 12 → also try with the 9
  if (digits.length === 12) {
    return [digits, digits.slice(0, 4) + "9" + digits.slice(4)];
  }
  return [digits];
}

function normalizeDestination(dest: string): string | null {
  const raw = String(dest || "").trim();
  if (!raw) return null;

  if (raw.includes("@")) return raw;

  const digits = normalizePhoneDigits(raw);
  return digits ? `${digits}@s.whatsapp.net` : null;
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

/** Returns true if a previously-persisted session exists on disk. */
export function hasStoredSession(): boolean {
  try {
    return fs.existsSync(SESSION_DIR) && fs.readdirSync(SESSION_DIR).length > 0;
  } catch {
    return false;
  }
}

export function getStatus() {
  return { status, qrCodeDataUrl, phone };
}

async function createSocket() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  let waVersion: [number, number, number] = [2, 3000, 1015901307];
  try {
    const latest = await fetchLatestBaileysVersion();
    if (latest?.version) waVersion = latest.version as [number, number, number];
  } catch {
    // Non-fatal: falls back to the pinned default version above.
  }

  const socket = makeWASocket({
    version: waVersion,
    auth: state,
    browser: ["Chrome (Windows)", "EspacoAprenderASer", "1.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 60_000,
    logger: makeSilentLogger(),
  });

  sock = socket;

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      status = "connecting";
      try {
        qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
      } catch (e: any) {
        console.warn("[WhatsApp] Falha ao gerar QR Code:", e.message);
        qrCodeDataUrl = null;
      }
      console.log("[WhatsApp] QR Code pronto para leitura.");
    }

    if (connection === "open") {
      status = "connected";
      qrCodeDataUrl = null;
      phone = jidToPhone(socket.user?.id || "") || "Conectado";
      console.log(`✅ WhatsApp conectado: ${phone}`);
    }

    if (connection === "close") {
      status = "disconnected";
      qrCodeDataUrl = null;
      phone = null;

      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (manualDisconnect || loggedOut) {
        if (loggedOut) {
          try {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          } catch {
            // Non-fatal: stale session folder will just be reused/overwritten later.
          }
        }
        return;
      }

      console.log("[WhatsApp] Desconectado. Tentando reconectar em 5s...");
      clearReconnectTimer();
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (!manualDisconnect) {
          connect().catch((err) => console.error("[WhatsApp] Auto-reconnect falhou:", err.message));
        }
      }, 5000);
    }
  });
}

/** Idempotent: no-op if already connected or a connection attempt is in progress. */
export async function connect(): Promise<void> {
  if (status === "connected" || status === "connecting" || connecting) {
    return;
  }

  connecting = true;
  manualDisconnect = false;
  clearReconnectTimer();
  status = "connecting";
  qrCodeDataUrl = null;
  phone = null;

  try {
    await createSocket();
  } catch (err: any) {
    console.error("[WhatsApp] Erro ao iniciar conexão:", err.message);
    status = "disconnected";
  } finally {
    connecting = false;
  }
}

export async function disconnect(): Promise<void> {
  manualDisconnect = true;
  clearReconnectTimer();

  if (sock) {
    try {
      await sock.logout();
    } catch {
      // Non-fatal: proceed to tear down the socket/session regardless.
    }
    try {
      sock.end(undefined as any);
    } catch {
      // Non-fatal.
    }
  }

  sock = null;
  status = "disconnected";
  qrCodeDataUrl = null;
  phone = null;

  try {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  } catch {
    // Non-fatal: leftover session files will be overwritten on the next connect().
  }
}

/**
 * Sends a text message to a Brazilian phone number. Never throws — logs and
 * returns false on any failure so callers (routes, cron jobs) never crash.
 */
export async function sendText(phoneNumber: string, text: string): Promise<boolean> {
  if (!sock || status !== "connected") {
    console.warn(`[WhatsApp] Envio ignorado (bot não conectado, status: ${status}).`);
    return false;
  }

  try {
    let jid = normalizeDestination(phoneNumber);
    if (!jid) {
      console.warn(`[WhatsApp] Número inválido, envio ignorado: "${phoneNumber}"`);
      return false;
    }

    // Resolve the real JID registered on WhatsApp (fixes the 9th-digit ambiguity and
    // detects numbers without WhatsApp). Falls back to the normalized JID on any error.
    if (jid.endsWith("@s.whatsapp.net")) {
      try {
        const digits = jid.replace("@s.whatsapp.net", "");
        const results = await sock.onWhatsApp(...brazilJidCandidates(digits));
        const found = Array.isArray(results) ? results.find((r) => r && r.exists && r.jid) : null;
        if (found) {
          jid = found.jid;
        } else if (Array.isArray(results) && results.length > 0) {
          console.warn(`[WhatsApp] Número sem WhatsApp: "${phoneNumber}"`);
          return false;
        }
      } catch (verifyErr: any) {
        console.warn(`[WhatsApp] Falha ao verificar JID de "${phoneNumber}": ${verifyErr.message} — enviando com JID normalizado.`);
      }
    }

    await sock.sendMessage(jid, { text: String(text || "") });
    return true;
  } catch (err: any) {
    console.error(`[WhatsApp] Erro ao enviar para "${phoneNumber}":`, err.message);
    return false;
  }
}
