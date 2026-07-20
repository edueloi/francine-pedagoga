import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckSquare,
  ChevronDown,
  Copy,
  Eye,
  Hash,
  List,
  Palette,
  Plus,
  Save,
  Settings,
  Trash2,
  Type,
  AlignLeft,
  type LucideIcon,
} from "lucide-react";
import { FormOption, FormQuestion, FormTheme, InterpretationRule, QuestionType } from "../../types";
import { Button } from "../UI/Button";
import { Input, Textarea } from "../UI/Input";
import { PageHeader } from "../UI/PageHeader";

interface FormBuilderProps {
  initialData?: {
    title: string;
    description: string;
    category?: string;
    questions: FormQuestion[];
    interpretations?: InterpretationRule[];
    theme?: FormTheme;
  };
  onSave: (data: {
    title: string;
    description: string;
    category?: string;
    questions: FormQuestion[];
    interpretations?: InterpretationRule[];
    theme?: FormTheme;
  }) => void;
  onCancel: () => void;
}

type BuilderTab = "editor" | "logic" | "settings";

interface QuestionTypeMeta {
  type: QuestionType;
  label: string;
  helper: string;
  Icon: LucideIcon;
  tone: string;
}

interface ResultToneOption {
  value: string;
  label: string;
  preview: string;
}

const QUESTION_TYPES: QuestionTypeMeta[] = [
  {
    type: "text",
    label: "Texto curto",
    helper: "Resposta em uma linha.",
    Icon: Type,
    tone: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    type: "textarea",
    label: "Texto longo",
    helper: "Resposta aberta com mais detalhe.",
    Icon: AlignLeft,
    tone: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    type: "number",
    label: "Número",
    helper: "Campo numérico simples.",
    Icon: Hash,
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    type: "radio",
    label: "Múltipla escolha",
    helper: "Uma única opção.",
    Icon: List,
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    type: "checkbox",
    label: "Caixas de seleção",
    helper: "Mais de uma opção.",
    Icon: CheckSquare,
    tone: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    type: "select",
    label: "Lista suspensa",
    helper: "Menu compacto.",
    Icon: ChevronDown,
    tone: "bg-violet-50 text-violet-700 border-violet-200",
  },
];

const RESULT_TONE_OPTIONS: ResultToneOption[] = [
  { value: "bg-slate-100 text-slate-800", label: "Neutro", preview: "#e2e8f0" },
  { value: "bg-emerald-100 text-emerald-800", label: "Positivo", preview: "#bbf7d0" },
  { value: "bg-blue-100 text-blue-800", label: "Informativo", preview: "#bfdbfe" },
  { value: "bg-amber-100 text-amber-800", label: "Atenção", preview: "#fde68a" },
  { value: "bg-red-100 text-red-800", label: "Crítico", preview: "#fecaca" },
];

const PALETTE_OPTIONS = [
  {
    label: "Clínico",
    colors: ["#1070ca", "#0b5194", "#d43f72", "#ebb448", "#f8fafc", "#ffffff"],
  },
  {
    label: "Suave",
    colors: ["#4f46e5", "#7c3aed", "#64748b", "#d97706", "#f8fafc", "#ffffff"],
  },
  {
    label: "Natural",
    colors: ["#0f766e", "#166534", "#b45309", "#a16207", "#f7f7f5", "#ffffff"],
  },
  {
    label: "Terroso",
    colors: ["#7c2d12", "#92400e", "#9f1239", "#a16207", "#faf7f2", "#ffffff"],
  },
];

const DEFAULT_THEME: FormTheme = {
  primaryColor: "#1070ca",
  accentColor: "#d43f72",
  backgroundColor: "#f8fafc",
  cardColor: "#ffffff",
  buttonColor: "#1070ca",
  headerImageUrl: "",
};

