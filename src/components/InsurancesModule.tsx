import React, { useState } from "react";
import { CreditCard, Calendar, Plus, AlertTriangle, Check, RefreshCw, Layers } from "lucide-react";
import { Patient, Insurance, UserRole, UserPermissions } from "../types";
import { ConfirmModal, useToast } from "./UI";

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

  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const [newNome, setNewNome] = useState("Unimed Paulista");
  const [newGuia, setNewGuia] = useState("");
  const [newSessoesAut, setNewSessoesAut] = useState(24);
  const [newValidade, setNewValidade] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
        <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
          <span className="p-1 rounded-xl bg-pink-50 text-[#d43f72] text-lg">💳</span> Guias & Convênios de Saúde
        </h2>
        <p className="text-xs text-slate-500 font-medium font-sans">Acompanhe o consumo de sessões autorizadas de planos de saúde de forma simplificada, agilizando faturamentos sem glosas de operadoras.</p>
      </div>

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
                    <option value="Unimed Paulista">Unimed Paulista</option>
                    <option value="SulAmérica Saúde">SulAmérica Saúde</option>
                    <option value="Bradesco Saúde">Bradesco Saúde</option>
                    <option value="Amil Assistência">Amil Assistência</option>
                  </select>
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
