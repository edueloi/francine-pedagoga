import React, { useMemo } from 'react';
import { Briefcase, CalendarDays, Ban, MapPin, Video } from 'lucide-react';
import { Combobox } from './Combobox';
import { Input, Textarea } from './Input';
import { DatePicker } from './DatePicker';
import { AgendaEvent, Patient, Service, SystemUser } from '../../types';

export const TIPO_OPTIONS: AgendaEvent['tipo'][] = ['Sessão', 'Avaliação', 'Reunião', 'Visita Escolar', 'Retorno'];
export const STATUS_OPTIONS: AgendaEvent['status'][] = ['pendente', 'confirmado', 'realizado', 'cancelado'];
export const STATUS_LABELS: Record<AgendaEvent['status'], string> = {
  pendente: 'Agendado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
};

export type EventType = AgendaEvent['type'];

export const TYPE_META: Record<
  EventType,
  { label: string; subtitle: string; icon: React.ReactNode; activeBorder: string; activeBg: string; activeText: string; activeDot: string }
> = {
  consulta: {
    label: 'Consulta',
    subtitle: 'Sessão clínica',
    icon: <Briefcase size={16} />,
    activeBorder: 'border-indigo-500',
    activeBg: 'bg-indigo-50',
    activeText: 'text-indigo-600',
    activeDot: 'bg-indigo-500',
  },
  pessoal: {
    label: 'Evento Pessoal',
    subtitle: 'Compromisso pessoal',
    icon: <CalendarDays size={16} />,
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-50',
    activeText: 'text-amber-600',
    activeDot: 'bg-amber-500',
  },
  bloqueio: {
    label: 'Bloqueio',
    subtitle: 'Horário indisponível',
    icon: <Ban size={16} />,
    activeBorder: 'border-slate-500',
    activeBg: 'bg-slate-100',
    activeText: 'text-slate-600',
    activeDot: 'bg-slate-500',
  },
};

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  // Falls back to 50min if end <= start (e.g. already-inconsistent data) so the
  // recalculated end time always lands after the new start.
  return diff > 0 ? diff : 50;
}

export interface AgendaEventFieldsValue {
  type: EventType;
  patientId: string;
  freeTitle: string;
  serviceId: string;
  modality: AgendaEvent['modality'];
  professionalId: string;
  status: AgendaEvent['status'];
  date: string;
  startTime: string;
  endTime: string;
  tipo: AgendaEvent['tipo'];
  alertas: string;
}

export interface AgendaEventFieldsProps {
  value: AgendaEventFieldsValue;
  onChange: (patch: Partial<AgendaEventFieldsValue>) => void;
  patients: Patient[];
  services: Service[];
  professionals: SystemUser[];
  /** Hides the type selector (Consulta/Pessoal/Bloqueio) — used when editing, since
   * changing the type of an existing event isn't a supported flow. */
  hideTypeSelector?: boolean;
  /** Extra content rendered at the end of the "Horário e Repetição" column (e.g. the
   * "Repetição Fixa" button, which only makes sense when creating a new event). */
  recurrenceSlot?: React.ReactNode;
}

