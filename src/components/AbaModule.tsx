import React, { useState } from "react";
import { 
  Target, 
  Award, 
  PlusCircle, 
  CheckCircle, 
  TrendingUp, 
  Plus, 
  Minus, 
  Trash2, 
  ClipboardList, 
  AlertCircle, 
  Calendar, 
  Sparkles, 
  LineChart as LineChartIcon,
  HelpCircle,
  Play
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Legend 
} from "recharts";
import { Patient, UserRole, UserPermissions } from "../types";
import { useToast, ConfirmModal } from "./UI";

interface AbaModuleProps {
  patients: Patient[];
  userRole: UserRole;
  userPermissions?: UserPermissions;
}

interface AbaProgram {
  id: string;
  nome: string;
  categoria: string; // ex: Comunicação, Atenção, Imitação, Acadêmico, Atividades de Vida Diária (AVD)
  objetivo: string;
  estímuloAlvo: string[]; // alvos, ex: ["Dar tchau", "Bater palmas", "Tocar nariz"]
  instrucoes: string;
}

interface TrialResult {
  trialIndex: number; // 1 to 10
  score: "I" | "Ag" | "Av" | "Af" | "E"; // I=Independente, Ag=Gestual, Av=Verbal, Af=Física, E=Erro
}

interface SavedAbaSession {
  id: string;
  patientId: string;
  programId: string;
  programNome: string;
  data: string;
  alvo: string;
  trials: TrialResult[];
  porcentagemIndependente: number;
  frequenciaComportamentos: {
    birra: number;
    estereotipia: number;
    autoagressao: number;
    recusa: number;
  };
  observacoes: string;
  terapeuta: string;
}

