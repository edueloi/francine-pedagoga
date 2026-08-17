import React, { useState, useEffect } from "react";
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
  ClipboardList,
  Pencil,
  X as XIcon
} from "lucide-react";
import jsPDF from "jspdf";
import { Patient, Protocol, ProtocolType, UserRole, UserPermissions } from "../types";
import { useProtocols } from "../hooks/useProtocols";
import { useClinicSettings } from "../hooks/useClinicSettings";
import { useToast, ConfirmModal } from "./UI";

interface ProtocolsModuleProps {
  patients: Patient[];
  userRole: UserRole;
  userPermissions?: UserPermissions;
}

export default function ProtocolsModule({ patients, userRole, userPermissions }: ProtocolsModuleProps) {
  const toast = useToast();
  const { settings: clinic } = useClinicSettings();
  const canCreate = userPermissions ? userPermissions.protocols.criar : (userRole !== UserRole.RESTRICTED);
  const canDelete = userPermissions ? userPermissions.protocols.excluir : (userRole === UserRole.ADMIN);

  const { protocols, loading, error, createProtocol, updateProtocol, deleteProtocol } = useProtocols();
  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const [selectedProtoType, setSelectedProtoType] = useState<ProtocolType>(ProtocolType.A);

  // Workspace states: 'view' (reading active protocol) or 'create' (filling new one)
  const [workspaceMode, setWorkspaceMode] = useState<"view" | "create">("create");
  const [activeProto, setActiveProto] = useState<Protocol | null>(null);
  const [isViewingPrint, setIsViewingPrint] = useState(false);

  // Filter historical protocols by type
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  // Form states for filling a new protocol
  const [formContent, setFormContent] = useState<Record<string, any>>({});
  const [formObs, setFormObs] = useState("");

  // When set, the "create" workspace acts as an edit form for this existing protocol
  // instead of a blank one (updateProtocol instead of createProtocol on submit).
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);

  // Delete confirmation flow
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Once protocols load for the first time, default to viewing the first one for the selected patient.
  useEffect(() => {
    if (!activeProto && protocols.length > 0) {
      const firstForPatient = protocols.find(p => p.patientId === selectedPatId) || protocols[0];
      setActiveProto(firstForPatient);
      setWorkspaceMode("view");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocols]);

  const handleSelectProtocolType = (type: ProtocolType) => {
    setSelectedProtoType(type);
    setFormContent({});
    setFormObs("");
    setEditingProtocol(null);
    setWorkspaceMode("create");
  };

  // Blank slate for a brand-new protocol, for the selected patient.
  const handleStartNew = () => {
    setEditingProtocol(null);
    setFormContent({});
    setFormObs("");
    setWorkspaceMode("create");
  };

  // Loads an existing protocol's data into the form so it can be corrected —
  // including which patient it belongs to, via the same patient selector used
  // for creating protocols (previously there was no way to edit a saved protocol
  // at all, only delete and recreate it from scratch).
  const handleStartEdit = (proto: Protocol) => {
    setEditingProtocol(proto);
    setSelectedPatId(proto.patientId);
    setSelectedProtoType(proto.tipo);
    setFormContent({ ...proto.conteudo });
    setFormObs(proto.observacoes || "");
    setWorkspaceMode("create");
  };

  const handleCancelEdit = () => {
    setEditingProtocol(null);
    setFormContent({});
    setFormObs("");
    setWorkspaceMode(activeProto ? "view" : "create");
  };

  const handleSaveProtocol = async (e: React.FormEvent) => {
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

    const newProtoPayload: Partial<Protocol> = {
      patientId: selectedPatId,
      tipo: selectedProtoType,
      dataPreenchimento: editingProtocol?.dataPreenchimento || new Date().toISOString().split("T")[0],
      profissional: editingProtocol?.profissional || "Francine Maria Tersi",
      conteudo: finalContent,
      observacoes: formObs
    };

    try {
      if (editingProtocol) {
        const updated = await updateProtocol(editingProtocol.id, newProtoPayload);
        if (updated) {
          setActiveProto(updated);
          setWorkspaceMode("view");
        }
        setEditingProtocol(null);
        toast.success(`Protocolo atualizado com sucesso na pasta de ${pat.nome}!`);
      } else {
        const created = await createProtocol(newProtoPayload);
        if (created) {
          setActiveProto(created);
          setWorkspaceMode("view");
        }
        toast.success(`Protocolo digital salvo com sucesso na pasta de ${pat.nome}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar protocolo.");
    }
  };

  const handleDeleteProtocol = (id: string) => {
    setPendingDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDeleteProtocol = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setIsDeleting(true);
    try {
      await deleteProtocol(id);
      if (activeProto?.id === id) {
        const remaining = protocols.filter(p => p.id !== id);
        setActiveProto(remaining[0] || null);
        setWorkspaceMode(remaining.length > 0 ? "view" : "create");
      }
      setConfirmDeleteOpen(false);
      setPendingDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || "Falha ao remover protocolo.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Builds a real PDF file (not a browser print/screenshot) so the document is
  // laid out on its own terms — consistent margins/pagination regardless of the
  // viewer's browser/OS print dialog, and downloadable without any "print" step.
  const handleDownloadPdf = () => {
    if (!activeProto) return;
    const patient = patients.find((p) => p.id === activeProto.patientId);

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const contentWidth = pageWidth - marginX * 2;
    let y = 20;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    };

    const clinicName = clinic?.name || "Clínica";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(clinicName, pageWidth / 2, y, { align: "center" });
    y += 6;

    if (clinic?.activities) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(clinic.activities.toUpperCase(), pageWidth / 2, y, { align: "center" });
      y += 5;
    }

    const contactLine = [clinic?.address, clinic?.email].filter(Boolean).join(" | ");
    if (contactLine) {
      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(contactLine.toUpperCase(), pageWidth / 2, y, { align: "center" });
      y += 5;
    }

    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 9;

    // Identity card — height adapts to whichever field wraps to the most lines.
    // A fixed 26mm card used to let long patient names/diagnósticos overflow the
    // box and bleed into the "CONTEÚDO ESTRUTURADO" header drawn right after it.
    const identityCols = [
      { label: "PACIENTE", value: patient?.nome || "-" },
      { label: "DATA DO REGISTRO", value: new Date(activeProto.dataPreenchimento).toLocaleDateString("pt-BR") },
      { label: "APLICADOR CLÍNICO", value: activeProto.profissional },
      { label: "DIAGNÓSTICO", value: patient?.diagnostico || "-" },
    ];
    const colWidth = contentWidth / 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const identityWrapped = identityCols.map((col) => doc.splitTextToSize(col.value, colWidth - 6));
    const maxValueLines = Math.max(1, ...identityWrapped.map((w) => w.length));
    const cardHeight = Math.max(26, 14 + maxValueLines * 4.2);
    ensureSpace(cardHeight + 8);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, contentWidth, cardHeight, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(activeProto.tipo, marginX + 5, y + 8);

    doc.setFillColor(219, 234, 254);
    const badgeText = "REGISTRO OFICIAL";
    const badgeWidth = doc.getTextWidth(badgeText) + 6;
    doc.roundedRect(pageWidth - marginX - badgeWidth - 5, y + 4, badgeWidth, 6, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(30, 64, 175);
    doc.text(badgeText, pageWidth - marginX - badgeWidth - 5 + 3, y + 8);

    identityCols.forEach((col, i) => {
      const x = marginX + 5 + i * colWidth;
      doc.setFont("courier", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(col.label, x, y + 15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(identityWrapped[i], x, y + 20);
    });
    y += cardHeight + 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("CONTEÚDO ESTRUTURADO DA AVALIAÇÃO", marginX, y);
    y += 3;
    doc.setDrawColor(241, 245, 249);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;

    // 2-column grid, matching the on-screen layout (`grid sm:grid-cols-2`) — a
    // single column here doubled the vertical space needed and pushed the
    // signature block onto a spurious extra page.
    const gap = 4;
    const colW = (contentWidth - gap) / 2;
    const entries = Object.keys(activeProto.conteudo).map((key) => {
      const label = key.replace(/_/g, " ").toUpperCase();
      const value = String(activeProto.conteudo[key]);
      const wrappedValue = doc.splitTextToSize(value, colW - 8);
      const blockHeight = 8 + wrappedValue.length * 4.2;
      return { label, wrappedValue, blockHeight };
    });

    for (let i = 0; i < entries.length; i += 2) {
      const rowEntries = [entries[i], entries[i + 1]].filter(Boolean);
      const rowHeight = Math.max(...rowEntries.map((e) => e.blockHeight));
      ensureSpace(rowHeight + 3);

      rowEntries.forEach((entry, colIdx) => {
        const x = marginX + colIdx * (colW + gap);
        doc.setFillColor(250, 250, 252);
        doc.roundedRect(x, y, colW, rowHeight, 2, 2, "F");
        doc.setFont("courier", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(entry.label, x + 4, y + 5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(entry.wrappedValue, x + 4, y + 10);
      });
      y += rowHeight + 3;
    }

    if (activeProto.observacoes) {
      const wrapped = doc.splitTextToSize(activeProto.observacoes, contentWidth - 10);
      const blockHeight = 8 + wrapped.length * 4.2;
      ensureSpace(blockHeight + 6);
      y += 3;
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(marginX, y, contentWidth, blockHeight, 2, 2, "F");
      doc.setFont("courier", "bold");
      doc.setFontSize(7);
      doc.setTextColor(146, 64, 14);
      doc.text("PARECER CLÍNICO & DIRETRIZES OPERACIONAIS ADICIONAIS", marginX + 5, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(wrapped, marginX + 5, y + 11);
      y += blockHeight + 6;
    }

    ensureSpace(28);
    y += 12;
    doc.setDrawColor(226, 232, 240);
    doc.line(pageWidth / 2 - 35, y, pageWidth / 2 + 35, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(activeProto.profissional, pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("COORDENAÇÃO CLÍNICA", pageWidth / 2, y, { align: "center" });
    y += 6;
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(7.5);
    doc.setTextColor(29, 78, 216);
    doc.text(`Assinado eletronicamente via Prontuário ${clinicName}`, pageWidth / 2, y, { align: "center" });

    const fileName = `${activeProto.tipo}-${patient?.nome || "paciente"}-${activeProto.dataPreenchimento}.pdf`
      .replace(/[^a-zA-Z0-9\-_.]/g, "_");
    doc.save(fileName);
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

      {loading && (
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs text-slate-600 font-medium">
          Carregando protocolos...
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold">
          {error}
        </div>
      )}

      {/* Visual print mode overlay if viewing printable sheet */}
      {isViewingPrint && activeProto && (
        <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-xs overflow-y-auto p-4 sm:p-10 flex justify-center items-start">
          <div className="w-full max-w-4xl border border-slate-200 p-8 sm:p-12 rounded-3xl shadow-2xl bg-white print-page relative mt-4 mb-10 text-left">
            <div className="absolute top-6 right-6 flex gap-2 no-print">
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2 bg-[#1070ca] hover:bg-[#0b5194] text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-md"
              >
                <Printer className="h-4 w-4" /> Baixar PDF
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
                {clinic?.logoUrl ? (
                  <img src={clinic.logoUrl} alt="" className="h-8 w-8 object-contain rounded-lg" />
                ) : (
                  <Heart className="h-6 w-6 text-[#1070ca] fill-[#1070ca]/10" />
                )}
                <h2 className="font-display font-black text-2xl text-slate-900">{clinic?.name || "Clínica"}</h2>
              </div>
              {clinic?.activities && (
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{clinic.activities}</p>
              )}
              <p className="text-[10px] text-slate-400 font-mono tracking-widest">
                {[clinic?.address, clinic?.email].filter(Boolean).join(" | ").toUpperCase()}
              </p>
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Coordenação Clínica</p>
              <div className="text-[9px] text-[#1070ca] font-black italic mt-1 bg-blue-50/50 py-1 px-3 rounded-lg border border-blue-100 inline-block">
                Assinado eletronicamente via Prontuário {clinic?.name || ""}
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
                const newPatId = e.target.value;
                setSelectedPatId(newPatId);
                // While filling out or editing a protocol, changing the patient here
                // is how you reassign it — don't blow away the form by jumping to
                // "view" mode for the newly picked patient (that used to make patient
                // selection feel completely broken while a form was open).
                if (workspaceMode === "create") return;
                setHistoryFilter("all");
                const firstPatProto = protocols.find(p => p.patientId === newPatId);
                if (firstPatProto) {
                  setActiveProto(firstPatProto);
                  setWorkspaceMode("view");
                } else {
                  setWorkspaceMode("create");
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1070ca]"
            >
              {patients.length === 0 && (
                <option value="" disabled>Nenhum paciente cadastrado</option>
              )}
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
                onClick={handleStartNew}
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
                        {canCreate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(proto);
                            }}
                            className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 hover:text-[#1070ca] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" /> Editar
                          </button>
                        )}
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
                    toast.warning("Por favor, selecione ou crie um protocolo primeiro.");
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
                onClick={handleStartNew}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  workspaceMode === "create" && !editingProtocol
                    ? "bg-[#1070ca] text-white shadow-xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Plus className="h-4 w-4" /> Preencher Novo
              </button>
            </div>

            {workspaceMode === "view" && activeProto && (
              <div className="flex gap-2">
                {canCreate && (
                  <button
                    onClick={() => handleStartEdit(activeProto)}
                    className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-3xs"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                )}
                <button
                  onClick={() => setIsViewingPrint(true)}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[#1070ca] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-3xs"
                >
                  <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
                </button>
              </div>
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
                    {editingProtocol ? (
                      <><Pencil className="h-4.5 w-4.5 text-[#1070ca]" /> Editando Protocolo Existente</>
                    ) : (
                      <><PlusCircle className="h-4.5 w-4.5 text-[#1070ca]" /> Preencher Registro Técnico</>
                    )}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                    {editingProtocol
                      ? "Ajuste as respostas ou troque o paciente no seletor ao lado — as alterações substituem o registro original."
                      : "Selecione o tipo de formulário e preencha as métricas estruturadas do paciente."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {editingProtocol && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 cursor-pointer transition-all flex items-center gap-1"
                    >
                      <XIcon className="h-3 w-3" /> Cancelar Edição
                    </button>
                  )}
                  {/* Horizontal selector for Type of Protocol */}
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
                    <Save className="h-4.5 w-4.5" />
                    {editingProtocol ? "Salvar Alterações no Protocolo" : "Salvar Protocolo Oficial no Prontuário"}
                  </button>
                )}
              </form>
            </div>
          )}

        </div>

      </div>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={handleConfirmDeleteProtocol}
        title="Remover protocolo preenchido?"
        message="Este protocolo será removido permanentemente do arquivo do paciente. Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