// Shared field set for creating and editing an agenda event — kept in one place so
// both modals always look and behave the same way (previously the edit modal had
// fallen behind with a plain <select> and no patient/status/type fields).
export const AgendaEventFields: React.FC<AgendaEventFieldsProps> = ({
  value,
  onChange,
  patients,
  services,
  professionals,
  hideTypeSelector,
  recurrenceSlot,
}) => {
  const activeServices = useMemo(() => services.filter((s) => s.active), [services]);
  const isConsulta = value.type === 'consulta';

  const handleServiceChange = (id: string) => {
    const service = activeServices.find((s) => s.id === id);
    onChange({
      serviceId: id,
      endTime: service ? addMinutes(value.startTime, service.defaultDurationMinutes) : value.endTime,
    });
  };

  const handleStartTimeChange = (time: string) => {
    const service = activeServices.find((s) => s.id === value.serviceId);
    // Preserve the original duration when the start time changes — otherwise
    // moving "início" without a service selected leaves "término" untouched,
    // which can leave end < start (e.g. 08:00-08:50 → 09:00-08:50).
    const durationMinutes = service
      ? service.defaultDurationMinutes
      : minutesBetween(value.startTime, value.endTime);
    onChange({
      startTime: time,
      endTime: addMinutes(time, durationMinutes),
    });
  };

  return (
    <div className="space-y-5">
      {!hideTypeSelector && (
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TYPE_META) as EventType[]).map((t) => {
            const meta = TYPE_META[t];
            const active = value.type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ type: t })}
                className={`rounded-2xl border-2 p-3 text-left transition ${
                  active ? `${meta.activeBorder} ${meta.activeBg}` : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={active ? meta.activeText : 'text-slate-400'}>{meta.icon}</span>
                  {active && <span className={`h-2 w-2 rounded-full ${meta.activeDot}`} />}
                </div>
                <p className="mt-1.5 text-xs font-black text-slate-800">{meta.label}</p>
                <p className="text-[10px] text-slate-400">{meta.subtitle}</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</p>

          {isConsulta ? (
            <>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Paciente</p>
                <Combobox
                  size="sm"
                  placeholder="Pesquisar ou adicionar paciente..."
                  options={patients.map((p) => ({ value: p.id, label: p.nome }))}
                  value={value.patientId}
                  onChange={(v) => onChange({ patientId: v as string })}
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Serviço ou pacote</p>
                <Combobox
                  size="sm"
                  placeholder="Pesquisar serviço ou pacote..."
                  options={activeServices.map((s) => ({ value: s.id, label: s.name }))}
                  value={value.serviceId}
                  onChange={(v) => handleServiceChange(v as string)}
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Modalidade</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ modality: 'presencial' })}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                      value.modality === 'presencial' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <MapPin size={13} /> Presencial
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ modality: 'online' })}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                      value.modality === 'online' ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <Video size={13} /> Online
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo de atendimento</p>
                <Combobox
                  size="sm"
                  options={TIPO_OPTIONS.map((t) => ({ value: t, label: t }))}
                  value={value.tipo}
                  onChange={(v) => onChange({ tipo: v as AgendaEvent['tipo'] })}
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status do Atendimento</p>
                <Combobox
                  size="sm"
                  value={value.status}
                  onChange={(v) => onChange({ status: v as AgendaEvent['status'] })}
                  options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
                />
              </div>
            </>
          ) : (
            <Input
              label={value.type === 'bloqueio' ? 'Motivo do Bloqueio' : 'Título do Evento'}
              value={value.freeTitle}
              onChange={(e) => onChange({ freeTitle: e.target.value })}
              placeholder={value.type === 'bloqueio' ? 'Ex: Feriado, manutenção...' : 'Ex: Reunião de equipe'}
            />
          )}
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</p>

          <DatePicker value={value.date} onChange={(v) => v && onChange({ date: v })} label="Data" />

          <div className="grid grid-cols-2 gap-3">
            <Input type="time" label="Início" value={value.startTime} onChange={(e) => handleStartTimeChange(e.target.value)} />
            <Input type="time" label="Término" value={value.endTime} onChange={(e) => onChange({ endTime: e.target.value })} />
          </div>

          {professionals.length > 1 && (
            <Combobox
              size="sm"
              placeholder="Buscar profissional..."
              options={professionals.map((p) => ({ value: p.id, label: p.name }))}
              value={value.professionalId}
              onChange={(v) => onChange({ professionalId: v as string })}
            />
          )}

          {recurrenceSlot}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prontuário e Observações</p>
        <Textarea
          value={value.alertas}
          onChange={(e) => onChange({ alertas: e.target.value })}
          rows={3}
          placeholder="Detalhes sobre o atendimento, queixas ou observações importantes..."
        />
      </div>
    </div>
  );
};
