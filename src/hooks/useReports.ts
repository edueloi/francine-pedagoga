import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface ReportsSummary {
  period: "week" | "month";
  intervalDays: number;
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
  newPatients: number;
  sessionsLogged: number;
  activePatients: number;
  appointmentsByDay: { day: string; total: number }[];
}

export function useReports(period: "week" | "month") {
  const { authFetch, user } = useAuth();
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/reports/summary?period=${period}`);
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao carregar relatórios");
      setSummary(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, period]);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  return { summary, loading, error, reload };
}
