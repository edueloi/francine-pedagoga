import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { UserPermissions, UserRole } from "../types";

export interface PendingInvite {
  id: string;
  email: string;
  role: UserRole;
  permissions?: UserPermissions;
  expiresAt: string;
  createdAt: string;
}

function fromApi(row: any): PendingInvite {
  return {
    id: String(row.id),
    email: row.email,
    role: row.role,
    permissions: row.permissions ? (typeof row.permissions === "string" ? JSON.parse(row.permissions) : row.permissions) : undefined,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function useInvites() {
  const { authFetch, user } = useAuth();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/users/invites");
      if (!res.ok) throw new Error("Falha ao carregar convites pendentes");
      const data = await res.json();
      setInvites(data.map(fromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadInvites();
  }, [user, reloadInvites]);

  const createInvite = useCallback(
    async (payload: { email: string; role: string; permissions?: UserPermissions }) => {
      const res = await authFetch("/api/users/invites", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao criar convite");
      await reloadInvites();
    },
    [authFetch, reloadInvites]
  );

  const cancelInvite = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/users/invites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao cancelar convite");
      await reloadInvites();
    },
    [authFetch, reloadInvites]
  );

  return { invites, loading, error, reloadInvites, createInvite, cancelInvite };
}
