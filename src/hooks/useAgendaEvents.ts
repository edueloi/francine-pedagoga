import { useCallback, useEffect, useState } from "react";
import { AgendaEvent, RecurrenceConfig } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { agendaEventFromApi, agendaEventToApi } from "../lib/apiMappers";
import { useAutoRefresh } from "./useAutoRefresh";

export type AgendaEventScope = "only" | "future";

// Thrown when the backend rejects a create/update with 409 (another event for the
// same professional overlaps the requested time range). Callers can catch this
// specifically to offer "save anyway" (resubmitting with force: true) instead of
// just showing a generic failure message.
export class AgendaConflictError extends Error {
  conflict: { id: string; title: string; start_time: string; end_time: string };
  constructor(message: string, conflict: AgendaConflictError["conflict"]) {
    super(message);
    this.name = "AgendaConflictError";
    this.conflict = conflict;
  }
}

async function throwForStatus(res: Response, fallbackMessage: string) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 409 && data.conflict) {
    throw new AgendaConflictError(data.error || fallbackMessage, data.conflict);
  }
  throw new Error(data.error || fallbackMessage);
}

export type BulkAgendaAction =
  | { action: "status"; ids: string[]; status: AgendaEvent["status"] }
  | { action: "shift_time"; ids: string[]; offsetMinutes: number }
  | { action: "professional"; ids: string[]; professionalId: string | null }
  | { action: "delete"; ids: string[] };

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

  // Agenda is the most collaborative screen (multiple staff booking at once) —
  // refetch on focus/visibility + a short background poll so a new appointment
  // made on another computer shows up without anyone needing to hit F5.
  useAutoRefresh(reloadEvents, 20000, !!user);

  const createEvent = useCallback(
    async (payload: Partial<AgendaEvent>, recurrence?: RecurrenceConfig, force?: boolean) => {
      const body: Record<string, any> = agendaEventToApi(payload);
      if (recurrence) {
        body.recurrence_freq = recurrence.freq;
        body.recurrence_interval = recurrence.interval;
        if (recurrence.count) body.recurrence_count = recurrence.count;
        if (recurrence.endDate) body.recurrence_end_date = recurrence.endDate;
      }
      if (force) body.force = true;
      const res = await authFetch("/api/agenda", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) await throwForStatus(res, "Falha ao criar evento de agenda");
      await reloadEvents();
      return res.json();
    },
    [authFetch, reloadEvents]
  );

  const updateEvent = useCallback(
    async (
      id: string,
      payload: Partial<AgendaEvent>,
      scope: AgendaEventScope = "only",
      force?: boolean,
      recurrence?: RecurrenceConfig
    ) => {
      const body: Record<string, any> = agendaEventToApi(payload);
      if (recurrence) {
        // Only meaningful when turning a standalone event into a new series — see
        // backend/routes/agenda.ts PUT handler (skipped when the event already
        // belongs to one, since editing an active series' rule isn't supported yet).
        body.recurrence_freq = recurrence.freq;
        body.recurrence_interval = recurrence.interval;
        if (recurrence.count) body.recurrence_count = recurrence.count;
        if (recurrence.endDate) body.recurrence_end_date = recurrence.endDate;
      }
      if (force) body.force = true;
      const res = await authFetch(`/api/agenda/${id}?scope=${scope}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) await throwForStatus(res, "Falha ao atualizar evento de agenda");
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

  const bulkAction = useCallback(
    async (payload: BulkAgendaAction) => {
      const res = await authFetch("/api/agenda/bulk", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Falha ao aplicar ação em lote");
      await reloadEvents();
    },
    [authFetch, reloadEvents]
  );

  return { events, loading, error, reloadEvents, setEvents, createEvent, updateEvent, deleteEvent, bulkAction };
}
