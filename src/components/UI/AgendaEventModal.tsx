import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, FileCheck2, Trash2, X, Link2, FileText, MessageCircle, Pencil, Repeat, CalendarClock, Video, MapPin, Briefcase } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button, IconButton } from './Button';
import { Combobox } from './Combobox';
import { AgendaEventFields, AgendaEventFieldsValue } from './AgendaEventFields';
import { RecurrencePickerModal, recurrenceSummaryLabel } from './AgendaEventFormModal';
import { AgendaEvent, Insurance, Patient, Service, SystemUser, RecurrenceConfig } from '../../types';
import type { AgendaEventScope } from '../../hooks/useAgendaEvents';

const STATUS_META: Record<AgendaEvent['status'], { label: string; dot: string; badge: string; activeBtn: string }> = {
  pendente: { label: 'Agendado', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600', activeBtn: 'bg-slate-600 border-slate-600' },
  confirmado: { label: 'Confirmado', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', activeBtn: 'bg-emerald-600 border-emerald-600' },
  realizado: { label: 'Realizado', dot: 'bg-[#1070ca]', badge: 'bg-blue-50 text-[#1070ca]', activeBtn: 'bg-[#1070ca] border-[#1070ca]' },
  cancelado: { label: 'Cancelado', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700', activeBtn: 'bg-rose-600 border-rose-600' },
};

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
  onSave: (
    id: string,
    payload: Partial<AgendaEvent>,
    scope?: AgendaEventScope,
    force?: boolean,
    recurrence?: RecurrenceConfig
  ) => Promise<void>;
  onDelete: (id: string, scope?: AgendaEventScope) => Promise<void>;
  onNavigateToPatient?: (patientId: string) => void;
}

type PendingAction =
  | { kind: 'save'; payload: Partial<AgendaEvent>; recurrence?: RecurrenceConfig }
  | { kind: 'delete' }
  | null;

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
  const [conflict, setConflict] = useState<{
    action: PendingAction;
    scope: AgendaEventScope;
    conflict: { id: string; title: string; start_time: string; end_time: string };
  } | null>(null);

  const [editFields, setEditFields] = useState<AgendaEventFieldsValue | null>(null);
  const handleEditFieldsChange = (patch: Partial<AgendaEventFieldsValue>) => {
    setEditFields((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  // Lets a standalone (non-series) event be turned into a recurring one from the
  // edit form — previously recurrence could only be picked at creation time, so an
  // existing Bloqueio/Evento Pessoal/Consulta had no way to become recurring later.
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceConfig | null>(null);
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);

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

  const service = useMemo(
    () => services.find((s) => s.id === event?.serviceId),
    [services, event?.serviceId]
  );

  // The "Guia" (convênio) block is only relevant when this patient actually has
  // insurance to link — showing an empty card for every particular patient (the
  // common case) was pure clutter.
  const showGuiaSection = !!linkedInsurance || patientInsurances.length > 0;

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
      setEditFields({
        type: event.type,
        patientId: event.patientId || '',
        freeTitle: event.type !== 'consulta' ? event.title : '',
        serviceId: event.serviceId || '',
        modality: event.modality,
        professionalId: event.professionalId || '',
        status: event.status,
        date: toDateInput(event.start),
        startTime: toTimeInput(event.start),
        endTime: toTimeInput(event.end),
        tipo: event.tipo,
        alertas: event.alertas || '',
      });
      setNewRecurrence(null);
    }
  }, [event, isEditing]);

  if (!event) return null;

  const statusMeta = STATUS_META[event.status];
  // A recurrence_group_id alone isn't enough — every event (even a one-off "Não
  // repete") gets one. Only treat it as a real series when other rows actually
  // share that group; otherwise the scope-confirmation modal would show up for
  // ordinary single events, asking to choose between "only" and "0 future
  // sessions" for no reason.
  const isPartOfSeries = !!event.recurrenceGroupId && seriesSiblings.length > 0;
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

  const runAction = async (action: PendingAction, scope: AgendaEventScope, force?: boolean) => {
    if (!action) return;
    setSaving(true);
    try {
      if (action.kind === 'save') {
        await onSave(event.id, action.payload, scope, force, action.recurrence);
        setConflict(null);
        setIsEditing(false);
      } else {
        await onDelete(event.id, scope);
        onClose();
      }
      setPendingAction(null);
    } catch (err: any) {
      if (err.name === 'AgendaConflictError' && action.kind === 'save') {
        setConflict({ action, scope, conflict: err.conflict });
      } else {
        throw err;
      }
    } finally {
      setSaving(false);
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
    if (!editFields) return;
    const isConsulta = editFields.type === 'consulta';
    const patient = patients.find((p) => p.id === editFields.patientId);
    runOrAskScope({
      kind: 'save',
      payload: {
        title: isConsulta ? patient?.nome || event!.title : editFields.freeTitle,
        patientId: isConsulta ? editFields.patientId || undefined : undefined,
        start: combineToIso(editFields.date, editFields.startTime),
        end: combineToIso(editFields.date, editFields.endTime),
        tipo: editFields.tipo,
        status: editFields.status,
        modality: editFields.modality,
        serviceId: isConsulta ? editFields.serviceId || undefined : undefined,
        professionalId: editFields.professionalId || undefined,
        alertas: editFields.alertas || undefined,
      },
      recurrence: newRecurrence || undefined,
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

  const conflictModal = conflict && (
    <Modal isOpen onClose={() => setConflict(null)} title="Conflito de horário" size="xs">
      <p className="text-sm text-slate-600 mb-4">
        Já existe um agendamento (<strong>{conflict.conflict.title}</strong>) para este profissional entre{' '}
        {new Date(conflict.conflict.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} e{' '}
        {new Date(conflict.conflict.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Deseja salvar mesmo assim?
      </p>
      <ModalFooter>
        <Button variant="outline" onClick={() => setConflict(null)}>Voltar</Button>
        <Button variant="primary" loading={saving} onClick={() => runAction(conflict.action, conflict.scope, true)}>
          Salvar mesmo assim
        </Button>
      </ModalFooter>
    </Modal>
  );

  if (isEditing && editFields) {
    return (
      <Modal isOpen={isOpen} onClose={() => setIsEditing(false)} title="Editar agendamento" size="xl">
        <AgendaEventFields
          value={editFields}
          onChange={handleEditFieldsChange}
          patients={patients}
          services={services}
          professionals={professionals}
          hideTypeSelector
          // Turning an existing series' rule into a different one isn't supported
          // yet — only offer "make this recurring" for a still-standalone event.
          recurrenceSlot={
            !isPartOfSeries ? (
              <button
                type="button"
                onClick={() => setRecurrenceModalOpen(true)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-indigo-300"
              >
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Repeat size={14} className="text-indigo-500" /> Repetição Fixa
                </span>
                <span className="text-[11px] font-black text-indigo-600">{recurrenceSummaryLabel(newRecurrence)}</span>
              </button>
            ) : undefined
          }
        />

        <ModalFooter className="mt-6">
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={handleSaveEdit}>Salvar Alterações</Button>
        </ModalFooter>

        <RecurrencePickerModal
          isOpen={recurrenceModalOpen}
          onClose={() => setRecurrenceModalOpen(false)}
          value={newRecurrence}
          onChange={setNewRecurrence}
        />

        {scopeModal}
        {conflictModal}
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" hideCloseButton>
      <div className="-m-6 mb-0 sm:-m-8 sm:mb-0 bg-gradient-to-br from-[#1070ca] to-[#0b5194] text-white px-6 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6 rounded-t-2xl relative">
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

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[11px] font-bold">
            <Calendar size={12} /> {formatDateLabel(event.start)}
            <span className="text-white/40">•</span>
            <Clock size={12} /> {formatTimeLabel(event.start)}–{formatTimeLabel(event.end)}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[11px] font-bold">
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} /> {statusMeta.label}
          </span>
          {isPartOfSeries && (
            <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[11px] font-bold">
              <Repeat size={12} /> Série
            </span>
          )}
          {onNavigateToPatient && patient && (
            <button
              onClick={() => onNavigateToPatient(patient.id)}
              className="inline-flex items-center gap-1.5 bg-white text-[#1070ca] hover:bg-white/90 rounded-full px-3 py-1 text-[11px] font-black transition ml-auto"
            >
              <FileText size={12} /> Ver prontuário
            </button>
          )}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 rounded-full px-3 py-1 text-[11px] font-black transition ${onNavigateToPatient && patient ? "" : "ml-auto"}`}
            >
              <MessageCircle size={12} /> WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="pt-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Atendimento</p>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Briefcase size={13} className="text-slate-400 shrink-0" /> {event.tipo}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Modalidade</p>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              {event.modality === 'online' ? <Video size={13} className="text-cyan-500 shrink-0" /> : <MapPin size={13} className="text-slate-400 shrink-0" />}
              {event.modality === 'online' ? 'Online' : 'Presencial'}
            </p>
          </div>
          {service && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 col-span-2 sm:col-span-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviço</p>
              <p className="text-xs font-bold text-slate-700 truncate">{service.name}</p>
            </div>
          )}
        </div>

        {event.alertas && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Observações</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{event.alertas}</p>
          </div>
        )}

        {/* Seção Guia — vínculo com convênio. Só aparece quando o paciente realmente
            tem guia(s) cadastrada(s); pra atendimento particular (a maioria) mostrar
            um card vazio dizendo "não possui guias" era só ruído visual. */}
        {showGuiaSection && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck2 size={15} className="text-[#1070ca]" />
              <p className="text-[11px] font-black text-[#1070ca] uppercase tracking-widest">Guia</p>
            </div>

            {linkedInsurance ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800">
                  {linkedInsurance.nome} — Guia nº {linkedInsurance.numeroGuia}
                </p>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1070ca]"
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
            ) : (
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
            )}
          </div>
        )}

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
                    ? `${STATUS_META[status].activeBtn} text-white`
                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
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
      {conflictModal}
    </Modal>
  );
};
