import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Calendar,
  FileText,
  AlertTriangle,
  Gift,
  Zap,
  ShieldAlert,
  BarChart3,
  PlusCircle,
  TrendingUp,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
  Heart,
  CheckCircle2,
  Cake,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkle,
  Search,
  Send,
  Play,
  Pause,
  RotateCcw,
  ClipboardCopy,
  Download,
  ClipboardCheck,
  BookOpen,
  HeartHandshake,
  Smile,
  Timer,
  Lightbulb,
  FileEdit,
  Flame,
  Check,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Patient, Session, Insurance, UserRole } from "../types";
import { ConfirmModal, useToast } from "./UI";

interface DashboardProps {
  patients: Patient[];
  sessions: Session[];
  insurances: Insurance[];
  userName: string;
  userRole: UserRole;
  onNavigate: (tab: string) => void;
  onSelectPatient: (patientId: string) => void;
}

// Preset expert clinical strategies for the AI Copilot
const CLINICAL_KNOWLEDGE_BASE = [
  {
    keywords: ["ecolalia", "fala", "comunicação", "linguagem", "autismo", "tea"],
    title: "🗣️ Manejo Clínico da Ecolalia no Transtorno do Espectro Autista",
    category: "Linguagem & Comunicação",
    summary: "Como modelar falas funcionais e redirecionar ecolalias imediatas ou tardias.",
    content: `### 1. Evite Perguntas Diretas em Excesso
Muitas crianças repetem a pergunta porque não sabem como formular a resposta. Em vez de perguntar *"Você quer água?"*, faça a modelagem direta: *"Quero água"*, com a entonação correta, permitindo que a criança repita funcionalmente.

### 2. Interrupção, Validação e Redirecionamento (IVR)
Se a criança repetir uma frase de desenho fora de contexto (ecolalia tardia):
* **Valide**: *"Ah, você lembrou do dinossauro!"*.
* **Redirecione**: Traga-a para a atividade física atual. *"Olha, agora o dinossauro vai pular na caixa de areia sensorial!"*.

### 3. Apoio Visual de Ancoragem (PECS/Fichas)
Utilize cartões de comunicação com figuras para ancorar a fala. O estímulo visual permanece disponível, enquanto o estímulo sonoro some rapidamente, reduzindo a sobrecarga cognitiva.`
  },
  {
    keywords: ["seletividade", "alimentação", "comida", "alimentar", "recusa", "textura"],
    title: "🍏 Abordagem Sensorial na Seletividade Alimentar Severa",
    category: "Integração Sensorial",
    summary: "Abordagem baseada na dessensibilização progressiva sem pressões.",
    content: `### 1. Dessensibilização Sistemática (Aproximações Progressivas)
Nunca force a ingestão. Siga os 6 passos da hierarquia alimentar:
1. **Tolerar**: O alimento fica no prato ou mesa sem causar crises.
2. **Interagir**: Lavar, descascar, carimbar ou brincar de alimentar um boneco.
3. **Cheirar**: Explorar o aroma de forma lúdica.
4. **Tocar**: Sentir com os dedos, mãos, queixo e lábios.
5. **Provar**: lamber ou tocar com a ponta da língua.
6. **Mastigar/Engolir**: Fase final de aceitação.

### 2. Pareamento de Atributos (Sensory Food Pairing)
Se a criança aceita apenas batata frita industrializada (crocante, salgada, amarela):
* Comece introduzindo salgadinho de milho assado amarelo (mantém textura e cor).
* Transicione para chips de cenoura desidratada bem crocante.
* Depois, cenoura assada no forno com textura crocante por fora.

### 3. Brincar de Comer (Food Play)
Retire o alimento do contexto de refeição estressante. Realize oficinas lúdicas de carimbos com legumes ou misturas táteis de purê e corante comestível na mesa de luz.`
  },
  {
    keywords: ["tdah", "hiperatividade", "atenção", "foco", "concentração", "impulso"],
    title: "🧠 Estratégias de Autorregulação para TDAH Infantil",
    category: "Intervenção Cognitivo-Comportamental",
    summary: "Técnicas estruturais para manter o foco e reduzir a agitação psicomotora.",
    content: `### 1. Intervalos Ativos (Brain Breaks)
Para manter o foco cognitivo de uma criança com TDAH, utilize a técnica de amortecimento psicomotor:
* **Estrutura**: A cada 12 a 15 minutos de esforço cognitivo focado na mesa, conceda **2 minutos de descarga motora ativa** (pular 10 vezes na cama elástica, dar uma volta completa segurando uma bola suíça pesada, ou rastejar em túnel de tecido).

### 2. Instruções de Comando Único (Task Chunking)
Evite orientações longas como *"Abra o caderno, pegue o lápis azul e faça a primeira linha"*.
Diga apenas: *"Abra o caderno na folha branca"*. Espere a conclusão.
Então diga: *"Pegue o giz azul"*. Isso elimina a falha de memória de trabalho.

### 3. Estímulos Ambientais Controlados
Reduza a poluição visual na mesa terapêutica. Mantenha apenas o material específico daquela micro-tarefa. Utilize almofadas de assento sensoriais (como discos de equilíbrio infláveis) para permitir micro-movimentos que estimulam o foco cortical.`
  },
  {
    keywords: ["pei", "plano", "metas", "objetivos", "como fazer", "criterio", "smart"],
    title: "🎯 Como Estruturar Metas Clínicas Eficazes no P.E.I.",
    category: "Planejamento Pedagógico",
    summary: "Roteiro de criação de objetivos de aprendizagem e desenvolvimento mensuráveis.",
    content: `### 1. O Critério SMART Aplicado à Terapia
Toda meta de Plano de Ensino Individualizado (P.E.I.) deve ser altamente específica e rastreável.
* **Inadequado**: *"O paciente vai melhorar o comportamento em sala de aula"*.
* **Adequado**: *"O paciente permanecerá sentado em atividades acadêmicas de mesa por até 8 minutos seguidos, necessitando de no máximo 2 lembretes gestuais leves, em 4 de 5 sessões consecutivas"*.

### 2. Análise de Tarefas (Task Analysis)
Sempre fragmente a habilidade alvo em sub-passos lógicos. Por exemplo, para ensinar a lavar as mãos de forma independente, a meta é dividida em: abrir a torneira -> pegar o sabonete -> esfregar as palmas -> enxaguar -> fechar a torneira -> secar. Avalie cada passo individualmente.

### 3. Planejamento do Esvanecimento de Suporte
Toda meta deve ditar de que forma o terapeuta irá retirar a ajuda física, visual ou verbal:
1. **Ajuda Física Total** -> 2. **Ajuda Física Parcial** -> 3. **Ajuda Gestual/Apontamento** -> 4. **Apoio Visual** -> 5. **Independência Completa**.`
  }
];

