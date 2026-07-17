import { useCallback, useEffect, useState } from "react";
import { SystemUser } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { systemUserFromApi } from "../lib/apiMappers";

export function useUsers() {
  const { authFetch, user } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/users");
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      const data = await res.json();
      setUsers(data.map(systemUserFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadUsers();
  }, [user, reloadUsers]);

  const createUser = useCallback(
    async (payload: { name: string; email: string; password: string; role: string }) => {
      const res = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao criar usuário");
      await reloadUsers();
    },
    [authFetch, reloadUsers]
  );

  const updateUser = useCallback(
    async (id: string, payload: { name: string; email: string; role: string; active: boolean; password?: string }) => {
      const res = await authFetch(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao atualizar usuário");
      await reloadUsers();
    },
    [authFetch, reloadUsers]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover usuário");
      await reloadUsers();
    },
    [authFetch, reloadUsers]
  );

  const inviteUser = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/users/${id}/invite`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao enviar convite");
    },
    [authFetch]
  );

  return { users, loading, error, reloadUsers, createUser, updateUser, deleteUser, inviteUser };
}
