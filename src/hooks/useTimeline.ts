import { useCallback, useEffect, useState } from "react";
import { TimelineItem } from "../types";
import { useAuth } from "../contexts/AuthContext";

function timelineFromApi(row: any): TimelineItem {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    data: row.data,
    tipo: row.tipo,
    titulo: row.titulo ?? "",
    descricao: row.descricao ?? "",
    profissional: row.profissional ?? "",
  };
}

function timelineToApi(item: Partial<TimelineItem>): Record<string, any> {
  return {
    patient_id: item.patientId,
    data: item.data,
    tipo: item.tipo,
    titulo: item.titulo ?? null,
    descricao: item.descricao ?? null,
    profissional: item.profissional ?? null,
  };
}

/**
 * Loads and manages timeline items (backend/routes/timeline.ts, table timeline_items)
 * for a single patient. Mirrors the shape of usePatients/useSessions/useInsurances.
 */
export function useTimeline(patientId?: string) {
  const { authFetch, user } = useAuth();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadTimeline = useCallback(async () => {
    if (!patientId) {
      setTimeline([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/timeline?patient_id=${encodeURIComponent(patientId)}`);
      if (!res.ok) throw new Error("Falha ao carregar linha do tempo");
      const data = await res.json();
      setTimeline(data.map(timelineFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, patientId]);

  useEffect(() => {
    if (user) reloadTimeline();
  }, [user, reloadTimeline]);

  const addTimelineItem = useCallback(
    async (item: Omit<TimelineItem, "id">) => {
      const res = await authFetch("/api/timeline", {
        method: "POST",
        body: JSON.stringify(timelineToApi(item)),
      });
      if (!res.ok) throw new Error("Falha ao registrar evento na linha do tempo");
      const row = await res.json();
      const created = timelineFromApi(row);
      setTimeline((prev) => [created, ...prev]);
      return created;
    },
    [authFetch]
  );

  return { timeline, loading, error, reloadTimeline, addTimelineItem, setTimeline };
}
