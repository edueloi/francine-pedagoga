import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface ClinicSettings {
  id: number | null;
  name: string;
  documentNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  activities: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  updatedAt?: string | null;
}

export interface ClinicSettingsPayload {
  name: string;
  documentNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  activities: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
}

function fromApi(row: any): ClinicSettings {
  return {
    id: row.id ?? null,
    name: row.name ?? "",
    documentNumber: row.documentNumber ?? row.document_number ?? null,
    address: row.address ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    description: row.description ?? null,
    activities: row.activities ?? null,
    logoUrl: row.logoUrl ?? row.logo_url ?? null,
    coverImageUrl: row.coverImageUrl ?? row.cover_image_url ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

export function useClinicSettings() {
  const { authFetch, user } = useAuth();
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/clinic-settings");
      if (!res.ok) throw new Error("Falha ao carregar dados da clínica");
      const data = await res.json();
      setSettings(fromApi(data));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadSettings();
  }, [user, reloadSettings]);

  const updateSettings = useCallback(
    async (payload: ClinicSettingsPayload) => {
      const res = await authFetch("/api/clinic-settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao salvar dados da clínica");
      await reloadSettings();
    },
    [authFetch, reloadSettings]
  );

  return { settings, loading, error, reloadSettings, updateSettings };
}
