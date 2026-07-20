import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, Send, CheckCircle2, AlertTriangle, Heart, MapPin } from "lucide-react";
import { PublicForm, FormQuestion } from "../types";
import { publicFormFromApi } from "../lib/formMappers";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { LogoSVG } from "./LandingPage";

// Default brand palette used when a form has no custom theme configured.
const DEFAULT_THEME = {
  primaryColor: "#1070ca",
  accentColor: "#d43f72",
  backgroundColor: "#f8fafc",
  cardColor: "#ffffff",
  buttonColor: "#1070ca",
  headerImageUrl: "",
};

const FALLBACK_CLINIC_NAME = "Espaço Aprender a Ser";

interface PublicClinicInfo {
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
}

type LoadState = "loading" | "ready" | "invalid" | "submitted";

// Small, always-present trust signal shown above the form's own themed hero,
// on every state (loading/invalid/form/submitted). Never replaced by the
// form's custom theme — the clinic's real identity should always be visible.
function ClinicIdentityBar({ clinicInfo }: { clinicInfo: PublicClinicInfo | null }) {
  const name = clinicInfo?.name || FALLBACK_CLINIC_NAME;
  const address = clinicInfo?.address;
  const logoUrl = clinicInfo?.logoUrl;

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-2.5">
        <div className="h-8 w-8 shrink-0 rounded-full bg-white ring-1 ring-slate-100 overflow-hidden flex items-center justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Graceful fallback if the uploaded logo URL 404s or is broken.
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <LogoSVG className="h-full w-full scale-125" />
          )}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-xs font-black text-slate-800 truncate">{name}</p>
          {address && (
            <p className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-semibold truncate">
              <MapPin size={9} className="shrink-0" /> {address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Shared footer credit line — mirrors the exact copy/link used in LandingPage.tsx
// so all public-facing pages carry the same attribution.
function PublicFooterCredit({ clinicName }: { clinicName: string }) {
  return (
    <div className="mt-6 text-center space-y-1">
      <p className="text-[10px] text-slate-400 font-semibold">
        Seus dados são enviados de forma segura e utilizados exclusivamente por {clinicName} para fins clínicos.
      </p>
      <p className="text-[10px] text-slate-300 font-mono">
        Desenvolvido por{" "}
        <a
          href="https://develoi.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1070ca] hover:text-[#0b5194] font-bold transition-colors"
        >
          Develoi Soluções Digitais
        </a>
      </p>
    </div>
  );
}

// Public, unauthenticated, mobile-first form fill-out page.
// Reachable at /f/:token with no login required — this renders before any
// AuthContext/session exists, so it only ever talks to /api/public/forms/*
// and /api/public/clinic-info.
export default function PublicFormPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") || undefined;

  const [state, setState] = useState<LoadState>("loading");
  const [form, setForm] = useState<PublicForm | null>(null);
  const [clinicInfo, setClinicInfo] = useState<PublicClinicInfo | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useDocumentTitle(form?.title || "Formulário");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setState("invalid");
        return;
      }
      try {
        const res = await fetch(`/api/public/forms/${token}`);
        if (!res.ok) {
          if (!cancelled) setState("invalid");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setForm(publicFormFromApi(data));
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

  // Independent fetch — the clinic identity bar must never block or break the
  // form itself. If this fails for any reason we simply fall back to the
  // hardcoded clinic name + LogoSVG mark, exactly like before this feature existed.
  useEffect(() => {
    let cancelled = false;
    async function loadClinicInfo() {
      try {
        const res = await fetch(`/api/public/clinic-info`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setClinicInfo({
            name: data?.name || FALLBACK_CLINIC_NAME,
            logoUrl: data?.logoUrl || null,
            address: data?.address || null,
            phone: data?.phone || null,
          });
        }
      } catch {
        // Silently ignore — graceful degradation to fallback branding.
      }
    }
    loadClinicInfo();
    return () => {
      cancelled = true;
    };
  }, []);

  const theme = useMemo(() => ({ ...DEFAULT_THEME, ...(form?.theme || {}) }), [form]);
  const clinicName = clinicInfo?.name || FALLBACK_CLINIC_NAME;

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: false }));
  };

  const handleToggleCheckbox = (questionId: string, optionValue: number) => {
    setAnswers((prev) => {
      const current: number[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const exists = current.includes(optionValue);
      const next = exists ? current.filter((v) => v !== optionValue) : [...current, optionValue];
      return { ...prev, [questionId]: next };
    });
    setErrors((prev) => ({ ...prev, [questionId]: false }));
  };

  const isAnswerEmpty = (q: FormQuestion, value: any) => {
    if (value === undefined || value === null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "string") return value.trim() === "";
    return false;
  };

  const validate = (): boolean => {
    if (!form) return false;
    const nextErrors: Record<string, boolean> = {};
    let ok = true;
    for (const q of form.questions) {
      if (q.required && isAnswerEmpty(q, answers[q.id])) {
        nextErrors[q.id] = true;
        ok = false;
      }
    }
    setErrors(nextErrors);
    return ok;
  };

  const handleSubmit = async () => {
    if (!form || !token) return;
    if (!validate()) {
      const firstInvalidId = form.questions.find((q) => q.required && isAnswerEmpty(q, answers[q.id]))?.id;
      if (firstInvalidId) {
        document.getElementById(`pq-${firstInvalidId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/public/forms/${token}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, answers }),
      });
      if (!res.ok) {
        throw new Error("Falha ao enviar resposta");
      }
      setState("submitted");
    } catch {
      setSubmitError("Não foi possível enviar sua resposta agora. Verifique sua conexão e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Answered-count progress, used for the non-blocking progress bar below.
  const totalQuestions = form?.questions.length ?? 0;
  const answeredCount = useMemo(() => {
    if (!form) return 0;
    return form.questions.filter((q) => !isAnswerEmpty(q, answers[q.id])).length;
  }, [form, answers]);

  // ── Loading state ──
  if (state === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <ClinicIdentityBar clinicInfo={clinicInfo} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm font-semibold">Carregando formulário...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid/expired token ──
  if (state === "invalid") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <ClinicIdentityBar clinicInfo={clinicInfo} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-5">
              <AlertTriangle size={28} />
            </div>
            <h1 className="text-lg font-black text-slate-800 mb-2">Este link não é válido</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              O link que você acessou pode estar incorreto, expirado ou o formulário pode ter sido removido. Entre em
              contato com quem enviou este link para obter um novo.
            </p>
            <PublicFooterCredit clinicName={clinicName} />
          </div>
        </div>
      </div>
    );
  }

  // ── Thank-you / confirmation screen ──
  if (state === "submitted") {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.backgroundColor }}>
        <ClinicIdentityBar clinicInfo={clinicInfo} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div
            className="max-w-sm w-full rounded-3xl shadow-xl border border-black/5 p-8 sm:p-10 text-center"
            style={{ backgroundColor: theme.cardColor }}
          >
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: `${theme.primaryColor}1a`, color: theme.primaryColor }}
            >
              <CheckCircle2 size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-3">Obrigado! 💛</h1>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Sua resposta foi enviada com sucesso para a equipe do <strong>{clinicName}</strong>. Agradecemos muito
              pelo seu tempo e confiança — isso nos ajuda a cuidar cada vez melhor de cada criança.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
              <Heart size={12} /> {clinicName}
            </div>
            <PublicFooterCredit clinicName={clinicName} />
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  // ── Main fill-out form ──
  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      <ClinicIdentityBar clinicInfo={clinicInfo} />

      {/* Themed hero / cover — curved bottom divider softens the transition into the content card */}
      <div className="relative w-full">
        {theme.headerImageUrl ? (
          <div className="w-full h-40 sm:h-56 overflow-hidden relative">
            <img src={theme.headerImageUrl} alt="" className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)" }}
            />
          </div>
        ) : (
          <div
            className="w-full h-28 sm:h-36 relative"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.primaryColor}cc 100%)`,
            }}
          />
        )}
        {/* Curved SVG divider — replaces the hard rectangular cut-off edge */}
        <svg
          className="absolute -bottom-px left-0 w-full h-6 sm:h-8"
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,10 C25,0 75,0 100,10 L100,10 L0,10 Z" fill={theme.backgroundColor} />
        </svg>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 sm:-mt-14 pb-24 relative">
        {/* Title card */}
        <div
          className="rounded-3xl shadow-xl border border-black/5 p-6 sm:p-8 mb-6"
          style={{ backgroundColor: theme.cardColor }}
        >
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed mt-3 whitespace-pre-line">
              {form.description}
            </p>
          )}
        </div>

        {/* Progress indicator — non-blocking, reflects answered-count out of total */}
        {totalQuestions > 1 && (
          <div className="mb-5 px-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Progresso
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {answeredCount} de {totalQuestions} respondidas
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(answeredCount / totalQuestions) * 100}%`,
                  backgroundColor: theme.primaryColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {form.questions.map((q, idx) => {
            const previousSection = idx > 0 ? form.questions[idx - 1].section : undefined;
            const showSectionHeader = q.section && q.section !== previousSection;

            return (
            <React.Fragment key={q.id}>
            {showSectionHeader && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: theme.primaryColor }}>{q.section}</span>
                <div className="h-px flex-1" style={{ backgroundColor: `${theme.primaryColor}25` }} />
              </div>
            )}
            <div
              id={`pq-${q.id}`}
              className={`rounded-3xl shadow-sm border p-5 sm:p-6 transition-colors ${
                errors[q.id] ? "border-rose-300 ring-2 ring-rose-100" : "border-black/5"
              }`}
              style={{ backgroundColor: theme.cardColor }}
            >
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {idx + 1}
                </span>
                <p className="text-base font-bold text-slate-800 leading-snug pt-0.5">
                  {q.text} {q.required && <span style={{ color: theme.accentColor }}>*</span>}
                </p>
              </div>

              {q.type === "text" && (
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${theme.primaryColor}30` }}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              )}

              {q.type === "textarea" && (
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base resize-none focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${theme.primaryColor}30` }}
                  rows={4}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              )}

              {q.type === "number" && (
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${theme.primaryColor}30` }}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value === "" ? "" : Number(e.target.value))}
                />
              )}

              {q.type === "select" && (
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base focus:outline-none focus:ring-4 appearance-none"
                  style={{ ["--tw-ring-color" as any]: `${theme.primaryColor}30` }}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="" disabled>
                    Selecione uma opção...
                  </option>
                  {(q.options ?? []).map((opt, oi) => (
                    <option key={oi} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {q.type === "radio" && (
                <div className="flex flex-col gap-2.5">
                  {(q.options ?? []).map((opt, oi) => {
                    const checked = answers[q.id] === opt.value;
                    return (
                      <label
                        key={oi}
                        className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-base font-semibold cursor-pointer transition-colors"
                        style={{
                          borderColor: checked ? theme.primaryColor : "#e2e8f0",
                          backgroundColor: checked ? `${theme.primaryColor}0d` : "transparent",
                          color: checked ? theme.primaryColor : "#334155",
                        }}
                      >
                        <input
                          type="radio"
                          name={`pq-${q.id}`}
                          className="w-5 h-5 shrink-0"
                          checked={checked}
                          onChange={() => handleAnswerChange(q.id, opt.value)}
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              )}

              {q.type === "checkbox" && (
                <div className="flex flex-col gap-2.5">
                  {(q.options ?? []).map((opt, oi) => {
                    const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt.value);
                    return (
                      <label
                        key={oi}
                        className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-base font-semibold cursor-pointer transition-colors"
                        style={{
                          borderColor: checked ? theme.primaryColor : "#e2e8f0",
                          backgroundColor: checked ? `${theme.primaryColor}0d` : "transparent",
                          color: checked ? theme.primaryColor : "#334155",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 shrink-0"
                          checked={checked}
                          onChange={() => handleToggleCheckbox(q.id, opt.value)}
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              )}

              {errors[q.id] && (
                <p className="text-xs font-bold mt-2" style={{ color: theme.accentColor }}>
                  Este campo é obrigatório.
                </p>
              )}
            </div>
            </React.Fragment>
            );
          })}

          {form.questions.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10">Este formulário ainda não possui perguntas.</p>
          )}
        </div>

        {submitError && (
          <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold px-4 py-3 text-center">
            {submitError}
          </div>
        )}

        {/* Sticky submit button — mobile-first, thumb-reachable */}
        <div className="sticky bottom-4 mt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-xl transition-transform active:scale-[0.98] disabled:opacity-70"
            style={{ backgroundColor: theme.buttonColor }}
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Send size={18} /> Enviar respostas
              </>
            )}
          </button>
        </div>

        <PublicFooterCredit clinicName={clinicName} />
      </div>
    </div>
  );
}
