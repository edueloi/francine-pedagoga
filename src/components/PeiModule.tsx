import React, { useState } from "react";
import { Save, Plus, Target, CheckCircle2, ChevronRight, Award, Trash2, ShieldAlert } from "lucide-react";
import { Patient, PeiGoal, GoalDomain, GoalStatus, UserRole, UserPermissions } from "../types";
import { usePeiGoals } from "../hooks/usePeiGoals";
import { ConfirmModal, useToast } from "./UI";

interface PeiModuleProps {
  patients: Patient[];
  userRole: UserRole;
  userPermissions?: UserPermissions;
}

export default function PeiModule({ patients, userRole, userPermissions }: PeiModuleProps) {
  const toast = useToast();
  const canCreate = userPermissions ? userPermissions.pei.criar : (userRole !== UserRole.RESTRICTED);
  const canDelete = userPermissions ? userPermissions.pei.excluir : (userRole === UserRole.ADMIN);

  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const { goals, loading, error, createGoal, updateGoal, deleteGoal } = usePeiGoals();

  // Custom goal additions state
  const [newMeta, setNewMeta] = useState("");
  const [newDominio, setNewDominio] = useState<GoalDomain>(GoalDomain.ACADEMIC);
  const [newSuporte, setNewSuporte] = useState("Pistas visuais estruturadas");
  const [newTentativas, setNewTentativas] = useState("80% de acerto em 3 sessões consecutivas");

  // Delete confirmation state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeta.trim()) return;

    const newGoal: Partial<PeiGoal> = {
      patientId: selectedPatId,
      dominio: newDominio,
      meta: newMeta,
      suporteRequerido: newSuporte || "Sem suporte",
      criterioAquisicao: newTentativas || "80% de independência",
      status: GoalStatus.NOT_STARTED,
      dataRevisao: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // 60 days renewal
    };

    try {
      await createGoal(newGoal);
      setNewMeta("");
      setNewSuporte("");
      setNewTentativas("");
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar meta do PEI.");
    }
  };

  const handleUpdateStatus = async (goalId: string, status: GoalStatus) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    try {
      await updateGoal(goalId, { ...goal, status });
    } catch (err: any) {
      toast.error(err.message || "Falha ao atualizar status da meta.");
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setPendingDeleteId(goalId);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDeleteGoal = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteGoal(pendingDeleteId);
      setConfirmDeleteOpen(false);
      setPendingDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || "Falha ao remover meta do PEI.");
    }
  };

  // Instant Clinical Catalog Suggestion Generator (No External API, Instant & Secure)
  const handleGenerateClinicalSuggestions = async () => {
    const pat = patients.find(p => p.id === selectedPatId);
    if (!pat) return;

    const diag = (pat.diagnostico || "").toLowerCase();
    let catalog: Omit<PeiGoal, "id" | "patientId" | "status" | "dataRevisao">[] = [];

    if (diag.includes("tea") || diag.includes("autismo") || diag.includes("espectro") || diag.includes("asperger")) {
      catalog = [
        {
          dominio: GoalDomain.COMMUNICATION,
          meta: "Identificar e nomear emoções básicas (alegria, tristeza, raiva, medo) através de cartões visuais estruturados e espelhos.",
          suporteRequerido: "Pistas físicas leves ou imitação imediata guiada por reforçador preferencial",
          criterioAquisicao: "80% de independência e contato visual associativo em 4 tentativas sequenciais"
        },
        {
          dominio: GoalDomain.COMMUNICATION,
          meta: "Solicitar itens de alta preferência utilizando frases completas de 3 palavras (ex: 'Eu quero [objeto]') sem vocalizações disruptivas.",
          suporteRequerido: "Esquema de reforço contínuo e modelagem de ecoica verbal",
          criterioAquisicao: "90% de independência funcional em 3 sessões terapêuticas consecutivas"
        },
        {
          dominio: GoalDomain.COGNITIVE,
          meta: "Manter atenção compartilhada foca em atividade de mesa dirigida (ex: pareamento) por até 6 minutos seguidos.",
          suporteRequerido: "Timer visual regressivo de mesa e blocos de incentivo tátil",
          criterioAquisicao: "Execução com menos de 2 redirecionamentos verbais por bloco de atividade"
        },
        {
          dominio: GoalDomain.AVD,
          meta: "Lavar as mãos de forma independente completando as 5 etapas da cadeia comportamental ilustrada.",
          suporteRequerido: "Checklist visual colorido afixado em frente ao lavatório e reforçador social",
          criterioAquisicao: "100% de sucesso nas etapas da cadeia sem prompts físicos em 5 sessões"
        }
      ];
    } else if (diag.includes("tdah") || diag.includes("atenção") || diag.includes("hiperativid") || diag.includes("desatento")) {
      catalog = [
        {
          dominio: GoalDomain.ACADEMIC,
          meta: "Permanecer sentado e engajado na resolução de atividade pedagógica estruturada por até 12 minutos contínuos.",
          suporteRequerido: "Intervalos programados de movimento livre e sistema de economia de fichas (token economy)",
          criterioAquisicao: "Engajamento completo em 4 de 5 oportunidades de atendimento semanal"
        },
        {
          dominio: GoalDomain.AVD,
          meta: "Organizar e fechar os próprios materiais escolares (caderno, estojo, apostila) ao término do bloco de trabalho de mesa.",
          suporteRequerido: "Instrução verbal mínima e lista de verificação de pertence em formato de ícones",
          criterioAquisicao: "Organização correta sem esquecimentos por 4 sessões consecutivas"
        },
        {
          dominio: GoalDomain.COMMUNICATION,
          meta: "Aguardar o interlocutor terminar de falar para iniciar sua intervenção, sem interromper ou emitir respostas impulsivas.",
          suporteRequerido: "Ficha de turno visual de mesa (Ficha de Fala/Ficha de Ouvir)",
          criterioAquisicao: "Respeito ao turno em pelo menos 80% das interações livres da sessão"
        }
      ];
    } else {
      // General pediatric development and psychopedagogy
      catalog = [
        {
          dominio: GoalDomain.ACADEMIC,
          meta: "Realizar junção silábica e leitura fonêmica de palavras dissílabas simples com apoio de cartões fônicos.",
          suporteRequerido: "Cartões fonéticos de apoio articulatório e jogos interativos",
          criterioAquisicao: "Leitura autônoma e correta de 8 a cada 10 palavras simples apresentadas"
        },
        {
          dominio: GoalDomain.COGNITIVE,
          meta: "Completar jogos de associação lógica de causa e efeito relacionando eventos cotidianos.",
          suporteRequerido: "Pistas visuais estruturadas e modelagem de exemplos práticos",
          criterioAquisicao: "Taxa de acerto superior a 85% em avaliações de mesa simples"
        },
        {
          dominio: GoalDomain.AVD,
          meta: "Expressar frustração, negação ou cansaço de forma verbal adequada, evitando comportamentos de recusa física.",
          suporteRequerido: "Uso de cartões de comunicação alternativa (Solicitar Pausa/Ajuda)",
          criterioAquisicao: "Utilização autônoma do cartão em vez de crises ou comportamentos disruptivos"
        }
      ];
    }

    const formattedGoals: Partial<PeiGoal>[] = catalog.map((g) => ({
      patientId: selectedPatId,
      dominio: g.dominio as GoalDomain,
      meta: g.meta,
      suporteRequerido: g.suporteRequerido,
      criterioAquisicao: g.criterioAquisicao,
      status: GoalStatus.NOT_STARTED,
      dataRevisao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    }));

    try {
      for (const g of formattedGoals) {
        await createGoal(g);
      }
      toast.success(`Metas estruturadas (ABA) sugeridas clinicamente com sucesso para ${pat.nome}!`);
    } catch (err: any) {
      toast.error(err.message || "Falha ao sugerir metas clínicas.");
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatId);
  const patientGoals = goals.filter(g => g.patientId === selectedPatId);

  // Stats computation
  const totalPatGoals = patientGoals.length;
  const acquiredCount = patientGoals.filter(g => g.status === GoalStatus.ACQUIRED || g.status === GoalStatus.GENERALIZED).length;
  const progressPercent = totalPatGoals > 0 ? Math.round((acquiredCount / totalPatGoals) * 100) : 0;

  return (
    <div id="pei-module" className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
          <span className="p-1 rounded-xl bg-blue-50 text-[#1070ca] text-lg">🎯</span> P.E.I. Clínico (Plano de Ensino Individualizado)
        </h2>
        <p className="text-xs text-gray-500">Desenvolva planos de desenvolvimento focados, estabeleça metas comportamentais ABA e acompanhe métricas de evolução real do paciente.</p>
      </div>

      {loading && (
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs text-slate-600 font-medium">
          Carregando metas do PEI...
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Side: Goal Setup & Progress KPI */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">Selecione o Paciente</h3>
            <select
              value={selectedPatId}
              onChange={(e) => setSelectedPatId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1070ca]"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.nome} ({p.diagnostico})</option>
              ))}
            </select>
          </div>

          {/* Progress Tracker Widget */}
          {selectedPatient && (
            <div className="bg-[#1070ca] p-6 rounded-3xl text-white shadow-md space-y-5 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-white/5 rounded-full" />
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-100">Taxa de Proficiência</span>
                <span className="text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-md uppercase font-mono">{acquiredCount} de {totalPatGoals} Metas</span>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-display font-black text-lg truncate leading-tight">{selectedPatient.nome}</h4>
                <p className="text-xs text-blue-100/95 leading-relaxed font-medium">Acompanhamento de autonomia escolar e social integrada.</p>
              </div>

              {/* Graphical Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span>Domínio ABA</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {canCreate && (
                <button
                  onClick={handleGenerateClinicalSuggestions}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-[#1070ca] rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Award className="h-4 w-4" /> Sugerir Metas Clínicas (ABA)
                </button>
              )}
            </div>
          )}

          {/* Add Goal form manual */}
          {canCreate && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-display font-black text-slate-800 text-xs uppercase tracking-widest pb-1 border-b border-slate-50">Criar Meta Personalizada</h3>
              
              <form onSubmit={handleCreateGoal} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Domínio da Habilidade</label>
                  <select
                    value={newDominio}
                    onChange={(e) => setNewDominio(e.target.value as GoalDomain)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value="Comunicação / Linguagem">Comunicação e Linguagem</option>
                    <option value="Habilidades Acadêmicas">Habilidades Acadêmicas</option>
                    <option value="Autonomia / AVD">Autonomia (Atividades de Vida Diária)</option>
                    <option value="Cognitivo / Motor">Cognição e Coordenação Motora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Meta de Comportamento</label>
                  <textarea
                    rows={2}
                    required
                    value={newMeta}
                    onChange={(e) => setNewMeta(e.target.value)}
                    placeholder="Ex: Segurar o giz de cera com pinça trípode para pintar formas geométricas."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nível de Suporte Necessário</label>
                  <input
                    type="text"
                    value={newSuporte}
                    onChange={(e) => setNewSuporte(e.target.value)}
                    placeholder="Ex: Pistas visuais ou suporte físico leve"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Critério de Aquisição ABA</label>
                  <input
                    type="text"
                    value={newTentativas}
                    onChange={(e) => setNewTentativas(e.target.value)}
                    placeholder="Ex: 80% de acertos em 3 sessões consecutivas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#d43f72] hover:bg-[#b02f5a] text-white font-black uppercase tracking-wider text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Inserir Meta ao PEI
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Goals Progress Status Matrix */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-display font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-50">
              <Target className="h-4.5 w-4.5 text-[#1070ca]" /> Metas Ativas do Plano
            </h3>

            <div className="space-y-4">
              {patientGoals.map((g) => {
                const statusColors = {
                  "Não Iniciado": "bg-slate-100 text-slate-600 border-slate-200",
                  "Em Progresso": "bg-blue-100 text-blue-700 border-blue-200",
                  "Adquirido": "bg-blue-100 text-[#1070ca] border-blue-200",
                  "Generalizado": "bg-purple-100 text-purple-700 border-purple-200"
                };
                return (
                  <div key={g.id} className="p-4 bg-slate-50/50 border border-slate-100 hover:border-blue-200 rounded-2xl transition space-y-3 relative">
                    <div className="flex flex-wrap justify-between items-center gap-2 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black font-mono text-slate-400 uppercase tracking-wider">{g.dominio}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${statusColors[g.status]}`}>{g.status}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs font-semibold">
                        <span className="text-[10px] text-slate-400">Status:</span>
                        <select
                          value={g.status}
                          onChange={(e) => handleUpdateStatus(g.id, e.target.value as GoalStatus)}
                          className="bg-white border border-slate-200 rounded p-1 text-[11px] font-bold text-slate-700 focus:outline-none"
                        >
                          <option value="Não Iniciado">Não Iniciado</option>
                          <option value="Em Progresso">Em Progresso</option>
                          <option value="Adquirido">Adquirido</option>
                          <option value="Generalizado">Generalizado</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs font-black text-slate-800 leading-relaxed">{g.meta}</p>

                    <div className="grid sm:grid-cols-2 gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100/50 font-medium">
                      <p><strong className="text-slate-400">Dica de Suporte:</strong> {g.suporteRequerido}</p>
                      <p><strong className="text-slate-400">Métrica ABA:</strong> {g.criterioAquisicao}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 font-mono font-bold">
                      <span>Revisão agendada: {g.dataRevisao}</span>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="text-slate-300 hover:text-red-500 transition absolute top-3 right-3 cursor-pointer"
                          title="Excluir meta do plano"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {patientGoals.length === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-3 border-2 border-dashed border-slate-100 rounded-3xl p-6">
                  <div className="mx-auto h-10 w-10 rounded-full bg-blue-50 text-[#1070ca] flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider">PEI em branco para este paciente.</p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">Clique no botão <strong className="text-[#1070ca] font-black">"Sugerir Metas Clínicas (ABA)"</strong> acima para que o sistema carregue metas psicopedagógicas específicas baseadas no diagnóstico clínico da criança.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDeleteGoal}
        title="Remover meta do PEI?"
        message="Esta meta de aprendizado será removida permanentemente do Plano Educacional Individualizado do paciente. Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="danger"
      />
    </div>
  );
}
