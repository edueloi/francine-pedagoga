import { useCallback, useEffect, useState } from "react";
import { Activity } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { activityFromApi, activityToApi } from "../lib/apiMappers";

export function useActivities() {
  const { authFetch, user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/activities");
      if (!res.ok) throw new Error("Falha ao carregar banco de atividades");
      const data = await res.json();
      setActivities(data.map(activityFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadActivities();
  }, [user, reloadActivities]);

  const createActivity = useCallback(
    async (payload: Partial<Activity>) => {
      const res = await authFetch("/api/activities", {
        method: "POST",
        body: JSON.stringify(activityToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao criar atividade");
      await reloadActivities();
    },
    [authFetch, reloadActivities]
  );

  const updateActivity = useCallback(
    async (id: string, payload: Partial<Activity>) => {
      const res = await authFetch(`/api/activities/${id}`, {
        method: "PUT",
        body: JSON.stringify(activityToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao atualizar atividade");
      await reloadActivities();
    },
    [authFetch, reloadActivities]
  );

  const deleteActivity = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/activities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover atividade");
      await reloadActivities();
    },
    [authFetch, reloadActivities]
  );

  return {
    activities,
    loading,
    error,
    reloadActivities,
    setActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  };
}
