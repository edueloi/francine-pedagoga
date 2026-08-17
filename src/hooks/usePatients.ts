import { useCallback, useEffect, useState } from "react";
import { Patient } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { patientFromApi } from "../lib/apiMappers";
import { useAutoRefresh } from "./useAutoRefresh";

export function usePatients() {
  const { authFetch, user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/patients");
      if (!res.ok) throw new Error("Falha ao carregar pacientes");
      const data = await res.json();
      setPatients(data.map(patientFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadPatients();
  }, [user, reloadPatients]);

  // Refetch on focus/visibility + a background poll, so a patient created or
  // edited by a coworker on another computer shows up without hitting F5.
  useAutoRefresh(reloadPatients, 30000, !!user);

  return { patients, loading, error, reloadPatients, setPatients };
}
