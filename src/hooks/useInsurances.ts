import { useCallback, useEffect, useState } from "react";
import { Insurance } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { insuranceFromApi, insuranceToApi } from "../lib/apiMappers";

export function useInsurances() {
  const { authFetch, user } = useAuth();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadInsurances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/insurances");
      if (!res.ok) throw new Error("Falha ao carregar convênios");
      const data = await res.json();
      setInsurances(data.map(insuranceFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadInsurances();
  }, [user, reloadInsurances]);

  const createInsurance = useCallback(
    async (payload: Partial<Insurance>) => {
      const res = await authFetch("/api/insurances", {
        method: "POST",
        body: JSON.stringify(insuranceToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao criar convênio");
      await reloadInsurances();
    },
    [authFetch, reloadInsurances]
  );

  const updateInsurance = useCallback(
    async (id: string, payload: Partial<Insurance>) => {
      const res = await authFetch(`/api/insurances/${id}`, {
        method: "PUT",
        body: JSON.stringify(insuranceToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao atualizar convênio");
      await reloadInsurances();
    },
    [authFetch, reloadInsurances]
  );

  const deleteInsurance = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/insurances/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover convênio");
      await reloadInsurances();
    },
    [authFetch, reloadInsurances]
  );

  return {
    insurances,
    loading,
    error,
    reloadInsurances,
    setInsurances,
    createInsurance,
    updateInsurance,
    deleteInsurance,
  };
}
