import React, { useState } from "react";
import { Receipt, Plus, Edit3, Trash2, X, Save } from "lucide-react";
import { Service, UserRole, UserPermissions } from "../types";
import { ConfirmModal, useToast } from "./UI";

interface ServicesModuleProps {
  userRole: UserRole;
  services: Service[];
  onCreateService: (payload: Partial<Service>) => Promise<void>;
  onUpdateService: (id: string, payload: Partial<Service>) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  userPermissions?: UserPermissions;
}

const COLOR_OPTIONS = ["#6366f1", "#f59e0b", "#0891b2", "#10b981", "#ef4444", "#8b5cf6"];

export default function ServicesModule({
  userRole,
  services,
  onCreateService,
  onUpdateService,
  onDeleteService,
  userPermissions,
}: ServicesModuleProps) {
  const toast = useToast();
  const canCreate = userPermissions ? userPermissions.services.criar : userRole !== UserRole.RESTRICTED;
  const canEdit = userPermissions ? userPermissions.services.editar : userRole !== UserRole.RESTRICTED;
  const canDelete = userPermissions ? userPermissions.services.excluir : userRole === UserRole.ADMIN;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDuration, setFormDuration] = useState(50);
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
  const [formActive, setFormActive] = useState(true);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormDuration(50);
    setFormColor(COLOR_OPTIONS[0]);
    setFormActive(true);
    setShowForm(false);
  };

  const handleEditClick = (s: Service) => {
    setEditingId(s.id);
    setFormName(s.name);
    setFormDuration(s.defaultDurationMinutes);
    setFormColor(s.color || COLOR_OPTIONS[0]);
    setFormActive(s.active);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formDuration <= 0) return;

    try {
      const payload = {
        name: formName,
        defaultDurationMinutes: formDuration,
        color: formColor,
        active: formActive,
      };
      if (editingId) {
        await onUpdateService(editingId, payload);
        toast.success("Serviço atualizado com sucesso.");
      } else {
        await onCreateService(payload);
        toast.success("Serviço cadastrado com sucesso.");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar serviço.");
    }
  };

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await onDeleteService(pendingDeleteId);
    } catch (err: any) {
      toast.error(err.message || "Falha ao remover serviço.");
    } finally {
      setConfirmDeleteOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div id="services-module" className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 flex items-center gap-2">
          <span className="p-1 rounded-xl bg-indigo-50 text-indigo-600 text-lg">🧾</span> Serviços e Comandas
        </h2>
        <p className="text-xs text-slate-500 font-medium font-sans">
          Cadastre os serviços oferecidos pela clínica — nome, duração padrão e cor — para usá-los ao criar agendamentos.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className={showForm ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-2 border-b border-slate-50">
              <div>
                <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">
                  Serviços Cadastrados
                </h3>
                <p className="text-[11px] text-slate-400">Total de {services.length} serviços disponíveis no sistema.</p>
              </div>
              {canCreate && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="shrink-0 whitespace-nowrap px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Novo Serviço
                </button>
              )}
            </div>

            <div className="space-y-3">
              {services.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">Nenhum serviço cadastrado ainda.</p>
              )}
              {services.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: s.color || COLOR_OPTIONS[0] }}
                    >
                      <Receipt className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 truncate flex items-center gap-2">
                        {s.name}
                        {!s.active && (
                          <span className="text-[9px] font-black uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            Inativo
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.defaultDurationMinutes} minutos (padrão)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    {canEdit && (
                      <button
                        onClick={() => handleEditClick(s)}
                        className="p-1.5 bg-white border border-slate-100 hover:border-indigo-200 rounded-lg text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                        title="Editar serviço"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteClick(s.id)}
                        className="p-1.5 bg-white border border-slate-100 hover:border-rose-200 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Remover serviço"
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
                  {editingId ? "Editar Serviço" : "Novo Serviço"}
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
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Nome do Serviço *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Sessão de Psicoterapia"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Duração Padrão (minutos) *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    step={5}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Cor</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        className={`h-8 w-8 rounded-full transition ${formColor === c ? "ring-2 ring-offset-2 ring-slate-400" : ""}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Selecionar cor ${c}`}
                      />
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-bold text-slate-600">Serviço ativo (aparece na criação de agendamentos)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5"
              >
                <Save className="h-4 w-4" /> {editingId ? "Salvar Alterações" : "Cadastrar Serviço"}
              </button>
            </form>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remover serviço?"
        message="Este serviço será removido do cadastro. Agendamentos já criados com ele permanecem inalterados."
        confirmLabel="Remover"
        variant="danger"
      />
    </div>
  );
}
