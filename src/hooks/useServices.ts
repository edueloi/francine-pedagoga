import { useCallback, useEffect, useState } from "react";
import { Service } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { serviceFromApi, serviceToApi } from "../lib/apiMappers";

export function useServices() {
  const { authFetch, user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/services");
      if (!res.ok) throw new Error("Falha ao carregar serviços");
      const data = await res.json();
      setServices(data.map(serviceFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadServices();
  }, [user, reloadServices]);

  const createService = useCallback(
    async (payload: Partial<Service>) => {
      const res = await authFetch("/api/services", {
        method: "POST",
        body: JSON.stringify(serviceToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao criar serviço");
      await reloadServices();
    },
    [authFetch, reloadServices]
  );

  const updateService = useCallback(
    async (id: string, payload: Partial<Service>) => {
      const res = await authFetch(`/api/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(serviceToApi(payload)),
      });
      if (!res.ok) throw new Error("Falha ao atualizar serviço");
      await reloadServices();
    },
    [authFetch, reloadServices]
  );

  const deleteService = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover serviço");
      await reloadServices();
    },
    [authFetch, reloadServices]
  );

  return {
    services,
    loading,
    error,
    reloadServices,
    setServices,
    createService,
    updateService,
    deleteService,
  };
}
