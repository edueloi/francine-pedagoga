import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  Baby,
  Brain,
  CheckCircle2,
  Heart,
  House,
  Loader2,
  MoonStar,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  type LucideIcon,
} from "lucide-react";
import { LogoSVG } from "./LandingPage";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type LoadState = "loading" | "ready" | "invalid" | "submitted";
type SectionTone = "blue" | "pink" | "yellow";

interface AnamneseField {
  key: string;
  label: string;
  helper: string;
  placeholder: string;
  rows?: number;
  span?: "full" | "half";
}

interface AnamneseSection {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  color: SectionTone;
  icon: LucideIcon;
  fieldKeys: string[];
}

interface ClinicInfo {
  name: string;
  logoUrl: string | null;
}

interface SectionPalette {
  accent: string;
  accentDark: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  helper: string;
  track: string;
  chip: string;
  chipText: string;
  glow: string;
}

const ANAMNESE_FIELDS: AnamneseField[] = [
  {
    key: "queixaPrincipal",
    label: "Queixa Principal / Motivo da Consulta de Desenvolvimento",
    helper: "Conte o que motivou a família a procurar avaliação, orientação ou acompanhamento neste momento.",
    placeholder: "Ex.: atraso na fala, dificuldade de atenção, comportamento desorganizado, adaptação escolar...",
    rows: 5,
    span: "full",
  },
  {
    key: "historiaGestacional",
    label: "História Gestacional / Parto",
    helper: "Descreva como foi a gestação, o parto, o tempo de internação e se houve qualquer intercorrência.",
    placeholder: "Ex.: gestação tranquila, parto cesárea, prematuridade, UTI neonatal, uso de medicação...",
    rows: 4,
    span: "full",
  },
  {
    key: "marcosDesenvolvimento",
    label: "Marcos de Desenvolvimento (Motor)",
    helper: "Se lembrar, conte quando sentou, engatinhou, andou e como percebeu a evolução motora.",
    placeholder: "Ex.: sentou com 7 meses, andou com 1 ano e 4 meses, apresenta tropeços frequentes...",
    rows: 4,
    span: "half",
  },
  {
    key: "linguagem",
    label: "Linguagem e Comunicação",
    helper: "Fale sobre fala, compreensão, troca social, pedidos, ecolalia, leitura ou escrita, se houver.",
    placeholder: "Ex.: fala frases curtas, entende comandos simples, dificuldade para manter diálogo...",
    rows: 4,
    span: "half",
  },
  {
    key: "sono",
    label: "Rotina de Sono",
    helper: "Como costuma dormir, se desperta à noite, precisa de ajuda para adormecer ou tem sono agitado.",
    placeholder: "Ex.: dorme tarde, acorda várias vezes, precisa de colo, ronca, tem pesadelos...",
    rows: 4,
    span: "half",
  },
  {
    key: "alimentacaoSeletividade",
    label: "Alimentação e Seletividade",
    helper: "Conte como é a rotina alimentar, recusas, preferências, texturas ou dificuldades nas refeições.",
    placeholder: "Ex.: come poucos alimentos, rejeita texturas, prefere alimentos secos, mastiga pouco...",
    rows: 4,
    span: "half",
  },
  {
    key: "controleEsfincteriano",
    label: "Controle Esfincteriano",
    helper: "Se já houve desfralde, como foi o processo e se existem escapes, medo ou resistência.",
    placeholder: "Ex.: desfraldou de dia, usa fralda à noite, ainda pede para ir ao banheiro...",
    rows: 4,
    span: "half",
  },
  {
    key: "historicoMedico",
    label: "Histórico Médico",
    helper: "Inclua diagnósticos, exames, crises, alergias, cirurgias, internações ou acompanhamentos médicos.",
    placeholder: "Ex.: bronquite, TEA em investigação, alergia alimentar, cirurgia, uso de óculos...",
    rows: 4,
    span: "full",
  },
  {
    key: "medicamentos",
    label: "Medicamentos de Uso Contínuo",
    helper: "Liste remédios, vitaminas, suplementos ou tratamentos contínuos, se houver.",
    placeholder: "Ex.: usa melatonina, anticonvulsivante, suplemento vitamínico...",
    rows: 4,
    span: "half",
  },
  {
    key: "terapiasAtuais",
    label: "Terapias Atuais",
    helper: "Informe atendimentos em andamento, frequência e se existe integração com escola ou outros profissionais.",
    placeholder: "Ex.: fonoaudiologia 2x por semana, terapia ocupacional, psicologia...",
    rows: 4,
    span: "half",
  },
  {
    key: "comportamentoCasa",
    label: "Comportamento em Casa",
    helper: "Descreva humor, rotina, frustrações, autonomia, convivência com familiares e manejo das emoções.",
    placeholder: "Ex.: irrita-se com mudanças, precisa de ajuda para tarefas, é carinhoso, isola-se...",
    rows: 4,
    span: "half",
  },
  {
    key: "comportamentoEscola",
    label: "Comportamento na Escola",
    helper: "Se possível, relate adaptação, socialização, atenção, aprendizagem e observações da escola.",
    placeholder: "Ex.: dificuldade para permanecer sentado, evita atividades, gosta da professora...",
    rows: 4,
    span: "half",
  },
  {
    key: "interessesHiperfocos",
    label: "Interesses / Hiperfocos",
    helper: "Quais temas, brincadeiras, objetos ou assuntos mais chamam a atenção da criança no dia a dia.",
    placeholder: "Ex.: letras, dinossauros, mapas, carrinhos, desenhos específicos, números...",
    rows: 4,
    span: "half",
  },
  {
    key: "sensibilidadesSensoriais",
    label: "Sensibilidade Sensorial",
    helper: "Conte se há incômodo com sons, cheiros, texturas, luz, etiquetas, cortes de cabelo ou toque.",
    placeholder: "Ex.: tapa os ouvidos, recusa roupas, evita areia, busca balanço, morde objetos...",
    rows: 4,
    span: "half",
  },
  {
    key: "pontosFortes",
    label: "Pontos Fortes",
    helper: "Compartilhe habilidades, facilidades, interesses positivos e tudo o que a família admira na criança.",
    placeholder: "Ex.: carinhoso, criativo, observador, aprende rápido com imagens, ótimo vocabulário...",
    rows: 4,
    span: "half",
  },
  {
    key: "principaisDificuldades",
    label: "Principais Dificuldades",
    helper: "Liste os desafios que mais impactam a rotina, a escola, a convivência ou a aprendizagem.",
    placeholder: "Ex.: aceitar limites, iniciar tarefas, falar sobre sentimentos, lidar com transições...",
    rows: 4,
    span: "half",
  },
  {
    key: "objetivosFamilia",
    label: "Objetivos Principais da Família",
    helper: "O que a família espera conquistar com o acompanhamento? Quais mudanças seriam mais importantes agora?",
    placeholder: "Ex.: melhorar comunicação, ampliar autonomia, organizar rotina, apoiar alfabetização...",
    rows: 5,
    span: "full",
  },
];

