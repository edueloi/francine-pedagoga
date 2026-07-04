import { useCallback, useEffect, useState } from "react";
import { Patient } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { patientFromApi } from "../lib/apiMappers";

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

  return { patients, loading, error, reloadPatients, setPatients };
}
