import { useCallback, useEffect, useState } from "react";
import { ClinicalReport } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { clinicalReportFromApi, clinicalReportToApi } from "../lib/apiMappers";

export function useClinicalReports(filters?: { patientId?: string }) {
  const { authFetch, user } = useAuth();
  const [reports, setReports] = useState<ClinicalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.patientId) params.set("patient_id", filters.patientId);
      const qs = params.toString();
      const res = await authFetch(`/api/clinical-reports${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Falha ao carregar laudos e relatórios");
      const data = await res.json();
      setReports(data.map(clinicalReportFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filters?.patientId]);

  useEffect(() => {
    if (user) reloadReports();
  }, [user, reloadReports]);

  const createReport = useCallback(
    async (payload: Partial<ClinicalReport>) => {
      const res = await authFetch("/api/clinical-reports", {
        method: "POST",
        body: JSON.stringify(clinicalReportToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao arquivar o laudo");
      const row = await res.json();
      await reloadReports();
      return clinicalReportFromApi(row);
    },
    [authFetch, reloadReports]
  );

  const deleteReport = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/clinical-reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover o laudo");
      await reloadReports();
    },
    [authFetch, reloadReports]
  );

  return { reports, loading, error, reloadReports, createReport, deleteReport };
}