const FIELD_MAP = Object.fromEntries(ANAMNESE_FIELDS.map((field) => [field.key, field])) as Record<string, AnamneseField>;

const ANAMNESE_SECTIONS: AnamneseSection[] = [
  {
    id: "acolhimento",
    eyebrow: "Primeiro olhar",
    title: "Acolhimento inicial",
    description: "Começamos entendendo o que trouxe a família até aqui e quais objetivos fazem mais sentido neste momento.",
    color: "yellow",
    icon: Heart,
    fieldKeys: ["queixaPrincipal", "pontosFortes", "objetivosFamilia"],
  },
  {
    id: "desenvolvimento",
    eyebrow: "Linha do tempo",
    title: "Gestação e desenvolvimento",
    description: "Essas respostas ajudam a montar a história de desenvolvimento desde a gestação até os primeiros marcos da infância.",
    color: "blue",
    icon: Baby,
    fieldKeys: ["historiaGestacional", "marcosDesenvolvimento", "linguagem", "controleEsfincteriano"],
  },
  {
    id: "rotina",
    eyebrow: "Regulação",
    title: "Rotina e autorregulação",
    description: "Aqui entram sono, alimentação, interesses e sensibilidades que influenciam diretamente o dia a dia da criança.",
    color: "pink",
    icon: MoonStar,
    fieldKeys: ["sono", "alimentacaoSeletividade", "interessesHiperfocos", "sensibilidadesSensoriais"],
  },
  {
    id: "ambientes",
    eyebrow: "Casa e escola",
    title: "Vivência nos ambientes",
    description: "Comportamento, convivência e desafios em casa e na escola revelam como a criança responde aos diferentes contextos.",
    color: "pink",
    icon: House,
    fieldKeys: ["comportamentoCasa", "comportamentoEscola", "principaisDificuldades"],
  },
  {
    id: "saude",
    eyebrow: "Rede de cuidado",
    title: "Saúde e acompanhamentos",
    description: "Fechamos com informações clínicas e terapêuticas para integrar a anamnese com a rede de apoio já existente.",
    color: "blue",
    icon: Stethoscope,
    fieldKeys: ["historicoMedico", "medicamentos", "terapiasAtuais"],
  },
];

