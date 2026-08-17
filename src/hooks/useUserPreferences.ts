import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

// Generic per-user UI preferences (view mode, page size, etc.), stored as a single
// JSON blob on the user record so each screen doesn't need its own DB column —
// see backend/routes/users.ts GET/PATCH /api/users/me/preferences.
export function useUserPreferences() {
  const { authFetch, user } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    authFetch("/api/users/me/preferences")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (!cancelled) setPreferences(data || {});
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authFetch, user]);

  const setPreference = useCallback(
    (key: string, value: any) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
      authFetch("/api/users/me/preferences", {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      }).catch(() => {});
    },
    [authFetch]
  );

  return { preferences, loaded, setPreference };
}
