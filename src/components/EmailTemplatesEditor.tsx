import React, { useEffect, useRef, useState } from "react";
import { Clock, CalendarClock, CheckCircle2, Heart, ClipboardList, KeyRound, UserPlus, Save, RefreshCw, Plus } from "lucide-react";
import { useEmailSettings, EmailSetting, EmailSettingKey } from "../hooks/useEmailSettings";
import { useToast, Switch, Tooltip } from "./UI";

const LABELS: Record<EmailSettingKey, { title: string; desc: string; icon: React.ReactNode }> = {
  reminder_24h: {
    title: "Lembrete de 24 horas",
    desc: "Enviado por e-mail no dia anterior ao atendimento, junto com o lembrete de WhatsApp.",
    icon: <CalendarClock className="h-4.5 w-4.5 text-[#1070ca]" />,
  },
  reminder_1h: {
    title: "Lembrete de 60 minutos",
    desc: "Enviado por e-mail cerca de 1 hora antes do atendimento.",
    icon: <Clock className="h-4.5 w-4.5 text-[#1070ca]" />,
  },
  appointment_confirmed: {
    title: "Confirmação de atendimento",
    desc: "Enviado quando um agendamento é marcado como confirmado.",
    icon: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />,
  },
  appointment_thanks: {
    title: "Agradecimento pós-atendimento",
    desc: "Enviado quando um agendamento é marcado como realizado.",
    icon: <Heart className="h-4.5 w-4.5 text-[#d43f72]" />,
  },
  form_result: {
    title: "Resultado de formulário",
    desc: "Enviado ao paciente/responsável após o envio de um formulário respondido.",
    icon: <ClipboardList className="h-4.5 w-4.5 text-amber-600" />,
  },
  password_reset: {
    title: "Recuperação de senha",
    desc: "Enviado quando um usuário solicita redefinição de senha. Recomendado manter sempre ativo.",
    icon: <KeyRound className="h-4.5 w-4.5 text-slate-600" />,
  },
  user_invite: {
    title: "Convite de acesso",
    desc: "Enviado ao convidar um novo usuário para acessar o sistema. Recomendado manter sempre ativo.",
    icon: <UserPlus className="h-4.5 w-4.5 text-slate-600" />,
  },
};

// Placeholders available per template, shown as clickable badges above the textarea.
const VARIABLES: Record<EmailSettingKey, { key: string; label: string }[]> = {
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
  appointment_confirmed: [
    { key: "nome", label: "Nome do Paciente" },
    { key: "data", label: "Data do Atendimento" },
    { key: "hora", label: "Horário do Atendimento" },
  ],
  appointment_thanks: [{ key: "nome", label: "Nome do Paciente" }],
  form_result: [
    { key: "nome", label: "Nome do Paciente" },
    { key: "resultado", label: "Resultado do Formulário" },
  ],
  password_reset: [
    { key: "nome", label: "Nome do Usuário" },
    { key: "link", label: "Link de Redefinição" },
  ],
  user_invite: [
    { key: "nome", label: "Nome do Usuário" },
    { key: "link", label: "Link de Convite" },
  ],
};

const ORDER: EmailSettingKey[] = [
  "reminder_24h",
  "reminder_1h",
  "appointment_confirmed",
  "appointment_thanks",
  "form_result",
  "password_reset",
  "user_invite",
];

function TemplateCard({
  setting,
  onSave,
}: {
  setting: EmailSetting;
  onSave: (payload: { enabled: boolean; subject: string; messageTemplate: string }) => Promise<void>;
}) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(setting.enabled);
  const [subject, setSubject] = useState(setting.subject);
  const [text, setText] = useState(setting.messageTemplate);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const info = LABELS[setting.settingKey];
  const variables = VARIABLES[setting.settingKey];
  const dirty = enabled !== setting.enabled || subject !== setting.subject || text !== setting.messageTemplate;

  useEffect(() => {
    setEnabled(setting.enabled);
    setSubject(setting.subject);
    setText(setting.messageTemplate);
  }, [setting.enabled, setting.subject, setting.messageTemplate]);

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
      await onSave({ enabled, subject, messageTemplate: text });
      toast.success(`Modelo de e-mail "${info.title}" atualizado com sucesso.`);
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar o modelo de e-mail.");
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
            <h4 className="font-display font-black text-slate-900 text-sm flex items-center gap-1.5">
              {info.title}
              <Tooltip text={info.desc} />
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">{info.desc}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label={enabled ? "Desativar" : "Ativar"} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Assunto do e-mail</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={!enabled}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
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

export function EmailTemplatesEditor() {
  const { settings, loading, error, updateSetting } = useEmailSettings();

  const ordered = ORDER.map((key) => settings.find((s) => s.settingKey === key)).filter(
    (s): s is EmailSetting => !!s
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest">
          Notificações por E-mail
        </h3>
      </div>

      {loading && <p className="text-xs text-slate-400 text-center py-6">Carregando modelos de e-mail...</p>}
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

export default EmailTemplatesEditor;