const SECTION_STYLES: Record<SectionTone, SectionPalette> = {
  blue: {
    accent: "#1070ca",
    accentDark: "#0b5194",
    surface: "#eef6ff",
    surfaceSoft: "#fbfdff",
    border: "rgba(16, 112, 202, 0.16)",
    helper: "#5677a2",
    track: "#dbeafe",
    chip: "#eff7ff",
    chipText: "#0b5194",
    glow: "rgba(16, 112, 202, 0.18)",
  },
  pink: {
    accent: "#d43f72",
    accentDark: "#a12b53",
    surface: "#fff1f6",
    surfaceSoft: "#fffafc",
    border: "rgba(212, 63, 114, 0.14)",
    helper: "#9a4b67",
    track: "#f8d7e4",
    chip: "#fff1f6",
    chipText: "#a12b53",
    glow: "rgba(212, 63, 114, 0.16)",
  },
  yellow: {
    accent: "#ebb448",
    accentDark: "#b8852c",
    surface: "#fff7e5",
    surfaceSoft: "#fffdf8",
    border: "rgba(235, 180, 72, 0.18)",
    helper: "#9d7a33",
    track: "#f6e2b5",
    chip: "#fff7e5",
    chipText: "#946819",
    glow: "rgba(235, 180, 72, 0.22)",
  },
};

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

function PublicFooterCredit({ clinicName }: { clinicName: string }) {
  return (
    <div className="mt-7 space-y-1 text-center">
      <p className="text-[11px] font-semibold text-slate-500">
        Seus dados são enviados com segurança e utilizados exclusivamente por {clinicName} para fins clínicos.
      </p>
      <p className="text-[10px] font-mono text-slate-400">
        Desenvolvido por{" "}
        <a
          href="https://develoi.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[#1070ca] transition-colors hover:text-[#0b5194]"
        >
          Develoi Soluções Digitais
        </a>
      </p>
    </div>
  );
}

