import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, FileCheck2, Trash2, X, Link2, FileText, MessageCircle, Pencil, Repeat, CalendarClock } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button, IconButton } from './Button';
import { Combobox } from './Combobox';
import { Select, Input, Textarea } from './Input';
import { DatePicker } from './DatePicker';
import { AgendaEvent, Insurance, Patient, Service, SystemUser } from '../../types';
import type { AgendaEventScope } from '../../hooks/useAgendaEvents';

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

function toDateInput(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toTimeInput(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function combineToIso(date: string, time: string) {
  return `${date}T${time}:00`;
}

function whatsappHref(phone?: string) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

export interface AgendaEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AgendaEvent | null;
  patients: Patient[];
  insurances: Insurance[];
  services: Service[];
  professionals: SystemUser[];
  allEvents: AgendaEvent[];
  canEdit: boolean;
  canDelete: boolean;
  onSave: (id: string, payload: Partial<AgendaEvent>, scope?: AgendaEventScope) => Promise<void>;
  onDelete: (id: string, scope?: AgendaEventScope) => Promise<void>;
  onNavigateToPatient?: (patientId: string) => void;
}

type PendingAction = { kind: 'save'; payload: Partial<AgendaEvent> } | { kind: 'delete' } | null;

export const AgendaEventModal: React.FC<AgendaEventModalProps> = ({
  isOpen,
  onClose,
  event,
  patients,
  insurances,
  services,
  professionals,
  allEvents,
  canEdit,
  canDelete,
  onSave,
  onDelete,
  onNavigateToPatient,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editTipo, setEditTipo] = useState<AgendaEvent['tipo']>('Sessão');
  const [editModality, setEditModality] = useState<AgendaEvent['modality']>('presencial');
  const [editServiceId, setEditServiceId] = useState('');
  const [editProfessionalId, setEditProfessionalId] = useState('');
  const [editAlertas, setEditAlertas] = useState('');

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

  // Other sessions sharing the same recurrence_group_id, so the user can see exactly
  // what a "this and future" edit/delete would touch before confirming it.
  const seriesSiblings = useMemo(() => {
    if (!event?.recurrenceGroupId) return [];
    return allEvents
      .filter((ev) => ev.recurrenceGroupId === event.recurrenceGroupId && ev.id !== event.id)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [allEvents, event]);

  const futureSiblings = useMemo(
    () => seriesSiblings.filter((ev) => new Date(ev.start) >= new Date() && ev.status !== 'realizado'),
    [seriesSiblings]
  );

  useEffect(() => {
    if (event && isEditing) {
      setEditDate(toDateInput(event.start));
      setEditStart(toTimeInput(event.start));
      setEditEnd(toTimeInput(event.end));
      setEditTipo(event.tipo);
      setEditModality(event.modality);
      setEditServiceId(event.serviceId || '');
      setEditProfessionalId(event.professionalId || '');
      setEditAlertas(event.alertas || '');
    }
  }, [event, isEditing]);

  if (!event) return null;

  const statusMeta = STATUS_META[event.status];
  const isPartOfSeries = !!event.recurrenceGroupId;
  const waHref = whatsappHref(patient?.telefone);

  // For actions affecting a recurring series, ask whether to apply to only this
  // occurrence or this and every future one before actually running them.
  const runOrAskScope = (action: PendingAction) => {
    if (!isPartOfSeries) {
      runAction(action, 'only');
      return;
    }
    setPendingAction(action);
  };

  const runAction = async (action: PendingAction, scope: AgendaEventScope) => {
    if (!action) return;
    setSaving(true);
    try {
      if (action.kind === 'save') {
        await onSave(event.id, action.payload, scope);
        setIsEditing(false);
      } else {
        await onDelete(event.id, scope);
        onClose();
      }
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  };

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

  const handleSaveEdit = () => {
    runOrAskScope({
      kind: 'save',
      payload: {
        start: combineToIso(editDate, editStart),
        end: combineToIso(editDate, editEnd),
        tipo: editTipo,
        modality: editModality,
        serviceId: editServiceId || undefined,
        professionalId: editProfessionalId || undefined,
        alertas: editAlertas || undefined,
      },
    });
  };

  const handleDelete = () => {
    if (!isPartOfSeries && !window.confirm('Deseja realmente excluir este agendamento?')) return;
    runOrAskScope({ kind: 'delete' });
  };

  const scopeModal = pendingAction && (
    <Modal
      isOpen
      onClose={() => setPendingAction(null)}
      title="Este agendamento faz parte de uma série"
      subtitle={`${futureSiblings.length} outra${futureSiblings.length === 1 ? '' : 's'} sessão${futureSiblings.length === 1 ? '' : 'ões'} futura${futureSiblings.length === 1 ? '' : 's'} na série`}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Deseja {pendingAction.kind === 'delete' ? 'excluir' : 'aplicar esta alteração a'} somente esta sessão, ou esta e as sessões futuras da série?
        </p>

        {futureSiblings.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 max-h-40 overflow-y-auto divide-y divide-slate-100">
            {futureSiblings.map((sibling) => (
              <div key={sibling.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                <CalendarClock size={13} className="text-slate-400 shrink-0" />
                <span className="font-bold text-slate-700">{formatDateLabel(sibling.start)}</span>
                <span className="text-slate-400">{formatTimeLabel(sibling.start)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => runAction(pendingAction, 'only')} disabled={saving}>
            Apenas esta sessão
          </Button>
          <Button variant="primary" className="w-full" onClick={() => runAction(pendingAction, 'future')} loading={saving}>
            Esta e as {futureSiblings.length} sessões futuras
          </Button>
        </div>
      </div>
    </Modal>
  );

  if (isEditing) {
    return (
      <Modal isOpen={isOpen} onClose={() => setIsEditing(false)} title="Editar agendamento" size="lg">
        <div className="space-y-5">
          <DatePicker value={editDate} onChange={(v) => v && setEditDate(v)} label="Data" />
          <div className="grid grid-cols-2 gap-3">
            <Input type="time" label="Início" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
            <Input type="time" label="Término" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
          </div>

          {event.type === 'consulta' && (
            <>
              <Select
                label="Tipo de atendimento"
                value={editTipo}
                onChange={(e) => setEditTipo(e.target.value as AgendaEvent['tipo'])}
                options={TIPO_OPTIONS.map((t) => ({ value: t, label: t }))}
              />
              <Combobox
                size="sm"
                placeholder="Serviço ou pacote"
                options={services.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))}
                value={editServiceId}
                onChange={(v) => setEditServiceId(v as string)}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditModality('presencial')}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    editModality === 'presencial' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  Presencial
                </button>
                <button
                  type="button"
                  onClick={() => setEditModality('online')}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    editModality === 'online' ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  Online
                </button>
              </div>
              {professionals.length > 1 && (
                <Combobox
                  size="sm"
                  placeholder="Profissional responsável"
                  options={professionals.map((p) => ({ value: p.id, label: p.name }))}
                  value={editProfessionalId}
                  onChange={(v) => setEditProfessionalId(v as string)}
                />
              )}
            </>
          )}

          <Textarea
            label="Observações"
            value={editAlertas}
            onChange={(e) => setEditAlertas(e.target.value)}
            rows={3}
          />
        </div>

        <ModalFooter className="mt-6">
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={handleSaveEdit}>Salvar Alterações</Button>
        </ModalFooter>

        {scopeModal}
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" hideCloseButton>
      <div className="-m-6 mb-0 sm:-m-8 sm:mb-0 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white px-6 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6 rounded-t-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center font-black text-lg shrink-0">
            {(patient?.nome || event.title || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 pr-8">
            <p className="font-black text-lg truncate">{patient?.nome || event.title}</p>
            {patient?.telefone && <p className="text-white/70 text-xs font-semibold">{patient.telefone}</p>}
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
          {isPartOfSeries && (
            <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[11px] font-bold">
              <Repeat size={12} /> Série
            </span>
          )}
        </div>

        {patient && (onNavigateToPatient || waHref) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {onNavigateToPatient && (
              <button
                onClick={() => onNavigateToPatient(patient.id)}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 text-[11px] font-bold transition"
              >
                <FileText size={12} /> Ver prontuário
              </button>
            )}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 text-[11px] font-bold transition"
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      <div className="pt-6 space-y-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo de atendimento</p>
          <p className="text-sm font-bold text-slate-700">{event.tipo}</p>
        </div>

        {event.alertas && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Observações</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{event.alertas}</p>
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Alterar status</p>
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

      <ModalFooter align="between" className="mt-7 pt-5 border-t border-slate-100">
        <div className="flex gap-2">
          {canDelete && (
            <IconButton variant="danger" onClick={handleDelete} disabled={saving} title="Excluir agendamento">
              <Trash2 size={15} />
            </IconButton>
          )}
          {canEdit && (
            <IconButton variant="outline" onClick={() => setIsEditing(true)} disabled={saving} title="Editar agendamento">
              <Pencil size={15} />
            </IconButton>
          )}
        </div>
        <Button variant="outline" onClick={onClose}>Fechar</Button>
      </ModalFooter>

      {scopeModal}
    </Modal>
  );
};
