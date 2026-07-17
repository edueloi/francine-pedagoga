import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export type EmailSettingKey =
  | "reminder_24h"
  | "reminder_1h"
  | "appointment_confirmed"
  | "appointment_thanks"
  | "form_result"
  | "password_reset"
  | "user_invite";

export interface EmailSetting {
  settingKey: EmailSettingKey;
  enabled: boolean;
  subject: string;
  messageTemplate: string;
  updatedAt?: string;
}

function fromApi(row: any): EmailSetting {
  return {
    settingKey: row.setting_key,
    enabled: !!row.enabled,
    subject: row.subject ?? "",
    messageTemplate: row.message_template ?? "",
    updatedAt: row.updated_at,
  };
}

export function useEmailSettings() {
  const { authFetch, user } = useAuth();
  const [settings, setSettings] = useState<EmailSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/email/settings");
      if (!res.ok) throw new Error("Falha ao carregar configurações de e-mail");
      const data = await res.json();
      setSettings(data.map(fromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadSettings();
  }, [user, reloadSettings]);

  const updateSetting = useCallback(
    async (key: EmailSettingKey, payload: { enabled: boolean; subject: string; messageTemplate: string }) => {
      const res = await authFetch(`/api/email/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({
          enabled: payload.enabled,
          subject: payload.subject,
          messageTemplate: payload.messageTemplate,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao salvar configuração");
      await reloadSettings();
    },
    [authFetch, reloadSettings]
  );

  return { settings, loading, error, reloadSettings, updateSetting };
}
