import React, { useState } from 'react';
import { CheckCircle2, Clock, UserCog, Trash2 } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { Combobox } from './Combobox';
import { Input } from './Input';
import { AgendaEvent, SystemUser } from '../../types';
import type { BulkAgendaAction } from '../../hooks/useAgendaEvents';

const STATUS_OPTIONS: AgendaEvent['status'][] = ['pendente', 'confirmado', 'realizado', 'cancelado'];
const STATUS_LABELS: Record<AgendaEvent['status'], string> = {
  pendente: 'Agendado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
};

type BulkActionKind = 'status' | 'shift_time' | 'professional' | 'delete';

const ACTION_META: Record<BulkActionKind, { label: string; icon: React.ReactNode }> = {
  status: { label: 'Mudar status', icon: <CheckCircle2 size={16} /> },
  shift_time: { label: 'Deslocar horário', icon: <Clock size={16} /> },
  professional: { label: 'Trocar profissional', icon: <UserCog size={16} /> },
  delete: { label: 'Excluir', icon: <Trash2 size={16} /> },
};

export interface AgendaBulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  professionals: SystemUser[];
  canDelete: boolean;
  onApply: (action: Omit<BulkAgendaAction, "ids">) => Promise<void>;
}

export const AgendaBulkActionModal: React.FC<AgendaBulkActionModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  professionals,
  canDelete,
  onApply,
}) => {
  const [kind, setKind] = useState<BulkActionKind>('status');
  const [status, setStatus] = useState<AgendaEvent['status']>('confirmado');
  const [offsetValue, setOffsetValue] = useState(60);
  const [offsetDirection, setOffsetDirection] = useState<'later' | 'earlier'>('later');
  const [professionalId, setProfessionalId] = useState('');
  const [saving, setSaving] = useState(false);

  const kinds: BulkActionKind[] = canDelete
    ? ['status', 'shift_time', 'professional', 'delete']
    : ['status', 'shift_time', 'professional'];

  const handleApply = async () => {
    setSaving(true);
    try {
      if (kind === 'status') {
        await onApply({ action: 'status', status });
      } else if (kind === 'shift_time') {
        const minutes = offsetDirection === 'later' ? offsetValue : -offsetValue;
        await onApply({ action: 'shift_time', offsetMinutes: minutes });
      } else if (kind === 'professional') {
        await onApply({ action: 'professional', professionalId: professionalId || null });
      } else {
        await onApply({ action: 'delete' });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ação em lote"
      subtitle={`${selectedCount} agendamento${selectedCount === 1 ? '' : 's'} selecionado${selectedCount === 1 ? '' : 's'}`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {kinds.map((k) => {
            const meta = ACTION_META[k];
            const active = kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-xs font-bold transition ${
                  active
                    ? k === 'delete'
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                {meta.icon} {meta.label}
              </button>
            );
          })}
        </div>

        {kind === 'status' && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Novo status</p>
            <Combobox
              size="sm"
              value={status}
              onChange={(v) => setStatus(v as AgendaEvent['status'])}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            />
          </div>
        )}

        {kind === 'shift_time' && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Deslocar todas as selecionadas (cada uma mantém seu próprio dia)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={1}
                value={offsetValue}
                onChange={(e) => setOffsetValue(Math.max(1, Number(e.target.value)))}
                suffix={<span className="text-[10px] text-slate-400 px-2">minutos</span>}
              />
              <Combobox
                size="sm"
                value={offsetDirection}
                onChange={(v) => setOffsetDirection(v as 'later' | 'earlier')}
                options={[
                  { value: 'later', label: 'Mais tarde' },
                  { value: 'earlier', label: 'Mais cedo' },
                ]}
              />
            </div>
          </div>
        )}

        {kind === 'professional' && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Profissional responsável</p>
            <Combobox
              size="sm"
              placeholder="Selecionar profissional..."
              value={professionalId}
              onChange={(v) => setProfessionalId(v as string)}
              options={professionals.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
        )}

        {kind === 'delete' && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
            Esta ação exclui permanentemente os {selectedCount} agendamentos selecionados. Não pode ser desfeita.
          </p>
        )}
      </div>

      <ModalFooter className="mt-6">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant={kind === 'delete' ? 'danger' : 'primary'} loading={saving} onClick={handleApply}>
          Aplicar a {selectedCount} agendamento{selectedCount === 1 ? '' : 's'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