export default function Dashboard({
  patients,
  sessions,
  insurances,
  userName,
  userRole,
  onNavigate,
  onSelectPatient
}: DashboardProps) {
  const toast = useToast();

  // Filters state
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>("Todos");
  const [selectedInsurance, setSelectedInsurance] = useState<string>("Todos");

  // Get dynamic unique diagnostics lists and convenios lists for filter dropdowns
  const uniqueDiagnostics = ["Todos", "TEA (Autismo)", "TDAH", "Dislexia", "Atraso Global"];
  const uniqueInsurances = ["Todos", ...Array.from(new Set(patients.map(p => p.convenio)))];

  // Apply real-time dashboard filters to patients list
  const filteredPatients = patients.filter(p => {
    // Diagnosis Filter
    let diagMatch = true;
    if (selectedDiagnosis !== "Todos") {
      const pDiag = p.diagnostico.toLowerCase();
      if (selectedDiagnosis === "TEA (Autismo)") {
        diagMatch = pDiag.includes("tea") || pDiag.includes("autismo") || pDiag.includes("espectro");
      } else if (selectedDiagnosis === "TDAH") {
        diagMatch = pDiag.includes("tdah") || pDiag.includes("hiperatividade") || pDiag.includes("atenção");
      } else if (selectedDiagnosis === "Dislexia") {
        diagMatch = pDiag.includes("dislexia");
      } else if (selectedDiagnosis === "Atraso Global") {
        diagMatch = pDiag.includes("atraso") || pDiag.includes("global") || pDiag.includes("desenvolvimento");
      }
    }

    // Insurance Filter
    let insMatch = true;
    if (selectedInsurance !== "Todos") {
      insMatch = p.convenio === selectedInsurance;
    }

    return diagMatch && insMatch;
  });

  // Calculate statistics based on filtered patients list
  const totalPatients = filteredPatients.length;
  const activePatients = filteredPatients.filter(p => p.status === "Ativo").length;
  const pausedPatients = filteredPatients.filter(p => p.status === "Pausado").length;

  // Real-time birthdays from the filtered list (patients born in July or June - local time July 2026)
  // Let's check birthdays for July (getMonth() === 6)
  const birthdaysThisMonth = filteredPatients.filter(p => {
    const dob = new Date(p.dataNascimento);
    return dob.getMonth() === 6; // July
  });

  // Expiring insurances / guides linked to filtered patients
  const filteredPatientIds = new Set(filteredPatients.map(p => p.id));
  const expiringGuides = insurances.filter(ins => {
    if (ins.patientId && !filteredPatientIds.has(ins.patientId)) return false;
    
    const validDate = new Date(ins.validade);
    const limitDate = new Date("2026-07-31");
    const sessionRatio = ins.sessoesUtilizadas / ins.sessoesAutorizadas;
    return validDate <= limitDate || sessionRatio >= 0.8;
  });

  // Diagnostics breakdown for PieChart
  const diagnosisCounts: Record<string, number> = {};
  filteredPatients.forEach(p => {
    let diag = p.diagnostico;
    if (diag.toLowerCase().includes("tea") || diag.toLowerCase().includes("autismo")) {
      diag = "TEA (Autismo)";
    } else if (diag.toLowerCase().includes("tdah")) {
      diag = "TDAH";
    } else if (diag.toLowerCase().includes("dislexia")) {
      diag = "Dislexia";
    } else if (diag.toLowerCase().includes("atraso")) {
      diag = "Atraso Global";
    } else {
      diag = "Outros";
    }
    diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1;
  });

  const pieData = Object.keys(diagnosisCounts).map(name => ({
    name,
    value: diagnosisCounts[name]
  }));

  const COLORS = ["#1070ca", "#d43f72", "#ebb448", "#ec4899", "#8b5cf6"];

  // Age group distribution for BarChart
  const ageGroups = {
    "0-4 anos": 0,
    "5-6 anos": 0,
    "7-8 anos": 0,
    "9+ anos": 0
  };
  filteredPatients.forEach(p => {
    if (p.idade <= 4) ageGroups["0-4 anos"]++;
    else if (p.idade <= 6) ageGroups["5-6 anos"]++;
    else if (p.idade <= 8) ageGroups["7-8 anos"]++;
    else ageGroups["9+ anos"]++;
  });

  const barData = Object.keys(ageGroups).map(group => ({
    faixa: group,
    quantidade: ageGroups[group as keyof typeof ageGroups]
  }));

  const sessionsCount = sessions.length;

  // Active Session Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [sessionPhase, setSessionPhase] = useState<"focus" | "play" | "cooldown">("focus");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clinical phases definitions based on standard child therapy models
  // Target: 50 minute sessions (3000 seconds total)
  // Phase 1: 0 to 30 mins (1800s) -> Focus / Regulation
  // Phase 2: 30 to 40 mins (2400s) -> Play / Reinforcement
  // Phase 3: 40 to 50 mins (3000s) -> Cooldown / Family Talk
  const totalSessionLengthSeconds = 3000; 

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          const nextSec = prev + 1;
          // Determine current phase based on seconds
          if (nextSec < 1800) {
            setSessionPhase("focus");
          } else if (nextSec >= 1800 && nextSec < 2400) {
            setSessionPhase("play");
          } else if (nextSec >= 2400) {
            setSessionPhase("cooldown");
          }
          return nextSec;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive]);

  const handleToggleTimer = () => setTimerActive(!timerActive);
  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
    setSessionPhase("focus");
  };

  const formatTimerTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ":" : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerProgressPercent = () => {
    return Math.min((timerSeconds / totalSessionLengthSeconds) * 100, 100);
  };

  // Clinical Helper / AI Copilot State
  const [searchQuery, setSearchQuery] = useState("");
  const [helperResult, setHelperResult] = useState<typeof CLINICAL_KNOWLEDGE_BASE[0] | null>(CLINICAL_KNOWLEDGE_BASE[0]);
  const [copiedAdvice, setCopiedAdvice] = useState(false);

  const handleSearchHelper = (query: string) => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return;

    // Search inside preset knowledge base
    const matched = CLINICAL_KNOWLEDGE_BASE.find(k => 
      k.keywords.some(kw => cleanQuery.includes(kw)) ||
      k.title.toLowerCase().includes(cleanQuery) ||
      k.category.toLowerCase().includes(cleanQuery)
    );

    if (matched) {
      setHelperResult(matched);
    } else {
      // Build a smart default clinical response if no exact preset matches
      setHelperResult({
        keywords: [cleanQuery],
        title: `💡 Estratégias de Estimulação de Desenvolvimento Infantil`,
        category: "Dica Clínica Geral",
        summary: `Planejamento de rotina e regulação adaptada para: "${query}".`,
        content: `### 🎯 Abordagem de Intervenção para "${query}"
Com base nos padrões da Clínica Integrada de Desenvolvimento Infantil:

1. **Acolhimento Sensorial Inicial**
   Antes de exigir foco do paciente, garanta que seu nível de alerta esteja regulado. Use balanços, redes sensoriais, ou compressão proprioceptiva leve na sala Snoezelen para abaixar o limiar de agitação.

2. **Roteiro Visual Antecipatório (Teoria da Mente / Autismo)**
   Sempre apresente a sequência de atividades com cards de velcro na parede. Crianças sentem-se mais seguras sabendo exatamente qual será a transição. Exemplo: *Brincadeira 1* -> *Atividade de Mesa* -> *Brinquedo Especial* -> *Tchau*.

3. **Esvanecimento de Prompts**
   Sempre inicie com o suporte necessário para o sucesso terapêutico, mas planeje a retirada gradual da ajuda verbal e física na mesma sessão para induzir a autonomia.`
      });
    }
  };

  const handleCopyAdvice = () => {
    if (!helperResult) return;
    const textToCopy = `${helperResult.title}\nCategoria: ${helperResult.category}\n\n${helperResult.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAdvice(true);
    setTimeout(() => setCopiedAdvice(false), 2000);
  };

  // Quick Notes Clipboard State (Persistent with LocalStorage)
  const [scratchpadText, setScratchpadText] = useState(() => {
    return localStorage.getItem("clinician_scratchpad") || "";
  });
  const [copiedScratchpad, setCopiedScratchpad] = useState(false);
  const [confirmClearNotesOpen, setConfirmClearNotesOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("clinician_scratchpad", scratchpadText);
  }, [scratchpadText]);

  const handleAddTemplate = (type: "aba" | "snoezelen" | "pei") => {
    const timestamp = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    let textToAdd = "";
    if (type === "aba") {
      textToAdd = `\n--- REGISTRO DE EVOLUÇÃO ABA [${timestamp}] ---\n• Paciente:\n• Nível de Atenção Compartilhada (1 a 5):\n• Reforçador Utilizado:\n• Comportamentos disruptivos observados:\n• Resposta aos prompts aplicados:\n• Planejamento para a próxima sessão:\n`;
    } else if (type === "snoezelen") {
      textToAdd = `\n--- ROTEIRO SENSORIAL SNOEZELEN [${timestamp}] ---\n• Estímulos Ativados (Luzes, Som, Vibração):\n• Estado de Alerta Inicial (Agitado / Apático):\n• Tolerância tátil observada:\n• Resposta à cabana de fibra óptica:\n• Tempo de autorregulação alcançado:\n`;
    } else if (type === "pei") {
      textToAdd = `\n--- DIAGNÓSTICO METAS P.E.I. [${timestamp}] ---\n• Domínio (Comunicação / Motor / AVD):\n• Meta Específica:\n• Nível de ajuda requerido hoje:\n• Desempenho geral (% de acertos):\n• Ajuste de metas sugerido:\n`;
    }
    setScratchpadText(prev => prev + textToAdd);
  };

  const handleDownloadScratchpad = () => {
    const blob = new Blob([scratchpadText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rascunho_clinico_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyScratchpad = () => {
    navigator.clipboard.writeText(scratchpadText);
    setCopiedScratchpad(true);
    setTimeout(() => setCopiedScratchpad(false), 2000);
  };

  const handleResetScratchpad = () => {
    setConfirmClearNotesOpen(true);
  };

  const handleConfirmClearNotes = () => {
    setScratchpadText("");
    setConfirmClearNotesOpen(false);
    toast.success("Notas rápidas limpas com sucesso.");
  };

  // Simulated Live Activity Stream (Timeline Feed)
  const [liveTimeline] = useState([
    {
      id: "ev-1",
      title: "Nova Evolução Cadastrada",
      time: "Há 12 min",
      desc: "Francine registrou evolução ABA de Lucas Silva.",
      icon: "✍️",
      color: "bg-blue-50 text-blue-700"
    },
    {
      id: "ev-2",
      title: "Meta do PEI Atingida",
      time: "Há 1 hora",
      desc: "Arthur Medeiros atingiu nível Generalizado em Coordenação Fina.",
      icon: "🎯",
      color: "bg-emerald-50 text-emerald-700"
    },
    {
      id: "ev-3",
      title: "Agendamento Confirmado",
      time: "Há 3 horas",
      desc: "Luciana Fonseca confirmou triagem de Beatriz Costa para amanhã às 14h.",
      icon: "📅",
      color: "bg-amber-50 text-amber-700"
    },
    {
      id: "ev-4",
      title: "Alinhamento Pedagógico",
      time: "Ontem",
      desc: "Enviado roteiro de orientação escolar de Davi Oliveira.",
      icon: "🏫",
      color: "bg-indigo-50 text-indigo-700"
    }
  ]);

  return (
    <div id="dashboard-tab" className="space-y-8 animate-fade-in pb-12 select-none">
      
      {/* Clinic Logo Branding Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#1070ca] flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/10 shrink-0">
            <Heart className="h-6 w-6 fill-white/10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-base sm:text-lg tracking-tight block text-slate-900 leading-none">APRENDER A SER®</span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-full font-mono border border-rose-100">PRO-EDITION</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase block mt-1.5 font-mono">Clínica Integrada de Desenvolvimento Infantil</span>
          </div>
        </div>
        
        {/* Dynamic Interactive Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Diagnosis Filter */}
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Filtrar por Diagnóstico</span>
            <select
              value={selectedDiagnosis}
              onChange={(e) => setSelectedDiagnosis(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-3xs"
            >
              {uniqueDiagnostics.map((diag, index) => (
                <option key={index} value={diag}>{diag}</option>
              ))}
            </select>
          </div>

          {/* Insurance Filter */}
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Filtrar por Convênio</span>
            <select
              value={selectedInsurance}
              onChange={(e) => setSelectedInsurance(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-3xs"
            >
              {uniqueInsurances.map((ins, index) => (
                <option key={index} value={ins}>{ins}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(selectedDiagnosis !== "Todos" || selectedInsurance !== "Todos") && (
            <button
              onClick={() => {
                setSelectedDiagnosis("Todos");
                setSelectedInsurance("Todos");
              }}
              className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              Limpar
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-100/80 px-3 py-2 mt-4 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono font-black uppercase text-slate-500 tracking-wider">Tatuí Conectado</span>
          </div>
        </div>
      </div>

      {/* Welcome Banner - Masterly Designed with soft ambient mesh background and clean details */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-slate-950 p-6 sm:p-8 text-white shadow-xl">
        {/* Soft atmospheric gradient highlights */}
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -bottom-10 left-20 h-[150px] w-[150px] rounded-full bg-[#d43f72]/15 blur-2xl" />
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-black tracking-widest uppercase border border-white/10 font-mono">
              <Sparkle className="h-3.5 w-3.5 text-[#ebb448] fill-[#ebb448]/20 animate-spin-slow" /> Central de Inteligência Multidisciplinar
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight leading-none text-white">
              Olá, {userName}!
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
              Acompanhe o desenvolvimento neurológico e motor das crianças sob sua responsabilidade. Hoje é <span className="text-white font-semibold underline decoration-blue-400 decoration-2">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <span className="text-[10px] bg-white/5 font-black px-3 py-1.5 rounded-xl border border-white/10 font-mono tracking-wider text-slate-200 uppercase">
                ⚙️ PERFIL: {userRole}
              </span>
              <span className="text-[10px] bg-white/5 font-black px-3 py-1.5 rounded-xl border border-white/10 font-mono tracking-wider text-slate-200 uppercase">
                🏢 SEDE: TATUÍ CENTRAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 shrink-0 w-full md:w-auto">
            <div className="h-12 w-12 rounded-2xl bg-[#1070ca] flex items-center justify-center font-black text-white text-base">
              {userName.charAt(0)}
            </div>
            <div>
              <p className="text-[9px] font-black tracking-wider uppercase text-slate-400 font-mono">Terapeuta Logada</p>
              <p className="text-xs font-bold text-white mt-0.5">{userName}</p>
              <span className="inline-block text-[8px] font-black uppercase tracking-widest text-[#ebb448] mt-1">Supervisora Clínica</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Section - Highly refined style with subtle vertical indicator bars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Active Patients */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-2xs relative overflow-hidden group hover:shadow-sm transition duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1070ca] rounded-l-full" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-mono">Pacientes Filtrados</span>
              <h3 className="text-3xl font-display font-black text-slate-900 leading-none">
                {activePatients} <span className="text-xs font-normal text-slate-400">/ {totalPatients}</span>
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1070ca]" />
                <span>{pausedPatients} suspensos</span>
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-50 text-[#1070ca] flex items-center justify-center group-hover:scale-105 transition shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Evoluções */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-2xs relative overflow-hidden group hover:shadow-sm transition duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#d43f72] rounded-l-full" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-mono">Evoluções Totais</span>
              <h3 className="text-3xl font-display font-black text-slate-900 leading-none">
                {sessionsCount}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold font-mono">
                <ArrowUpRight className="h-3.5 w-3.5" /> +14 esta semana
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-rose-50 text-[#d43f72] flex items-center justify-center group-hover:scale-105 transition shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Birthdays */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-2xs relative overflow-hidden group hover:shadow-sm transition duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ebb448] rounded-l-full" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-mono">Aniversariantes</span>
              <h3 className="text-3xl font-display font-black text-slate-900 leading-none">
                {birthdaysThisMonth.length}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-[#ebb448] font-bold">
                <Cake className="h-3.5 w-3.5" /> Mês de Julho (Corrente)
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-50 text-[#ebb448] flex items-center justify-center group-hover:scale-105 transition shrink-0">
              <Gift className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Insurances */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-2xs relative overflow-hidden group hover:shadow-sm transition duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-full" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-mono">Guias Críticas</span>
              <h3 className="text-3xl font-display font-black text-rose-600 leading-none">
                {expiringGuides.length}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold font-mono">
                <ArrowDownRight className="h-3.5 w-3.5" /> Atenção / Limites atingidos
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-red-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Active Session Helper Bar & Timer (Clinical Operational Support) */}
      <div className="bg-white border border-slate-100 p-6 rounded-[2.2rem] shadow-2xs grid md:grid-cols-12 gap-6 items-center">
        
        {/* Stopwatch Visual Widget */}
        <div className="md:col-span-4 flex items-center gap-4 border-r border-slate-100 pr-4">
          <div className="relative h-18 w-18 flex items-center justify-center shrink-0">
            {/* SVG Progress Circle Background */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="36"
                cy="36"
                r="32"
                stroke="#f1f5f9"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="36"
                cy="36"
                r="32"
                stroke={
                  sessionPhase === "focus" 
                    ? "#1070ca" 
                    : sessionPhase === "play" 
                      ? "#ebb448" 
                      : "#d43f72"
                }
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - getTimerProgressPercent() / 100)}`}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <Timer className={`h-6 w-6 relative z-10 ${timerActive ? "animate-pulse text-[#1070ca]" : "text-slate-400"}`} />
          </div>

          <div className="space-y-1">
            <span className="text-[8px] font-black font-mono uppercase tracking-widest text-slate-400 block">Tempo de Sessão Clínico</span>
            <span className="text-2xl font-display font-black text-slate-900 block font-mono">
              {formatTimerTime(timerSeconds)}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={handleToggleTimer}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                {timerActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {timerActive ? "Pausar" : "Iniciar"}
              </button>
              <button
                onClick={handleResetTimer}
                className="p-1 text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
                title="Resetar tempo"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Adaptive Pediatric Protocol Guideline Indicator */}
        <div className="md:col-span-8 grid grid-cols-3 gap-3">
          {/* Phase 1: Cognitive Focus */}
          <div className={`p-3 rounded-2xl border transition-all ${
            sessionPhase === "focus" 
              ? "bg-blue-50/50 border-blue-200/50 text-[#1070ca] shadow-3xs" 
              : "bg-slate-50/40 border-transparent text-slate-400 opacity-60"
          }`}>
            <span className="text-[8px] font-black uppercase tracking-wider font-mono block">Fase 1 (0-30m)</span>
            <span className="text-xs font-black block mt-1 text-slate-800">Foco Cognitivo ABA</span>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Estímulo estruturado e metas do PEI.</p>
          </div>

          {/* Phase 2: Reinforcement Play */}
          <div className={`p-3 rounded-2xl border transition-all ${
            sessionPhase === "play" 
              ? "bg-amber-50/50 border-amber-200/50 text-[#ebb448] shadow-3xs" 
              : "bg-slate-50/40 border-transparent text-slate-400 opacity-60"
          }`}>
            <span className="text-[8px] font-black uppercase tracking-wider font-mono block">Fase 2 (30-40m)</span>
            <span className="text-xs font-black block mt-1 text-slate-800">Lúdico / Reforço</span>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Livre escolha guiada e reforçadores.</p>
          </div>

          {/* Phase 3: Cooldown / Parent Feedback */}
          <div className={`p-3 rounded-2xl border transition-all ${
            sessionPhase === "cooldown" 
              ? "bg-rose-50/50 border-rose-200/50 text-[#d43f72] shadow-3xs" 
              : "bg-slate-50/40 border-transparent text-slate-400 opacity-60"
          }`}>
            <span className="text-[8px] font-black uppercase tracking-wider font-mono block">Fase 3 (40-50m)</span>
            <span className="text-xs font-black block mt-1 text-slate-800">Sensorial / Feedback</span>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Descompressão Snoezelen e pais.</p>
          </div>
        </div>

      </div>

      {/* Bento Layout Row: AI Copilot & Scratchpad Notes & Live Notification Centre */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Container: Clinical AI Helper & Strategies */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[2.2rem] border border-slate-100 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-blue-50 text-[#1070ca]"><Lightbulb className="h-4 w-4" /></span> Copiloto Clínico Integrado
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-1">Biblioteca de estratégias e intervenções rápidas</p>
              </div>
              <span className="text-[8px] font-black bg-blue-50 text-[#1070ca] border border-blue-100 px-2.5 py-1 rounded-full font-mono uppercase tracking-widest">Base de Conhecimento</span>
            </div>

            {/* Smart Helper Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Busque por 'ecolalia', 'seletividade', 'tdah', 'pei'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchHelper(searchQuery)}
                className="w-full pl-10 pr-12 py-3 bg-slate-50 text-xs border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400 font-medium"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                onClick={() => handleSearchHelper(searchQuery)}
                className="p-1.5 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-xl absolute right-2 top-2 transition cursor-pointer"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>

            {/* Smart Prompts Shortcuts */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setSearchQuery("ecolalia"); handleSearchHelper("ecolalia"); }}
                className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer font-mono"
              >
                💬 Ecolalia
              </button>
              <button
                onClick={() => { setSearchQuery("seletividade"); handleSearchHelper("seletividade"); }}
                className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer font-mono"
              >
                🍏 Seletividade
              </button>
              <button
                onClick={() => { setSearchQuery("tdah"); handleSearchHelper("tdah"); }}
                className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer font-mono"
              >
                🧠 TDAH/Foco
              </button>
              <button
                onClick={() => { setSearchQuery("pei"); handleSearchHelper("pei"); }}
                className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer font-mono"
              >
                🎯 Metas PEI
              </button>
            </div>

            {/* Smart Response Output Card */}
            <AnimatePresence mode="wait">
              {helperResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-[1.8rem] space-y-3.5 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="px-2 py-0.5 bg-blue-100 text-[#1070ca] text-[8px] font-black font-mono rounded uppercase tracking-wider">
                        {helperResult.category}
                      </span>
                      <h4 className="font-display font-black text-slate-900 text-xs sm:text-sm leading-tight mt-1">
                        {helperResult.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">
                        {helperResult.summary}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyAdvice}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200/50 text-slate-500 hover:text-slate-900 rounded-xl transition cursor-pointer shadow-3xs shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase font-mono"
                    >
                      {copiedAdvice ? <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                      {copiedAdvice ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  
                  {/* Styled markdown-like body */}
                  <div className="text-[11px] text-slate-600 leading-relaxed font-medium space-y-2 whitespace-pre-line max-h-52 overflow-y-auto pr-1">
                    {helperResult.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-2">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">
              💡 As dicas clínicas do copiloto são pautadas em evidências científicas de Análise do Comportamento Aplicada (ABA).
            </p>
          </div>
        </div>

        {/* Right Container: Clinician Scratchpad Clipboard (Local Persistence) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-[2.2rem] border border-slate-100 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-50 text-[#ebb448]"><FileEdit className="h-4 w-4" /></span> Bloco de Notas Clínicas
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-1">Rascunho de sessão com preenchimento rápido</p>
              </div>
              <button
                onClick={handleResetScratchpad}
                className="text-[9px] text-slate-400 hover:text-rose-600 transition-colors font-mono font-black uppercase"
              >
                Limpar
              </button>
            </div>

            {/* Quick Templates Injection Button Row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleAddTemplate("aba")}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1070ca] text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer font-mono"
              >
                + Template ABA
              </button>
              <button
                onClick={() => handleAddTemplate("snoezelen")}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#ebb448] text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer font-mono"
              >
                + Snoezelen
              </button>
              <button
                onClick={() => handleAddTemplate("pei")}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer font-mono"
              >
                + Metas PEI
              </button>
            </div>

            {/* Note Area */}
            <div className="flex-1 min-h-48 flex flex-col">
              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Escreva aqui suas anotações temporárias da sessão ativa... (Os dados permanecem salvos localmente mesmo se fechar o navegador!)"
                className="w-full flex-1 p-3.5 bg-slate-50 text-[11px] font-medium border border-slate-200/80 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-sans placeholder-slate-400/80 leading-relaxed"
              />
            </div>
          </div>

          {/* Note Controls */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              onClick={handleDownloadScratchpad}
              disabled={!scratchpadText.trim()}
              className={`p-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition font-mono flex items-center gap-1.5 cursor-pointer shadow-3xs ${!scratchpadText.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Download className="h-3.5 w-3.5" /> Baixar .TXT
            </button>
            <button
              onClick={handleCopyScratchpad}
              disabled={!scratchpadText.trim()}
              className={`p-2 px-3 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition font-mono flex items-center gap-1.5 cursor-pointer shadow-3xs ${!scratchpadText.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {copiedScratchpad ? <ClipboardCheck className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
              {copiedScratchpad ? "Copiado!" : "Copiar Tudo"}
            </button>
          </div>
        </div>

      </div>

      {/* Modern Bento Grid: Clinical Alerts vs Birthdays vs Live Clinic Timeline */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left column: Critical Alerts Board */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-[2.2rem] border border-slate-100 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle className="h-4 w-4" /></span> Alertas e Pendências Clínicas
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-1">Sinalizações automáticas de conformidade</p>
            </div>
            <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full border border-rose-100 uppercase font-mono">Crítico</span>
          </div>

          <div className="space-y-4">
            {/* Alert 1: expiring insurances */}
            {expiringGuides.length > 0 ? (
              expiringGuides.map((ins, idx) => {
                const remaining = ins.sessoesAutorizadas - ins.sessoesUtilizadas;
                return (
                  <div key={idx} className="flex gap-4 bg-amber-50/40 border border-amber-200/40 p-4.5 rounded-[1.5rem] text-xs text-amber-950 transition hover:bg-amber-50/80">
                    <div className="h-10 w-10 rounded-xl bg-amber-100/50 text-amber-700 flex items-center justify-center text-sm shrink-0">
                      📅
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="font-black leading-none text-slate-800">Convênio Expirando: {ins.nome}</p>
                        <span className="text-[8px] font-black uppercase font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Guia</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        A autorização de n° <strong>{ins.numeroGuia}</strong> de <strong>{ins.patientNome || "Paciente"}</strong> encerra em {new Date(ins.validade).toLocaleDateString('pt-BR')}. Restam apenas <strong>{remaining} sessões</strong> de terapia integrada.
                      </p>
                      <button
                        onClick={() => onNavigate("convenios")}
                        className="text-[10px] font-black text-[#1070ca] hover:text-[#0b5194] underline flex items-center gap-0.5 transition cursor-pointer font-mono"
                      >
                        Solicitar Renovação de Guia Administrativa →
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-3 bg-emerald-50/40 border border-emerald-100 p-4.5 rounded-[1.5rem] text-xs text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="font-medium">Nenhuma guia administrativa de convênio expirando no momento para os pacientes selecionados.</p>
              </div>
            )}

            {/* Alert 2: Clinical alert */}
            <div className="flex gap-4 bg-blue-50/40 border border-blue-100 p-4.5 rounded-[1.5rem] text-xs text-blue-950 transition hover:bg-blue-50/80">
              <div className="h-10 w-10 rounded-xl bg-blue-100/50 text-blue-700 flex items-center justify-center shrink-0">
                🧠
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="font-black leading-none text-slate-800">Avaliação Escolar de Rotina</p>
                  <span className="text-[8px] font-black uppercase font-mono bg-blue-100 text-[#1070ca] px-1.5 py-0.5 rounded">Clínico</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  O paciente <strong>Lucas Silva</strong> acumulou 15 sessões sem visita de alinhamento com a equipe pedagógica. Recomenda-se preencher roteiro de mediação escolar.
                </p>
                <button
                  onClick={() => onNavigate("school-family")}
                  className="text-[10px] font-black text-[#1070ca] hover:text-[#0b5194] underline flex items-center gap-0.5 transition cursor-pointer font-mono"
                >
                  Modelos de Relatório de Visita →
                </button>
              </div>
            </div>

            {/* Alert 3: PEI Renewal alert */}
            <div className="flex gap-4 bg-purple-50/40 border border-purple-100 p-4.5 rounded-[1.5rem] text-xs text-purple-950 transition hover:bg-purple-50/80">
              <div className="h-10 w-10 rounded-xl bg-purple-100/50 text-purple-700 flex items-center justify-center shrink-0">
                🧩
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="font-black leading-none text-slate-800">P.E.I. Próximo do Prazo de Revisão</p>
                  <span className="text-[8px] font-black uppercase font-mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">PEI</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  As metas estipuladas no Plano de Ensino Individualizado (P.E.I.) do paciente <strong>Arthur Medeiros</strong> expiram na próxima semana. É sugerida a revisão dos estímulos e níveis de suporte aplicados.
                </p>
                <button
                  onClick={() => onNavigate("pei")}
                  className="text-[10px] font-black text-[#1070ca] hover:text-[#0b5194] underline flex items-center gap-0.5 transition cursor-pointer font-mono"
                >
                  Gerenciar Objetivos do PEI →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Birthdays Feed & Quick Live Timeline */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Birthdays Card */}
          <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-pink-50 text-pink-600"><Cake className="h-4 w-4" /></span> Aniversários de Julho
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-1">Fortalecimento do vínculo acolhedor</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
            </div>

            {birthdaysThisMonth.length > 0 ? (
              <div className="space-y-3">
                {birthdaysThisMonth.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-pink-50/10 hover:bg-pink-50/20 border border-pink-100/50 rounded-2xl transition duration-200">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-display font-black text-xs">
                        {p.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-none">{p.nome.split(" ")[0]} {p.nome.split(" ").slice(-1)[0]}</p>
                        <p className="text-[9px] text-pink-700 mt-1.5 font-bold bg-pink-100/40 px-2 py-0.5 rounded-md inline-block font-mono">
                          Fará {p.idade} anos em {new Date(p.dataNascimento).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSelectPatient(p.id);
                        onNavigate("patients");
                      }}
                      className="p-1.5 rounded-lg bg-white hover:bg-pink-100 text-pink-700 border border-pink-100/60 transition cursor-pointer font-bold text-[10px] flex items-center gap-1 shadow-2xs hover:scale-105 shrink-0"
                    >
                      Acessar <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">Nenhum paciente aniversaria este mês.</p>
            )}
          </div>

          {/* Live Timeline Card */}
          <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-[#1070ca]" /> Atividades Recentes do Painel
                </h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase font-mono">Log operacional em tempo real</p>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-3.5">
              {liveTimeline.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${item.color} text-sm font-semibold`}>
                    {item.icon}
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-slate-800 truncate leading-none">{item.title}</p>
                      <span className="text-[8px] font-medium text-slate-400 shrink-0 font-mono">{item.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Recharts Graphics Panel - Styled into clean visual cards */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Diagnosis Distribution Pie/Donut Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.2rem] border border-slate-100 shadow-2xs space-y-4">
          <div>
            <h4 className="font-display font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
              📊 Distribuição por Diagnóstico Clínico
            </h4>
            <p className="text-xs text-slate-400 font-medium font-sans mt-1">Mapeamento de pacientes na base de neurodesenvolvimento ativo.</p>
          </div>
          
          <div className="h-64 relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(15, 23, 42, 0.95)", 
                      border: "none", 
                      borderRadius: "12px", 
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "bold",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value) => [`${value} paciente(s)`, "Total"]} 
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center" 
                    iconType="circle"
                    wrapperStyle={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Nenhum dado de diagnóstico para os filtros aplicados.
              </div>
            )}

            {/* Custom Central Absolute Badge inside Donut */}
            {pieData.length > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-10px]">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none font-mono">Total Geral</p>
                <p className="text-2xl font-display font-black text-slate-800 mt-1">{filteredPatients.length}</p>
                <p className="text-[8px] text-emerald-600 font-extrabold uppercase leading-none mt-0.5">Prontuários</p>
              </div>
            )}
          </div>
        </div>

        {/* Age Groups Bar Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.2rem] border border-slate-100 shadow-2xs space-y-4">
          <div>
            <h4 className="font-display font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
              📈 Pacientes por Faixa Etária
            </h4>
            <p className="text-xs text-slate-400 font-medium font-sans mt-1">Divisão demográfica para adequação de roteiros pedagógicos e psicomotores.</p>
          </div>
          
          <div className="h-64">
            {filteredPatients.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="faixa" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(16, 112, 202, 0.05)" }}
                    contentStyle={{ 
                      background: "rgba(15, 23, 42, 0.95)", 
                      border: "none", 
                      borderRadius: "12px", 
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "bold",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                    formatter={(value) => [`${value} paciente(s)`, "Total"]} 
                  />
                  <Bar dataKey="quantidade" fill="#1070ca" radius={[8, 8, 0, 0]} maxBarSize={45}>
                    {barData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? "#1070ca" : "#d43f72"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Nenhum dado demográfico para os filtros aplicados.
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmClearNotesOpen}
        onClose={() => setConfirmClearNotesOpen(false)}
        onConfirm={handleConfirmClearNotes}
        title="Limpar notas rápidas?"
        message="Suas notas rápidas de atendimento serão apagadas. Esta ação não pode ser desfeita."
        confirmLabel="Limpar"
        cancelLabel="Cancelar"
        variant="primary"
      />
    </div>
  );
}
