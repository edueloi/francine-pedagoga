import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, CalendarDays, Ban, MapPin, Video, ChevronRight, Repeat } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { Combobox } from './Combobox';
import { Select, Input, Textarea } from './Input';
import { DatePicker } from './DatePicker';
import { AgendaEvent, Patient, Service, SystemUser, RecurrenceConfig, RecurrenceFrequency } from '../../types';

const TIPO_OPTIONS: AgendaEvent['tipo'][] = ['Sessão', 'Avaliação', 'Reunião', 'Visita Escolar', 'Retorno'];
const STATUS_OPTIONS: AgendaEvent['status'][] = ['pendente', 'confirmado', 'realizado', 'cancelado'];
const STATUS_LABELS: Record<AgendaEvent['status'], string> = {
  pendente: 'Agendado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
};

type EventType = AgendaEvent['type'];

const TYPE_META: Record<
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

interface RecurrencePreset {
  label: string;
  freq: RecurrenceFrequency | null;
  interval: number;
  count: number;
}

const RECURRENCE_PRESETS: RecurrencePreset[] = [
  { label: 'Não repete', freq: null, interval: 1, count: 1 },
  { label: 'Semanal — 4 sessões', freq: 'WEEKLY', interval: 1, count: 4 },
  { label: 'Semanal — 8 sessões', freq: 'WEEKLY', interval: 1, count: 8 },
  { label: 'Semanal — 12 sessões', freq: 'WEEKLY', interval: 1, count: 12 },
  { label: 'Semanal — 16 sessões', freq: 'WEEKLY', interval: 1, count: 16 },
  { label: 'Semanal — 20 sessões', freq: 'WEEKLY', interval: 1, count: 20 },
  { label: 'Semanal — 24 sessões', freq: 'WEEKLY', interval: 1, count: 24 },
  { label: '2x por semana — 8 sessões', freq: 'TWICE_WEEKLY', interval: 1, count: 8 },
  { label: '2x por semana — 16 sessões', freq: 'TWICE_WEEKLY', interval: 1, count: 16 },
  { label: '2x por semana — 24 sessões', freq: 'TWICE_WEEKLY', interval: 1, count: 24 },
  { label: '3x por semana — 12 sessões', freq: 'THREE_WEEKLY', interval: 1, count: 12 },
  { label: '3x por semana — 24 sessões', freq: 'THREE_WEEKLY', interval: 1, count: 24 },
  { label: 'Quinzenal — 4 sessões', freq: 'WEEKLY', interval: 2, count: 4 },
  { label: 'Quinzenal — 8 sessões', freq: 'WEEKLY', interval: 2, count: 8 },
  { label: 'Quinzenal — 12 sessões', freq: 'WEEKLY', interval: 2, count: 12 },
  { label: 'Mensal — 3 sessões', freq: 'MONTHLY', interval: 1, count: 3 },
  { label: 'Mensal — 6 sessões', freq: 'MONTHLY', interval: 1, count: 6 },
  { label: 'Mensal — 12 sessões', freq: 'MONTHLY', interval: 1, count: 12 },
];

const FREQ_LABELS: Record<RecurrenceFrequency, string> = {
  DAILY: 'Diariamente',
  WEEKLY: 'Semanalmente',
  TWICE_WEEKLY: '2x por semana',
  THREE_WEEKLY: '3x por semana',
  MONTHLY: 'Mensalmente',
  YEARLY: 'Anualmente',
};

const INTERVAL_UNIT: Record<RecurrenceFrequency, string> = {
  DAILY: 'Dia(s)',
  WEEKLY: 'Semana(s)',
  TWICE_WEEKLY: 'Semana(s)',
  THREE_WEEKLY: 'Semana(s)',
  MONTHLY: 'Mês(es)',
  YEARLY: 'Ano(s)',
};

function recurrenceSummaryLabel(recurrence: RecurrenceConfig | null): string {
  if (!recurrence) return 'Não repete';
  const preset = RECURRENCE_PRESETS.find(
    (p) => p.freq === recurrence.freq && p.interval === recurrence.interval && p.count === recurrence.count
  );
  if (preset) return preset.label;
  if (recurrence.endDate) return `${FREQ_LABELS[recurrence.freq]} até ${new Date(`${recurrence.endDate}T12:00:00`).toLocaleDateString('pt-BR')}`;
  return `${FREQ_LABELS[recurrence.freq]} — ${recurrence.count ?? '?'} sessões`;
}

interface RecurrencePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: RecurrenceConfig | null;
  onChange: (value: RecurrenceConfig | null) => void;
}

