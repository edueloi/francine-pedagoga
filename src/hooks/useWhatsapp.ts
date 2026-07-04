import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export type WhatsappStatus = "disconnected" | "connecting" | "connected";

export interface WhatsappState {
  status: WhatsappStatus;
  qrCodeDataUrl: string | null;
  phone: string | null;
}

export function useWhatsapp() {
  const { authFetch, user } = useAuth();
  const [state, setState] = useState<WhatsappState>({ status: "disconnected", qrCodeDataUrl: null, phone: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reloadStatus = useCallback(async () => {
    try {
      const res = await authFetch("/api/whatsapp/status");
      if (!res.ok) throw new Error("Falha ao consultar status do WhatsApp");
      const data = await res.json();
      setState(data);
      return data as WhatsappState;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [authFetch]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const data = await reloadStatus();
      if (data && data.status !== "connecting") {
        stopPolling();
      }
    }, 4000);
  }, [reloadStatus, stopPolling]);

  useEffect(() => {
    if (user) reloadStatus();
    return () => stopPolling();
  }, [user, reloadStatus, stopPolling]);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/whatsapp/connect", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao iniciar conexão com o WhatsApp");
      const data = await res.json();
      setState(data);
      startPolling();
      return data as WhatsappState;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authFetch, startPolling]);

  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      stopPolling();
      const res = await authFetch("/api/whatsapp/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao desconectar o WhatsApp");
      const data = await res.json();
      setState(data);
      return data as WhatsappState;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authFetch, stopPolling]);

  const sendTest = useCallback(
    async (phone: string, message: string) => {
      const res = await authFetch("/api/whatsapp/test", {
        method: "POST",
        body: JSON.stringify({ phone, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao enviar mensagem de teste");
      }
    },
    [authFetch]
  );

  return { ...state, loading, error, reloadStatus, connect, disconnect, sendTest };
}
