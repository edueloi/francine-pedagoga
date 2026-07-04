import React, { useState, useEffect } from "react";
import { Clock, Plus, Save, Info, CheckSquare, Trash2, BookOpen, AlertCircle, Sparkles, Star, Lightbulb, Check } from "lucide-react";
import { Patient, Session, Session as SessionType, UserRole, UserPermissions } from "../types";
import { useToast } from "./UI";

interface SessionEvolutionProps {
  patients: Patient[];
  userRole: UserRole;
  onCreateSession: (payload: Partial<Session>) => Promise<void>;
  sessions: Session[];
  userPermissions?: UserPermissions;
}

export default function SessionEvolution({
  patients,
  userRole,
  onCreateSession,
  sessions,
  userPermissions
}: SessionEvolutionProps) {
  const toast = useToast();
  const canCreate = userPermissions ? userPermissions.sessions.criar : (userRole !== UserRole.RESTRICTED);

  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const [sessionDuration, setSessionDuration] = useState<number>(50);
  
  // Clinical fields
  const [arrivalReg, setArrivalReg] = useState("Chegou regulado, sorridente e estabelecendo bom contato visual.");
  const [communication, setCommunication] = useState("Vocalizações espontâneas e uso de gestos indicativos consistentes.");
  const [play, setPlay] = useState("Brincou de forma funcional compartilhando atenção e seguindo instruções simples.");
  const [paperAct, setPaperAct] = useState("Realizou pareamento de letras do nome próprio com apoio verbal leve.");
  const [cogFlex, setCogFlex] = useState("Manteve boa flexibilidade na transição entre atividades de seu interesse.");
  const [transitions, setTransitions] = useState("Transições suaves, necessitando apenas de aviso verbal prévio.");
  const [behaviors, setBehaviors] = useState("Flapping de mãos leve em momentos de contentamento, sem caráter disruptivo.");
  const [independence, setIndependence] = useState<SessionType["nivelIndependencia"]>("Suporte Leve");
  const [nextPlan, setNextPlan] = useState("Reforçar contato visual e avançar no pareamento de sílabas complexas.");
  
  // Custom states for target skills and reinforcers
  const [targetSkills, setTargetSkills] = useState<string[]>(["Pareamento", "Imitação Motora", "Ecoico"]);
  const [newSkill, setNewSkill] = useState("");
  const [reinforcers, setReinforcers] = useState<string[]>(["Fibras Ópticas Snoezelen", "Dinossauro de Encaixe"]);
  const [newReinforcer, setNewReinforcer] = useState("");

  const [formalOutput, setFormalOutput] = useState("");

  const selectedPat = patients.find(p => p.id === selectedPatId);

  // Automated templates for fast compilation
  const templates = [
    {
      id: "cooperativo",
      name: "1. Regulado & Cooperativo",
      desc: "Sessão fluida e produtiva, excelente contato visual.",
      emoji: "🌟",
      data: {
        arrivalReg: "Paciente iniciou a sessão regulado, demonstrando prontidão para interações sociais e bom contato visual.",
        communication: "Uso de comunicação funcional ativa. Apresentou vocalizações espontâneas consistentes de duas sílabas.",
        play: "Brincou de forma lúdica direcionada, compartilhando atenção com a terapeuta e aceitando trocas de turno.",
        paperAct: "Realizou pareamento de letras do nome de forma autônoma sob uso de reforço intermitente.",
        cogFlex: "Boa flexibilidade cognitiva. Aceitou novos desafios propostos de nível de dificuldade incremental.",
        transitions: "Transições de atividades suaves, necessitando apenas de sinalização verbal simples com timer visual.",
        behaviors: "Ausência de comportamentos clinicamente significativos ou estereotipias disruptivas.",
        independence: "Suporte Leve" as const,
        targetSkills: ["Pareamento", "Ecoico", "Imitação Motora", "Troca de Turno"],
        reinforcers: ["Massinha de Modelar", "Dinossauro de Encaixe"],
        nextPlan: "Avançar para pareamento de sílabas complexas e reduzir suporte verbal para contato visual espontâneo."
      }
    },
    {
      id: "snoezelen_reg",
      name: "2. Agitado + Regulação Snoezelen",
      desc: "Início agitado com excelente resposta na Sala Sensorial.",
      emoji: "🔮",
      data: {
        arrivalReg: "Paciente chegou agitado, com alto nível de alerta e agitação psicomotora, dificultando o foco inicial.",
        communication: "Vocalizações curtas e repetições ecolálicas motivadas pelo estado de ansiedade inicial.",
        play: "Necessitou de intervenção imediata na Sala Sensorial Snoezelen com luzes azuis e fibras ópticas para autorregulação.",
        paperAct: "Após 10 minutos de regulação proprioceptiva, sentou-se à mesa e completou as atividades de grafomotricidade.",
        cogFlex: "Apresentou recusa leve para iniciar tarefas de mesa, superada após estruturação visual da rotina.",
        transitions: "Necessitou de pistas físicas sutis e cronômetro de contagem regressiva para realizar as transições.",
        behaviors: "Flapping de mãos e busca sensorial tátil moderada nas texturas do atelier.",
        independence: "Suporte Moderado" as const,
        targetSkills: ["Regulação Sensorial", "Grafomotricidade", "Seguir Rotina Visual"],
        reinforcers: ["Fibras Ópticas Snoezelen", "Colunas de Água com Bolhas", "Massa de Modelar Tátil"],
        nextPlan: "Manter protocolo de regulação prévia em Snoezelen por 8 minutos e focar em escrita cursiva básica."
      }
    },
    {
      id: "frustracao",
      name: "3. Baixa Tolerância a Frustração",
      desc: "Trabalho de recusa e transição sob regras comportamentais.",
      emoji: "⚠️",
      data: {
        arrivalReg: "Paciente chegou regulado, contudo apresentou desorganização ao ver um brinquedo restrito na sala.",
        communication: "Expressou frustração através de vocalizações de protesto e choro leve em momentos de transição de brinquedos.",
        play: "Brincou de forma rígida, demonstrando forte apego ao item preferencial e dificuldade em aceitar regras de compartilhamento.",
        paperAct: "A atividade de alfabetização foi concluída parcialmente devido a episódios de recusa ativa.",
        cogFlex: "Baixa flexibilidade frente à frustração de errar a correspondência de letras, demandando ajuda física parcial.",
        transitions: "Dificuldade na transição de brinquedos. Exigiu suporte físico de compressão proprioceptiva e timer visual.",
        behaviors: "Comportamento de recusa (empurrar materiais) e choro curto diante de demandas terapêuticas.",
        independence: "Suporte Intenso" as const,
        targetSkills: ["Tolerância à Frustração", "Flexibilidade Cognitiva", "Controle de Impulsos"],
        reinforcers: ["Timer Visual", "Abraço de Urso Proprioceptivo"],
        nextPlan: "Reforçar repertório de pedido de pausa funcional e utilizar esquema de reforço com tokens para conclusão de metas."
      }
    },
    {
      id: "comunicacao",
      name: "4. Foco em Comunicação Funcional",
      desc: "Atendimento focado em fonologia e emissão de fonemas.",
      emoji: "🗣️",
      data: {
        arrivalReg: "Paciente iniciou a sessão calmo e responsivo ao chamado, engajando no contato visual face a face.",
        communication: "Atendimento focado em fala. Apresentou imitações vocais de fonemas solicitados com excelente engajamento.",
        play: "Utilização do teatro de fantoches como reforço e estimulador de diálogo estruturado simples.",
        paperAct: "Atividade de associação de imagens a sons fonéticos correspondentes executada com sucesso.",
        cogFlex: "Excelente flexibilidade e interesse em novos estímulos auditivos e visuais de linguagem.",
        transitions: "Realizou todas as transições com facilidade sob instrução puramente verbal.",
        behaviors: "Ausência de comportamentos disruptivos ou estereotipias que atrapalhassem as vocalizações.",
        independence: "Suporte Leve" as const,
        targetSkills: ["Ecoico (Imitação Vocal)", "Associação Fonema-Grafema", "Contato Visual"],
        reinforcers: ["Teatro de Fantoches", "Estrelas Adesivas Brilhantes"],
        nextPlan: "Expandir o vocabulário estimulando sentenças completas de 3 palavras para requisição de reforço."
      }
    }
  ];

  // Auto compile the formal clinical summary text based on the selected attributes
  const compileFormalText = () => {
    const patName = selectedPat ? selectedPat.nome : "Paciente";
    const patAge = selectedPat ? `${selectedPat.idade} anos` : "";
    const patDiag = selectedPat ? selectedPat.diagnostico : "Diagnóstico";

    const text = `RELATÓRIO CLÍNICO DE EVOLUÇÃO TERAPÊUTICA

DATA: ${new Date().toLocaleDateString("pt-BR")}
PACIENTE: ${patName} | IDADE: ${patAge}
DIAGNÓSTICO: ${patDiag}
TERAPEUTA RESPONSÁVEL: Francine Maria Tersi
DURAÇÃO DO ATENDIMENTO: ${sessionDuration} minutos

1. COMPORTAMENTO E REGULAÇÃO SENSORIOMOTORA
Na chegada à clínica, o paciente ${arrivalReg.toLowerCase()} Durante o transcorrer do atendimento clínico, no que diz respeito à flexibilidade cognitiva, ${cogFlex.toLowerCase()} No mapeamento de estereotipias ou comportamentos dignos de atenção técnica, identificou-se ${behaviors.toLowerCase()}

2. HABILIDADES COGNITIVAS, ACADÊMICAS E COMUNICAÇÃO
Em relação ao repertório de fala e linguagem, o paciente apresentou ${communication.toLowerCase()} No comportamento do brincar funcional estruturado, ${play.toLowerCase()} Quanto às tarefas acadêmicas e de mesa dirigidas, ${paperAct.toLowerCase()} As transições entre os blocos de intervenção transcorreram de forma que ${transitions.toLowerCase()}

3. DIRETRIZES DE METODOLOGIA COMPORTAMENTAL (ABA)
- Habilidades Alvo Trabalhadas na Sessão: ${targetSkills.join(", ")}.
- Recursos Reforçadores com Maior Valência: ${reinforcers.join(", ")}.
- Nível de Independência Demostrado: ${independence} segundo as métricas clínicas de suporte.

4. DIRETRIZES PARA O PRÓXIMO ATENDIMENTO CLÍNICO
Plano de ação delineado: ${nextPlan}

Documento assinado digitalmente no prontuário eletrônico. Conforme LGPD.`;
    setFormalOutput(text);
  };

  // Re-compile whenever inputs change
  useEffect(() => {
    compileFormalText();
  }, [selectedPatId, sessionDuration, arrivalReg, communication, play, paperAct, cogFlex, transitions, behaviors, independence, nextPlan, targetSkills, reinforcers]);

  const applyTemplate = (tplData: typeof templates[0]["data"]) => {
    setArrivalReg(tplData.arrivalReg);
    setCommunication(tplData.communication);
    setPlay(tplData.play);
    setPaperAct(tplData.paperAct);
    setCogFlex(tplData.cogFlex);
    setTransitions(tplData.transitions);
    setBehaviors(tplData.behaviors);
    setIndependence(tplData.independence);
    setTargetSkills(tplData.targetSkills);
    setReinforcers(tplData.reinforcers);
    setNextPlan(tplData.nextPlan);
  };

  const [saving, setSaving] = useState(false);

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPat) return;

    const newSession: Partial<Session> = {
      patientId: selectedPatId,
      data: new Date().toISOString().split("T")[0],
      profissional: "Francine Maria Tersi",
      tempoSessao: sessionDuration,
      chegadaRegulacao: arrivalReg,
      comunicacao: communication,
      brincar: play,
      atividadePapel: paperAct,
      flexibilidadeCognitiva: cogFlex,
      transicaoAtividades: transitions,
      comportamentosObservados: behaviors,
      habilidadesTrabalhadas: [...targetSkills],
      perfilSensorial: "Misto (Busca proprioceptiva / Hipersensibilidade)",
      reforcadores: [...reinforcers],
      nivelIndependencia: independence,
      observacoesClinicas: formalOutput,
      rawNotes: `Preenchido via modelo automático: ${arrivalReg}`,
      planoProximaSessao: nextPlan
    };

    setSaving(true);
    try {
      await onCreateSession(newSession);
      toast.success(`Evolução clínica estruturada e arquivada com sucesso para ${selectedPat.nome}!`);
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar evolução clínica.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !targetSkills.includes(newSkill.trim())) {
      setTargetSkills([...targetSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setTargetSkills(targetSkills.filter(s => s !== skill));
  };

  const handleAddReinforcer = () => {
    if (newReinforcer.trim() && !reinforcers.includes(newReinforcer.trim())) {
      setReinforcers([...reinforcers, newReinforcer.trim()]);
      setNewReinforcer("");
    }
  };

  const handleRemoveReinforcer = (ref: string) => {
    setReinforcers(reinforcers.filter(r => r !== ref));
  };

  return (
    <div id="session-evolution" className="space-y-6">
      {/* Clinician Title Section */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
            <span className="p-1 rounded-xl bg-blue-50 text-[#1070ca] text-lg">📝</span> Evolução Terapêutica Automatizada
          </h2>
          <p className="text-xs text-slate-500 font-medium">Preencha prontuários rapidamente utilizando moldes comportamentais estruturados de alto padrão clínico.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-3 py-1 rounded-full border border-slate-200/50">
            PADRÃO ABA / SNOEZELEN
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Automated clinical presets & template loader */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#ebb448]" />
              <h3 className="font-display font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                Modelos de Sessão Rápidos
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Selecione o modelo de comportamento que melhor descreve o atendimento de hoje. O sistema irá preencher instantaneamente todos os campos, checklists e a redação técnica formal:
            </p>

            <div className="space-y-3 pt-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl.data)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 hover:border-[#1070ca]/50 rounded-2xl transition duration-200 cursor-pointer group flex gap-3 items-start"
                >
                  <span className="text-xl bg-white p-1.5 rounded-xl border border-slate-200 group-hover:border-[#1070ca]/30 shadow-xs shrink-0">{tpl.emoji}</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1070ca] transition-colors">{tpl.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium">{tpl.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Guidance Alert */}
          <div className="bg-amber-50/40 border border-amber-200/40 p-4 rounded-2xl flex gap-3 text-amber-900/90">
            <Lightbulb className="h-5 w-5 text-[#ebb448] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold leading-none">Como Funciona?</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Ao selecionar um dos modelos rápidos de comportamento acima, os campos clínicos e a redação técnica formal do prontuário ao lado são atualizados instantaneamente. Você pode alterar manualmente qualquer trecho antes de salvar.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Form and live preview output */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSaveSession} className="space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="font-display font-black text-slate-900 text-base">
                  Ficha do Atendimento
                </h3>
                <span className="text-[10px] bg-blue-100 text-[#1070ca] font-black px-2 py-0.5 rounded-full border border-blue-200/40">
                  ESTRUTURA COMPORTAMENTAL
                </span>
              </div>

              {/* Patient and duration Selection */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Paciente em Atendimento</label>
                  <select
                    value={selectedPatId}
                    onChange={(e) => setSelectedPatId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} ({p.diagnostico})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Duração da Sessão (Minutos)</label>
                  <input
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Text Area Inputs for Custom Clinical Metrics */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[11px] font-mono font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Metricas de Regulação e Comportamento</h4>
                
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-3">
                    <div>
                      <span className="font-bold text-slate-700 text-xs">Acolhimento e Regulação Inicial</span>
                      <textarea
                        rows={2}
                        value={arrivalReg}
                        onChange={(e) => setArrivalReg(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-medium"
                      />
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 text-xs">Comunicação e Linguagem Oral</span>
                      <textarea
                        rows={2}
                        value={communication}
                        onChange={(e) => setCommunication(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-medium"
                      />
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 text-xs">Engajamento e Brincar Lúdico</span>
                      <textarea
                        rows={2}
                        value={play}
                        onChange={(e) => setPlay(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="font-bold text-slate-700 text-xs">Atividades Pedagógicas de Mesa</span>
                      <textarea
                        rows={2}
                        value={paperAct}
                        onChange={(e) => setPaperAct(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-medium"
                      />
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 text-xs">Flexibilidade Cognitiva & Foco</span>
                      <textarea
                        rows={2}
                        value={cogFlex}
                        onChange={(e) => setCogFlex(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-medium"
                      />
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 text-xs">Estereotipias e Comportamento Alvo</span>
                      <textarea
                        rows={2}
                        value={behaviors}
                        onChange={(e) => setBehaviors(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Target Skills and Reinforcers pills */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">Competências Trabalhadas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {targetSkills.map(skill => (
                      <span key={skill} className="text-[10px] bg-blue-50 text-[#1070ca] border border-blue-200/50 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                        {skill} <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-red-500 font-black text-xs hover:text-red-700 cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Adicionar competência..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-[#1070ca] focus:outline-none"
                    />
                    <button type="button" onClick={handleAddSkill} className="bg-slate-900 hover:bg-[#1070ca] text-white rounded px-2.5 text-xs font-extrabold cursor-pointer transition-colors">+</button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">Reforçadores Utilizados</span>
                  <div className="flex flex-wrap gap-1.5">
                    {reinforcers.map(ref => (
                      <span key={ref} className="text-[10px] bg-pink-50 text-[#d43f72] border border-pink-200/50 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                        {ref} <button type="button" onClick={() => handleRemoveReinforcer(ref)} className="text-red-500 font-black text-xs hover:text-red-700 cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newReinforcer}
                      onChange={(e) => setNewReinforcer(e.target.value)}
                      placeholder="Adicionar reforçador..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-[#1070ca] focus:outline-none"
                    />
                    <button type="button" onClick={handleAddReinforcer} className="bg-slate-900 hover:bg-[#1070ca] text-white rounded px-2.5 text-xs font-extrabold cursor-pointer transition-colors">+</button>
                  </div>
                </div>
              </div>

              {/* Independence & planning fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Nível de Suporte Necessário</label>
                  <select
                    value={independence}
                    onChange={(e) => setIndependence(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="Totalmente Independente">Totalmente Independente (Livre)</option>
                    <option value="Suporte Leve">Suporte Leve (Apenas pistas verbais leves)</option>
                    <option value="Suporte Moderado">Suporte Moderado (Pistas visuais + físicas leves)</option>
                    <option value="Suporte Intenso">Suporte Intenso (Necessita ajuda física direta total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Metas para o Próximo Atendimento</label>
                  <input
                    type="text"
                    value={nextPlan}
                    onChange={(e) => setNextPlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                    placeholder="Próximas metas e condutas clínicas..."
                  />
                </div>
              </div>

              {/* LIVE TECHNICAL OUTPUT PREVIEW BOX - Sleek simulation of formal clinic sheet */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 space-y-3 font-mono text-[10px] shadow-inner relative overflow-hidden border border-slate-950">
                <div className="absolute top-0 right-0 h-20 w-20 bg-blue-500/5 rounded-full blur-2xl" />
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-slate-400">
                  <span>📄 PRONTUÁRIO CLÍNICO DIGITAL</span>
                  <span className="text-sky-400 font-bold flex items-center gap-1"><Check className="h-3 w-3" /> FORMATAÇÃO OK</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {formalOutput}
                </div>
              </div>

              {/* Submit Save Button */}
              {canCreate && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-[#1070ca] hover:bg-[#0b5194] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="h-4.5 w-4.5" /> {saving ? "Salvando..." : "Arquivar Prontuário no Histórico do Paciente"}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
