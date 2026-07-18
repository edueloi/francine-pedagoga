import { useCallback, useEffect, useState } from "react";
import { InsuranceProvider } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { insuranceProviderFromApi, insuranceProviderToApi } from "../lib/apiMappers";

export function useInsuranceProviders() {
  const { authFetch, user } = useAuth();
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/insurance-providers");
      if (!res.ok) throw new Error("Falha ao carregar operadoras de saúde");
      const data = await res.json();
      setProviders(data.map(insuranceProviderFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadProviders();
  }, [user, reloadProviders]);

  const createProvider = useCallback(
    async (payload: Partial<InsuranceProvider>) => {
      const res = await authFetch("/api/insurance-providers", {
        method: "POST",
        body: JSON.stringify(insuranceProviderToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao cadastrar operadora");
      await reloadProviders();
    },
    [authFetch, reloadProviders]
  );

  const updateProvider = useCallback(
    async (id: string, payload: Partial<InsuranceProvider>) => {
      const res = await authFetch(`/api/insurance-providers/${id}`, {
        method: "PUT",
        body: JSON.stringify(insuranceProviderToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao atualizar operadora");
      await reloadProviders();
    },
    [authFetch, reloadProviders]
  );

  const deleteProvider = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/insurance-providers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover operadora");
      await reloadProviders();
    },
    [authFetch, reloadProviders]
  );

  return {
    providers,
    loading,
    error,
    reloadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
  };
}
