import { useCallback, useEffect, useState } from "react";
import { PeiGoal } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { peiGoalFromApi, peiGoalToApi } from "../lib/apiMappers";

export function usePeiGoals(filters?: { patientId?: string }) {
  const { authFetch, user } = useAuth();
  const [goals, setGoals] = useState<PeiGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.patientId) params.set("patient_id", filters.patientId);
      const qs = params.toString();
      const res = await authFetch(`/api/pei-goals${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Falha ao carregar metas do PEI");
      const data = await res.json();
      setGoals(data.map(peiGoalFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filters?.patientId]);

  useEffect(() => {
    if (user) reloadGoals();
  }, [user, reloadGoals]);

  const createGoal = useCallback(
    async (payload: Partial<PeiGoal>) => {
      const res = await authFetch("/api/pei-goals", {
        method: "POST",
        body: JSON.stringify(peiGoalToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao criar meta do PEI");
      await reloadGoals();
    },
    [authFetch, reloadGoals]
  );

  const updateGoal = useCallback(
    async (id: string, payload: Partial<PeiGoal>) => {
      const res = await authFetch(`/api/pei-goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(peiGoalToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao atualizar meta do PEI");
      await reloadGoals();
    },
    [authFetch, reloadGoals]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/pei-goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover meta do PEI");
      await reloadGoals();
    },
    [authFetch, reloadGoals]
  );

  return { goals, loading, error, reloadGoals, setGoals, createGoal, updateGoal, deleteGoal };
}
