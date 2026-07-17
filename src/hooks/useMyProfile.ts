import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface MyProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  profissao?: string;
  dataNascimento?: string;
  abordagens?: string;
}

function fromApi(row: any): MyProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url ?? undefined,
    profissao: row.profissao ?? undefined,
    dataNascimento: row.data_nascimento ?? undefined,
    abordagens: row.abordagens ?? undefined,
  };
}

export function useMyProfile() {
  const { authFetch, user } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/users/me");
      if (!res.ok) throw new Error("Falha ao carregar perfil");
      setProfile(fromApi(await res.json()));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  const updateProfile = useCallback(
    async (payload: {
      name: string;
      avatarUrl?: string;
      profissao?: string;
      dataNascimento?: string;
      abordagens?: string;
      currentPassword?: string;
      newPassword?: string;
    }) => {
      const res = await authFetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao atualizar perfil");
      await reload();
    },
    [authFetch, reload]
  );

  return { profile, loading, error, reload, updateProfile };
}