export default function AbaModule({ patients, userRole, userPermissions }: AbaModuleProps) {
  const toast = useToast();
  const canCreate = userPermissions ? userPermissions.pei.criar : (userRole !== UserRole.RESTRICTED);
  const canDelete = userPermissions ? userPermissions.pei.excluir : (userRole === UserRole.ADMIN);

  // Selected patient
  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const selectedPatient = patients.find(p => p.id === selectedPatId);

  // ABA Programs list (State to allow adding new clinical programs)
  const [programs, setPrograms] = useState<AbaProgram[]>([
    {
      id: "prog-1",
      nome: "Contato Visual (3 segundos)",
      categoria: "Atenção Compartilhada",
      objetivo: "Fazer e sustentar contato visual direto com o terapeuta por 3 segundos após comando vocal.",
      estímuloAlvo: ["Olhar ao chamar pelo nome", "Olhar ao apresentar estímulo reforçador", "Olhar espontâneo durante o brincar"],
      instrucoes: "Sente-se à frente da criança. Diga o nome dela de forma clara. Assim que houver o contato visual de 3 segundos, forneça reforço social imediato + item de preferência."
    },
    {
      id: "prog-2",
      nome: "Imitação Motora com Objetos",
      categoria: "Imitação",
      objetivo: "Imitar a ação do terapeuta utilizando objetos do cotidiano em até 3 segundos.",
      estímuloAlvo: ["Bater colher no prato", "Passar pente no cabelo", "Rolar carrinho na pista", "Colocar bloco na caixa"],
      instrucoes: "Apresente os objetos idênticos. Realize a ação dizendo 'Faça igual'. Aguarde resposta. Forneça ajuda graduada se necessário."
    },
    {
      id: "prog-3",
      nome: "Mando - Solicitar Itens Desejados",
      categoria: "Comunicação Verbal",
      objetivo: "Solicitar verbalmente ou via PECS/comunicação alternativa um item de interesse que está à vista.",
      estímuloAlvo: ["Água", "Brinquedo favorito", "Bolha de sabão", "Massinha de modelar"],
      instrucoes: "Mantenha o item visível mas fora do alcance da criança. Espere a iniciativa de comunicação. Se necessário, dê o modelo vocal ou aponte a figura (ajuda)."
    },
    {
      id: "prog-4",
      nome: "Identificação de Cores Primárias (Tato/Receptivo)",
      categoria: "Acadêmico / Cognitivo",
      objetivo: "Apontar ou entregar o bloco da cor correta mediante comando verbal ('Aponte o Azul').",
      estímuloAlvo: ["Vermelho", "Azul", "Amarelo"],
      instrucoes: "Coloque três blocos de cores diferentes na mesa. Diga 'Me dê o [Cor]'. Altere a posição dos blocos a cada tentativa para evitar pareamento automático por posição."
    },
    {
      id: "prog-5",
      nome: "Seguir Instruções Simples de 1 Passo",
      categoria: "Prontidão / Comportamental",
      objetivo: "Seguir instruções de um passo sem pistas físicas, como 'Senta', 'Guarda', 'Vem aqui'.",
      estímuloAlvo: ["Comando: 'Senta'", "Comando: 'Guarda o brinquedo'", "Comando: 'Levanta a mão'"],
      instrucoes: "Garanta a atenção da criança. Diga o comando verbal uma única vez. Não repita imediatamente. Dê reforço em caso de resposta independente ou ajuda física na recusa."
    }
  ]);

  // Selected program for trials
  const [selectedProgramId, setSelectedProgramId] = useState<string>(programs[0]?.id || "");
  const selectedProgram = programs.find(p => p.id === selectedProgramId) || programs[0];

  // Target item selected from selected program
  const [selectedTarget, setSelectedTarget] = useState<string>(selectedProgram?.estímuloAlvo[0] || "");

  // Current trial run state (10 trials sheet)
  const [currentTrials, setCurrentTrials] = useState<TrialResult[]>(
    Array.from({ length: 10 }, (_, i) => ({ trialIndex: i + 1, score: "I" }))
  );
  
  // Track which trial index is currently being edited (1 to 10)
  const [activeTrialIndex, setActiveTrialIndex] = useState<number>(1);

  // Problem behavior occurrences tally counter
  const [behaviors, setBehaviors] = useState({
    birra: 0,
    estereotipia: 0,
    autoagressao: 0,
    recusa: 0
  });

  // Notes and session variables
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Saved clinical session database (Mock storage loaded into state)
  const [savedSessions, setSavedSessions] = useState<SavedAbaSession[]>([
    {
      id: "aba-1",
      patientId: "pat-1", // Benjamin
      programId: "prog-1",
      programNome: "Contato Visual (3 segundos)",
      data: "2026-06-15",
      alvo: "Olhar ao chamar pelo nome",
      trials: [
        { trialIndex: 1, score: "I" },
        { trialIndex: 2, score: "I" },
        { trialIndex: 3, score: "Ag" },
        { trialIndex: 4, score: "I" },
        { trialIndex: 5, score: "Av" },
        { trialIndex: 6, score: "I" },
        { trialIndex: 7, score: "Af" },
        { trialIndex: 8, score: "I" },
        { trialIndex: 9, score: "I" },
        { trialIndex: 10, score: "I" }
      ],
      porcentagemIndependente: 70,
      frequenciaComportamentos: { birra: 1, estereotipia: 3, autoagressao: 0, recusa: 1 },
      observacoes: "Benjamin demonstrou bom engajamento inicial, mas necessitou de ajuda gestual e verbal a partir da 5ª tentativa devido à fadiga.",
      terapeuta: "Francine Maria Tersi"
    },
    {
      id: "aba-2",
      patientId: "pat-1", // Benjamin
      programId: "prog-1",
      programNome: "Contato Visual (3 segundos)",
      data: "2026-06-20",
      alvo: "Olhar ao chamar pelo nome",
      trials: [
        { trialIndex: 1, score: "I" },
        { trialIndex: 2, score: "I" },
        { trialIndex: 3, score: "I" },
        { trialIndex: 4, score: "Ag" },
        { trialIndex: 5, score: "I" },
        { trialIndex: 6, score: "I" },
        { trialIndex: 7, score: "I" },
        { trialIndex: 8, score: "I" },
        { trialIndex: 9, score: "I" },
        { trialIndex: 10, score: "I" }
      ],
      porcentagemIndependente: 90,
      frequenciaComportamentos: { birra: 0, estereotipia: 2, autoagressao: 0, recusa: 0 },
      observacoes: "Desempenho excelente hoje! Atingiu 90% de respostas independentes. Demonstrou grande motivação com o carrinho luminoso.",
      terapeuta: "Francine Maria Tersi"
    },
    {
      id: "aba-3",
      patientId: "pat-1", // Benjamin
      programId: "prog-2",
      programNome: "Imitação Motora com Objetos",
      data: "2026-06-22",
      alvo: "Bater colher no prato",
      trials: [
        { trialIndex: 1, score: "I" },
        { trialIndex: 2, score: "Av" },
        { trialIndex: 3, score: "Ag" },
        { trialIndex: 4, score: "Af" },
        { trialIndex: 5, score: "E" },
        { trialIndex: 6, score: "Av" },
        { trialIndex: 7, score: "Ag" },
        { trialIndex: 8, score: "I" },
        { trialIndex: 9, score: "I" },
        { trialIndex: 10, score: "I" }
      ],
      porcentagemIndependente: 40,
      frequenciaComportamentos: { birra: 2, estereotipia: 4, autoagressao: 0, recusa: 3 },
      observacoes: "Dificuldade na sustentação da atenção. Necessitou de ajudas de alta intensidade (física e verbal) nas tentativas intermediárias.",
      terapeuta: "Francine Maria Tersi"
    },
    {
      id: "aba-4",
      patientId: "pat-1", // Benjamin
      programId: "prog-2",
      programNome: "Imitação Motora com Objetos",
      data: "2026-06-28",
      alvo: "Bater colher no prato",
      trials: [
        { trialIndex: 1, score: "I" },
        { trialIndex: 2, score: "I" },
        { trialIndex: 3, score: "Av" },
        { trialIndex: 4, score: "I" },
        { trialIndex: 5, score: "I" },
        { trialIndex: 6, score: "Ag" },
        { trialIndex: 7, score: "I" },
        { trialIndex: 8, score: "I" },
        { trialIndex: 9, score: "I" },
        { trialIndex: 10, score: "I" }
      ],
      porcentagemIndependente: 80,
      frequenciaComportamentos: { birra: 0, estereotipia: 1, autoagressao: 0, recusa: 1 },
      observacoes: "Benjamin alcançou o critério de aquisição (80%) para o alvo de bater colher. Excelente controle de estímulos.",
      terapeuta: "Francine Maria Tersi"
    },
    {
      id: "aba-5",
      patientId: "pat-2", // Mariana
      programId: "prog-3",
      programNome: "Mando - Solicitar Itens Desejados",
      data: "2026-06-24",
      alvo: "Água",
      trials: [
        { trialIndex: 1, score: "I" },
        { trialIndex: 2, score: "I" },
        { trialIndex: 3, score: "I" },
        { trialIndex: 4, score: "I" },
        { trialIndex: 5, score: "Ag" },
        { trialIndex: 6, score: "I" },
        { trialIndex: 7, score: "I" },
        { trialIndex: 8, score: "Av" },
        { trialIndex: 9, score: "I" },
        { trialIndex: 10, score: "I" }
      ],
      porcentagemIndependente: 80,
      frequenciaComportamentos: { birra: 0, estereotipia: 1, autoagressao: 0, recusa: 0 },
      observacoes: "Mariana solicitou água vocalmente de forma independente na maioria das tentativas. Ótimo progresso em comunicação funcional.",
      terapeuta: "Francine Maria Tersi"
    }
  ]);

  // Confirm delete session modal state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Form states to create a new program
  const [newProgNome, setNewProgNome] = useState("");
  const [newProgCat, setNewProgCat] = useState("Comunicação");
  const [newProgObj, setNewProgObj] = useState("");
  const [newProgAlvos, setNewProgAlvos] = useState("");
  const [newProgInstr, setNewProgInstr] = useState("");
  const [isAddingProgram, setIsAddingProgram] = useState(false);

  // Switch program helper
  const handleSelectProgram = (programId: string) => {
    setSelectedProgramId(programId);
    const prog = programs.find(p => p.id === programId);
    if (prog) {
      setSelectedTarget(prog.estímuloAlvo[0] || "");
    }
    // reset trials and behavior counters
    setCurrentTrials(Array.from({ length: 10 }, (_, i) => ({ trialIndex: i + 1, score: "I" })));
    setActiveTrialIndex(1);
    setBehaviors({ birra: 0, estereotipia: 0, autoagressao: 0, recusa: 0 });
    setSessionNotes("");
  };

  // Helper score color keys
  const scoreKeys = {
    I: { label: "I (Independente)", bg: "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600", desc: "Respondeu de forma autônoma em até 3s", color: "#10b981" },
    Ag: { label: "Ag (Ajuda Gestual)", bg: "bg-sky-500 text-white border-sky-600 hover:bg-sky-600", desc: "Apontar, olhar ou indicar fisicamente o alvo", color: "#0ea5e9" },
    Av: { label: "Av (Ajuda Verbal)", bg: "bg-violet-500 text-white border-violet-600 hover:bg-violet-600", desc: "Modelo vocal total ou parcial do som correto", color: "#8b5cf6" },
    Af: { label: "Af (Ajuda Física)", bg: "bg-amber-500 text-white border-amber-600 hover:bg-amber-600", desc: "Suporte 'mão sobre mão' ou toque físico direto", color: "#f59e0b" },
    E: { label: "E (Erro)", bg: "bg-rose-500 text-white border-rose-600 hover:bg-rose-600", desc: "Fuga, resposta incorreta ou recusa total", color: "#f43f5e" }
  };

  // Set the score of the active trial and auto-advance
  const handleSetScore = (score: "I" | "Ag" | "Av" | "Af" | "E") => {
    const updated = [...currentTrials];
    updated[activeTrialIndex - 1] = { trialIndex: activeTrialIndex, score };
    setCurrentTrials(updated);

    if (activeTrialIndex < 10) {
      setActiveTrialIndex(activeTrialIndex + 1);
    }
  };

  // Quick reset of sheet
  const handleResetTrials = () => {
    setCurrentTrials(Array.from({ length: 10 }, (_, i) => ({ trialIndex: i + 1, score: "I" })));
    setActiveTrialIndex(1);
    setBehaviors({ birra: 0, estereotipia: 0, autoagressao: 0, recusa: 0 });
    setSessionNotes("");
  };

  // Handle behavior count change
  const handleTallyBehavior = (type: "birra" | "estereotipia" | "autoagressao" | "recusa", val: number) => {
    setBehaviors(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + val)
    }));
  };

  // Submit and save session trials
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    // Calculate independent trials percentage
    const independentCount = currentTrials.filter(t => t.score === "I").length;
    const pctInd = Math.round((independentCount / 10) * 100);

    const newSession: SavedAbaSession = {
      id: `aba-${Date.now()}`,
      patientId: selectedPatId,
      programId: selectedProgramId,
      programNome: selectedProgram.nome,
      data: sessionDate,
      alvo: selectedTarget,
      trials: [...currentTrials],
      porcentagemIndependente: pctInd,
      frequenciaComportamentos: { ...behaviors },
      observacoes: sessionNotes,
      terapeuta: "Francine Maria Tersi"
    };

    setSavedSessions([newSession, ...savedSessions]);
    toast.success(`Folha de Registro ABA salva com sucesso! Desempenho: ${pctInd}% de acertos independentes.`);

    // Clear and reset form
    handleResetTrials();
  };

  // Delete saved session
  const handleDeleteSession = (id: string) => {
    setPendingDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDeleteSession = () => {
    setSavedSessions(savedSessions.filter(s => s.id !== pendingDeleteId));
    setConfirmDeleteOpen(false);
    setPendingDeleteId(null);
    toast.success("Registro de tentativas excluído do histórico.");
  };

  // Handle creating new custom program
  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgNome) return;

    const alvosList = newProgAlvos.split(",").map(a => a.trim()).filter(Boolean);
    const newProg: AbaProgram = {
      id: `prog-${Date.now()}`,
      nome: newProgNome,
      categoria: newProgCat,
      objetivo: newProgObj,
      estímuloAlvo: alvosList.length > 0 ? alvosList : ["Alvo Geral"],
      instrucoes: newProgInstr
    };

    setPrograms([...programs, newProg]);
    setSelectedProgramId(newProg.id);
    setSelectedTarget(newProg.estímuloAlvo[0] || "Alvo Geral");
    
    // reset form fields
    setNewProgNome("");
    setNewProgObj("");
    setNewProgAlvos("");
    setNewProgInstr("");
    setIsAddingProgram(false);

    toast.success(`Programa de Ensino "${newProg.nome}" cadastrado com sucesso!`);
  };

  // Filter saved sessions by current patient and current program to show acquisition curve!
  const patientProgramSessions = savedSessions
    .filter(s => s.patientId === selectedPatId && s.programId === selectedProgramId)
    .sort((a, b) => a.data.localeCompare(b.data));

  // Graph data mapper
  const chartData = patientProgramSessions.map(session => ({
    data: new Date(session.data).toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' }),
    "Acertos Independentes (%)": session.porcentagemIndependente,
    "Alvo": session.alvo
  }));

  // General patient sessions to show in general log table
  const patientSessionsHistory = savedSessions
    .filter(s => s.patientId === selectedPatId)
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="space-y-6">
      {/* Upper context and information bar */}
      <div className="bg-gradient-to-r from-blue-700 via-[#1070ca] to-blue-600 text-white p-6 rounded-3xl shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10 space-y-1 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-wider">
            <Target className="h-3.5 w-3.5 animate-pulse" /> Protocolo ABA & Treino de Tentativas
          </div>
          <h2 className="text-xl md:text-2xl font-display font-black tracking-tight leading-none">
            Análise do Comportamento Aplicada (ABA)
          </h2>
          <p className="text-xs text-blue-100/90 font-medium max-w-2xl">
            Workspace integrado para aplicação de Programas de Ensino, Registro de Tentativas Discretas (DTT), rastreio de comportamentos inadequados e gráficos da curva de aprendizado.
          </p>
        </div>

        {/* Global patient dropdown selector */}
        <div className="relative z-10 shrink-0 bg-white/10 backdrop-blur-xs border border-white/20 p-3 rounded-2xl flex flex-col gap-1.5 min-w-[220px]">
          <label className="text-[10px] text-blue-100 font-bold uppercase tracking-wider text-left">Selecionar Prontuário</label>
          <select
            value={selectedPatId}
            onChange={(e) => {
              setSelectedPatId(e.target.value);
              handleResetTrials();
            }}
            className="w-full bg-white text-slate-800 border-none rounded-xl p-2.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.nome} ({p.idade} anos)</option>
            ))}
          </select>
          {selectedPatient && (
            <p className="text-[10px] text-emerald-300 font-bold text-left mt-0.5">
              🎯 Diagnóstico: {selectedPatient.diagnostico}
            </p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PROGRAMS SELECTION & ADD NEW PROGRAM (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Programs Selector Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h3 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="h-4.5 w-4.5 text-[#1070ca]" /> Currículo & Programas ABA
              </h3>
              {canCreate && !isAddingProgram && (
                <button
                  onClick={() => setIsAddingProgram(true)}
                  className="text-[10px] font-black text-[#1070ca] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-all flex items-center gap-0.5"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Criar
                </button>
              )}
            </div>

            {/* Program Add Form (Visible if isAddingProgram is true) */}
            {isAddingProgram ? (
              <form onSubmit={handleCreateProgram} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">Novo Programa Clínico</span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingProgram(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                  >
                    Cancelar
                  </button>
                </div>
                
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Nome do Programa</label>
                  <input
                    type="text"
                    required
                    value={newProgNome}
                    onChange={(e) => setNewProgNome(e.target.value)}
                    placeholder="Ex: Identificação de Sentimentos"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1070ca]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Categoria de Desenvolvimento</label>
                  <select
                    value={newProgCat}
                    onChange={(e) => setNewProgCat(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1070ca]"
                  >
                    <option value="Comunicação">Comunicação / Linguagem</option>
                    <option value="Imitação">Imitação</option>
                    <option value="Atenção Compartilhada">Atenção Compartilhada</option>
                    <option value="Acadêmico">Acadêmico / Cognitivo</option>
                    <option value="AVD">Atividades de Vida Diária (AVD)</option>
                    <option value="Socialização">Habilidades Sociais</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Objetivo Geral do Treino</label>
                  <textarea
                    required
                    value={newProgObj}
                    onChange={(e) => setNewProgObj(e.target.value)}
                    placeholder="Descreva o critério de sucesso esperado..."
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1070ca] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Estímulos Alvo (Separados por vírgula)</label>
                  <input
                    type="text"
                    required
                    value={newProgAlvos}
                    onChange={(e) => setNewProgAlvos(e.target.value)}
                    placeholder="Ex: Triste, Feliz, Bravo, Assustado"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1070ca]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Diretriz e Instrução de Aplicação</label>
                  <textarea
                    value={newProgInstr}
                    onChange={(e) => setNewProgInstr(e.target.value)}
                    placeholder="Instruções para o terapeuta na mesa..."
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1070ca] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#1070ca] hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition"
                >
                  Salvar Programa
                </button>
              </form>
            ) : null}

            {/* List of active programs */}
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
              {programs.map((prog) => {
                const isSelected = selectedProgramId === prog.id;
                const progSessionsCount = savedSessions.filter(
                  s => s.patientId === selectedPatId && s.programId === prog.id
                ).length;

                return (
                  <button
                    key={prog.id}
                    onClick={() => handleSelectProgram(prog.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all relative block ${
                      isSelected 
                        ? "bg-[#1070ca]/5 border-[#1070ca] shadow-xs" 
                        : "bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono font-black uppercase text-[#1070ca] tracking-wider px-2 py-0.5 rounded-md bg-blue-100/50">
                        {prog.categoria}
                      </span>
                      {progSessionsCount > 0 && (
                        <span className="text-[8.5px] font-mono font-bold text-slate-400">
                          {progSessionsCount} sessões
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-black text-slate-800 mt-1.5 leading-tight">{prog.nome}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">{prog.objetivo}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Program Instructions / Guidelines Sheet */}
          {selectedProgram && (
            <div className="bg-amber-50/40 p-5 rounded-3xl border border-amber-100/50 space-y-3 text-left">
              <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                💡 Instruções do Programa Selecionado
              </h4>
              <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed">
                {selectedProgram.instrucoes}
              </p>
              <div className="border-t border-amber-200/50 pt-2 space-y-1">
                <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider font-mono">Alvos Cadastrados:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedProgram.estímuloAlvo.map((alvo, idx) => (
                    <span 
                      key={idx}
                      onClick={() => setSelectedTarget(alvo)} 
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer transition ${
                        selectedTarget === alvo 
                          ? "bg-[#1070ca] text-white border-[#1070ca]" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {alvo}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* CENTER COLUMN: INTERACTIVE TRIALS RUNNER SHEET (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
              <div>
                <h3 className="font-display font-black text-[#1070ca] text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="h-4.5 w-4.5 text-[#1070ca] fill-current" /> Folha de Registro Ativa (10 Tentativas)
                </h3>
                <p className="text-[10.5px] text-slate-400 font-semibold font-sans mt-0.5">
                  Selecione o alvo do programa, execute as tentativas discretas e preencha os níveis de ajuda de 1 a 10.
                </p>
              </div>

              {/* Reset button */}
              <button
                type="button"
                onClick={handleResetTrials}
                className="text-[10px] font-bold text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                Limpar Grade
              </button>
            </div>

            {/* Targets and Header controls inside Runner */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Estímulo Alvo / SD Ativo</label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca]"
                >
                  {selectedProgram?.estímuloAlvo.map((alvo, idx) => (
                    <option key={idx} value={alvo}>{alvo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Data da Aplicação</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Aplicador Responsável</label>
                <input
                  type="text"
                  disabled
                  value="Francine Maria Tersi"
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Trial run selector grid (1 to 10) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/80 mb-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 font-mono">Linha das 10 Tentativas (DTT / Discrete Trial):</h4>
              
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {currentTrials.map((trial) => {
                  const isActive = activeTrialIndex === trial.trialIndex;
                  const isScored = trial.score !== undefined;
                  
                  // Score-dependent text colors
                  const colorMap = {
                    I: "bg-emerald-100 text-emerald-800 border-emerald-300 font-black",
                    Ag: "bg-sky-100 text-sky-800 border-sky-300 font-bold",
                    Av: "bg-violet-100 text-violet-800 border-violet-300 font-bold",
                    Af: "bg-amber-100 text-amber-800 border-amber-300 font-bold",
                    E: "bg-rose-100 text-rose-800 border-rose-300 font-bold"
                  };
                  
                  const activeClass = isActive ? "ring-2 ring-offset-2 ring-[#1070ca]" : "";
                  const scoreClass = colorMap[trial.score];

                  return (
                    <button
                      key={trial.trialIndex}
                      type="button"
                      onClick={() => setActiveTrialIndex(trial.trialIndex)}
                      className={`h-11 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer text-xs ${scoreClass} ${activeClass}`}
                    >
                      <span className="text-[9px] font-mono font-bold opacity-60">T{trial.trialIndex}</span>
                      <span className="text-sm font-black tracking-tight">{trial.score}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress Summary */}
              <div className="flex items-center justify-between mt-4 border-t border-slate-200/50 pt-3">
                <div className="flex items-center gap-3">
                  <div className="text-xs">
                    <span className="text-slate-400 font-semibold">Acertos Independentes: </span>
                    <span className="font-black text-emerald-600">
                      {currentTrials.filter(t => t.score === "I").length} / 10
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400 font-semibold">Aproveitamento: </span>
                    <span className="font-black text-blue-600">
                      {Math.round((currentTrials.filter(t => t.score === "I").length / 10) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-black">
                  Tentativa Atual: {activeTrialIndex} / 10
                </div>
              </div>
            </div>

            {/* Score entry buttons with action description */}
            <div className="space-y-4 mb-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Registrar Nota para a Tentativa {activeTrialIndex}:</h4>
              
              <div className="grid sm:grid-cols-5 gap-2.5">
                {(Object.keys(scoreKeys) as Array<keyof typeof scoreKeys>).map((key) => {
                  const item = scoreKeys[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSetScore(key)}
                      className={`p-3 border rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-center group ${item.bg}`}
                    >
                      <span className="text-sm font-black tracking-tight uppercase">{key}</span>
                      <span className="text-[8px] font-mono font-bold mt-0.5 opacity-90 line-clamp-1">{key === "I" ? "Independente" : key === "E" ? "Erro" : "Com Ajuda"}</span>
                    </button>
                  );
                })}
              </div>

              {/* Show detail on help guidelines */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2 text-xs text-slate-500 font-semibold">
                <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-600 uppercase text-[9px] font-mono tracking-wider">Diretriz Clínico-Operacional:</p>
                  <p className="mt-0.5 leading-relaxed">
                    Clique no botão de pontuação acima para registrar a resposta na tentativa selecionada. O cursor avançará automaticamente para a próxima tentativa. Em ABA, buscamos o critério de aquisição de <strong>80% de acertos independentes (I)</strong> em 3 sessões consecutivas para considerar o alvo dominado.
                  </p>
                </div>
              </div>
            </div>

            {/* Problem Behaviors counters (Tally trackers) */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  ⚠️ Monitor de Comportamentos Inadequados / Barreira
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold">Rastreie ocorrências ou frequência de comportamentos que geram barreira no aprendizado durante este treino.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "birra" as const, label: "Birra / Choro", color: "text-amber-600 border-amber-150 bg-amber-50/20" },
                  { key: "estereotipia" as const, label: "Estereotipias", color: "text-teal-600 border-teal-150 bg-teal-50/20" },
                  { key: "autoagressao" as const, label: "Auto/Agressão", color: "text-red-600 border-red-150 bg-red-50/20" },
                  { key: "recusa" as const, label: "Recusa / Fuga", color: "text-indigo-600 border-indigo-150 bg-indigo-50/20" }
                ].map((beh) => (
                  <div key={beh.key} className={`p-3 border rounded-2xl flex flex-col items-center justify-between gap-2 text-center ${beh.color}`}>
                    <span className="text-[10.5px] font-black">{beh.label}</span>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => handleTallyBehavior(beh.key, -1)}
                        className="h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-500 transition-all flex items-center justify-center font-bold text-sm cursor-pointer shadow-3xs"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-mono font-black text-slate-800 min-w-[20px]">{behaviors[beh.key]}</span>
                      <button
                        type="button"
                        onClick={() => handleTallyBehavior(beh.key, 1)}
                        className="h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#1070ca] transition-all flex items-center justify-center font-bold text-sm cursor-pointer shadow-3xs"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Observations and SAVE Form */}
            <form onSubmit={handleSaveSession} className="border-t border-slate-100 pt-5 mt-5 space-y-4">
              <div>
                <label className="block text-[9.5px] font-black uppercase text-slate-400 mb-1 tracking-wider">Notas Clínicas e Observações da Sessão ABA</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Relate intercorrências, nível de motivação, uso de reforçadores, progresso de esvanecimento de ajuda..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1070ca] hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="h-4.5 w-4.5" /> Salvar Sessão e Atualizar Aprendizado
              </button>
            </form>

          </div>

        </div>

      </div>

      {/* CURVA DE APRENDIZADO: Dynamic chart block */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
        <div className="border-b border-slate-50 pb-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <LineChartIcon className="h-4.5 w-4.5 text-[#1070ca]" /> Curva de Aprendizado e Evolução do Alvo
            </h3>
            <p className="text-[10.5px] text-slate-400 font-semibold font-sans mt-0.5">
              Visualização temporal da porcentagem de respostas independentes para o programa: <strong>{selectedProgram?.nome}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-bold">
              <span className="h-1 w-5 bg-emerald-500 rounded" /> Desempenho Independente (%)
            </span>
            <span className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-bold">
              <span className="h-0.5 w-5 bg-red-400 border-t border-dashed" /> Critério de Aquisição (80%)
            </span>
          </div>
        </div>

        {/* Dynamic chart render */}
        {chartData.length > 0 ? (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} 
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "16px", 
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", 
                    border: "1px solid #f1f5f9",
                    fontSize: "11px",
                    fontWeight: "600"
                  }} 
                />
                <ReferenceLine y={80} stroke="#f87171" strokeDasharray="3 3" label={{ value: '80% Domínio', fill: '#ef4444', fontSize: 9, fontWeight: 800, position: 'top' }} />
                <Line 
                  type="monotone" 
                  dataKey="Acertos Independentes (%)" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  activeDot={{ r: 7 }}
                  dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">Nenhum registro para gerar o gráfico neste programa.</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Aplique as 10 tentativas discretas e salve a sessão para iniciar a linha de progresso do paciente.</p>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE SESSIONS LIST: Patient History Logs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
        <h3 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
          📜 Histórico de Registros Clínicos ABA do Paciente
        </h3>

        {patientSessionsHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-auto text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase font-mono bg-slate-50/50">
                  <th className="py-3 px-4 rounded-l-2xl">Data</th>
                  <th className="py-3 px-4">Programa / Alvo</th>
                  <th className="py-3 px-4">Aproveitamento</th>
                  <th className="py-3 px-4 text-center">Tentativas (1-10)</th>
                  <th className="py-3 px-4">Intercorrências / Frequência</th>
                  <th className="py-3 px-4">Notas Clínicas</th>
                  {canDelete && <th className="py-3 px-4 rounded-r-2xl text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {patientSessionsHistory.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-[11px] font-bold font-mono">
                      {new Date(sess.data).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 leading-tight">{sess.programNome}</div>
                      <div className="text-[9.5px] text-[#1070ca] uppercase tracking-wider font-mono font-bold mt-0.5">Alvo: {sess.alvo}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-black ${
                        sess.porcentagemIndependente >= 80 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : sess.porcentagemIndependente >= 50 
                            ? "bg-amber-50 text-amber-700 border border-amber-200" 
                            : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {sess.porcentagemIndependente}% Indep.
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-0.5 justify-center">
                        {sess.trials.map((t, idx) => {
                          const bgColors = {
                            I: "bg-emerald-500",
                            Ag: "bg-sky-500",
                            Av: "bg-violet-500",
                            Af: "bg-amber-500",
                            E: "bg-rose-500"
                          };
                          return (
                            <span 
                              key={idx} 
                              className={`h-4.5 w-4 text-[8px] text-white flex items-center justify-center font-black rounded-xs ${bgColors[t.score]}`}
                              title={`Tentativa ${t.trialIndex}: ${scoreKeys[t.score].label}`}
                            >
                              {t.score}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {Object.entries(sess.frequenciaComportamentos).map(([key, count]) => {
                          if (count === 0) return null;
                          const nameMap = { birra: "Birra", estereotipia: "Est.", autoagressao: "Autoag.", recusa: "Recusa" };
                          return (
                            <span key={key} className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                              {nameMap[key as keyof typeof nameMap]}: {count}
                            </span>
                          );
                        })}
                        {Object.values(sess.frequenciaComportamentos).every(v => v === 0) && (
                          <span className="text-[10px] text-emerald-600">Nenhuma intercorrência</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[10.5px] text-slate-500 leading-normal max-w-xs truncate" title={sess.observacoes}>
                      {sess.observacoes || "—"}
                    </td>
                    {canDelete && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(sess.id)}
                          className="text-slate-300 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">Nenhuma sessão registrada para este paciente ainda.</p>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDeleteSession}
        title="Excluir registro de tentativas?"
        message="Este registro de tentativas ABA será removido permanentemente do histórico do paciente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />

    </div>
  );
}