const RecurrencePickerModal: React.FC<RecurrencePickerModalProps> = ({ isOpen, onClose, value, onChange }) => {
  const [stage, setStage] = useState<'list' | 'custom'>('list');
  const [customFreq, setCustomFreq] = useState<RecurrenceFrequency>('WEEKLY');
  const [customInterval, setCustomInterval] = useState(1);
  const [endType, setEndType] = useState<'count' | 'until'>('count');
  const [customCount, setCustomCount] = useState(8);
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    if (isOpen) setStage('list');
  }, [isOpen]);

  const handlePresetClick = (preset: RecurrencePreset) => {
    if (!preset.freq) {
      onChange(null);
      onClose();
      return;
    }
    onChange({ freq: preset.freq, interval: preset.interval, count: preset.count });
    onClose();
  };

  const handleOpenCustom = () => {
    if (value) {
      setCustomFreq(value.freq);
      setCustomInterval(value.interval);
      if (value.endDate) {
        setEndType('until');
        setCustomEndDate(value.endDate);
      } else {
        setEndType('count');
        setCustomCount(value.count ?? 8);
      }
    }
    setStage('custom');
  };

  const handleSaveCustom = () => {
    onChange({
      freq: customFreq,
      interval: customInterval,
      count: endType === 'count' ? customCount : undefined,
      endDate: endType === 'until' ? customEndDate : undefined,
    });
    onClose();
  };

  if (stage === 'custom') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Configurar Repetição" size="sm">
        <div className="space-y-4">
          <Select
            label="Frequência de repetição"
            value={customFreq}
            onChange={(e) => setCustomFreq(e.target.value as RecurrenceFrequency)}
            options={(Object.keys(FREQ_LABELS) as RecurrenceFrequency[]).map((f) => ({ value: f, label: FREQ_LABELS[f] }))}
          />

          <div className="grid grid-cols-2 gap-3 items-end">
            <Input
              type="number"
              min={1}
              label="A cada"
              value={customInterval}
              onChange={(e) => setCustomInterval(Math.max(1, Number(e.target.value)))}
            />
            <p className="text-xs font-bold text-slate-500 pb-3">{INTERVAL_UNIT[customFreq]}</p>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Terminar em</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEndType('count')}
                className={`rounded-xl border-2 p-3 text-left transition ${
                  endType === 'count' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Por vezes</p>
                {endType === 'count' && (
                  <Input
                    type="number"
                    min={1}
                    value={customCount}
                    onChange={(e) => setCustomCount(Math.max(1, Number(e.target.value)))}
                    onClick={(e) => e.stopPropagation()}
                    wrapperClassName="mt-1.5"
                    suffix={<span className="text-[10px] text-slate-400 px-2">sessões</span>}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => setEndType('until')}
                className={`rounded-xl border-2 p-3 text-left transition ${
                  endType === 'until' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Por data</p>
                {endType === 'until' && (
                  <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                    <DatePicker value={customEndDate} onChange={(v) => v && setCustomEndDate(v)} />
                  </div>
                )}
              </button>
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setStage('list')}>Voltar</Button>
            <Button
              variant="primary"
              onClick={handleSaveCustom}
              disabled={endType === 'count' ? customCount <= 0 : !customEndDate}
            >
              Salvar
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seleção Atual" subtitle="Escolha uma opção abaixo para mudar a seleção" size="sm">
      <div className="space-y-2">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-indigo-400">Opção atual</p>
          <p className="text-sm font-black text-indigo-700">{recurrenceSummaryLabel(value)}</p>
        </div>

        <div className="max-h-[320px] overflow-y-auto -mx-1 px-1 space-y-1">
          {RECURRENCE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {preset.label}
              <ChevronRight size={14} className="text-slate-300" />
            </button>
          ))}
          <button
            type="button"
            onClick={handleOpenCustom}
            className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-black text-indigo-600 hover:bg-indigo-50 transition"
          >
            Personalizado...
            <ChevronRight size={14} className="text-indigo-300" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export interface AgendaEventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  patients: Patient[];
  services: Service[];
  professionals: SystemUser[];
  onCreate: (payload: Partial<AgendaEvent>, recurrence?: RecurrenceConfig) => Promise<any>;
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function combineToIso(date: string, time: string) {
  return `${date}T${time}:00`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

export const AgendaEventFormModal: React.FC<AgendaEventFormModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  patients,
  services,
  professionals,
  onCreate,
}) => {
  const [type, setType] = useState<EventType>('consulta');
  const [patientId, setPatientId] = useState('');
  const [freeTitle, setFreeTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [modality, setModality] = useState<AgendaEvent['modality']>('presencial');
  const [professionalId, setProfessionalId] = useState('');
  const [status, setStatus] = useState<AgendaEvent['status']>('pendente');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:50');
  const [tipo, setTipo] = useState<AgendaEvent['tipo']>('Sessão');
  const [alertas, setAlertas] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(null);
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeServices = useMemo(() => services.filter((s) => s.active), [services]);

  useEffect(() => {
    if (isOpen) {
      setType('consulta');
      setPatientId('');
      setFreeTitle('');
      setServiceId('');
      setModality('presencial');
      setProfessionalId(professionals.length === 1 ? professionals[0].id : '');
      setStatus('pendente');
      setDate(toDateInput(initialDate || new Date()));
      setStartTime('08:00');
      setEndTime('08:50');
      setTipo('Sessão');
      setAlertas('');
      setRecurrence(null);
    }
  }, [isOpen, initialDate, professionals]);

  const handleServiceChange = (id: string) => {
    setServiceId(id);
    const service = activeServices.find((s) => s.id === id);
    if (service) setEndTime(addMinutes(startTime, service.defaultDurationMinutes));
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    const service = activeServices.find((s) => s.id === serviceId);
    if (service) setEndTime(addMinutes(time, service.defaultDurationMinutes));
  };

  const isConsulta = type === 'consulta';
  const canSubmit = isConsulta ? !!patientId : !!freeTitle.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !date || !startTime || !endTime) return;
    const patient = patients.find((p) => p.id === patientId);
    setSaving(true);
    try {
      await onCreate(
        {
          title: isConsulta ? patient?.nome || 'Paciente' : freeTitle,
          patientId: isConsulta ? patientId : undefined,
          start: combineToIso(date, startTime),
          end: combineToIso(date, endTime),
          tipo,
          status,
          alertas: alertas || undefined,
          type,
          modality,
          professionalId: professionalId || undefined,
          serviceId: isConsulta ? serviceId || undefined : undefined,
        },
        recurrence || undefined
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo agendamento" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TYPE_META) as EventType[]).map((t) => {
            const meta = TYPE_META[t];
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
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

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</p>

            {isConsulta ? (
              <>
                <Combobox
                  size="sm"
                  placeholder="Pesquisar ou adicionar paciente..."
                  options={patients.map((p) => ({ value: p.id, label: p.nome }))}
                  value={patientId}
                  onChange={(v) => setPatientId(v as string)}
                />
                <Combobox
                  size="sm"
                  placeholder="Pesquisar serviço ou pacote..."
                  options={activeServices.map((s) => ({ value: s.id, label: s.name }))}
                  value={serviceId}
                  onChange={(v) => handleServiceChange(v as string)}
                />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Modalidade</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModality('presencial')}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                        modality === 'presencial' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <MapPin size={13} /> Presencial
                    </button>
                    <button
                      type="button"
                      onClick={() => setModality('online')}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                        modality === 'online' ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <Video size={13} /> Online
                    </button>
                  </div>
                </div>
                <Select
                  label="Status do Atendimento"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AgendaEvent['status'])}
                  options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
                />
              </>
            ) : (
              <Input
                label={type === 'bloqueio' ? 'Motivo do Bloqueio' : 'Título do Evento'}
                value={freeTitle}
                onChange={(e) => setFreeTitle(e.target.value)}
                placeholder={type === 'bloqueio' ? 'Ex: Feriado, manutenção...' : 'Ex: Reunião de equipe'}
              />
            )}
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário e Repetição</p>

            <DatePicker value={date} onChange={(v) => v && setDate(v)} label="Data" />

            <div className="grid grid-cols-2 gap-3">
              <Input type="time" label="Início" value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} />
              <Input type="time" label="Término" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>

            {professionals.length > 1 && (
              <Combobox
                size="sm"
                placeholder="Buscar profissional..."
                options={professionals.map((p) => ({ value: p.id, label: p.name }))}
                value={professionalId}
                onChange={(v) => setProfessionalId(v as string)}
              />
            )}

            <button
              type="button"
              onClick={() => setRecurrenceModalOpen(true)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-indigo-300"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Repeat size={14} className="text-indigo-500" /> Repetição Fixa
              </span>
              <span className="text-[11px] font-black text-indigo-600">{recurrenceSummaryLabel(recurrence)}</span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prontuário e Observações</p>
          <Textarea
            value={alertas}
            onChange={(e) => setAlertas(e.target.value)}
            rows={3}
            placeholder="Detalhes sobre o atendimento, queixas ou observações importantes..."
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!canSubmit}>
            Confirmar Agendamento
          </Button>
        </ModalFooter>
      </form>

      <RecurrencePickerModal
        isOpen={recurrenceModalOpen}
        onClose={() => setRecurrenceModalOpen(false)}
        value={recurrence}
        onChange={setRecurrence}
      />
    </Modal>
  );
};
