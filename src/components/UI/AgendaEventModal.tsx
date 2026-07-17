import React, { useMemo, useState } from 'react';
import { Calendar, Clock, FileCheck2, Trash2, X, Link2 } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button, IconButton } from './Button';
import { Combobox } from './Combobox';
import { DatePicker } from './DatePicker';
import { AgendaEvent, Insurance, Patient } from '../../types';

const STATUS_META: Record<AgendaEvent['status'], { label: string; dot: string }> = {
  pendente: { label: 'Agendado', dot: 'bg-slate-400' },
  confirmado: { label: 'Confirmado', dot: 'bg-emerald-500' },
  realizado: { label: 'Realizado', dot: 'bg-indigo-500' },
  cancelado: { label: 'Cancelado', dot: 'bg-rose-500' },
};

const TIPO_OPTIONS: AgendaEvent['tipo'][] = ['Sessão', 'Avaliação', 'Reunião', 'Visita Escolar', 'Retorno'];

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
}

function formatTimeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export interface AgendaEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AgendaEvent | null;
  patients: Patient[];
  insurances: Insurance[];
  canEdit: boolean;
  canDelete: boolean;
  onSave: (id: string, payload: Partial<AgendaEvent>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const AgendaEventModal: React.FC<AgendaEventModalProps> = ({
  isOpen,
  onClose,
  event,
  patients,
  insurances,
  canEdit,
  canDelete,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const patient = useMemo(
    () => patients.find((p) => p.id === event?.patientId),
    [patients, event?.patientId]
  );

  const patientInsurances = useMemo(
    () => insurances.filter((ins) => ins.patientId === event?.patientId),
    [insurances, event?.patientId]
  );

  const linkedInsurance = useMemo(
    () => insurances.find((ins) => ins.id === event?.insuranceId),
    [insurances, event?.insuranceId]
  );

  if (!event) return null;

  const statusMeta = STATUS_META[event.status];

  const handleStatusChange = async (status: AgendaEvent['status']) => {
    setSaving(true);
    try {
      await onSave(event.id, { status });
    } finally {
      setSaving(false);
    }
  };

  const handleLinkInsurance = async (insuranceId: string) => {
    setSaving(true);
    try {
      await onSave(event.id, { insuranceId: insuranceId || undefined });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Deseja realmente excluir este agendamento?')) return;
    setSaving(true);
    try {
      await onDelete(event.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" hideCloseButton>
      <div className="-m-6 mb-0 sm:-m-8 sm:mb-0 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 sm:p-8 rounded-t-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center font-black text-lg shrink-0">
            {(patient?.nome || event.title || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-black text-lg truncate">{patient?.nome || event.title}</p>
            <p className="text-white/70 text-xs font-semibold">{patient?.telefone}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[11px] font-bold">
            <Calendar size={12} /> {formatDateLabel(event.start)}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[11px] font-bold">
            <Clock size={12} /> {formatTimeLabel(event.start)} – {formatTimeLabel(event.end)}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[11px] font-bold">
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} /> {statusMeta.label}
          </span>
        </div>
      </div>

      <div className="pt-5 space-y-5">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de atendimento</p>
          <p className="text-sm font-bold text-slate-700">{event.tipo}</p>
        </div>

        {event.alertas && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observações</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{event.alertas}</p>
          </div>
        )}

        {/* Seção Guia — vínculo com convênio, equivalente à "comanda" do psi-painel-karen */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck2 size={15} className="text-indigo-600" />
            <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">Guia</p>
          </div>

          {linkedInsurance ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-800">
                {linkedInsurance.nome} — Guia nº {linkedInsurance.numeroGuia}
              </p>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (linkedInsurance.sessoesUtilizadas / Math.max(1, linkedInsurance.sessoesAutorizadas)) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[11px] font-semibold text-slate-500">
                {linkedInsurance.sessoesUtilizadas} de {linkedInsurance.sessoesAutorizadas} sessões utilizadas
              </p>
              {canEdit && (
                <button
                  onClick={() => handleLinkInsurance('')}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-600"
                  disabled={saving}
                >
                  Desvincular guia
                </button>
              )}
            </div>
          ) : patientInsurances.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Sem guia de convênio vinculada a este agendamento.</p>
              {canEdit && (
                <Combobox
                  size="sm"
                  icon={<Link2 size={13} />}
                  placeholder="Vincular guia de convênio"
                  options={patientInsurances.map((ins) => ({
                    value: ins.id,
                    label: `${ins.nome} — Guia nº ${ins.numeroGuia}`,
                    subtitle: `${ins.sessoesUtilizadas}/${ins.sessoesAutorizadas} sessões`,
                  }))}
                  value=""
                  onChange={(v) => handleLinkInsurance(v as string)}
                />
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Este paciente não possui guias de convênio cadastradas.
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alterar status</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_META) as AgendaEvent['status'][]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={saving || !canEdit}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide border transition-all ${
                  event.status === status
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {STATUS_META[status].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter align="between" className="mt-6">
        <div>
          {canDelete && (
            <IconButton variant="danger" onClick={handleDelete} disabled={saving} title="Excluir agendamento">
              <Trash2 size={15} />
            </IconButton>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
