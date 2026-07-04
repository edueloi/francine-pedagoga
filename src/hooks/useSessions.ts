import { useCallback, useEffect, useState } from "react";
import { Session } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { sessionFromApi, sessionToApi } from "../lib/apiMappers";

export function useSessions() {
  const { authFetch, user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/sessions");
      if (!res.ok) throw new Error("Falha ao carregar sessões");
      const data = await res.json();
      setSessions(data.map(sessionFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadSessions();
  }, [user, reloadSessions]);

  const createSession = useCallback(
    async (payload: Partial<Session>) => {
      const res = await authFetch("/api/sessions", {
        method: "POST",
        body: JSON.stringify(sessionToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao salvar sessão");
      await reloadSessions();
    },
    [authFetch, reloadSessions]
  );

  const updateSession = useCallback(
    async (id: string, payload: Partial<Session>) => {
      const res = await authFetch(`/api/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify(sessionToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao atualizar sessão");
      await reloadSessions();
    },
    [authFetch, reloadSessions]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover sessão");
      await reloadSessions();
    },
    [authFetch, reloadSessions]
  );

  return {
    sessions,
    loading,
    error,
    reloadSessions,
    setSessions,
    createSession,
    updateSession,
    deleteSession,
  };
}
