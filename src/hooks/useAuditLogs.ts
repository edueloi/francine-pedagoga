import { useCallback, useEffect, useState } from "react";
import { AuditLog } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { auditLogFromApi, auditLogToApi } from "../lib/apiMappers";

export function useAuditLogs() {
  const { authFetch, user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/audit-logs");
      if (!res.ok) throw new Error("Falha ao carregar logs de auditoria");
      const data = await res.json();
      setLogs(data.map(auditLogFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadLogs();
  }, [user, reloadLogs]);

  const createLog = useCallback(
    async (payload: Partial<AuditLog>) => {
      const res = await authFetch("/api/audit-logs", {
        method: "POST",
        body: JSON.stringify(auditLogToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao registrar log de auditoria");
      await reloadLogs();
    },
    [authFetch, reloadLogs]
  );

  return { logs, loading, error, reloadLogs, setLogs, createLog };
}
