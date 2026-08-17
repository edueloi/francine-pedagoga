import { useCallback, useEffect, useState } from "react";
import { Protocol } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { protocolFromApi, protocolToApi } from "../lib/apiMappers";

export function useProtocols(filters?: { patientId?: string }) {
  const { authFetch, user } = useAuth();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadProtocols = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.patientId) params.set("patient_id", filters.patientId);
      const qs = params.toString();
      const res = await authFetch(`/api/protocols${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Falha ao carregar protocolos");
      const data = await res.json();
      setProtocols(data.map(protocolFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filters?.patientId]);

  useEffect(() => {
    if (user) reloadProtocols();
  }, [user, reloadProtocols]);

  const createProtocol = useCallback(
    async (payload: Partial<Protocol>) => {
      const res = await authFetch("/api/protocols", {
        method: "POST",
        body: JSON.stringify(protocolToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao criar protocolo");
      const row = await res.json();
      await reloadProtocols();
      return protocolFromApi(row);
    },
    [authFetch, reloadProtocols]
  );

  const updateProtocol = useCallback(
    async (id: string, payload: Partial<Protocol>) => {
      const res = await authFetch(`/api/protocols/${id}`, {
        method: "PUT",
        body: JSON.stringify(protocolToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao atualizar protocolo");
      const row = await res.json();
      await reloadProtocols();
      return protocolFromApi(row);
    },
    [authFetch, reloadProtocols]
  );

  const deleteProtocol = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/protocols/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover protocolo");
      await reloadProtocols();
    },
    [authFetch, reloadProtocols]
  );

  return {
    protocols,
    loading,
    error,
    reloadProtocols,
    setProtocols,
    createProtocol,
    updateProtocol,
    deleteProtocol,
  };
}
