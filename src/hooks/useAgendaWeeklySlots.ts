import { useCallback, useEffect, useState } from "react";
import { AgendaItem, Patient } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { agendaWeeklySlotFromApi, agendaWeeklySlotToApi } from "../lib/apiMappers";

// `agenda_weekly_slots` only stores patient_id; patientNome is resolved
// client-side from the already-loaded usePatients() list (pass it in).
export function useAgendaWeeklySlots(patients: Patient[]) {
  const { authFetch, user } = useAuth();
  const [slots, setSlots] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/agenda-weekly-slots");
      if (!res.ok) throw new Error("Falha ao carregar grade semanal");
      const data = await res.json();
      setSlots(
        data.map((row: any) => {
          const patient = patients.find((p) => p.id === String(row.patient_id));
          return agendaWeeklySlotFromApi(row, patient?.nome ?? "");
        })
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, patients]);

  useEffect(() => {
    if (user) reloadSlots();
  }, [user, reloadSlots]);

  const createSlot = useCallback(
    async (payload: Partial<AgendaItem>) => {
      const res = await authFetch("/api/agenda-weekly-slots", {
        method: "POST",
        body: JSON.stringify(agendaWeeklySlotToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao criar horário fixo");
      await reloadSlots();
    },
    [authFetch, reloadSlots]
  );

  const updateSlot = useCallback(
    async (id: string, payload: Partial<AgendaItem>) => {
      const res = await authFetch(`/api/agenda-weekly-slots/${id}`, {
        method: "PUT",
        body: JSON.stringify(agendaWeeklySlotToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao atualizar horário fixo");
      await reloadSlots();
    },
    [authFetch, reloadSlots]
  );

  const deleteSlot = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/agenda-weekly-slots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover horário fixo");
      await reloadSlots();
    },
    [authFetch, reloadSlots]
  );

  return { slots, loading, error, reloadSlots, setSlots, createSlot, updateSlot, deleteSlot };
}
