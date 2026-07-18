import React, { useEffect, useState } from "react";
import { CreditCard, Calendar, Plus, AlertTriangle, Check, RefreshCw, Layers, Building2, Edit3, Trash2, X, Save } from "lucide-react";
import { Patient, Insurance, InsuranceProvider, UserRole, UserPermissions } from "../types";
import { ConfirmModal, useToast } from "./UI";
import { useInsuranceProviders } from "../hooks/useInsuranceProviders";

interface InsurancesModuleProps {
  patients: Patient[];
  userRole: UserRole;
  insurances: Insurance[];
  onCreateInsurance: (payload: Partial<Insurance>) => Promise<void>;
  onUpdateInsurance: (id: string, payload: Partial<Insurance>) => Promise<void>;
  onDeleteInsurance: (id: string) => Promise<void>;
  userPermissions?: UserPermissions;
}

export default function InsurancesModule({
  patients,
  userRole,
  insurances,
  onCreateInsurance,
  onUpdateInsurance,
  onDeleteInsurance,
  userPermissions,
}: InsurancesModuleProps) {
  const toast = useToast();
  const canCreate = userPermissions ? userPermissions.insurances.criar : (userRole !== UserRole.RESTRICTED);
  const canEdit = userPermissions ? userPermissions.insurances.editar : (userRole !== UserRole.RESTRICTED);
  const canDelete = userPermissions ? userPermissions.insurances.excluir : (userRole === UserRole.ADMIN);

  const { providers, createProvider, updateProvider, deleteProvider } = useInsuranceProviders();

  const [activeTab, setActiveTab] = useState<"guias" | "operadoras">("guias");

  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const [newNome, setNewNome] = useState("");
  const [newGuia, setNewGuia] = useState("");
  const [newSessoesAut, setNewSessoesAut] = useState(24);
  const [newValidade, setNewValidade] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Keep the operadora dropdown pointed at a valid, existing provider once the list loads.
  useEffect(() => {
    if (!newNome && providers.length > 0) setNewNome(providers[0].nome);
  }, [providers, newNome]);

  // patientNome is not stored on the backend insurances table; resolve client-side.
  const patientNomeFor = (patientId?: string) => patients.find(p => p.id === patientId)?.nome ?? "Convênio Geral";

  const handleCreateInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === selectedPatId);
    if (!pat || !newGuia.trim() || !newValidade) return;

    try {
      await onCreateInsurance({
        patientId: selectedPatId,
        nome: newNome,
        numeroGuia: newGuia,
        sessoesAutorizadas: newSessoesAut,
        sessoesUtilizadas: 0,
        validade: newValidade,
      });
      setNewGuia("");
      setNewValidade("");
      toast.success(`Guia de tratamento autorizada pela operadora ${newNome} registrada com sucesso para ${pat.nome}!`);
    } catch (err: any) {
      toast.error(err.message || "Falha ao registrar guia de convênio.");
    }
  };

  const handleDebitSession = async (ins: Insurance) => {
    if (ins.sessoesUtilizadas >= ins.sessoesAutorizadas) {
      toast.warning("Todas as sessões desta guia já foram debitadas. Por favor solicite a renovação junto à operadora.");
      return;
    }
    try {
      await onUpdateInsurance(ins.id, { ...ins, sessoesUtilizadas: ins.sessoesUtilizadas + 1 });
    } catch (err: any) {
      toast.error(err.message || "Falha ao debitar sessão.");
    }
  };

  const handleDeleteInsurance = (id: string) => {
    setPendingDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await onDeleteInsurance(pendingDeleteId);
      setConfirmDeleteOpen(false);
      setPendingDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || "Falha ao remover guia de convênio.");
    }
  };

  return (
    <div id="insurances-module" className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 flex items-center gap-2">
          <span className="p-1 rounded-xl bg-pink-50 text-[#d43f72] text-lg">💳</span> Guias & Convênios de Saúde
        </h2>
        <p className="text-xs text-slate-500 font-medium font-sans">Acompanhe o consumo de sessões autorizadas de planos de saúde de forma simplificada, agilizando faturamentos sem glosas de operadoras.</p>
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-slate-100 gap-1 select-none overflow-x-auto overflow-y-hidden -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => setActiveTab("guias")}
          className={`shrink-0 whitespace-nowrap px-5 py-3 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "guias"
              ? "border-[#1070ca] text-[#1070ca]"
              : "border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <CreditCard className="h-4 w-4" /> Guias Autorizadas
        </button>
        <button
          onClick={() => setActiveTab("operadoras")}
          className={`shrink-0 whitespace-nowrap px-5 py-3 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "operadoras"
              ? "border-[#1070ca] text-[#1070ca]"
              : "border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <Building2 className="h-4 w-4" /> Operadoras de Saúde
        </button>
      </div>

      {activeTab === "guias" && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Side: Register new Authorization */}
          {canCreate && (
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider">
                  Cadastrar Guia Autorizada
                </h3>

                <form onSubmit={handleCreateInsurance} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Paciente Beneficiário</label>
                    <select
                      value={selectedPatId}
                      onChange={(e) => setSelectedPatId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-semibold"
                    >
                      {patients.length === 0 && (
                        <option value="" disabled>Nenhum paciente cadastrado</option>
                      )}
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Operadora de Saúde</label>
                    <select
                      value={newNome}
                      onChange={(e) => setNewNome(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-semibold"
                    >
                      {providers.length === 0 && (
                        <option value="" disabled>Nenhuma operadora cadastrada</option>
                      )}
                      {providers.map(p => (
                        <option key={p.id} value={p.nome}>{p.nome}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setActiveTab("operadoras")}
                      className="mt-1.5 text-[10px] font-bold text-[#1070ca] hover:text-[#0b5194] cursor-pointer"
                    >
                      + Cadastrar nova operadora
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Número da Guia de Autorização</label>
                    <input
                      type="text"
                      required
                      value={newGuia}
                      onChange={(e) => setNewGuia(e.target.value)}
                      placeholder="Ex: 99881122"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Qtd Sessões</label>
                      <input
                        type="number"
                        required
                        value={newSessoesAut}
                        onChange={(e) => setNewSessoesAut(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Vencimento da Guia</label>
                      <input
                        type="date"
                        required
                        value={newValidade}
                        onChange={(e) => setNewValidade(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1070ca] hover:bg-[#0b5194] text-white font-black uppercase text-xs tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-md shadow-blue-500/5 flex items-center justify-center gap-1.5"
                  >
                    Registrar Nova Guia
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Right Side: Active guides listing with progress debiting */}
          <div className={canCreate ? "lg:col-span-8" : "lg:col-span-12"}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
              <h3 className="font-display font-black text-xs text-slate-950 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-3">
                Tratamentos Autorizados & Consumo de Sessões
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {insurances.map((ins) => {
                  const remaining = ins.sessoesAutorizadas - ins.sessoesUtilizadas;
                  const ratio = ins.sessoesUtilizadas / ins.sessoesAutorizadas;
                  const isOverused = ratio >= 0.8;

                  // Format validity
                  const validDate = new Date(ins.validade);
                  const isExpired = validDate <= new Date("2026-07-20");

                  return (
                    <div
                      key={ins.id}
                      className={`p-5 rounded-2xl border transition duration-200 relative space-y-4 flex flex-col justify-between ${isOverused || isExpired ? "border-amber-200 bg-amber-50/15" : "border-slate-100 bg-slate-50/50"}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#1070ca] bg-blue-100/50 px-2 py-0.5 rounded-md font-mono">
                            {ins.nome}
                          </span>
                          <p className="text-xs font-black text-slate-800 leading-tight mt-2">{ins.patientNome ?? patientNomeFor(ins.patientId)}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono font-semibold">Cód. Guia: {ins.numeroGuia}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-black text-slate-800 block">{ins.sessoesUtilizadas} / {ins.sessoesAutorizadas}</span>
                          <span className="text-[9px] text-slate-400 block font-mono font-black uppercase tracking-wide">utilizadas</span>
                        </div>
                      </div>

                      {/* Progress visual bar */}
                      <div className="space-y-1.5">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isOverused ? "bg-[#ebb448]" : "bg-[#1070ca]"}`}
                            style={{ width: `${(ins.sessoesUtilizadas / ins.sessoesAutorizadas) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                          <span>Restam: {remaining} sessões</span>
                          <span>Vence em: {new Date(ins.validade).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      {/* Expiration or Limit Overuse alarms */}
                      {(isOverused || isExpired) && (
                        <div className="p-3 bg-amber-100/40 border border-amber-200 rounded-xl text-[10px] text-amber-800 flex items-center gap-1.5 leading-tight font-medium font-sans">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>
                            {isExpired ? "Validade da guia clínica está prestes a expirar!" : "Mais de 80% das sessões autorizadas já foram consumidas."}
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        {canEdit ? (
                          <button
                            onClick={() => handleDebitSession(ins)}
                            className="px-3.5 py-1.5 bg-[#1070ca] hover:bg-[#0b5194] text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" /> Debitar Sessão
                          </button>
                        ) : (
                          <span />
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteInsurance(ins.id)}
                            className="text-slate-300 hover:text-red-500 transition font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                            title="Remover guia"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "operadoras" && (
        <InsuranceProvidersPanel
          providers={providers}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onCreate={createProvider}
          onUpdate={updateProvider}
          onDelete={deleteProvider}
        />
      )}

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remover guia de convênio?"
        message="Esta guia de convênio será removida permanentemente do arquivo do paciente. Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="danger"
      />
    </div>
  );
}

function InsuranceProvidersPanel({
  providers,
  canCreate,
  canEdit,
  canDelete,
  onCreate,
  onUpdate,
  onDelete,
}: {
  providers: InsuranceProvider[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onCreate: (payload: Partial<InsuranceProvider>) => Promise<void>;
  onUpdate: (id: string, payload: Partial<InsuranceProvider>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const toast = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formContato, setFormContato] = useState("");
  const [formObs, setFormObs] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFormNome("");
    setFormContato("");
    setFormObs("");
    setShowForm(false);
  };

  const handleEditClick = (p: InsuranceProvider) => {
    setEditingId(p.id);
    setFormNome(p.nome);
    setFormContato(p.contato || "");
    setFormObs(p.observacoes || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) return;

    try {
      if (editingId) {
        await onUpdate(editingId, { nome: formNome, contato: formContato, observacoes: formObs });
        toast.success("Operadora atualizada com sucesso.");
      } else {
        await onCreate({ nome: formNome, contato: formContato, observacoes: formObs });
        toast.success("Operadora cadastrada com sucesso.");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar operadora.");
    }
  };

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await onDelete(pendingDeleteId);
    } catch (err: any) {
      toast.error(err.message || "Falha ao remover operadora.");
    } finally {
      setConfirmDeleteOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className={showForm ? "lg:col-span-7" : "lg:col-span-12"}>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-2 border-b border-slate-50">
            <div>
              <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">
                Operadoras Cadastradas
              </h3>
              <p className="text-[11px] text-slate-400">Total de {providers.length} operadoras disponíveis no sistema.</p>
            </div>
            {canCreate && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="shrink-0 whitespace-nowrap px-4 py-2 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Nova Operadora
              </button>
            )}
          </div>

          <div className="space-y-3">
            {providers.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Nenhuma operadora cadastrada ainda.</p>
            )}
            {providers.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-pink-50 text-[#d43f72] flex items-center justify-center shrink-0">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-800 truncate">{p.nome}</h4>
                    {p.contato && <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{p.contato}</p>}
                    {p.observacoes && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{p.observacoes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  {canEdit && (
                    <button
                      onClick={() => handleEditClick(p)}
                      className="p-1.5 bg-white border border-slate-100 hover:border-blue-200 rounded-lg text-slate-500 hover:text-[#1070ca] transition cursor-pointer"
                      title="Editar operadora"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteClick(p.id)}
                      className="p-1.5 bg-white border border-slate-100 hover:border-rose-200 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="Remover operadora"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="lg:col-span-5 animate-fade-in">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">
                {editingId ? "Editar Operadora" : "Nova Operadora"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Nome da Operadora *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Porto Seguro Saúde"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Telefone / E-mail de Contato</label>
                <input
                  type="text"
                  value={formContato}
                  onChange={(e) => setFormContato(e.target.value)}
                  placeholder="Ex: (11) 4000-0000 ou contato@operadora.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Observações</label>
                <textarea
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  rows={3}
                  placeholder="Ex: regras específicas de faturamento, prazos de glosa, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-semibold resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1070ca] hover:bg-[#0b5194] text-white font-black uppercase text-xs tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-md shadow-blue-500/5 flex items-center justify-center gap-1.5"
            >
              <Save className="h-4 w-4" /> {editingId ? "Salvar Alterações" : "Cadastrar Operadora"}
            </button>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remover operadora?"
        message="Esta operadora será removida do cadastro. Guias já registradas com o nome dela permanecem inalteradas."
        confirmLabel="Remover"
        variant="danger"
      />
    </div>
  );
}
