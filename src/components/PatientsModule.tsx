import React, { useState } from "react";
import { User, Calendar, Heart, PlusCircle, Search, Trash2, Filter, Upload, Paperclip, ChevronRight, History, FileText, CheckSquare, Save, CreditCard, Users, Pencil, Loader2, Share2 } from "lucide-react";
import { Patient, PatientStatus, Anamnese, TimelineItem, UserRole, UserPermissions } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { patientFromApi, patientToApi } from "../lib/apiMappers";
import { WizardModal, DocFile } from "./Patient/PatientFormWizard";
import { useAnamneses } from "../hooks/useAnamneses";
import { useTimeline } from "../hooks/useTimeline";
import { useInsuranceProviders } from "../hooks/useInsuranceProviders";
import { useToast, ConfirmModal } from "./UI";

interface PatientsModuleProps {
  patients: Patient[];
  userRole: UserRole;
  onUpdatePatients: (updated: Patient[]) => void;
  selectedPatientId?: string;
  userPermissions?: UserPermissions;
}

export default function PatientsModule({
  patients,
  userRole,
  onUpdatePatients,
  selectedPatientId,
  userPermissions
}: PatientsModuleProps) {
  const { authFetch } = useAuth();
  const toast = useToast();
  const canCreate = userPermissions ? userPermissions.patients.criar : (userRole !== UserRole.RESTRICTED);
  const canEdit = userPermissions ? userPermissions.patients.editar : (userRole !== UserRole.RESTRICTED);
  const canDelete = userPermissions ? userPermissions.patients.excluir : (userRole === UserRole.ADMIN);

  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");
  const [selectedPat, setSelectedPat] = useState<Patient | null>(
    selectedPatientId ? patients.find(p => p.id === selectedPatientId) || null : patients[0]
  );
  const { anamneses, saveAnamnese } = useAnamneses();
  const { timeline, addTimelineItem } = useTimeline(selectedPat?.id);
  const { providers: insuranceProviders } = useInsuranceProviders();
  const [detailTab, setDetailTab] = useState<"cadastro" | "anamnese" | "documentos" | "timeline">("cadastro");

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [diagFilter, setDiagFilter] = useState<string>("todos");

  // Wizard (criação/edição de paciente)
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<Partial<Patient> | undefined>(undefined);
  const [wizardSaving, setWizardSaving] = useState(false);

  // Detailed Anamnese Editor state
  const [editingAnamnese, setEditingAnamnese] = useState<Anamnese | null>(null);
  const [sendingShareLink, setSendingShareLink] = useState(false);
  const [sendingAdmissionLink, setSendingAdmissionLink] = useState(false);
  const [sendingCadastroLink, setSendingCadastroLink] = useState(false);

  // Document Upload Simulator
  const [simulatedDocName, setSimulatedDocName] = useState("");
  const [simulatedParentDocName, setSimulatedParentDocName] = useState("");

  // Manual Timeline addition state
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineDesc, setTimelineDesc] = useState("");
  const [timelineType, setTimelineType] = useState<TimelineItem["tipo"]>("Visita Escolar");

  // Confirm modals state
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const [confirmDeleteDocOpen, setConfirmDeleteDocOpen] = useState(false);
  const [pendingDeleteDoc, setPendingDeleteDoc] = useState<{ docId: string; isParentDoc: boolean } | null>(null);

  // ─── Wizard: abertura para criação / edição ────────────────────────────
  const openCreateWizard = () => {
    setWizardInitialData(undefined);
    setWizardOpen(true);
  };

  const openEditWizard = (patient: Patient) => {
    setWizardInitialData(patient);
    setWizardOpen(true);
  };

  // Persiste o paciente (criação ou edição) via API real, mais os metadados
  // de documentos selecionados (apenas nome — ver aviso na etapa de Documentos
  // do wizard: o armazenamento do arquivo em si ainda não está implementado).
  const handleWizardSave = async (data: Partial<Patient>, files: DocFile[], photoFile?: File | null) => {
    setWizardSaving(true);
    try {
      const isEdit = !!data.id;
      const body = JSON.stringify(patientToApi(data));
      const res = await authFetch(isEdit ? `/api/patients/${data.id}` : "/api/patients", {
        method: isEdit ? "PUT" : "POST",
        body,
      });
      if (!res.ok) throw new Error("Falha ao salvar paciente");
      const row = await res.json();
      const savedPatient = patientFromApi(row);

      // Metadados dos documentos selecionados nesta sessão do wizard.
      // NOTA: apenas o nome do arquivo é persistido (tabela patient_documents);
      // não há upload/armazenamento real do arquivo ainda.
      for (const doc of files) {
        try {
          await authFetch("/api/patient-documents", {
            method: "POST",
            body: JSON.stringify({ patient_id: savedPatient.id, nome: doc.label || doc.file.name, tipo: "medico" }),
          });
        } catch {
          // Falha ao registrar um documento não deve impedir o salvamento do paciente.
        }
      }

      const updatedList = isEdit
        ? patients.map(p => (p.id === savedPatient.id ? savedPatient : p))
        : [savedPatient, ...patients];
      onUpdatePatients(updatedList);

      if (!isEdit) {
        // Cria um template de anamnese em branco e um evento de admissão na
        // linha do tempo, ambos persistidos via API.
        try {
          await saveAnamnese({
            patientId: savedPatient.id,
            queixaPrincipal: "Aguardando preenchimento.",
            historiaGestacional: "",
            marcosDesenvolvimento: "",
            linguagem: "",
            sono: "",
            alimentacaoSeletividade: "",
            controleEsfincteriano: "",
            historicoMedico: "",
            medicamentos: savedPatient.medicamentos,
            terapiasAtuais: "",
            comportamentoCasa: "",
            comportamentoEscola: "",
            interessesHiperfocos: "",
            sensibilidadesSensoriais: "",
            pontosFortes: "",
            principaisDificuldades: "",
            objetivosFamilia: ""
          });
        } catch {
          // Falha ao criar a anamnese em branco não deve impedir o salvamento do paciente.
        }

        try {
          await addTimelineItem({
            patientId: savedPatient.id,
            data: savedPatient.dataInicio || new Date().toISOString().split("T")[0],
            tipo: "Avaliação",
            titulo: "Admissão Clínico-Social",
            descricao: "Paciente admitido na clínica Espaço Aprender a Ser para acompanhamento.",
            profissional: "Francine Maria Tersi"
          });
        } catch {
          // Falha ao registrar o evento inicial não deve impedir o salvamento do paciente.
        }
      }

      setSelectedPat(savedPatient);
      setDetailTab("cadastro");
      setActiveTab("detail");
      setWizardOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar o paciente. Tente novamente.");
    } finally {
      setWizardSaving(false);
    }
  };

  const handleDeletePatient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingArchiveId(id);
    setConfirmArchiveOpen(true);
  };

  const handleConfirmArchive = async () => {
    const id = pendingArchiveId;
    if (!id) return;
    const target = patients.find(p => p.id === id);
    if (!target) return;
    try {
      const res = await authFetch(`/api/patients/${id}`, {
        method: "PUT",
        body: JSON.stringify(patientToApi({ ...target, status: PatientStatus.CLOSED })),
      });
      if (!res.ok) throw new Error("Falha ao arquivar paciente");
      const row = await res.json();
      const updatedPatient = patientFromApi(row);
      const updated = patients.map(p => (p.id === id ? updatedPatient : p));
      onUpdatePatients(updated);
      if (selectedPat?.id === id) setSelectedPat(updatedPatient);
      setConfirmArchiveOpen(false);
      setPendingArchiveId(null);
      toast.success("Prontuário arquivado com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível arquivar o prontuário. Tente novamente.");
    }
  };

  const handleUpdateStatus = async (id: string, status: PatientStatus) => {
    const target = patients.find(p => p.id === id);
    if (!target) return;
    try {
      const res = await authFetch(`/api/patients/${id}`, {
        method: "PUT",
        body: JSON.stringify(patientToApi({ ...target, status })),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
      const row = await res.json();
      const updatedPatient = patientFromApi(row);
      const updated = patients.map(p => (p.id === id ? updatedPatient : p));
      onUpdatePatients(updated);
      setSelectedPat(updatedPatient);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível atualizar o status do paciente.");
    }
  };

  // Simulates uploading files safely in the browser session
  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPat || !simulatedDocName.trim()) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      nome: simulatedDocName.endsWith(".pdf") ? simulatedDocName : `${simulatedDocName}.pdf`,
      dataUpload: new Date().toISOString().split("T")[0]
    };

    const updatedPatients = patients.map(p => {
      if (p.id === selectedPat.id) {
        return {
          ...p,
          documentos: [...p.documentos, newDoc]
        };
      }
      return p;
    });

    onUpdatePatients(updatedPatients);
    setSelectedPat(updatedPatients.find(p => p.id === selectedPat.id) || null);

    // Timeline update
    addTimelineItem({
      patientId: selectedPat.id,
      data: newDoc.dataUpload,
      tipo: "Documento",
      titulo: `Documento Anexado: ${newDoc.nome}`,
      descricao: "Arquivo clínico adicionado com sucesso ao banco criptografado do prontuário.",
      profissional: "Francine Maria Tersi"
    }).catch(() => {});
    setSimulatedDocName("");
  };

  const handleSimulateParentUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPat || !simulatedParentDocName.trim()) return;

    const newDoc = {
      id: `docp-${Date.now()}`,
      nome: simulatedParentDocName.endsWith(".pdf") ? simulatedParentDocName : `${simulatedParentDocName}.pdf`,
      dataUpload: new Date().toISOString().split("T")[0]
    };

    const updatedPatients = patients.map(p => {
      if (p.id === selectedPat.id) {
        const existing = p.documentosPais || [];
        return {
          ...p,
          documentosPais: [...existing, newDoc]
        };
      }
      return p;
    });

    onUpdatePatients(updatedPatients);
    setSelectedPat(updatedPatients.find(p => p.id === selectedPat.id) || null);

    // Timeline update
    addTimelineItem({
      patientId: selectedPat.id,
      data: newDoc.dataUpload,
      tipo: "Documento",
      titulo: `Doc. Responsável Anexado: ${newDoc.nome}`,
      descricao: "Documento pessoal do responsável (RG/CPF ou comprovante) arquivado com segurança.",
      profissional: "Francine Maria Tersi"
    }).catch(() => {});
    setSimulatedParentDocName("");
  };

  const handleDeleteDoc = (docId: string, isParentDoc: boolean = false) => {
    if (!selectedPat) return;
    setPendingDeleteDoc({ docId, isParentDoc });
    setConfirmDeleteDocOpen(true);
  };

  const handleConfirmDeleteDoc = () => {
    if (!selectedPat || !pendingDeleteDoc) return;
    const { docId, isParentDoc } = pendingDeleteDoc;
    const updatedPatients = patients.map(p => {
      if (p.id === selectedPat.id) {
        if (isParentDoc) {
          const docList = p.documentosPais || [];
          return {
            ...p,
            documentosPais: docList.filter(d => d.id !== docId)
          };
        } else {
          return {
            ...p,
            documentos: p.documentos.filter(d => d.id !== docId)
          };
        }
      }
      return p;
    });
    onUpdatePatients(updatedPatients);
    setSelectedPat(updatedPatients.find(p => p.id === selectedPat.id) || null);
    setConfirmDeleteDocOpen(false);
    setPendingDeleteDoc(null);
  };

  const handleSaveAnamnese = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnamnese) return;

    try {
      await saveAnamnese(editingAnamnese);
      setEditingAnamnese(null);

      // Save Timeline notification
      await addTimelineItem({
        patientId: editingAnamnese.patientId,
        data: new Date().toISOString().split("T")[0],
        tipo: "Avaliação",
        titulo: "Anamnese Atualizada",
        descricao: "Histórico clínico e marcos do desenvolvimento foram revisados e atualizados pela terapeuta.",
        profissional: "Francine Maria Tersi"
      });
      toast.success("Anamnese atualizada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar a anamnese. Tente novamente.");
    }
  };

  // Gera (ou reaproveita, se já existir) o link público de preenchimento da anamnese
  // pelos pais e copia para a área de transferência.
  const handleSendAnamneseShareLink = async () => {
    if (!selectedPat) return;
    setSendingShareLink(true);
    try {
      const res = await authFetch(`/api/patients/${selectedPat.id}/anamnese-share-link`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao gerar link de compartilhamento");
      const { url } = await res.json();
      const fullUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copiado! Envie para os pais preencherem a anamnese.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível gerar o link de compartilhamento. Tente novamente.");
    } finally {
      setSendingShareLink(false);
    }
  };

  // Gera (ou reaproveita, se já existir) o link público de atualização cadastral para
  // um paciente JÁ existente e copia para a área de transferência. Diferente do link de
  // Pré-Cadastro (que cria um paciente novo), este atualiza dados gerais de um paciente
  // já cadastrado — nunca campos clínicos, financeiros ou de convênio.
  const handleSendCadastroShareLink = async (patientId: string) => {
    setSendingCadastroLink(true);
    try {
      const res = await authFetch(`/api/patients/${patientId}/cadastro-share-link`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao gerar link de atualização cadastral");
      const { url } = await res.json();
      const fullUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copiado! Envie para a família completar/atualizar os dados cadastrais.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível gerar o link de atualização cadastral. Tente novamente.");
    } finally {
      setSendingCadastroLink(false);
    }
  };

  // Gera um link avulso de pré-admissão (sem paciente ainda) e copia para a área de
  // transferência. Diferente do link de anamnese acima, este cria um paciente novo
  // quando a família preenche — válido por 7 dias, uso único.
  const handleGenerateAdmissionLink = async () => {
    setSendingAdmissionLink(true);
    try {
      const res = await authFetch("/api/admission-invites", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao gerar link de pré-admissão");
      const { url } = await res.json();
      const fullUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copiado! Válido por 7 dias e uso único — envie para a família preencher o pré-cadastro.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível gerar o link de pré-admissão. Tente novamente.");
    } finally {
      setSendingAdmissionLink(false);
    }
  };

  const handleAddTimelineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPat || !timelineTitle.trim()) return;

    await addTimelineItem({
      patientId: selectedPat.id,
      data: new Date().toISOString().split("T")[0],
      tipo: timelineType,
      titulo: timelineTitle,
      descricao: timelineDesc || "Não fornecido.",
      profissional: "Francine Maria Tersi"
    }).catch(() => {});
    setTimelineTitle("");
    setTimelineDesc("");
  };

  // Filter computation
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.diagnostico.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.escola.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.responsavel.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || p.status === statusFilter;
    
    let matchesDiag = true;
    if (diagFilter !== "todos") {
      if (diagFilter === "tea") matchesDiag = p.diagnostico.includes("TEA") || p.diagnostico.includes("Autismo");
      else if (diagFilter === "tdah") matchesDiag = p.diagnostico.includes("TDAH");
      else if (diagFilter === "dislexia") matchesDiag = p.diagnostico.includes("Dislexia");
    }

    return matchesSearch && matchesStatus && matchesDiag;
  });

  const selectedAnamnese = selectedPat ? anamneses.find(a => a.patientId === selectedPat.id) : null;
  const selectedTimeline = selectedPat ? timeline.filter(t => t.patientId === selectedPat.id).sort((a,b) => b.data.localeCompare(a.data)) : [];

  return (
    <div id="patients-module" className="space-y-6">
      {/* Header and top tab selectors */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 flex items-center gap-2">
            <span className="p-1 rounded-xl bg-blue-50 text-[#1070ca] text-lg">📁</span> Prontuários de Pacientes
          </h2>
          <p className="text-xs text-gray-500">Módulo completo de admissão, acompanhamento psicopedagógico e linha do tempo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all duration-150 whitespace-nowrap ${activeTab === "list" ? "bg-[#1070ca] text-white border-[#1070ca]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            📋 Lista de Prontuários
          </button>
          {selectedPat && (
            <button
              onClick={() => setActiveTab("detail")}
              className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all duration-150 whitespace-nowrap max-w-[45vw] sm:max-w-none truncate ${activeTab === "detail" ? "bg-[#1070ca] text-white border-[#1070ca]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            >
              🔎 Ver: {selectedPat.nome.split(" ")[0]}
            </button>
          )}
          {canCreate && (
            <button
              onClick={handleGenerateAdmissionLink}
              disabled={sendingAdmissionLink}
              className="px-3 sm:px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer flex items-center gap-1.5 transition-all duration-150 bg-white text-slate-600 border-slate-200 hover:bg-slate-50 whitespace-nowrap disabled:opacity-60"
              title="Gera um link para a família preencher o pré-cadastro (válido por 7 dias, uso único)"
            >
              <Share2 className="h-3.5 w-3.5" /> {sendingAdmissionLink ? "Gerando..." : "Link de Pré-Cadastro"}
            </button>
          )}
          {canCreate && (
            <button
              onClick={openCreateWizard}
              className="px-3 sm:px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer flex items-center gap-1.5 transition-all duration-150 bg-pink-50 text-[#d43f72] border-pink-100 hover:bg-pink-100/50 whitespace-nowrap"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Admitir Novo
            </button>
          )}
        </div>
      </div>

      <WizardModal
        isOpen={wizardOpen}
        onClose={() => !wizardSaving && setWizardOpen(false)}
        initialData={wizardInitialData}
        onSave={handleWizardSave}
        insuranceProviderNames={insuranceProviders.map((p) => p.nome)}
      />

      {/* Tab: Patients Directory List */}
      {activeTab === "list" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Filters Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por criança, responsável, diagnóstico, escola..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1070ca] focus:bg-white text-xs font-semibold text-slate-700 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 font-mono tracking-wider">
                <Filter className="h-3.5 w-3.5" /> FILTRAR:
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1070ca] focus:bg-white transition-all"
              >
                <option value="todos">Status: Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Pausado">Pausado</option>
                <option value="Encerrado">Encerrado</option>
              </select>

              <select
                value={diagFilter}
                onChange={(e) => setDiagFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1070ca] focus:bg-white transition-all"
              >
                <option value="todos">Diagnóstico: Todos</option>
                <option value="tea">TEA (Autismo)</option>
                <option value="tdah">TDAH</option>
                <option value="dislexia">Dislexia</option>
              </select>
            </div>
          </div>

          {/* Patients Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((pat) => (
              <div
                key={pat.id}
                onClick={() => {
                  setSelectedPat(pat);
                  setActiveTab("detail");
                }}
                className={`p-5 rounded-3xl border transition text-left flex flex-col justify-between h-56 cursor-pointer relative ${selectedPat?.id === pat.id ? "bg-blue-50/20 border-[#1070ca]/50 shadow-md" : "bg-white border-slate-100 hover:border-[#1070ca]/30 hover:shadow-2xs"}`}
              >
                {/* Status Dot */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${pat.status === "Ativo" ? "bg-blue-500" : pat.status === "Pausado" ? "bg-amber-400" : "bg-slate-300"}`} />
                  <span className="text-[9px] font-black text-slate-400 uppercase font-mono tracking-wider">{pat.status}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-[#1070ca] font-display font-black flex items-center justify-center text-sm">
                      {pat.nome.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-slate-800 leading-tight">{pat.nome}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-sans font-medium">
                        <Calendar className="h-3 w-3 text-[#1070ca]" /> {pat.idade} anos • {pat.anoSerie}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                    <p className="text-[11px] text-slate-500 font-medium"><strong className="text-slate-700 font-extrabold">Resp:</strong> {pat.responsavel}</p>
                    <p className="text-[11px] text-slate-500 font-medium"><strong className="text-slate-700 font-extrabold">Escola:</strong> {pat.escola}</p>
                    <p className="text-[10px] font-black text-[#1070ca] bg-blue-100/30 px-2 py-0.5 rounded-md inline-block max-w-full truncate font-mono uppercase tracking-wider">
                      {pat.diagnostico}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-[9px] font-mono font-bold text-slate-400">Início: {new Date(pat.dataInicio).toLocaleDateString('pt-BR')}</span>
                  <div className="flex items-center gap-2">
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeletePatient(pat.id, e)}
                        className="text-slate-300 hover:text-red-500 transition p-1"
                        title="Arquivar prontuário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronRight className="h-4 w-4 text-[#1070ca]" />
                  </div>
                </div>
              </div>
            ))}

            {filteredPatients.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 space-y-2">
                <p className="text-sm font-semibold">Nenhum prontuário corresponde aos critérios.</p>
                <p className="text-xs">Tente redefinir a busca inteligente ou cadastrar um novo paciente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Patient Detailed View (Prontuário completo) */}
      {activeTab === "detail" && selectedPat && (
        <div className="grid lg:grid-cols-12 gap-6 animate-fade-in text-left">
          {/* Left panel: Sticky Summary Card with Avatar Selector */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1070ca]" />
              
              <div className="relative group w-24 h-24 mx-auto">
                <div className="w-24 h-24 rounded-full bg-blue-50/80 text-4xl mx-auto flex items-center justify-center border-4 border-white shadow-md transition duration-150">
                  {selectedPat.foto || "🧸"}
                </div>
                {canEdit && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer">
                    <span className="text-[10px] text-white font-black uppercase tracking-wider">Mudar</span>
                  </div>
                )}
              </div>

              {canEdit && (
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Selecione uma Foto/Avatar:</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {["🧸", "🦖", "🦄", "🎨", "⚽", "🚀", "🐱", "🐶", "🦸", "🧩"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          const updated = patients.map(p => {
                            if (p.id === selectedPat.id) return { ...p, foto: emoji };
                            return p;
                          });
                          onUpdatePatients(updated);
                          setSelectedPat({ ...selectedPat, foto: emoji });
                        }}
                        className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center transition hover:bg-white hover:scale-110 active:scale-95 ${selectedPat.foto === emoji ? "bg-white shadow-xs border border-blue-200" : "bg-transparent"}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-display font-extrabold text-base text-slate-800 leading-tight">{selectedPat.nome}</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Dossiê: <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{selectedPat.id}</span></p>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => openEditWizard(selectedPat)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-[#1070ca] border border-blue-100 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-100/60 transition cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar Prontuário
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleSendCadastroShareLink(selectedPat.id)}
                  disabled={sendingCadastroLink}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-100/60 transition cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                  title="Gera um link para a família completar/atualizar os dados cadastrais deste paciente"
                >
                  {sendingCadastroLink ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                  Link de Atualização Cadastral
                </button>
              )}

              <div className="flex justify-center gap-1.5">
                <select
                  value={selectedPat.status}
                  onChange={(e) => handleUpdateStatus(selectedPat.id, e.target.value as PatientStatus)}
                  className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Pausado">Pausado</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg font-mono font-bold flex items-center">Cadastrado: {selectedPat.dataInicio}</span>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-left text-xs font-medium text-slate-600">
                <p className="flex justify-between border-b border-slate-50 pb-1.5"><strong className="text-slate-400 font-extrabold">Idade atual:</strong> <span className="text-slate-800 font-bold">{selectedPat.idade} anos ({new Date(selectedPat.dataNascimento).toLocaleDateString('pt-BR')})</span></p>
                <p className="flex justify-between border-b border-slate-50 pb-1.5"><strong className="text-slate-400 font-extrabold">Responsável:</strong> <span className="text-slate-800 font-bold">{selectedPat.responsavel} {selectedPat.responsavelParentesco ? `(${selectedPat.responsavelParentesco})` : ""}</span></p>
                <p className="flex justify-between border-b border-slate-50 pb-1.5"><strong className="text-slate-400 font-extrabold">Telefone principal:</strong> <span className="text-slate-800 font-bold">{selectedPat.telefone}</span></p>
                {selectedPat.email && (
                  <p className="flex justify-between border-b border-slate-50 pb-1.5"><strong className="text-slate-400 font-extrabold">E-mail:</strong> <span className="text-slate-800 font-bold truncate max-w-[150px]">{selectedPat.email}</span></p>
                )}
                <p className="flex justify-between border-b border-slate-50 pb-1.5"><strong className="text-slate-400 font-extrabold">Pagamento:</strong> <span className="text-slate-800 font-black text-blue-700">{selectedPat.tipoPagamento || "Particular"}</span></p>
                <p className="flex justify-between border-b border-slate-50 pb-1.5"><strong className="text-slate-400 font-extrabold">Convênio:</strong> <span className="text-slate-800 font-bold truncate max-w-[150px]">{selectedPat.convenio}</span></p>
                <div className="p-3 bg-red-50/50 border border-red-100 rounded-2xl mt-1">
                  <p className="font-black text-red-800 uppercase tracking-wider text-[9px] font-mono">Medicamentos de Uso Contínuo:</p>
                  <p className="text-[11px] text-red-900 mt-1 font-bold">{selectedPat.medicamentos || "Nenhum"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Modern tab interface for detailed patient history */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
              {/* Inner Tabs navigation */}
              <div className="flex border-b border-slate-100 pb-3 mb-6 overflow-x-auto gap-1">
                {[
                  { id: "cadastro", label: "📋 Cadastro & Finanças" },
                  { id: "anamnese", label: "🧠 Anamnese" },
                  { id: "documentos", label: "📎 Documentos & Laudos" },
                  { id: "timeline", label: "📈 Evoluções & Linha do Tempo" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setDetailTab(tab.id as any);
                      setEditingAnamnese(null);
                    }}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${detailTab === tab.id ? "bg-[#1070ca] text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: CADASTRO COMPLETO & FINANCEIRO */}
              {detailTab === "cadastro" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <h4 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4.5 w-4.5 text-[#1070ca]" /> Ficha Cadastral Clinico-Social do Aluno
                    </h4>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Bento Box: Dados de Identificação */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <User className="h-3 w-3 text-[#1070ca]" /> Identificação do Aluno
                      </p>
                      <div className="text-xs space-y-2 font-semibold text-slate-600">
                        <p><strong className="text-slate-800 font-extrabold">Nome Completo:</strong> {selectedPat.nome}</p>
                        <p><strong className="text-slate-800 font-extrabold">Data Nascimento:</strong> {new Date(selectedPat.dataNascimento).toLocaleDateString('pt-BR')} ({selectedPat.idade} anos)</p>
                        <p><strong className="text-slate-800 font-extrabold">Diagnóstico / Queixa:</strong> <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[11px] inline-block font-extrabold mt-0.5">{selectedPat.diagnostico} ({selectedPat.cid || "N/A"})</span></p>
                        <p><strong className="text-slate-800 font-extrabold">Médico Responsável:</strong> {selectedPat.medico || "Não informado"}</p>
                      </div>
                    </div>

                    {/* Bento Box: Dados Educacionais */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        🎨 Informações Escolares
                      </p>
                      <div className="text-xs space-y-2 font-semibold text-slate-600">
                        <p><strong className="text-slate-800 font-extrabold">Instituição de Ensino:</strong> {selectedPat.escola || "Não informada"}</p>
                        <p><strong className="text-slate-800 font-extrabold">Ano / Série Escolar:</strong> {selectedPat.anoSerie || "Não informado"}</p>
                        <p><strong className="text-slate-800 font-extrabold">Professor(a) Regente:</strong> {selectedPat.professor || "Não informada"}</p>
                        <p><strong className="text-slate-800 font-extrabold">Coordenador(a) Pedagógico:</strong> {selectedPat.coordenador || "Não informada"}</p>
                      </div>
                    </div>

                    {/* Bento Box: Pais e Responsáveis */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Users className="h-3 w-3 text-[#1070ca]" /> Filiação e Responsável Legal
                      </p>
                      <div className="text-xs space-y-2 font-semibold text-slate-600">
                        <p><strong className="text-slate-800 font-extrabold">Responsável Principal:</strong> {selectedPat.responsavel}</p>
                        <p><strong className="text-slate-800 font-extrabold">Grau de Parentesco:</strong> {selectedPat.responsavelParentesco || "Mãe"}</p>
                        <p><strong className="text-slate-800 font-extrabold">CPF do Responsável:</strong> {selectedPat.responsavelCpf || "Não cadastrado"}</p>
                        <p><strong className="text-slate-800 font-extrabold">Telefone de Contato:</strong> {selectedPat.telefone}</p>
                      </div>
                    </div>

                    {/* Bento Box: Dados Financeiros e de Convênio */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-[#1070ca]" /> Financeiro & Faturamento
                      </p>
                      <div className="text-xs space-y-2 font-semibold text-slate-600">
                        <p><strong className="text-slate-800 font-extrabold">Responsável Financeiro:</strong> {selectedPat.responsavelFinanceiroNome || selectedPat.responsavel}</p>
                        <p><strong className="text-slate-800 font-extrabold">CPF Financeiro:</strong> {selectedPat.responsavelFinanceiroCpf || selectedPat.responsavelCpf || "Não cadastrado"}</p>
                        <p><strong className="text-slate-800 font-extrabold">Telefone Financeiro:</strong> {selectedPat.responsavelFinanceiroTelefone || selectedPat.telefone}</p>
                        <p><strong className="text-slate-800 font-extrabold">Tipo de Contrato:</strong> {selectedPat.tipoPagamento || "Particular"}</p>
                        {selectedPat.tipoPagamento === "Convênio" && (
                          <div className="bg-white p-2 rounded-xl border border-slate-100 space-y-1 mt-1 text-[11px]">
                            <p><strong className="text-slate-700">Nome Convênio:</strong> {selectedPat.convenio}</p>
                            <p><strong className="text-slate-700">Carteirinha Nº:</strong> {selectedPat.convenioCarteirinha || "A preencher"}</p>
                            <p><strong className="text-slate-700">Validade:</strong> {selectedPat.convenioValidade || "N/A"}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1070ca]/5 border border-[#1070ca]/20 rounded-2xl p-4">
                    <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Histórico Clínico e Social de Admissão:</h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">{selectedPat.historicoClinico || "Nenhuma intercorrência inicial cadastrada."}</p>
                  </div>
                </div>
              )}

              {/* TAB 2: ANAMNESE MULTIDISCIPLINAR */}
              {detailTab === "anamnese" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex gap-4 border-b border-slate-50 pb-2 items-center justify-between">
                    <h4 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider">
                      Anamnese Clínico-Pedagógica
                    </h4>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSendAnamneseShareLink}
                          disabled={sendingShareLink}
                          className="text-xs font-black uppercase px-3 py-1.5 rounded-lg border tracking-wider cursor-pointer transition-colors flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-wait"
                          title="Gera um link público para os pais preencherem a anamnese sem precisar de login"
                        >
                          {sendingShareLink ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                          Enviar para os pais preencherem
                        </button>
                        <button
                          onClick={() => {
                            if (selectedAnamnese) {
                              setEditingAnamnese({ ...selectedAnamnese });
                            } else {
                              // fallback structure
                              setEditingAnamnese({
                                patientId: selectedPat.id,
                                queixaPrincipal: "Aguardando preenchimento",
                                historiaGestacional: "",
                                marcosDesenvolvimento: "",
                                linguagem: "",
                                sono: "",
                                alimentacaoSeletividade: "",
                                controleEsfincteriano: "",
                                historicoMedico: "",
                                medicamentos: selectedPat.medicamentos || "",
                                terapiasAtuais: ""
                              });
                            }
                          }}
                          className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg border tracking-wider cursor-pointer transition-colors ${editingAnamnese ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-blue-50 text-[#1070ca] border-blue-200 hover:bg-blue-100"}`}
                        >
                          {editingAnamnese ? "✏️ Editando..." : "✏️ Editar Histórico Clínico"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Anamnese View mode */}
                  {!editingAnamnese ? (
                    selectedAnamnese ? (
                      <div className="space-y-6 max-h-[550px] overflow-y-auto pr-2">
                        <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl">
                          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">Queixa Principal / Motivo da Consulta de Desenvolvimento:</h5>
                          <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedAnamnese.queixaPrincipal}</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gestação e Parto:</p>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedAnamnese.historiaGestacional || "Não informado."}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Marcos de Desenvolvimento (Motor):</p>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedAnamnese.marcosDesenvolvimento || "Não informado."}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Linguagem e Comunicação:</p>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedAnamnese.linguagem || "Não informado."}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rotina de Sono:</p>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedAnamnese.sono || "Não informado."}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Alimentação e Seletividade:</p>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedAnamnese.alimentacaoSeletividade || "Não informado."}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Controle de Esfíncteres:</p>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedAnamnese.controleEsfincteriano || "Não informado."}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hipersensibilidades Sensoriais:</p>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedAnamnese.sensibilidadesSensoriais || "Não informado."}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Interesses Especiais & Hiperfocos:</p>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedAnamnese.interessesHiperfocos || "Não informado."}</p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                          <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                            <h6 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-1">Pontos Fortes Observados:</h6>
                            <p className="text-xs text-emerald-950 leading-relaxed font-bold">{selectedAnamnese.pontosFortes || "Não informado."}</p>
                          </div>
                          <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-2xl">
                            <h6 className="text-xs font-black text-rose-800 uppercase tracking-wider mb-1">Principais Dificuldades do Paciente:</h6>
                            <p className="text-xs text-rose-950 leading-relaxed font-bold">{selectedAnamnese.principaisDificuldades || "Não informado."}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl">
                          <h6 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-1">Objetivos Clínicos Esperados pela Família:</h6>
                          <p className="text-xs text-amber-950 leading-relaxed font-bold">{selectedAnamnese.objetivosFamilia || "Não informado."}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-12">Anamnese não cadastrada para este paciente.</p>
                    )
                  ) : (
                    /* Anamnese Edit mode */
                    <form onSubmit={handleSaveAnamnese} className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Queixa Principal *</label>
                          <textarea
                            rows={2}
                            required
                            value={editingAnamnese.queixaPrincipal}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, queixaPrincipal: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">História Gestacional / Parto</label>
                          <input
                            type="text"
                            value={editingAnamnese.historiaGestacional || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, historiaGestacional: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Marcos do Desenvolvimento (Motor)</label>
                          <input
                            type="text"
                            value={editingAnamnese.marcosDesenvolvimento || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, marcosDesenvolvimento: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Linguagem e Comunicação</label>
                          <input
                            type="text"
                            value={editingAnamnese.linguagem || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, linguagem: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Rotina de Sono</label>
                          <input
                            type="text"
                            value={editingAnamnese.sono || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, sono: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Alimentação e Seletividade</label>
                          <input
                            type="text"
                            value={editingAnamnese.alimentacaoSeletividade || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, alimentacaoSeletividade: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Controle Esfincteriano</label>
                          <input
                            type="text"
                            value={editingAnamnese.controleEsfincteriano || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, controleEsfincteriano: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Sensibilidade Sensorial</label>
                          <input
                            type="text"
                            value={editingAnamnese.sensibilidadesSensoriais || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, sensibilidadesSensoriais: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Interesses / Hiperfocos</label>
                          <input
                            type="text"
                            value={editingAnamnese.interessesHiperfocos || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, interessesHiperfocos: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Pontos Fortes</label>
                          <textarea
                            rows={2}
                            value={editingAnamnese.pontosFortes || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, pontosFortes: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Principais Dificuldades</label>
                          <textarea
                            rows={2}
                            value={editingAnamnese.principaisDificuldades || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, principaisDificuldades: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Objetivos Principais da Família</label>
                          <textarea
                            rows={2}
                            value={editingAnamnese.objetivosFamilia || ""}
                            onChange={(e) => setEditingAnamnese({ ...editingAnamnese, objetivosFamilia: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingAnamnese(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-lg text-xs font-black uppercase tracking-wider transition duration-150 flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5" /> Salvar Prontuário
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: DOCUMENTOS DO PACIENTE E DOS PAIS (DADOS DE REGISTRO) */}
              {detailTab === "documentos" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-50 pb-2 flex items-center gap-1.5">
                    <Paperclip className="h-4.5 w-4.5 text-[#1070ca]" />
                    <h4 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider">
                      Dossiê de Documentos Criptografados
                    </h4>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Column 1: Documentos Clínicos do Paciente */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                          <FileText className="h-3.5 w-3.5 text-[#1070ca]" /> 1. Laudos & Relatórios do Paciente ({selectedPat.documentos.length})
                        </h5>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {selectedPat.documentos.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl hover:border-blue-100 transition">
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-base text-red-500">📄</span>
                                <div className="truncate font-semibold">
                                  <p className="text-[11px] text-slate-800 truncate" title={doc.nome}>{doc.nome}</p>
                                  <p className="text-[9px] text-slate-400 font-mono font-bold">Enviado: {doc.dataUpload}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] bg-blue-50 border border-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black font-mono">LAUDO</span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDoc(doc.id, false)}
                                    className="text-slate-300 hover:text-red-500 transition p-1 cursor-pointer"
                                    title="Excluir documento"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {selectedPat.documentos.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-8 font-medium">Nenhum laudo clínico anexado.</p>
                          )}
                        </div>
                      </div>

                      {canEdit && (
                        <form onSubmit={handleSimulateUpload} className="border-t border-slate-100 pt-3 space-y-2.5 font-semibold">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Simular Envio de Laudo (PDF):</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={simulatedDocName}
                              onChange={(e) => setSimulatedDocName(e.target.value)}
                              placeholder="Ex: Laudo_TEA_Lucas"
                              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1070ca]"
                            />
                            <button
                              type="submit"
                              className="px-3.5 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-lg text-xs font-black uppercase tracking-wider transition duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Upload className="h-3 w-3" /> Anexar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Column 2: Documentos Pessoais dos Pais / Responsáveis */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                          <Users className="h-3.5 w-3.5 text-[#1070ca]" /> 2. Documentos dos Pais & Responsáveis ({(selectedPat.documentosPais || []).length})
                        </h5>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {(selectedPat.documentosPais || []).map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl hover:border-blue-100 transition">
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-base text-blue-500">📄</span>
                                <div className="truncate font-semibold">
                                  <p className="text-[11px] text-slate-800 truncate" title={doc.nome}>{doc.nome}</p>
                                  <p className="text-[9px] text-slate-400 font-mono font-bold">Enviado: {doc.dataUpload}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] bg-slate-50 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-black font-mono">PAIS</span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDoc(doc.id, true)}
                                    className="text-slate-300 hover:text-red-500 transition p-1 cursor-pointer"
                                    title="Excluir documento"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {(selectedPat.documentosPais || []).length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-8 font-medium">Nenhum documento pessoal do responsável anexado.</p>
                          )}
                        </div>
                      </div>

                      {canEdit && (
                        <form onSubmit={handleSimulateParentUpload} className="border-t border-slate-100 pt-3 space-y-2.5 font-semibold">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Simular Envio de Doc. dos Pais (PDF):</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={simulatedParentDocName}
                              onChange={(e) => setSimulatedParentDocName(e.target.value)}
                              placeholder="Ex: RG_Mae_Lucas"
                              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1070ca]"
                            />
                            <button
                              type="submit"
                              className="px-3.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Upload className="h-3 w-3" /> Anexar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LINHA DO TEMPO & EVOLUÇÕES */}
              {detailTab === "timeline" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-50 pb-2 flex items-center gap-1.5">
                    <History className="h-4.5 w-4.5 text-[#1070ca]" />
                    <h4 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider">
                      Linha do Tempo de Evolução Terapêutica
                    </h4>
                  </div>

                  {/* Add manual Timeline event form */}
                  {canEdit && (
                    <form onSubmit={handleAddTimelineItem} className="grid sm:grid-cols-3 gap-3 p-4 bg-blue-50/20 border border-blue-100/50 rounded-2xl font-semibold">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          value={timelineTitle}
                          onChange={(e) => setTimelineTitle(e.target.value)}
                          placeholder="Adicionar evento à Linha do Tempo (ex: Reunião Escolar)"
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1070ca] focus:outline-none"
                        />
                      </div>
                      <div>
                        <select
                          value={timelineType}
                          onChange={(e) => setTimelineType(e.target.value as TimelineItem["tipo"])}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#1070ca]"
                        >
                          <option value="Visita Escolar">Visita Escolar</option>
                          <option value="Reunião de Família">Reunião de Família</option>
                          <option value="Encaminhamento">Encaminhamento</option>
                          <option value="Avaliação">Avaliação</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={timelineDesc}
                          onChange={(e) => setTimelineDesc(e.target.value)}
                          placeholder="Descrição detalhada das resoluções..."
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1070ca] focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-lg text-xs font-black uppercase tracking-wider transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Registrar Evento
                      </button>
                    </form>
                  )}

                  {/* Graphical Timeline list */}
                  <div className="relative border-l-2 border-gray-100 ml-4 space-y-6">
                    {selectedTimeline.map((item) => {
                      const badgeColors = {
                        "Avaliação": "bg-blue-100 text-blue-700 border-blue-200",
                        "Sessão": "bg-blue-100 text-[#1070ca] border-blue-200",
                        "Protocolo": "bg-purple-100 text-purple-700 border-purple-200",
                        "Relatório": "bg-amber-100 text-amber-700 border-amber-200",
                        "PEI": "bg-pink-100 text-[#d43f72] border-pink-200",
                        "Visita Escolar": "bg-sky-100 text-sky-700 border-sky-200",
                        "Reunião de Família": "bg-orange-100 text-orange-700 border-orange-200",
                        "Encaminhamento": "bg-rose-100 text-rose-700 border-rose-200",
                        "Documento": "bg-slate-100 text-slate-700 border-slate-200"
                      };
                      return (
                        <div key={item.id} className="relative pl-6 animate-fade-in">
                          {/* Timeline Dot icon */}
                          <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-[#1070ca] ring-4 ring-blue-50" />
                          
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold font-mono text-gray-400">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${badgeColors[item.tipo] || "bg-gray-100"}`}>{item.tipo}</span>
                              <span className="text-[9px] font-mono text-gray-400">Por: {item.profissional}</span>
                            </div>
                            <h5 className="text-xs font-bold text-gray-800 leading-tight">{item.titulo}</h5>
                            <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">{item.descricao}</p>
                          </div>
                        </div>
                      );
                    })}

                    {selectedTimeline.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-6">Nenhuma evolução registrada nesta linha cronológica.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmArchiveOpen}
        onClose={() => setConfirmArchiveOpen(false)}
        onConfirm={handleConfirmArchive}
        title="Arquivar prontuário?"
        message="Os dados históricos serão preservados e você poderá consultá-los futuramente."
        confirmLabel="Arquivar"
        cancelLabel="Cancelar"
        variant="primary"
      />

      <ConfirmModal
        isOpen={confirmDeleteDocOpen}
        onClose={() => setConfirmDeleteDocOpen(false)}
        onConfirm={handleConfirmDeleteDoc}
        title="Remover documento?"
        message="Este documento será removido permanentemente do prontuário do paciente. Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}
