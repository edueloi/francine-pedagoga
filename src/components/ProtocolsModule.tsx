import React, { useState } from "react";
import { 
  FileText, 
  Save, 
  Printer, 
  Trash2, 
  PlusCircle, 
  CheckCircle, 
  Award, 
  Star, 
  Sparkles, 
  Eye, 
  Volume2, 
  Sliders, 
  Activity, 
  Heart, 
  Flame, 
  ArrowRight, 
  Plus, 
  Minus, 
  TrendingUp, 
  HelpCircle,
  Clock,
  ClipboardList
} from "lucide-react";
import { Patient, Protocol, ProtocolType, UserRole, UserPermissions } from "../types";
import { initialProtocols } from "../mockData";

interface ProtocolsModuleProps {
  patients: Patient[];
  userRole: UserRole;
  userPermissions?: UserPermissions;
}

export default function ProtocolsModule({ patients, userRole, userPermissions }: ProtocolsModuleProps) {
  const canCreate = userPermissions ? userPermissions.protocols.criar : (userRole !== UserRole.RESTRICTED);
  const canDelete = userPermissions ? userPermissions.protocols.excluir : (userRole === UserRole.ADMIN);

  const [protocols, setProtocols] = useState<Protocol[]>(initialProtocols);
  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const [selectedProtoType, setSelectedProtoType] = useState<ProtocolType>(ProtocolType.A);
  
  // Workspace states: 'view' (reading active protocol) or 'create' (filling new one)
  const [workspaceMode, setWorkspaceMode] = useState<"view" | "create">("create");
  const [activeProto, setActiveProto] = useState<Protocol | null>(initialProtocols[0] || null);
  const [isViewingPrint, setIsViewingPrint] = useState(false);

  // Filter historical protocols by type
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  // Form states for filling a new protocol
  const [formContent, setFormContent] = useState<Record<string, any>>({});
  const [formObs, setFormObs] = useState("");

  const handleSelectProtocolType = (type: ProtocolType) => {
    setSelectedProtoType(type);
    setFormContent({});
    setFormObs("");
    setWorkspaceMode("create");
  };

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === selectedPatId);
    if (!pat) return;

    // Prefill default fields depending on type if not set
    const finalContent = { ...formContent };
    
    // Set some nice defaults so the saved content doesn't look empty
    if (selectedProtoType === ProtocolType.A) {
      finalContent.motor_grosso_correr = finalContent.motor_grosso_correr || "Sim";
      finalContent.motor_grosso_pular = finalContent.motor_grosso_pular || "Em desenvolvimento";
      finalContent.motor_fino_segurar_lapis = finalContent.motor_fino_segurar_lapis || "Não";
      finalContent.motor_fino_cortar_papel = finalContent.motor_fino_cortar_papel || "Não";
      finalContent.linguagem_vocalizacao = finalContent.linguagem_vocalizacao || "Em desenvolvimento";
      finalContent.social_contato_visual = finalContent.social_contato_visual || "Não";
    } else if (selectedProtoType === ProtocolType.B) {
      finalContent.aba_atencao_compartilhada = finalContent.aba_atencao_compartilhada || "Com suporte verbal leve";
      finalContent.aba_ecolalia = finalContent.aba_ecolalia || "Ausente";
      finalContent.reforcador_principal = finalContent.reforcador_principal || "Carrinho luminoso";
    } else if (selectedProtoType === ProtocolType.C) {
      finalContent.estado_inicial = finalContent.estado_inicial || "Agitado";
      finalContent.tempo_snoezelen = finalContent.tempo_snoezelen || "10 minutos";
      finalContent.cor_luzes = finalContent.cor_luzes || "Azul (Calma)";
      finalContent.estado_final = finalContent.estado_final || "Regulado e atento";
    }

    const newProto: Protocol = {
      id: `prot-${Date.now()}`,
      patientId: selectedPatId,
      tipo: selectedProtoType,
      dataPreenchimento: new Date().toISOString().split("T")[0],
      profissional: "Francine Maria Tersi",
      conteudo: finalContent,
      observacoes: formObs
    };

    setProtocols([newProto, ...protocols]);
    setActiveProto(newProto);
    setWorkspaceMode("view");
    alert(`Protocolo digital salvo com sucesso na pasta de ${pat.nome}!`);
  };

  const handleDeleteProtocol = (id: string) => {
    if (confirm("Deseja realmente remover este protocolo preenchido?")) {
      const remaining = protocols.filter(p => p.id !== id);
      setProtocols(remaining);
      if (activeProto?.id === id) {
        setActiveProto(remaining[0] || null);
        setWorkspaceMode(remaining.length > 0 ? "view" : "create");
      }
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  // Protocols filtered by selected patient and type filter
  const patientProtocols = protocols
    .filter(p => p.patientId === selectedPatId)
    .filter(p => historyFilter === "all" || p.tipo === historyFilter);

  const selectedPatient = patients.find(p => p.id === selectedPatId);

  // Helper colors mapping for badges
  const typeBadgeStyles = {
    [ProtocolType.A]: { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500", label: "Marcos Infantil" },
    [ProtocolType.B]: { bg: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500", label: "ABA" },
    [ProtocolType.C]: { bg: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500", label: "Snoezelen" },
    [ProtocolType.D]: { bg: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500", label: "Evolução" },
    [ProtocolType.E]: { bg: "bg-indigo-50 border-indigo-200 text-indigo-700", dot: "bg-indigo-500", label: "Resumo" }
  };

  return (
    <div id="protocols-module" className="space-y-6">
      
      {/* Visual print mode overlay if viewing printable sheet */}
      {isViewingPrint && activeProto && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs overflow-y-auto p-4 sm:p-10 flex justify-center items-start">
          <div className="w-full max-w-4xl border border-slate-200 p-8 sm:p-12 rounded-3xl shadow-2xl bg-white print-page relative mt-4 mb-10 text-left">
            <div className="absolute top-6 right-6 flex gap-2 no-print">
              <button
                onClick={handleTriggerPrint}
                className="px-4 py-2 bg-[#1070ca] hover:bg-[#0b5194] text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-md"
              >
                <Printer className="h-4 w-4" /> Imprimir / PDF
              </button>
              <button
                onClick={() => setIsViewingPrint(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition border border-slate-200"
              >
                Fechar
              </button>
            </div>

            {/* Print Header */}
            <div className="text-center space-y-2 border-b border-slate-200 pb-6 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Heart className="h-6 w-6 text-[#1070ca] fill-[#1070ca]/10" />
                <h2 className="font-display font-black text-2xl text-slate-900">Espaço Aprender a Ser</h2>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Centro Avançado de Desenvolvimento Infantil & Análise do Comportamento (ABA)</p>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest">AV. PAULISTA, 1000 - SÃO PAULO/SP | CONTATO@APRENDERASER.COM.BR</p>
            </div>

            {/* Protocol Identity Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 mb-6 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-display font-black text-lg text-slate-800 leading-tight">{activeProto.tipo}</h3>
                <span className="text-[9px] font-mono font-black uppercase bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md">
                  REGISTRO OFICIAL
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-2 text-slate-700 font-medium">
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider font-mono">Paciente:</p>
                  <p className="font-black text-slate-800 mt-0.5">{patients.find(p => p.id === activeProto.patientId)?.nome}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider font-mono">Data do Registro:</p>
                  <p className="font-black text-slate-800 mt-0.5">{new Date(activeProto.dataPreenchimento).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider font-mono">Aplicador Clínico:</p>
                  <p className="font-black text-slate-800 mt-0.5">{activeProto.profissional}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider font-mono">Diagnóstico:</p>
                  <p className="font-black text-[#d43f72] mt-0.5">{patients.find(p => p.id === activeProto.patientId)?.diagnostico}</p>
                </div>
              </div>
            </div>

            {/* Form outputs */}
            <div className="space-y-6">
              <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Conteúdo Estruturado da Avaliação</h4>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.keys(activeProto.conteudo).map((key) => {
                  const val = activeProto.conteudo[key];
                  return (
                    <div key={key} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/40 text-xs">
                      <p className="font-bold text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm font-black text-slate-800 mt-1">{String(val)}</p>
                    </div>
                  );
                })}
              </div>

              {activeProto.observacoes && (
                <div className="p-5 bg-amber-50/40 rounded-2xl border border-amber-100 space-y-1.5 mt-6">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider font-mono">Parecer Clínico & Diretrizes Operacionais Adicionais:</p>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-semibold">{activeProto.observacoes}</p>
                </div>
              )}
            </div>

            {/* Signature Area */}
            <div className="mt-20 text-center border-t border-slate-200 pt-8 max-w-sm mx-auto space-y-1">
              <p className="text-xs font-black text-slate-800">{activeProto.profissional}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Coordenação Clínica • Reg. 1290-SP</p>
              <div className="text-[9px] text-[#1070ca] font-black italic mt-1 bg-blue-50/50 py-1 px-3 rounded-lg border border-blue-100 inline-block">
                Assinado eletronicamente via Prontuário Aprender a Ser
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Side: Patient and Protocol Timeline feed */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Patient Quick Selector */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4 text-left">
            <h3 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-[#d43f72]" /> Selecione o Prontuário
            </h3>
            
            <select
              value={selectedPatId}
              onChange={(e) => {
                setSelectedPatId(e.target.value);
                setHistoryFilter("all");
                // Select first protocol of new patient if available
                const firstPatProto = protocols.find(p => p.patientId === e.target.value);
                if (firstPatProto) {
                  setActiveProto(firstPatProto);
                  setWorkspaceMode("view");
                } else {
                  setWorkspaceMode("create");
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1070ca]"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.nome} ({p.idade} anos)</option>
              ))}
            </select>

            {selectedPatient && (
              <div className="p-3 bg-blue-50/30 border border-blue-100/50 rounded-2xl flex flex-col gap-1">
                <span className="text-[8px] font-mono font-black text-[#1070ca] uppercase tracking-wider">Diagnóstico Associado</span>
                <span className="text-xs font-black text-slate-800">{selectedPatient.diagnostico}</span>
              </div>
            )}
          </div>

          {/* Historical timeline feed */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList className="h-4.5 w-4.5 text-[#1070ca]" /> Pasta de Protocolos ({patientProtocols.length})
              </h3>
              
              <button
                onClick={() => setWorkspaceMode("create")}
                className="text-[10px] font-black text-[#1070ca] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-0.5 cursor-pointer border border-blue-100"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Novo
              </button>
            </div>

            {/* Timeline filter bar */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setHistoryFilter("all")}
                className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border whitespace-nowrap cursor-pointer transition ${
                  historyFilter === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Todos
              </button>
              {Object.values(ProtocolType).map((type) => {
                const style = typeBadgeStyles[type];
                const isSelected = historyFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setHistoryFilter(type)}
                    className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border whitespace-nowrap cursor-pointer transition ${
                      isSelected 
                        ? "bg-[#1070ca] text-white border-[#1070ca]" 
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
            
            {/* Scrollable list */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {patientProtocols.map(proto => {
                const isActive = activeProto?.id === proto.id && workspaceMode === "view";
                const badgeStyle = typeBadgeStyles[proto.tipo] || { bg: "bg-slate-100 text-slate-800", dot: "bg-slate-400", label: "Protocolo" };
                return (
                  <div
                    key={proto.id}
                    onClick={() => {
                      setActiveProto(proto);
                      setWorkspaceMode("view");
                    }}
                    className={`p-3.5 rounded-2xl border transition text-left cursor-pointer relative group ${
                      isActive 
                        ? "bg-blue-50/30 border-[#1070ca] shadow-xs" 
                        : "bg-slate-50/50 border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded-md border ${badgeStyle.bg}`}>
                        <span className={`h-1 w-1 rounded-full ${badgeStyle.dot}`} />
                        {badgeStyle.label}
                      </span>
                      <span className="text-[8.5px] font-mono font-bold text-slate-400">
                        {new Date(proto.dataPreenchimento).toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-800 mt-2 leading-tight">
                      {proto.tipo}
                    </h4>

                    {proto.observacoes && (
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-medium italic">
                        "{proto.observacoes}"
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100/60 opacity-90 group-hover:opacity-100">
                      <span className="text-[9px] font-bold text-slate-400">
                        Por: {proto.profissional.split(" ")[0]}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProto(proto);
                            setIsViewingPrint(true);
                          }}
                          className="text-[9.5px] font-black uppercase tracking-wider text-[#1070ca] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Printer className="h-3 w-3" /> Imprimir
                        </button>
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProtocol(proto.id);
                            }}
                            className="text-slate-300 hover:text-red-500 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {patientProtocols.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
                  <FileText className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500 font-bold">Nenhum protocolo histórico</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Selecione outro filtro ou preencha um novo abaixo.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Active Workspace Pane */}
        <div className="lg:col-span-8 space-y-6 text-left">
          
          {/* Workspace Tab Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  if (activeProto) {
                    setWorkspaceMode("view");
                  } else {
                    alert("Por favor, selecione ou crie um protocolo primeiro.");
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  workspaceMode === "view" 
                    ? "bg-[#1070ca] text-white shadow-xs" 
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Eye className="h-4 w-4" /> Visualizar Protocolo
              </button>
              
              <button
                onClick={() => setWorkspaceMode("create")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  workspaceMode === "create" 
                    ? "bg-[#1070ca] text-white shadow-xs" 
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Plus className="h-4 w-4" /> Preencher Novo
              </button>
            </div>

            {workspaceMode === "view" && activeProto && (
              <button
                onClick={() => setIsViewingPrint(true)}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[#1070ca] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-3xs"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
              </button>
            )}
          </div>

          {/* VIEW MODE WORKSPACE CARD */}
          {workspaceMode === "view" && activeProto ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 relative overflow-hidden">
              
              {/* Abstract decorative top strip based on badge color */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1070ca]" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-4 gap-2">
                <div>
                  <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-[#1070ca] bg-blue-50 px-2 py-0.5 rounded">
                    Registro de Francine Maria Tersi
                  </span>
                  <h3 className="font-display font-black text-slate-800 text-base leading-tight mt-1">
                    {activeProto.tipo}
                  </h3>
                </div>
                <div className="text-right text-[10.5px] font-mono font-bold text-slate-400">
                  Cadastrado em: {new Date(activeProto.dataPreenchimento).toLocaleDateString("pt-BR")}
                </div>
              </div>

              {/* Patient context banner */}
              <div className="grid sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase">Paciente Avaliado</span>
                  <p className="font-black text-slate-800 mt-0.5">
                    {patients.find(p => p.id === activeProto.patientId)?.nome}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase">Diagnóstico Clínico</span>
                  <p className="font-black text-[#d43f72] mt-0.5">
                    {patients.find(p => p.id === activeProto.patientId)?.diagnostico}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase">Status do Documento</span>
                  <p className="font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5" /> Homologado e Assinado
                  </p>
                </div>
              </div>

              {/* Dynamic rendering of clinical values depending on type */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Respostas e Status Mapeados:</h4>
                
                {/* Custom layout if ProtocolType A */}
                {activeProto.tipo === ProtocolType.A ? (
                  <div className="space-y-4">
                    {/* Progress tracking */}
                    {(() => {
                      const keys = Object.keys(activeProto.conteudo);
                      const yesCount = keys.filter(k => activeProto.conteudo[k] === "Sim").length;
                      const devCount = keys.filter(k => activeProto.conteudo[k] === "Em desenvolvimento").length;
                      const noCount = keys.filter(k => activeProto.conteudo[k] === "Não").length;
                      const total = keys.length || 1;
                      const successRate = Math.round((yesCount / total) * 100);

                      return (
                        <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between text-xs font-black text-emerald-800">
                            <span>Índice de Marcos Alcançados (Sucedidos):</span>
                            <span>{successRate}% ({yesCount} de {total})</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(yesCount/total)*100}%` }} />
                            <div className="bg-amber-400 h-full" style={{ width: `${(devCount/total)*100}%` }} />
                            <div className="bg-rose-400 h-full" style={{ width: `${(noCount/total)*100}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Sim: {yesCount}</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Em Des.: {devCount}</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Não: {noCount}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Grouped grid of milestones */}
                    <div className="grid sm:grid-cols-2 gap-3.5">
                      {Object.keys(activeProto.conteudo).map((key) => {
                        const val = activeProto.conteudo[key];
                        let statusColor = "bg-rose-50 text-rose-700 border-rose-100";
                        if (val === "Sim") statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        if (val === "Em desenvolvimento") statusColor = "bg-amber-50 text-amber-700 border-amber-100";

                        return (
                          <div key={key} className="p-3 border border-slate-100 rounded-2xl flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${statusColor}`}>
                              {val}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : activeProto.tipo === ProtocolType.C ? (
                  /* Custom layout if Snoezelen Room */
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl border border-slate-100 bg-purple-50/20 text-center space-y-1">
                        <span className="text-[9px] font-mono font-black text-purple-600 uppercase">Esquema de Luz</span>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          <span className="h-3.5 w-3.5 rounded-full bg-blue-500 animate-pulse inline-block" />
                          <p className="text-xs font-black text-slate-800">{activeProto.conteudo.cor_luzes || "Azul (Calma)"}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-100 bg-blue-50/20 text-center space-y-1">
                        <span className="text-[9px] font-mono font-black text-blue-600 uppercase">Som / Trilha</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Volume2 className="h-4 w-4 text-blue-500" />
                          <p className="text-xs font-black text-slate-800">{activeProto.conteudo.som_ambiente || "Sons de Natureza"}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-100 bg-amber-50/20 text-center space-y-1">
                        <span className="text-[9px] font-mono font-black text-amber-600 uppercase">Tempo de Sala</span>
                        <p className="text-xs font-black text-slate-800 mt-1">{activeProto.conteudo.tempo_snoezelen || "10 min"}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {Object.keys(activeProto.conteudo).map((key) => {
                        if (["cor_luzes", "som_ambiente", "tempo_snoezelen"].includes(key)) return null;
                        return (
                          <div key={key} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-wider">{key.replace(/_/g, " ")}:</span>
                            <p className="text-xs font-bold text-slate-700 mt-1">{activeProto.conteudo[key]}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Standard generic protocol output grid */
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.keys(activeProto.conteudo).map((key) => (
                      <div key={key} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="text-[9.5px] font-black uppercase text-slate-400 font-mono tracking-wider">
                          {key.replace(/_/g, " ").replace(/aba_/g, "ABA ")}
                        </span>
                        <p className="text-xs font-black text-slate-800 mt-1">{String(activeProto.conteudo[key])}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes and general observations block */}
                {activeProto.observacoes && (
                  <div className="p-5 bg-amber-50/30 border border-amber-150/60 rounded-3xl mt-4">
                    <h5 className="text-[10px] font-black uppercase text-amber-800 tracking-wider font-mono">
                      Diretriz e Parecer Clínico Adicional:
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold mt-1.5 whitespace-pre-wrap">
                      {activeProto.observacoes}
                    </p>
                  </div>
                )}
              </div>

              {/* Clinician Signature Footer block */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-[#1070ca] flex items-center justify-center font-bold">
                    FT
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">{activeProto.profissional}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Terapeuta ABA / Especialista em Neurodesenvolvimento</p>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 text-center sm:text-right bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-100">
                  ID: <span className="font-bold">{activeProto.id}</span> • Chave: <span className="font-bold">A-S-S-I-G-N-E-D</span>
                </div>
              </div>

            </div>
          ) : workspaceMode === "view" ? (
            /* Empty state for view mode if no protocols exist */
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center space-y-3">
              <FileText className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="font-display font-black text-slate-800 text-sm uppercase">Nenhum protocolo para este paciente</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">Não há protocolos históricos cadastrados na pasta deste prontuário. Clique em "Preencher Novo" para iniciar.</p>
              <button
                onClick={() => setWorkspaceMode("create")}
                className="px-4 py-2 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Criar Novo Protocolo
              </button>
            </div>
          ) : null}

          {/* CREATE FORM MODE WORKSPACE CARD */}
          {workspaceMode === "create" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5">
                    <PlusCircle className="h-4.5 w-4.5 text-[#1070ca]" /> Preencher Registro Técnico
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">Selecione o tipo de formulário e preencha as métricas estruturadas do paciente.</p>
                </div>

                {/* Horizontal selector for Type of Protocol */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.values(ProtocolType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSelectProtocolType(type)}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border cursor-pointer transition-all ${
                        selectedProtoType === type 
                          ? "bg-[#1070ca] text-white border-[#1070ca] shadow-xs" 
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {typeBadgeStyles[type].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form implementation */}
              <form onSubmit={handleSaveProtocol} className="space-y-6">
                
                <div className="p-4 bg-blue-50/20 border border-blue-100/50 rounded-2xl">
                  <span className="text-[8.5px] font-mono font-black uppercase text-[#1070ca] bg-blue-100 px-2.5 py-0.5 rounded">
                    FORMULÁRIO ATIVO
                  </span>
                  <p className="text-xs font-black text-slate-800 mt-2">{selectedProtoType}</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">As respostas serão agregadas à linha do tempo e à ficha evolutiva de {selectedPatient?.nome}.</p>
                </div>

                {/* FORM SPECIFIC FIELDS: TYPE A (Desenvolvimento Infantil) */}
                {selectedProtoType === ProtocolType.A && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Checklist de Marcos de Desenvolvimento (0 a 6 anos)</h4>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      
                      {/* Motor Grosso Card */}
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4">
                        <span className="text-[9px] font-mono font-black text-blue-700 bg-blue-100/50 px-2 py-0.5 rounded uppercase">
                          🏃‍♂️ Motricidade Grossa
                        </span>
                        
                        <div className="space-y-3">
                          <div className="space-y-1.5 text-left">
                            <span className="text-xs font-bold text-slate-700">Consegue correr de forma estável?</span>
                            <div className="flex gap-1.5">
                              {["Não", "Em desenvolvimento", "Sim"].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormContent({ ...formContent, "motor_grosso_correr": val })}
                                  className={`flex-1 py-1 px-2.5 text-[10px] font-bold rounded-lg border text-center transition ${
                                    formContent.motor_grosso_correr === val 
                                      ? "bg-[#1070ca] text-white border-[#1070ca]" 
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-xs font-bold text-slate-700">Consegue pular com os dois pés?</span>
                            <div className="flex gap-1.5">
                              {["Não", "Em desenvolvimento", "Sim"].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormContent({ ...formContent, "motor_grosso_pular": val })}
                                  className={`flex-1 py-1 px-2.5 text-[10px] font-bold rounded-lg border text-center transition ${
                                    formContent.motor_grosso_pular === val 
                                      ? "bg-[#1070ca] text-white border-[#1070ca]" 
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Motor Fino Card */}
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4">
                        <span className="text-[9px] font-mono font-black text-[#d43f72] bg-pink-100/50 px-2 py-0.5 rounded uppercase">
                          ✏️ Motricidade Fina
                        </span>

                        <div className="space-y-3">
                          <div className="space-y-1.5 text-left">
                            <span className="text-xs font-bold text-slate-700">Segura lápis adequadamente?</span>
                            <div className="flex gap-1.5">
                              {["Não", "Em desenvolvimento", "Sim"].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormContent({ ...formContent, "motor_fino_segurar_lapis": val })}
                                  className={`flex-1 py-1 px-2.5 text-[10px] font-bold rounded-lg border text-center transition ${
                                    formContent.motor_fino_segurar_lapis === val 
                                      ? "bg-[#1070ca] text-white border-[#1070ca]" 
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-xs font-bold text-slate-700">Consegue recortar papel em linha reta?</span>
                            <div className="flex gap-1.5">
                              {["Não", "Em desenvolvimento", "Sim"].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormContent({ ...formContent, "motor_fino_cortar_papel": val })}
                                  className={`flex-1 py-1 px-2.5 text-[10px] font-bold rounded-lg border text-center transition ${
                                    formContent.motor_fino_cortar_papel === val 
                                      ? "bg-[#1070ca] text-white border-[#1070ca]" 
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Linguagem Card */}
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4">
                        <span className="text-[9px] font-mono font-black text-teal-700 bg-teal-100/50 px-2 py-0.5 rounded uppercase">
                          🗣️ Linguagem & Comunicação
                        </span>

                        <div className="space-y-3">
                          <div className="space-y-1.5 text-left">
                            <span className="text-xs font-bold text-slate-700">Vocaliza de forma funcional?</span>
                            <div className="flex gap-1.5">
                              {["Não", "Em desenvolvimento", "Sim"].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormContent({ ...formContent, "linguagem_vocalizacao": val })}
                                  className={`flex-1 py-1 px-2.5 text-[10px] font-bold rounded-lg border text-center transition ${
                                    formContent.linguagem_vocalizacao === val 
                                      ? "bg-[#1070ca] text-white border-[#1070ca]" 
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-xs font-bold text-slate-700">Forma frases completas de 3+ palavras?</span>
                            <div className="flex gap-1.5">
                              {["Não", "Em desenvolvimento", "Sim"].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormContent({ ...formContent, "linguagem_frases_completas": val })}
                                  className={`flex-1 py-1 px-2.5 text-[10px] font-bold rounded-lg border text-center transition ${
                                    formContent.linguagem_frases_completas === val 
                                      ? "bg-[#1070ca] text-white border-[#1070ca]" 
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Social Card */}
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4">
                        <span className="text-[9px] font-mono font-black text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded uppercase">
                          🤝 Cognição Social
                        </span>

                        <div className="space-y-3">
                          <div className="space-y-1.5 text-left">
                            <span className="text-xs font-bold text-slate-700">Sustenta contato visual por mais de 3s?</span>
                            <div className="flex gap-1.5">
                              {["Não", "Em desenvolvimento", "Sim"].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormContent({ ...formContent, "social_contato_visual": val })}
                                  className={`flex-1 py-1 px-2.5 text-[10px] font-bold rounded-lg border text-center transition ${
                                    formContent.social_contato_visual === val 
                                      ? "bg-[#1070ca] text-white border-[#1070ca]" 
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-xs font-bold text-slate-700">Brinca de forma cooperativa?</span>
                            <div className="flex gap-1.5">
                              {["Não", "Em desenvolvimento", "Sim"].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormContent({ ...formContent, "social_brincar_compartilhado": val })}
                                  className={`flex-1 py-1 px-2.5 text-[10px] font-bold rounded-lg border text-center transition ${
                                    formContent.social_brincar_compartilhado === val 
                                      ? "bg-[#1070ca] text-white border-[#1070ca]" 
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* FORM SPECIFIC FIELDS: TYPE B (Observação Psicopedagógica ABA) */}
                {selectedProtoType === ProtocolType.B && (
                  <div className="space-y-5">
                    <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Tríplice Contingência & Mapeamento Comportamental ABA</h4>
                    
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150/60 space-y-4">
                      
                      {/* Clinical ABC Input box */}
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider font-mono">Registro Comportamental A-B-C (Antecedente-Comportamento-Consequência):</p>
                      
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Antecedente (A)</label>
                          <input
                            type="text"
                            placeholder="Ex: Demanda de escrita apresentada"
                            onChange={(e) => setFormContent({ ...formContent, "aba_abc_antecedente": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Comportamento (B)</label>
                          <input
                            type="text"
                            placeholder="Ex: Jogar o lápis e gritar"
                            onChange={(e) => setFormContent({ ...formContent, "aba_abc_comportamento": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Consequência (C)</label>
                          <input
                            type="text"
                            placeholder="Ex: Retirada temporária da tarefa"
                            onChange={(e) => setFormContent({ ...formContent, "aba_abc_consequencia": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Behavioral Function Buttons */}
                      <div className="space-y-2 mt-2 text-left">
                        <span className="text-[10px] font-bold text-slate-500">Função Provável do Comportamento Inadequado:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["Fuga de Demanda", "Acesso a Tangível", "Atenção Social", "Estimulação Sensorial Auto-reforçadora"].map((func) => {
                            const isSel = formContent.aba_funcao_comportamento === func;
                            return (
                              <button
                                key={func}
                                type="button"
                                onClick={() => setFormContent({ ...formContent, "aba_funcao_comportamento": func })}
                                className={`py-1.5 px-3 rounded-lg border text-[10px] font-black transition cursor-pointer ${
                                  isSel ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {func}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 border-t border-slate-200/50 pt-4 text-xs font-semibold">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Reforçador de Alto Valor Identificado:</label>
                          <input
                            type="text"
                            placeholder="Ex: Carrinho de fricção, massinha azul"
                            onChange={(e) => setFormContent({ ...formContent, "reforcador_principal": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Atenção Compartilhada sustentada na mesa?</label>
                          <select
                            onChange={(e) => setFormContent({ ...formContent, "aba_atencao_compartilhada": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700"
                          >
                            <option value="Independente">Independente</option>
                            <option value="Com suporte verbal leve">Com suporte verbal leve</option>
                            <option value="Com suporte verbal intenso">Com suporte verbal intenso</option>
                            <option value="Não demonstrou">Não demonstrou</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* FORM SPECIFIC FIELDS: TYPE C (Regulação Snoezelen) */}
                {selectedProtoType === ProtocolType.C && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Ajustes & Respostas Clínicas na Sala Snoezelen</h4>
                    
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      
                      {/* Interactive Visual Light Picker circle buttons */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider font-mono">1. Esquema Cromático de Iluminação Ativa:</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            { name: "Azul (Calma e Redução)", class: "bg-blue-500" },
                            { name: "Verde (Estabilidade e Concentração)", class: "bg-emerald-500" },
                            { name: "Amarelo (Estímulo Cognitivo)", class: "bg-amber-400" },
                            { name: "Roxo (Regulação Profunda)", class: "bg-purple-500" },
                            { name: "Branco Quente (Acolhimento)", class: "bg-orange-100 border border-slate-300" },
                            { name: "Vermelho (Estímulo Motor)", class: "bg-rose-500" }
                          ].map((colorObj) => {
                            const isSelected = formContent.cor_luzes === colorObj.name;
                            return (
                              <button
                                key={colorObj.name}
                                type="button"
                                onClick={() => setFormContent({ ...formContent, "cor_luzes": colorObj.name })}
                                className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                  isSelected ? "bg-purple-600 text-white border-purple-600 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <span className={`h-3 w-3 rounded-full ${colorObj.class}`} />
                                {colorObj.name.split(" (")[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tactile Snoezelen Equipments Checkbox array */}
                      <div className="space-y-2 border-t border-slate-200/50 pt-3">
                        <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider font-mono">2. Equipamentos Utilizados (Pareamento Sensorial):</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            "Cascata de Fibra Óptica",
                            "Coluna de Bolhas de Água",
                            "Piscina de Esferas Luminosas",
                            "Tapete de Textura Tátil",
                            "Difusor de Aromaterapia",
                            "Painel de Espelhos Infinitos"
                          ].map((equip) => {
                            const currentList = formContent.snoezelen_equipamentos || [];
                            const isIncluded = currentList.includes(equip);
                            
                            const toggleEquip = () => {
                              const newList = isIncluded 
                                ? currentList.filter((e: string) => e !== equip)
                                : [...currentList, equip];
                              setFormContent({ ...formContent, "snoezelen_equipamentos": newList });
                            };

                            return (
                              <button
                                key={equip}
                                type="button"
                                onClick={toggleEquip}
                                className={`p-2.5 rounded-xl border text-[10px] font-bold text-center transition ${
                                  isIncluded ? "bg-purple-500 text-white border-purple-500" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                                }`}
                              >
                                {equip}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 border-t border-slate-200/50 pt-4 text-xs font-semibold">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Estado Emocional na Chegada:</label>
                          <input
                            type="text"
                            placeholder="Ex: Hiperativo, em choro"
                            onChange={(e) => setFormContent({ ...formContent, "estado_inicial": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Trilha Sonora Sonora Utilizada:</label>
                          <input
                            type="text"
                            placeholder="Ex: Sons de água de riacho, batidas binaturais"
                            onChange={(e) => setFormContent({ ...formContent, "som_ambiente": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Massagem Compressiva de Regulação:</label>
                          <select
                            onChange={(e) => setFormContent({ ...formContent, "massagem_compressiva": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                          >
                            <option value="Não">Não realizada</option>
                            <option value="Sim (Costas/Ombros)">Sim (Costas e Ombros)</option>
                            <option value="Sim (Pés/Pernas)">Sim (Membros Inferiores)</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* FORM SPECIFIC FIELDS: TYPE D (Evolução de Rotina) */}
                {selectedProtoType === ProtocolType.D && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Evolução Terapêutica Diária</h4>
                    
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      
                      {/* Star Rating for Child cooperativeness level */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase text-slate-500">Nível de Cooperação & Engajamento do Paciente:</label>
                        <div className="flex gap-1.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const current = formContent.cooperacao_estrelas || 3;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFormContent({ ...formContent, "cooperacao_estrelas": star })}
                                className="p-1 cursor-pointer transition transform hover:scale-110"
                              >
                                <Star className={`h-6 w-6 ${star <= current ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                              </button>
                            );
                          })}
                          <span className="text-xs font-bold text-slate-500 ml-2 self-center">
                            ({formContent.cooperacao_estrelas || 3} de 5 estrelas)
                          </span>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 text-xs font-semibold">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Atividade Acadêmica / Foco Principal:</label>
                          <input
                            type="text"
                            placeholder="Ex: Identificação e traçado da letra B"
                            onChange={(e) => setFormContent({ ...formContent, "evol_foco_academico": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Nível de Suporte Necessário:</label>
                          <select
                            onChange={(e) => setFormContent({ ...formContent, "evol_independencia": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700"
                          >
                            <option value="Totalmente Independente">Totalmente Independente</option>
                            <option value="Suporte Leve">Suporte Leve</option>
                            <option value="Suporte Moderado">Suporte Moderado</option>
                            <option value="Suporte Intenso">Suporte Intenso</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* FORM SPECIFIC FIELDS: TYPE E (Resumo Mensal) */}
                {selectedProtoType === ProtocolType.E && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Fechamento e Resumo Clínico Mensal</h4>
                    
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      
                      <div className="grid sm:grid-cols-2 gap-4 text-xs font-semibold">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Total de Atendimentos Realizados no Mês:</label>
                          <input
                            type="text"
                            placeholder="Ex: 8 sessões presenciais"
                            onChange={(e) => setFormContent({ ...formContent, "resumo_sessoes_ratio": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Principal Ganho Clínico Mensal Detectado:</label>
                          <input
                            type="text"
                            placeholder="Ex: Sustentação de contato visual sem suporte ecoico"
                            onChange={(e) => setFormContent({ ...formContent, "resumo_ganho_comportamental": e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5"
                          />
                        </div>
                      </div>

                      {/* Multi-disciplinary clinical areas involved checkmarks */}
                      <div className="space-y-2 border-t border-slate-200/50 pt-3">
                        <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider font-mono">Especialidades Integradas no Fechamento:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            "Psicopedagogia",
                            "Fonoaudiologia",
                            "Terapia Ocupacional",
                            "Fisioterapia Motora",
                            "Neurologia Infantil",
                            "Intervenção ABA",
                            "Orientação Parental"
                          ].map((spec) => {
                            const currentList = formContent.resumo_especialidades || [];
                            const isIncluded = currentList.includes(spec);

                            const toggleSpec = () => {
                              const newList = isIncluded 
                                ? currentList.filter((s: string) => s !== spec)
                                : [...currentList, spec];
                              setFormContent({ ...formContent, "resumo_especialidades": newList });
                            };

                            return (
                              <button
                                key={spec}
                                type="button"
                                onClick={toggleSpec}
                                className={`p-2.5 rounded-xl border text-[10px] font-bold text-center transition ${
                                  isIncluded ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                                }`}
                              >
                                {spec}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Free Text Clinical Observation */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">
                    Considerações e Parecer Técnico Adicional
                  </label>
                  <textarea
                    rows={4}
                    value={formObs}
                    onChange={(e) => setFormObs(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1070ca] focus:bg-white transition-all resize-none"
                    placeholder="Relate observações informais, intercorrências, humor geral do paciente, aceitação de reforçadores ou recomendações de treino em mesa..."
                  />
                </div>

                {canCreate && (
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1070ca] hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="h-4.5 w-4.5" /> Salvar Protocolo Oficial no Prontuário
                  </button>
                )}
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
