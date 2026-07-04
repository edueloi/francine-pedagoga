import { useCallback, useEffect, useState } from "react";
import { Anamnese } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { anamneseFromApi, anamneseToApi } from "../lib/apiMappers";

export function useAnamneses(filters?: { patientId?: string }) {
  const { authFetch, user } = useAuth();
  const [anamneses, setAnamneses] = useState<Anamnese[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadAnamneses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.patientId) params.set("patient_id", filters.patientId);
      const qs = params.toString();
      const res = await authFetch(`/api/anamneses${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Falha ao carregar anamneses");
      const data = await res.json();
      setAnamneses(data.map(anamneseFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filters?.patientId]);

  useEffect(() => {
    if (user) reloadAnamneses();
  }, [user, reloadAnamneses]);

  // Anamnese is 1-to-1 per patient (patient_id UNIQUE in the DB): create if
  // the patient has none yet, otherwise update the existing record.
  const saveAnamnese = useCallback(
    async (payload: Anamnese) => {
      const existing = anamneses.find((a) => a.patientId === payload.patientId);
      if (existing?.id) {
        const res = await authFetch(`/api/anamneses/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify(anamneseToApi(payload)),
        });
        if (!res.ok) throw new Error("Falha ao atualizar anamnese");
      } else {
        const res = await authFetch("/api/anamneses", {
          method: "POST",
          body: JSON.stringify(anamneseToApi(payload)),
        });
        if (!res.ok) throw new Error("Falha ao criar anamnese");
      }
      await reloadAnamneses();
    },
    [authFetch, anamneses, reloadAnamneses]
  );

  return {
    anamneses,
    loading,
    error,
    reloadAnamneses,
    setAnamneses,
    saveAnamnese,
  };
}