export default function PublicAnamnesePage() {
  const { token } = useParams<{ token: string }>();

  const [state, setState] = useState<LoadState>("loading");
  const [patientName, setPatientName] = useState("");
  const [clinic, setClinic] = useState<ClinicInfo>(DEFAULT_CLINIC);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useDocumentTitle("Anamnese da Família");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/public/clinic-info")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setClinic({ name: data.name || DEFAULT_CLINIC.name, logoUrl: data.logoUrl || null });
        }
      })
      .catch(() => {
        // Keep fallback clinic identity silently.
      });

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
        const res = await fetch(`/api/public/anamnese/${token}`);
        if (!res.ok) {
          if (!cancelled) setState("invalid");
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setPatientName(data.patientName || "");
          if (data.existingAnamnese) {
            setValues(data.existingAnamnese);
          }
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

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!token) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/public/anamnese/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.");
        }
        throw new Error("Falha ao enviar anamnese");
      }

      setState("submitted");
    } catch (err: any) {
      setSubmitError(
        err?.message === "Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente."
          ? err.message
          : "Não foi possível enviar suas respostas agora. Verifique sua conexão e tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = patientName ? patientName.split(" ")[0] : "";
  const clinicName = clinic.name || DEFAULT_CLINIC.name;
  const totalQuestions = ANAMNESE_FIELDS.length;

  const answeredCount = useMemo(
    () =>
      ANAMNESE_FIELDS.filter((field) => {
        const currentValue = typeof values[field.key] === "string" ? values[field.key] : "";
        return currentValue.trim().length > 0;
      }).length,
    [values]
  );

  const completionPercent = Math.max(6, Math.round((answeredCount / totalQuestions) * 100));

  const sectionSummaries = useMemo(
    () =>
      ANAMNESE_SECTIONS.map((section) => {
        const fields = section.fieldKeys.map((key) => FIELD_MAP[key]);
        const answered = fields.filter((field) => {
          const currentValue = typeof values[field.key] === "string" ? values[field.key] : "";
          return currentValue.trim().length > 0;
        }).length;

        return {
          ...section,
          fields,
          answered,
          total: fields.length,
        };
      }),
    [values]
  );

  if (state === "loading") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] px-4 py-6">
        <BackgroundOrbs />
        <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl flex-col items-center justify-center gap-6">
          <ClinicIdentityBar clinic={clinic} className="mx-auto" />
          <div className="w-full rounded-[2rem] border border-white/80 bg-white/92 p-8 text-center shadow-[0_35px_120px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-[#1070ca]/10 text-[#1070ca]">
              <Loader2 size={34} className="animate-spin" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-black tracking-tight text-slate-900">Preparando a anamnese</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Estamos carregando o formulário para que a família possa preencher com calma e segurança.
            </p>
          </div>
        </div>
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
              O link pode estar incorreto, expirado ou ter sido removido. Entre em contato com a clínica para receber
              um novo acesso.
            </p>
            <PublicFooterCredit clinicName={clinicName} />
          </div>
        </div>
      </div>
    );
  }

  if (state === "submitted") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] px-4 py-6">
        <BackgroundOrbs />
        <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col items-center justify-center gap-6">
          <ClinicIdentityBar clinic={clinic} className="mx-auto" />
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_40px_140px_-65px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="bg-[linear-gradient(135deg,#0b5194_0%,#1070ca_38%,#d43f72_100%)] px-7 py-8 text-white">
              <div className="flex items-center gap-3 text-[#fff6da]">
                <Heart size={18} />
                <span className="text-[11px] font-black uppercase tracking-[0.24em]">Recebido com carinho</span>
              </div>
              <h1 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight">
                Obrigado por concluir a anamnese.
              </h1>
            </div>

            <div className="p-7 sm:p-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1070ca]/10 text-[#1070ca] shadow-[0_20px_45px_-28px_rgba(16,112,202,0.45)]">
                <CheckCircle2 size={42} />
              </div>
              <p className="mt-6 text-center text-sm leading-7 text-slate-600 sm:text-base">
                As informações {firstName ? `de ${firstName}` : "da criança"} foram enviadas com sucesso para a equipe
                do <strong>{clinicName}</strong>. Cada detalhe compartilhado ajuda a construir um cuidado mais preciso,
                acolhedor e individualizado.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-[#1070ca]/10 bg-[#eff7ff] px-4 py-4 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1070ca]">Sigilo</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">As respostas seguem para uso clínico da equipe.</p>
                </div>
                <div className="rounded-[1.4rem] border border-[#d43f72]/10 bg-[#fff1f6] px-4 py-4 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d43f72]">Atualização</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Se necessário, este mesmo link pode ser usado depois.</p>
                </div>
                <div className="rounded-[1.4rem] border border-[#ebb448]/15 bg-[#fff7e5] px-4 py-4 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#b8852c]">Cuidado</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">A clínica avaliará as respostas antes do atendimento.</p>
                </div>
              </div>

              <PublicFooterCredit clinicName={clinicName} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0b5194_0%,#1070ca_38%,#1677c5_52%,#d43f72_100%)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 top-0 h-44 w-44 rounded-full bg-[#ebb448]/35 blur-3xl" />
          <div className="absolute left-[-4rem] top-20 h-64 w-64 rounded-full bg-white/12 blur-3xl" />
          <div className="absolute bottom-[-5rem] right-[18%] h-56 w-56 rounded-full bg-[#d43f72]/24 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
          <ClinicIdentityBar clinic={clinic} className="mx-auto lg:mx-0" />

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-white/92 backdrop-blur-sm">
                <Sparkles size={14} className="text-[#fff0bf]" />
                Anamnese de desenvolvimento
              </span>

              <h1 className="mt-5 font-display text-4xl font-black leading-[0.96] tracking-tight text-white sm:text-5xl">
                Uma ficha mais acolhedora, clara e bonita para conhecer melhor {firstName ? `${firstName}` : "a criança"}.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
                Este formulário organiza história, rotina, saúde e objetivos da família em blocos mais simples de
                preencher. Responda no seu tempo e envie quando sentir que o retrato ficou completo.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 font-semibold text-white/95 backdrop-blur-sm">
                  <ShieldCheck size={16} className="text-[#fff0bf]" />
                  Informações para uso clínico
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 font-semibold text-white/95 backdrop-blur-sm">
                  <Brain size={16} className="text-[#ffd4e2]" />
                  Estrutura pensada para desenvolvimento infantil
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 font-semibold text-white/95 backdrop-blur-sm">
                  <Target size={16} className="text-[#dff0ff]" />
                  Atualizável pelo mesmo link
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">Mapa da anamnese</p>
              <div className="mt-5 flex flex-wrap justify-center gap-4">
                {sectionSummaries.map((section) => {
                  const palette = SECTION_STYLES[section.color];
                  const Icon = section.icon;

                  return (
                    <div key={section.id} className="flex w-[92px] flex-col items-center gap-2 text-center">
                      <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[5px] border-white bg-white/95 shadow-lg shadow-slate-900/15">
                        <div
                          className="flex h-full w-full items-center justify-center rounded-full"
                          style={{ backgroundColor: palette.accent }}
                        >
                          <Icon size={22} className="text-white" />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold leading-4 text-white/92">{section.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto -mt-14 max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-[0_35px_120px_-60px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-7">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#1070ca]">Boas-vindas</p>
              <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-slate-900">
                Olá! Vamos completar a anamnese {firstName ? `de ${firstName}` : "da criança"}.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Você não precisa escrever tudo de forma técnica. O mais importante é registrar o que a família observa
                na prática. Se preferir, responda primeiro os pontos essenciais e depois volte para complementar com
                calma.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.4rem] border border-[#1070ca]/10 bg-[#eff7ff] px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1070ca]">Progresso geral</p>
                <p className="mt-2 font-display text-3xl font-black text-[#0b5194]">{answeredCount}</p>
                <p className="text-sm font-semibold text-slate-600">de {totalQuestions} campos com resposta</p>
              </div>
              <div className="rounded-[1.4rem] border border-[#d43f72]/10 bg-[#fff1f6] px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d43f72]">Leitura guiada</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  A ficha está dividida por blocos para deixar o preenchimento mais leve.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[#ebb448]/15 bg-[#fff7e5] px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#b8852c]">Mesma página</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Depois de enviar, este link continua servindo para revisar ou atualizar.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Andamento</span>
              <span className="text-sm font-semibold text-slate-500">{answeredCount} de 17 respondidos</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ebb448_0%,#1070ca_55%,#d43f72_100%)] transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {sectionSummaries.map((section) => {
              const palette = SECTION_STYLES[section.color];
              return (
                <div
                  key={section.id}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: palette.chip,
                    color: palette.chipText,
                    borderColor: palette.border,
                  }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette.accent }} />
                  {section.title} · {section.answered}/{section.total}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {sectionSummaries.map((section) => {
            const palette = SECTION_STYLES[section.color];
            const Icon = section.icon;

            return (
              <section
                key={section.id}
                className="relative overflow-hidden rounded-[1.8rem] border p-4 sm:p-5 lg:p-6"
                style={{
                  background: `linear-gradient(145deg, ${palette.surface} 0%, ${palette.surfaceSoft} 48%, #ffffff 100%)`,
                  borderColor: palette.border,
                  boxShadow: `0 28px 90px -58px ${palette.glow}`,
                }}
              >
                <div
                  className="absolute inset-x-8 top-0 h-px opacity-85"
                  style={{ background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)` }}
                />
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: palette.glow }} />

                <div className="relative">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <span
                        className="inline-flex rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white"
                        style={{ backgroundColor: palette.accent }}
                      >
                        {section.eyebrow}
                      </span>

                      <div className="mt-4 flex items-start gap-4">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.3rem] bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]"
                          style={{ color: palette.accent }}
                        >
                          <Icon size={24} />
                        </div>
                        <div>
                          <h3 className="font-display text-2xl font-black tracking-tight text-slate-900">{section.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{section.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/85 bg-white/78 px-4 py-3 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: palette.accentDark }}>
                        Progresso da seção
                      </p>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="font-display text-3xl font-black leading-none" style={{ color: palette.accentDark }}>
                          {section.answered}
                        </span>
                        <span className="pb-1 text-sm font-semibold text-slate-500">de {section.total}</span>
                      </div>
                      <div className="mt-3 h-2 w-32 overflow-hidden rounded-full" style={{ backgroundColor: palette.track }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(8, Math.round((section.answered / section.total) * 100))}%`,
                            backgroundColor: palette.accent,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {section.fields.map((field) => {
                      const currentValue = typeof values[field.key] === "string" ? values[field.key] : "";
                      const isAnswered = currentValue.trim().length > 0;
                      const fieldNumber = ANAMNESE_FIELDS.findIndex((item) => item.key === field.key) + 1;

                      return (
                        <div
                          key={field.key}
                          className="rounded-[1.5rem] border bg-white/86 p-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.55)] sm:p-5"
                          style={{ borderColor: palette.border }}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex items-start gap-3">
                                <span
                                  className="flex h-8 min-w-8 items-center justify-center rounded-full text-[11px] font-black"
                                  style={{ backgroundColor: palette.chip, color: palette.accentDark }}
                                >
                                  {String(fieldNumber).padStart(2, "0")}
                                </span>
                                <div>
                                  <label htmlFor={`af-${field.key}`} className="block text-base font-black leading-snug text-slate-900">
                                    {field.label}
                                  </label>
                                  <p className="mt-2 text-sm leading-6" style={{ color: palette.helper }}>
                                    {field.helper}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <span
                              className="inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                              style={{
                                backgroundColor: isAnswered ? palette.chip : "#f8fafc",
                                color: isAnswered ? palette.accentDark : "#94a3b8",
                              }}
                            >
                              {isAnswered ? "Respondido" : "Opcional"}
                            </span>
                          </div>

                          <textarea
                            id={`af-${field.key}`}
                            rows={field.rows ?? 4}
                            className="mt-4 min-h-[132px] w-full resize-y rounded-[1.2rem] border bg-white px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 sm:text-base"
                            style={{
                              borderColor: isAnswered ? palette.border : "#d8e0ea",
                              ["--tw-ring-color" as any]: palette.glow,
                            }}
                            value={currentValue}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {submitError && (
          <div className="mt-5 rounded-[1.6rem] border border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm font-semibold text-rose-600">
            {submitError}
          </div>
        )}

        <div className="sticky bottom-3 mt-6">
          <div className="rounded-[1.5rem] border border-white/85 bg-white/94 p-2.5 shadow-[0_26px_70px_-50px_rgba(15,23,42,0.42)] backdrop-blur-xl">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
              <div className="px-2 py-1">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#1070ca]">Pronto para enviar</p>
                <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  Você preencheu {answeredCount} de {totalQuestions} campos. Revise o que quiser e envie quando estiver
                  confortável.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-[1.15rem] px-5 py-3 text-sm font-black text-white shadow-[0_22px_55px_-34px_rgba(16,112,202,0.52)] transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:min-w-[210px]"
                style={{ background: "linear-gradient(135deg, #1070ca 0%, #0b5194 42%, #d43f72 100%)" }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar respostas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <PublicFooterCredit clinicName={clinicName} />
      </div>
    </div>
  );
}
