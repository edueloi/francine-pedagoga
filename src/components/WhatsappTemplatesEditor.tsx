import React, { useEffect, useRef, useState } from "react";
import { Clock, CalendarClock, Gift, Save, RefreshCw, CreditCard, Plus } from "lucide-react";
import { useWhatsappSettings, WhatsappSetting, WhatsappSettingKey } from "../hooks/useWhatsappSettings";
import { useToast } from "./UI";

const LABELS: Record<WhatsappSettingKey, { title: string; desc: string; icon: React.ReactNode }> = {
  reminder_24h: {
    title: "Lembrete de 24 horas",
    desc: "Enviado no dia anterior ao atendimento.",
    icon: <CalendarClock className="h-4.5 w-4.5 text-[#1070ca]" />,
  },
  reminder_1h: {
    title: "Lembrete de 60 minutos",
    desc: "Enviado cerca de 1 hora antes do atendimento.",
    icon: <Clock className="h-4.5 w-4.5 text-[#1070ca]" />,
  },
  birthday: {
    title: "Mensagem de aniversário",
    desc: "Enviada automaticamente no dia do aniversário do paciente.",
    icon: <Gift className="h-4.5 w-4.5 text-[#d43f72]" />,
  },
  insurance_expiring: {
    title: "Alerta de guia de convênio",
    desc: "Enviado quando a guia está vencendo ou com poucas sessões restantes.",
    icon: <CreditCard className="h-4.5 w-4.5 text-amber-600" />,
  },
};

// Placeholders available per template, shown as clickable badges above the textarea.
const VARIABLES: Record<WhatsappSettingKey, { key: string; label: string }[]> = {
  reminder_24h: [
    { key: "nome", label: "Nome do Paciente" },
    { key: "data", label: "Data do Atendimento" },
    { key: "hora", label: "Horário do Atendimento" },
  ],
  reminder_1h: [
    { key: "nome", label: "Nome do Paciente" },
    { key: "data", label: "Data do Atendimento" },
    { key: "hora", label: "Horário do Atendimento" },
  ],
  birthday: [{ key: "nome", label: "Nome do Paciente" }],
  insurance_expiring: [
    { key: "nome", label: "Nome do Paciente" },
    { key: "convenio", label: "Convênio" },
    { key: "sessoes_restantes", label: "Sessões Restantes" },
    { key: "validade", label: "Vencimento da Guia" },
  ],
};

const ORDER: WhatsappSettingKey[] = ["reminder_24h", "reminder_1h", "birthday", "insurance_expiring"];

function TemplateCard({ setting, onSave }: { setting: WhatsappSetting; onSave: (payload: { enabled: boolean; messageTemplate: string }) => Promise<void> }) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(setting.enabled);
  const [text, setText] = useState(setting.messageTemplate);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const info = LABELS[setting.settingKey];
  const variables = VARIABLES[setting.settingKey];
  const dirty = enabled !== setting.enabled || text !== setting.messageTemplate;

  useEffect(() => {
    setEnabled(setting.enabled);
    setText(setting.messageTemplate);
  }, [setting.enabled, setting.messageTemplate]);

  const handleInsertVariable = (key: string) => {
    const placeholder = `{${key}}`;
    const el = textareaRef.current;
    if (!el) {
      setText((prev) => prev + placeholder);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + placeholder + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + placeholder.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ enabled, messageTemplate: text });
      toast.success(`Modelo de mensagem "${info.title}" atualizado com sucesso.`);
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar o modelo de mensagem.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-slate-50 pb-3">
        <div className="flex items-start gap-2.5">
          {info.icon}
          <div>
            <h4 className="font-display font-black text-slate-900 text-sm">{info.title}</h4>
            <p className="text-[11px] text-slate-500 font-medium">{info.desc}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
            enabled ? "bg-emerald-500" : "bg-slate-200"
          }`}
          aria-label={enabled ? "Desativar" : "Ativar"}
        >
          <span
            className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5.5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-0.5">Inserir:</span>
        {variables.map((v) => (
          <button
            key={v.key}
            type="button"
            disabled={!enabled}
            onClick={() => handleInsertVariable(v.key)}
            title={`Inserir {${v.key}} no texto`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e7f1fc] hover:bg-[#d3e6fa] text-[#0b5194] text-[10px] font-black uppercase tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            {v.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        disabled={!enabled}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-medium leading-relaxed focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <button
        onClick={handleSave}
        disabled={!dirty || saving}
        className="w-full py-2.5 bg-[#1070ca] hover:bg-[#0b5194] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
      >
        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Modelo
      </button>
    </div>
  );
}

export function WhatsappTemplatesEditor() {
  const { settings, loading, error, updateSetting } = useWhatsappSettings();

  const ordered = ORDER.map((key) => settings.find((s) => s.settingKey === key)).filter(
    (s): s is WhatsappSetting => !!s
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest">
          Modelos de Mensagem
        </h3>
      </div>

      {loading && <p className="text-xs text-slate-400 text-center py-6">Carregando modelos de mensagem...</p>}
      {error && <p className="text-xs text-red-600 font-bold text-center py-2">{error}</p>}

      {!loading && ordered.map((setting) => (
        <TemplateCard
          key={setting.settingKey}
          setting={setting}
          onSave={(payload) => updateSetting(setting.settingKey, payload)}
        />
      ))}
    </div>
  );
}

export default WhatsappTemplatesEditor;
