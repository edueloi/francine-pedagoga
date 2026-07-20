import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Heart, Loader2, Send } from "lucide-react";
import { LogoSVG } from "./LandingPage";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type LoadState = "loading" | "ready" | "invalid" | "submitted";

interface ClinicInfo {
  name: string;
  logoUrl: string | null;
}

const DEFAULT_CLINIC: ClinicInfo = { name: "Espaço Aprender a Ser", logoUrl: null };

function BackgroundOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-14 top-12 h-52 w-52 rounded-full bg-[#1070ca]/10 blur-3xl" />
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#ebb448]/15 blur-3xl" />
      <div className="absolute bottom-0 right-[12%] h-64 w-64 rounded-full bg-[#d43f72]/10 blur-3xl" />
    </div>
  );
}

function ClinicIdentityBar({ clinic, className = "" }: { clinic: ClinicInfo; className?: string }) {
  return (
    <div
      className={`inline-flex max-w-full items-center gap-3 rounded-full border border-white/55 bg-white/88 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur-md ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-100 shrink-0">
        {clinic.logoUrl ? (
          <img src={clinic.logoUrl} alt={clinic.name} className="h-full w-full object-cover" />
        ) : (
          <LogoSVG className="h-full w-full scale-110" />
        )}
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Espaço clínico</p>
        <p className="truncate text-sm font-black text-slate-800">{clinic.name}</p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-3 text-sm border border-slate-200 rounded-xl bg-white/90 outline-none transition focus:ring-2 focus:ring-[#1070ca]/20 focus:border-[#1070ca]";
const labelClass = "text-xs font-bold text-slate-600";

interface FieldsState {
  nome: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  responsavel: string;
  responsavelParentesco: string;
  escola: string;
  anoSerie: string;
  professor: string;
  coordenador: string;
}

const EMPTY_FIELDS: FieldsState = {
  nome: "",
  dataNascimento: "",
  telefone: "",
  email: "",
  responsavel: "",
  responsavelParentesco: "",
  escola: "",
  anoSerie: "",
  professor: "",
  coordenador: "",
};

export default function PublicCadastroPage() {
  const { token } = useParams<{ token: string }>();
  useDocumentTitle("Atualização de Cadastro");

  const [state, setState] = useState<LoadState>("loading");
  const [clinic, setClinic] = useState<ClinicInfo>(DEFAULT_CLINIC);
  const [fields, setFields] = useState<FieldsState>(EMPTY_FIELDS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/clinic-info")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setClinic({ name: data.name || DEFAULT_CLINIC.name, logoUrl: data.logoUrl || null });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setState("invalid");
        return;
      }
      try {
        const res = await fetch(`/api/public/cadastro/${token}`);
        if (!res.ok) {
          if (!cancelled) setState("invalid");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setFields({ ...EMPTY_FIELDS, ...data.fields });
          setState("ready");
        }
      } catch {
        if (!cancelled) setState("invalid");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const updateField = (key: keyof FieldsState, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/public/cadastro/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível salvar as informações.");
      setState("submitted");
    } catch (err: any) {
      setSubmitError(err.message || "Não foi possível salvar as informações. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] px-4 py-6 flex items-center justify-center">
        <BackgroundOrbs />
        <Loader2 className="h-7 w-7 text-slate-300 animate-spin relative" />
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] px-4 py-6">
        <BackgroundOrbs />
        <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl flex-col items-center justify-center gap-6">
          <ClinicIdentityBar clinic={clinic} className="mx-auto" />
          <div className="w-full rounded-[2rem] border border-white/80 bg-white/94 p-8 text-center shadow-[0_35px_120px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={34} />
            </div>
            <h1 className="mt-5 font-display text-2xl font-black tracking-tight text-slate-900">Este link não está disponível</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              O link pode estar incorreto ou ter sido removido. Entre em contato com a clínica para receber um novo acesso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "submitted") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] px-4 py-6">
        <BackgroundOrbs />
        <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl flex-col items-center justify-center gap-6">
          <ClinicIdentityBar clinic={clinic} className="mx-auto" />
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_40px_140px_-65px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="bg-[linear-gradient(135deg,#0b5194_0%,#1070ca_38%,#d43f72_100%)] px-7 py-8 text-white">
              <div className="flex items-center gap-3 text-[#fff6da]">
                <Heart size={18} />
                <span className="text-[11px] font-black uppercase tracking-[0.24em]">Recebido com carinho</span>
              </div>
              <h1 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight">
                Cadastro atualizado com sucesso.
              </h1>
            </div>
            <div className="p-7 sm:p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1070ca]/10 text-[#1070ca] shadow-[0_20px_45px_-28px_rgba(16,112,202,0.45)]">
                <CheckCircle2 size={42} />
              </div>
              <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base">
                As informações foram atualizadas no prontuário junto à equipe do <strong>{clinic.name}</strong>. Você
                pode reabrir este mesmo link mais tarde para atualizar novamente, se precisar.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] px-4 py-6">
      <BackgroundOrbs />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6 py-6">
        <ClinicIdentityBar clinic={clinic} />

        <div className="w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_35px_120px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="bg-[linear-gradient(135deg,#0b5194_0%,#1070ca_38%,#d43f72_100%)] px-7 py-7 text-white">
            <div className="flex items-center gap-2 text-[#fff6da]">
              <Heart size={16} />
              <span className="text-[11px] font-black uppercase tracking-[0.24em]">Atualização de cadastro</span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              Vamos manter os dados em dia.
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/85">
              Confira e complete as informações abaixo. Você pode deixar em branco o que não souber agora.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Dados da criança</p>
              <div className="space-y-1.5">
                <label className={labelClass}>Nome completo</label>
                <input value={fields.nome} onChange={(e) => updateField("nome", e.target.value)} className={inputClass} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Data de nascimento</label>
                  <input type="date" value={fields.dataNascimento} onChange={(e) => updateField("dataNascimento", e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Telefone</label>
                  <input value={fields.telefone} onChange={(e) => updateField("telefone", e.target.value)} className={inputClass} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>E-mail de contato</label>
                <input type="email" value={fields.email} onChange={(e) => updateField("email", e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Escola</p>
              <div className="space-y-1.5">
                <label className={labelClass}>Instituição de ensino</label>
                <input value={fields.escola} onChange={(e) => updateField("escola", e.target.value)} className={inputClass} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Ano / série escolar</label>
                  <input value={fields.anoSerie} onChange={(e) => updateField("anoSerie", e.target.value)} className={inputClass} placeholder="Ex: 2º ano" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Professor(a)</label>
                  <input value={fields.professor} onChange={(e) => updateField("professor", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Coordenador(a) pedagógico(a)</label>
                <input value={fields.coordenador} onChange={(e) => updateField("coordenador", e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Responsável</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Nome do responsável</label>
                  <input value={fields.responsavel} onChange={(e) => updateField("responsavel", e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Grau de parentesco</label>
                  <input value={fields.responsavelParentesco} onChange={(e) => updateField("responsavelParentesco", e.target.value)} className={inputClass} placeholder="Ex: Mãe, Pai, Avó" />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded-xl font-medium leading-relaxed">
                ⚠️ {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-slate-900 hover:bg-[#1070ca] text-white rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md shadow-slate-900/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Salvar Informações
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
