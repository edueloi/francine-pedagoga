import { useCallback, useEffect, useState } from "react";
import { AgendaEvent, RecurrenceConfig } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { agendaEventFromApi, agendaEventToApi } from "../lib/apiMappers";

export type AgendaEventScope = "only" | "future";

export function useAgendaEvents(filters?: { patientId?: string; status?: string }) {
  const { authFetch, user } = useAuth();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.patientId) params.set("patient_id", filters.patientId);
      if (filters?.status) params.set("status", filters.status);
      const qs = params.toString();
      const res = await authFetch(`/api/agenda${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Falha ao carregar agenda");
      const data = await res.json();
      setEvents(data.map(agendaEventFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filters?.patientId, filters?.status]);

  useEffect(() => {
    if (user) reloadEvents();
  }, [user, reloadEvents]);

  const createEvent = useCallback(
    async (payload: Partial<AgendaEvent>, recurrence?: RecurrenceConfig) => {
      const body: Record<string, any> = agendaEventToApi(payload);
      if (recurrence) {
        body.recurrence_freq = recurrence.freq;
        body.recurrence_interval = recurrence.interval;
        if (recurrence.count) body.recurrence_count = recurrence.count;
        if (recurrence.endDate) body.recurrence_end_date = recurrence.endDate;
      }
      const res = await authFetch("/api/agenda", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao criar evento de agenda");
      await reloadEvents();
      return res.json();
    },
    [authFetch, reloadEvents]
  );

  const updateEvent = useCallback(
    async (id: string, payload: Partial<AgendaEvent>, scope: AgendaEventScope = "only") => {
      const res = await authFetch(`/api/agenda/${id}?scope=${scope}`, {
        method: "PUT",
        body: JSON.stringify(agendaEventToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao atualizar evento de agenda");
      await reloadEvents();
    },
    [authFetch, reloadEvents]
  );

  const deleteEvent = useCallback(
    async (id: string, scope: AgendaEventScope = "only") => {
      const res = await authFetch(`/api/agenda/${id}?scope=${scope}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover evento de agenda");
      await reloadEvents();
    },
    [authFetch, reloadEvents]
  );

  return { events, loading, error, reloadEvents, setEvents, createEvent, updateEvent, deleteEvent };
}
