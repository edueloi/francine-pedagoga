import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export type WhatsappSettingKey = "reminder_24h" | "reminder_1h" | "birthday" | "insurance_expiring";

export interface WhatsappSetting {
  settingKey: WhatsappSettingKey;
  enabled: boolean;
  messageTemplate: string;
  updatedAt?: string;
}

function fromApi(row: any): WhatsappSetting {
  return {
    settingKey: row.setting_key,
    enabled: !!row.enabled,
    messageTemplate: row.message_template ?? "",
    updatedAt: row.updated_at,
  };
}

export function useWhatsappSettings() {
  const { authFetch, user } = useAuth();
  const [settings, setSettings] = useState<WhatsappSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/whatsapp/settings");
      if (!res.ok) throw new Error("Falha ao carregar configurações do WhatsApp");
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
    async (key: WhatsappSettingKey, payload: { enabled: boolean; messageTemplate: string }) => {
      const res = await authFetch(`/api/whatsapp/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ enabled: payload.enabled, messageTemplate: payload.messageTemplate }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao salvar configuração");
      await reloadSettings();
    },
    [authFetch, reloadSettings]
  );

  return { settings, loading, error, reloadSettings, updateSetting };
}