function createId(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}`;
}

function usesOptions(type: QuestionType) {
  return type === "radio" || type === "checkbox" || type === "select";
}

function defaultOptions() {
  return [
    { label: "Opção 1", value: 0 },
    { label: "Opção 2", value: 0 },
  ];
}

function cloneOptions(options?: FormOption[]) {
  return (options ?? []).map((option) => ({ ...option }));
}

function getTypeMeta(type: QuestionType) {
  return QUESTION_TYPES.find((item) => item.type === type) ?? QUESTION_TYPES[0];
}

function PreviewField({ question }: { question: FormQuestion }) {
  if (question.type === "text") {
    return (
      <input
        disabled
        type="text"
        placeholder="Resposta curta"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-400"
      />
    );
  }

  if (question.type === "textarea") {
    return (
      <textarea
        disabled
        rows={3}
        placeholder="Resposta descritiva"
        className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-400"
      />
    );
  }

  if (question.type === "number") {
    return (
      <input
        disabled
        type="number"
        placeholder="0"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-400"
      />
    );
  }

  if (question.type === "select") {
    return (
      <select disabled className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">
        <option>Selecione uma opção</option>
        {(question.options ?? []).map((option, index) => (
          <option key={`${option.label}-${index}`}>{option.label || `Opção ${index + 1}`}</option>
        ))}
      </select>
    );
  }

  if (question.type === "radio") {
    return (
      <div className="space-y-2">
        {(question.options ?? []).map((option, index) => (
          <label
            key={`${option.label}-${index}`}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600"
          >
            <span className="h-4 w-4 rounded-full border border-zinc-300 bg-white" />
            {option.label || `Opção ${index + 1}`}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(question.options ?? []).map((option, index) => (
        <label
          key={`${option.label}-${index}`}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600"
        >
          <span className="h-4 w-4 rounded-md border border-zinc-300 bg-white" />
          {option.label || `Opção ${index + 1}`}
        </label>
      ))}
    </div>
  );
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ initialData, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<BuilderTab>("editor");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category] = useState(initialData?.category || "");
  const [questions, setQuestions] = useState<FormQuestion[]>(initialData?.questions || []);
  const [interpretations, setInterpretations] = useState<InterpretationRule[]>(initialData?.interpretations || []);
  const [theme, setTheme] = useState<FormTheme>(initialData?.theme || DEFAULT_THEME);
  const [selectedPalette, setSelectedPalette] = useState(PALETTE_OPTIONS[0].label);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(initialData?.questions?.[0]?.id || null);
  const [titleError, setTitleError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentPalette = useMemo(
    () => PALETTE_OPTIONS.find((palette) => palette.label === selectedPalette)?.colors ?? PALETTE_OPTIONS[0].colors,
    [selectedPalette]
  );

  const calculateMaxScore = () => {
    return questions.reduce((total, question) => {
      if ((question.type === "radio" || question.type === "select") && question.options?.length) {
        return total + Math.max(...question.options.map((option) => option.value || 0));
      }
      if (question.type === "checkbox" && question.options?.length) {
        return total + question.options.reduce((sum, option) => sum + (option.value || 0), 0);
      }
      return total;
    }, 0);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError("Título obrigatório para salvar.");
      return;
    }

    setTitleError("");
    onSave({ title, description, category, questions, interpretations, theme });
  };

  const addQuestion = (type: QuestionType = "text") => {
    const newId = createId("q_");
    const newQuestion: FormQuestion = {
      id: newId,
      type,
      text: "",
      required: false,
      options: usesOptions(type) ? defaultOptions() : undefined,
    };

    setQuestions((prev) => [...prev, newQuestion]);
    setActiveQuestionId(newId);
    setIsSidebarOpen(false);

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById(`q-${newId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  };

  const updateQuestion = (id: string, field: keyof FormQuestion, value: any) => {
    setQuestions((prev) => prev.map((question) => (question.id === id ? { ...question, [field]: value } : question)));
  };

  const changeQuestionType = (id: string, type: QuestionType) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== id) return question;
        return {
          ...question,
          type,
          options: usesOptions(type) ? (question.options?.length ? cloneOptions(question.options) : defaultOptions()) : undefined,
        };
      })
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
    if (activeQuestionId === id) {
      const nextQuestion = questions.find((question) => question.id !== id);
      setActiveQuestionId(nextQuestion?.id || null);
    }
  };

  const duplicateQuestion = (id: string) => {
    setQuestions((prev) => {
      const index = prev.findIndex((question) => question.id === id);
      if (index < 0) return prev;

      const source = prev[index];
      const duplicated: FormQuestion = {
        ...source,
        id: createId("q_"),
        text: source.text ? `${source.text} (cópia)` : "",
        options: source.options ? cloneOptions(source.options) : undefined,
      };

      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      setActiveQuestionId(duplicated.id);
      return next;
    });
  };

  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        const options = question.options ?? [];
        return {
          ...question,
          options: [...options, { label: `Opção ${options.length + 1}`, value: 0 }],
        };
      })
    );
  };

  const updateOption = (questionId: string, index: number, field: keyof FormOption, value: string | number) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId || !question.options) return question;
        const options = [...question.options];
        options[index] = { ...options[index], [field]: value };
        return { ...question, options };
      })
    );
  };

  const removeOption = (questionId: string, index: number) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId || !question.options) return question;
        return { ...question, options: question.options.filter((_, optionIndex) => optionIndex !== index) };
      })
    );
  };

  const addInterpretation = () => {
    setInterpretations((prev) => [
      ...prev,
      {
        id: createId("rule_"),
        minScore: 0,
        maxScore: 10,
        resultTitle: "",
        description: "",
        color: RESULT_TONE_OPTIONS[0].value,
      },
    ]);
  };

  const updateInterpretation = (id: string, field: keyof InterpretationRule, value: any) => {
    setInterpretations((prev) => prev.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule)));
  };

  const deleteInterpretation = (id: string) => {
    setInterpretations((prev) => prev.filter((rule) => rule.id !== id));
  };

  const activeQuestion = questions.find((question) => question.id === activeQuestionId) || null;

  const sidebar = (
    <>
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Estrutura</p>
          <h2 className="mt-1 text-lg font-black text-zinc-900">{questions.length} pergunta(s)</h2>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-500 lg:hidden"
        >
          Fechar
        </button>
      </div>

      <div className="border-b border-zinc-200 p-4">
        <Button variant="primary" fullWidth leftIcon={<Plus size={16} />} onClick={() => addQuestion()}>
          Nova pergunta
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-zinc-500">Nenhuma pergunta criada ainda.</p>
            <p className="mt-1 text-xs text-zinc-400">Comece adicionando um campo de resposta.</p>
          </div>
        ) : (
          questions.map((question, index) => {
            const typeMeta = getTypeMeta(question.type);
            const Icon = typeMeta.Icon;
            const isActive = activeQuestionId === question.id;

            return (
              <button
                key={question.id}
                onClick={() => {
                  setActiveQuestionId(question.id);
                  setIsSidebarOpen(false);
                  document.getElementById(`q-${question.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                  isActive ? "border-[#1070ca] bg-[#eff7ff]" : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-[11px] font-black text-zinc-700">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-zinc-800">{question.text || "Pergunta sem título"}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${typeMeta.tone}`}>
                        <Icon size={12} />
                        {typeMeta.label}
                      </span>
                      {question.required && (
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                          Obrigatória
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm">
      <PageHeader
        icon={<Settings size={22} />}
        title={title || "Novo formulário"}
        subtitle="Criação simples de formulários, testes e escalas"
        showBackButton
        onBackClick={onCancel}
        containerClassName="mb-0 rounded-none border-b border-zinc-200 bg-white"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1">
              {[
                { id: "editor" as const, label: "Perguntas", icon: <Settings size={14} /> },
                { id: "logic" as const, label: "Cálculo", icon: <Calculator size={14} /> },
                { id: "settings" as const, label: "Visual", icon: <Palette size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                    activeTab === tab.id ? "bg-white text-[#1070ca] shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <Button variant="primary" leftIcon={<Save size={16} />} onClick={handleSave} elevation="sm">
              Salvar formulário
            </Button>
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "editor" && (
          <div className="flex h-full min-h-0">
            {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

            <aside
              className={`fixed inset-y-0 left-0 z-40 flex w-[88%] max-w-[360px] flex-col border-r border-zinc-200 bg-white transition-transform lg:static lg:z-auto lg:w-[320px] lg:max-w-none ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
              }`}
            >
              {sidebar}
            </aside>

            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl space-y-5 pb-24">
                <div className="flex flex-wrap items-center gap-2 lg:hidden">
                  <Button variant="outline" leftIcon={<List size={16} />} onClick={() => setIsSidebarOpen(true)}>
                    Ver perguntas
                  </Button>
                  <Button variant="soft" leftIcon={<Plus size={16} />} onClick={() => addQuestion()}>
                    Nova pergunta
                  </Button>
                </div>

                <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Dados do formulário</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Informações principais</h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Defina título, categoria e descrição. Depois monte as perguntas logo abaixo.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:w-[330px] lg:grid-cols-1">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Perguntas</p>
                        <p className="mt-2 text-2xl font-black text-zinc-900">{questions.length}</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Com pontuação</p>
                        <p className="mt-2 text-2xl font-black text-zinc-900">
                          {questions.filter((question) => usesOptions(question.type)).length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Obrigatórias</p>
                        <p className="mt-2 text-2xl font-black text-zinc-900">
                          {questions.filter((question) => question.required).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Título
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => {
                        setTitle(event.target.value);
                        if (titleError) setTitleError("");
                      }}
                      placeholder="Ex.: Escala de rotina escolar"
                      className={`w-full rounded-2xl border bg-zinc-50 px-4 py-3 text-xl font-black tracking-tight text-zinc-900 outline-none transition-colors placeholder:text-zinc-300 focus:border-[#1070ca] focus:bg-white ${
                        titleError ? "border-red-300" : "border-zinc-200"
                      }`}
                    />
                    {titleError && (
                      <div className="mt-2 flex items-center gap-2 text-xs font-bold text-red-500">
                        <AlertCircle size={14} />
                        {titleError}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Uso padrão</p>
                    <p className="mt-2 text-sm font-bold text-zinc-900">
                      Neuropsicopedagogia, Pedagogia e Psicopedagogia
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      A tela não pede categoria porque esse construtor já foi pensado para esse contexto de atendimento.
                    </p>
                  </div>

                  <div className="mt-4">
                    <Textarea
                      label="Descrição"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Explique rapidamente o objetivo do formulário para quem vai responder."
                      rows={3}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Editor</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Perguntas do formulário</h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Cada pergunta fica em um card simples, fácil de revisar e ajustar.
                      </p>
                    </div>

                    <Button variant="outline" leftIcon={<Plus size={16} />} onClick={() => addQuestion()}>
                      Adicionar pergunta
                    </Button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {questions.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center">
                        <p className="text-base font-bold text-zinc-700">Nenhuma pergunta criada.</p>
                        <p className="mt-1 text-sm text-zinc-500">Use o botão acima para começar a montar o formulário.</p>
                      </div>
                    )}

                    {questions.map((question, index) => {
                      const typeMeta = getTypeMeta(question.type);
                      const isActive = activeQuestionId === question.id;
                      const previewTone = RESULT_TONE_OPTIONS.find((option) => option.value === theme.accentColor);
                      const previousSection = index > 0 ? questions[index - 1].section : undefined;
                      const showSectionHeader = question.section && question.section !== previousSection;

                      return (
                        <React.Fragment key={question.id}>
                        {showSectionHeader && (
                          <div className="flex items-center gap-3 pt-2">
                            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#1070ca]">{question.section}</span>
                            <div className="h-px flex-1 bg-[#1070ca]/15" />
                          </div>
                        )}
                        <article
                          id={`q-${question.id}`}
                          onClick={() => setActiveQuestionId(question.id)}
                          className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
                            isActive ? "border-[#1070ca] bg-[#f8fbff]" : "border-zinc-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm font-black text-zinc-700">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Pergunta {index + 1}</p>
                                  <span className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${typeMeta.tone}`}>
                                    <typeMeta.Icon size={12} />
                                    {typeMeta.label}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  leftIcon={<Copy size={14} />}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    duplicateQuestion(question.id);
                                  }}
                                >
                                  Duplicar
                                </Button>
                                <Button
                                  variant="softDanger"
                                  size="sm"
                                  leftIcon={<Trash2 size={14} />}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removeQuestion(question.id);
                                  }}
                                >
                                  Excluir
                                </Button>
                              </div>
                            </div>

                            <Input
                              label="Seção (opcional)"
                              value={question.section || ""}
                              onChange={(event) => updateQuestion(question.id, "section", event.target.value || undefined)}
                              placeholder="Ex.: Socialização, Comportamento, Crise..."
                            />
                            <p className="-mt-3 text-xs text-zinc-500">
                              Perguntas com o mesmo nome de seção aparecem agrupadas sob um cabeçalho comum.
                            </p>

                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                              <Input
                                label="Enunciado da pergunta"
                                value={question.text}
                                onChange={(event) => updateQuestion(question.id, "text", event.target.value)}
                                placeholder="Ex.: Como a criança reage em mudanças de rotina?"
                                className="font-bold"
                              />

                              <div>
                                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                  Campo obrigatório
                                </label>
                                <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                                  <button
                                    type="button"
                                    onClick={() => updateQuestion(question.id, "required", false)}
                                    className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-colors ${
                                      !question.required ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                                    }`}
                                  >
                                    Não
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateQuestion(question.id, "required", true)}
                                    className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-colors ${
                                      question.required ? "bg-white text-[#1070ca] shadow-sm" : "text-zinc-500"
                                    }`}
                                  >
                                    Sim
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                Tipo de resposta
                              </label>
                              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {QUESTION_TYPES.map((typeOption) => {
                                  const Icon = typeOption.Icon;
                                  const selected = typeOption.type === question.type;

                                  return (
                                    <button
                                      key={typeOption.type}
                                      type="button"
                                      onClick={() => changeQuestionType(question.id, typeOption.type)}
                                      className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                                        selected ? "border-[#1070ca] bg-[#eff7ff]" : "border-zinc-200 bg-zinc-50 hover:bg-white"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${typeOption.tone}`}>
                                          <Icon size={15} />
                                        </span>
                                        <div>
                                          <p className="text-sm font-bold text-zinc-800">{typeOption.label}</p>
                                          <p className="text-xs text-zinc-500">{typeOption.helper}</p>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {usesOptions(question.type) && (
                              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                  <div>
                                    <h4 className="text-base font-black text-zinc-900">Opções de resposta</h4>
                                    <p className="mt-1 text-sm text-zinc-500">
                                      Preencha o texto que o usuário verá e a pontuação usada no cálculo.
                                    </p>
                                  </div>
                                  <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => addOption(question.id)}>
                                    Adicionar opção
                                  </Button>
                                </div>

                                <div className="mt-4 space-y-3">
                                  {(question.options ?? []).map((option, optionIndex) => (
                                    <div
                                      key={`${question.id}-${optionIndex}`}
                                      className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]"
                                    >
                                      <Input
                                        label={`Opção ${optionIndex + 1}`}
                                        value={option.label}
                                        onChange={(event) => updateOption(question.id, optionIndex, "label", event.target.value)}
                                        placeholder={`Texto da opção ${optionIndex + 1}`}
                                      />
                                      <Input
                                        label="Pontuação"
                                        type="number"
                                        value={String(option.value ?? 0)}
                                        onChange={(event) =>
                                          updateOption(question.id, optionIndex, "value", Number(event.target.value || 0))
                                        }
                                      />
                                      <div className="flex items-end">
                                        <Button
                                          variant="softDanger"
                                          size="sm"
                                          fullWidth
                                          leftIcon={<Trash2 size={14} />}
                                          onClick={() => removeOption(question.id, optionIndex)}
                                        >
                                          Remover
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
                              <div className="flex items-center gap-2">
                                <Eye size={16} className="text-zinc-400" />
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Prévia simples da pergunta</p>
                              </div>
                              <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-sm font-bold text-zinc-900">
                                  {question.text || "Pergunta sem título"}{" "}
                                  {question.required && <span className="text-red-500">*</span>}
                                </p>
                                <div className="mt-3">
                                  <PreviewField question={question} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                        </React.Fragment>
                      );
                    })}

                    {questions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => addQuestion()}
                        className="w-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-6 text-center transition-colors hover:bg-white"
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-500 shadow-sm">
                          <Plus size={18} />
                        </div>
                        <p className="mt-3 text-sm font-bold text-zinc-800">Adicionar mais uma pergunta</p>
                        <p className="mt-1 text-xs text-zinc-500">Insira um novo campo sem sair da revisão atual.</p>
                      </button>
                    )}
                  </div>
                </section>
              </div>
            </main>
          </div>
        )}

        {activeTab === "logic" && (
          <div className="h-full overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-5 pb-24">
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Pontuação automática</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Regras de interpretação</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Use esta área quando o formulário precisar transformar respostas em pontuação e resultado final.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Pontuação máxima</p>
                    <p className="mt-2 text-3xl font-black text-zinc-900">{calculateMaxScore()}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-zinc-900">Faixas de resultado</h3>
                    <p className="mt-1 text-sm text-zinc-500">Defina o nome e a descrição clínica para cada intervalo de pontos.</p>
                  </div>
                  <Button variant="outline" leftIcon={<Plus size={16} />} onClick={addInterpretation}>
                    Adicionar regra
                  </Button>
                </div>

                <div className="mt-5 space-y-4">
                  {interpretations.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center">
                      <p className="text-base font-bold text-zinc-700">Nenhuma regra configurada.</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Se este formulário for apenas de coleta simples, você pode deixar essa área em branco.
                      </p>
                    </div>
                  )}

                  {interpretations.map((rule, index) => {
                    const selectedTone = RESULT_TONE_OPTIONS.find((option) => option.value === rule.color) ?? RESULT_TONE_OPTIONS[0];

                    return (
                      <article key={rule.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-zinc-700 shadow-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-black text-zinc-900">Regra {index + 1}</p>
                                <p className="text-xs text-zinc-500">Faixa de interpretação automática</p>
                              </div>
                            </div>
                            <Button
                              variant="softDanger"
                              size="sm"
                              leftIcon={<Trash2 size={14} />}
                              onClick={() => deleteInterpretation(rule.id)}
                            >
                              Excluir
                            </Button>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  label="Mínimo"
                                  type="number"
                                  value={String(rule.minScore)}
                                  onChange={(event) => updateInterpretation(rule.id, "minScore", Number(event.target.value || 0))}
                                />
                                <Input
                                  label="Máximo"
                                  type="number"
                                  value={String(rule.maxScore)}
                                  onChange={(event) => updateInterpretation(rule.id, "maxScore", Number(event.target.value || 0))}
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                  Estilo do resultado
                                </label>
                                <div className="grid gap-2">
                                  {RESULT_TONE_OPTIONS.map((tone) => (
                                    <button
                                      key={tone.value}
                                      type="button"
                                      onClick={() => updateInterpretation(rule.id, "color", tone.value)}
                                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                                        rule.color === tone.value ? "border-[#1070ca] bg-white text-zinc-900" : "border-zinc-200 bg-white text-zinc-600"
                                      }`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tone.preview }} />
                                        {tone.label}
                                      </span>
                                      {rule.color === tone.value && <span className="text-xs text-[#1070ca]">Ativo</span>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <Input
                                label="Título do resultado"
                                value={rule.resultTitle}
                                onChange={(event) => updateInterpretation(rule.id, "resultTitle", event.target.value)}
                                placeholder="Ex.: Nível moderado de estresse"
                              />
                              <Textarea
                                label="Descrição clínica"
                                rows={4}
                                value={rule.description}
                                onChange={(event) => updateInterpretation(rule.id, "description", event.target.value)}
                                placeholder="Explique o significado clínico desta faixa de pontuação."
                              />
                              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Prévia do resultado</p>
                                <div className="mt-3">
                                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${selectedTone.value}`}>
                                    {rule.resultTitle || "Resultado"}
                                  </span>
                                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                                    {rule.description || "A descrição clínica aparecerá aqui quando esta regra for preenchida."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="h-full overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-5 pb-24">
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Visual público</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Identidade do formulário</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Escolha cores sólidas e uma capa opcional. A ideia aqui é manter a experiência bonita, mas simples.
                  </p>
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div>
                    <h3 className="text-lg font-black text-zinc-900">Paletas rápidas</h3>
                    <p className="mt-1 text-sm text-zinc-500">Selecione uma base pronta e depois refine cor por cor, se quiser.</p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {PALETTE_OPTIONS.map((palette) => (
                      <button
                        key={palette.label}
                        type="button"
                        onClick={() => setSelectedPalette(palette.label)}
                        className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                          selectedPalette === palette.label ? "border-[#1070ca] bg-[#eff7ff]" : "border-zinc-200 bg-zinc-50 hover:bg-white"
                        }`}
                      >
                        <div className="flex gap-1">
                          {palette.colors.slice(0, 5).map((color) => (
                            <span key={`${palette.label}-${color}`} className="h-7 flex-1 rounded-lg" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <p className="mt-3 text-sm font-black text-zinc-900">{palette.label}</p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    {[
                      { label: "Cor principal", field: "primaryColor" as const },
                      { label: "Cor de destaque", field: "accentColor" as const },
                      { label: "Fundo da página", field: "backgroundColor" as const },
                      { label: "Fundo dos cards", field: "cardColor" as const },
                      { label: "Cor do botão", field: "buttonColor" as const },
                    ].map((colorField) => (
                      <div key={colorField.field} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-zinc-900">{colorField.label}</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                              {theme[colorField.field]}
                            </p>
                          </div>
                          <span
                            className="h-10 w-10 rounded-xl border border-white shadow-sm"
                            style={{ backgroundColor: theme[colorField.field] }}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {currentPalette.map((color) => (
                            <button
                              key={`${colorField.field}-${color}`}
                              type="button"
                              onClick={() => setTheme((prev) => ({ ...prev, [colorField.field]: color }))}
                              className={`h-8 w-8 rounded-lg border-2 transition-transform hover:scale-105 ${
                                theme[colorField.field] === color ? "border-zinc-900" : "border-white"
                              }`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Input
                      label="Imagem de capa (opcional)"
                      value={theme.headerImageUrl || ""}
                      onChange={(event) => setTheme((prev) => ({ ...prev, headerImageUrl: event.target.value }))}
                      placeholder="https://sua-imagem.com/banner.jpg"
                    />
                    <p className="mt-2 text-xs text-zinc-500">Se não houver imagem, a faixa superior usará apenas cor sólida.</p>
                  </div>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Prévia</p>
                    <h3 className="mt-2 text-lg font-black text-zinc-900">Como o público verá</h3>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-zinc-200">
                    <div style={{ backgroundColor: theme.primaryColor }}>
                      {theme.headerImageUrl ? (
                        <img src={theme.headerImageUrl} alt="" className="h-24 w-full object-cover" />
                      ) : (
                        <div className="h-24 w-full" />
                      )}
                    </div>

                    <div className="space-y-4 p-4" style={{ backgroundColor: theme.backgroundColor }}>
                      <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: theme.cardColor, borderColor: "#e4e4e7" }}>
                        <div className="inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white" style={{ backgroundColor: theme.accentColor }}>
                          Formulário
                        </div>
                        <p className="mt-3 text-lg font-black text-zinc-900">{title || "Título do formulário"}</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          {description || "A descrição do formulário aparecerá aqui para orientar quem vai responder."}
                        </p>
                      </div>

                      <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: theme.cardColor, borderColor: "#e4e4e7" }}>
                        <p className="text-sm font-bold text-zinc-900">
                          {activeQuestion?.text || "Exemplo de pergunta"} {activeQuestion?.required && <span className="text-red-500">*</span>}
                        </p>
                        <div className="mt-3">
                          <PreviewField
                            question={
                              activeQuestion || {
                                id: "preview",
                                type: "text",
                                text: "Exemplo de pergunta",
                                required: false,
                              }
                            }
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full rounded-xl px-4 py-3 text-sm font-black text-white"
                        style={{ backgroundColor: theme.buttonColor }}
                      >
                        Enviar respostas
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
