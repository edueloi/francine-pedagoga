import React, { useState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { Modal, ModalFooter, useToast } from "./UI";
import { UserRole } from "../types";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (payload: { email: string; role: string }) => Promise<void>;
}

export default function InviteUserModal({ isOpen, onClose, onInvite }: InviteUserModalProps) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.PROFESSIONAL);
  const [sending, setSending] = useState(false);

  const handleClose = () => {
    setEmail("");
    setRole(UserRole.PROFESSIONAL);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await onInvite({ email, role });
      toast.success(`Convite enviado para ${email}. Válido por 7 dias.`);
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar convite.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Convidar por E-mail"
      subtitle="A pessoa recebe um link para criar o próprio cadastro. O convite expira em 7 dias."
      size="sm"
      footer={
        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="invite-user-form"
            disabled={sending}
            className="px-4 py-2.5 bg-[#1070ca] hover:bg-[#0b5194] disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
          >
            {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar Convite
          </button>
        </ModalFooter>
      }
    >
      <form id="invite-user-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">E-mail do convidado *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pessoa@email.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Perfil de acesso *</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
          >
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">A pessoa herda as permissões padrão deste perfil, ajustáveis depois.</p>
        </div>
      </form>
    </Modal>
  );
}
