import React, { useEffect, useState } from 'react';
import { ChevronRight, Repeat } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { Combobox } from './Combobox';
import { Input } from './Input';
import { DatePicker } from './DatePicker';
import { AgendaEventFields, AgendaEventFieldsValue, EventType } from './AgendaEventFields';
import { AgendaEvent, Patient, Service, SystemUser, RecurrenceConfig, RecurrenceFrequency } from '../../types';

interface RecurrencePreset {
  label: string;
  freq: RecurrenceFrequency | null;
  interval: number;
  count: number;
}

// Same cap as backend/routes/agenda.ts MAX_OCCURRENCES — there is no true "never
// ends" option since every occurrence is a stored row, so "Contínuo" generates
// as far out as the system supports (~2 years) instead. The clinic re-runs this
// (or extends the series) before it runs out; she still ends it herself whenever
// the patient actually stops, same as any other recurring series (delete "esta e
// as sessões futuras").
export const MAX_RECURRENCE_OCCURRENCES = 104;

export const RECURRENCE_PRESETS: RecurrencePreset[] = [
  { label: 'Não repete', freq: null, interval: 1, count: 1 },
  { label: 'Semanal — Contínuo (sem data definida)', freq: 'WEEKLY', interval: 1, count: MAX_RECURRENCE_OCCURRENCES },
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

export function recurrenceSummaryLabel(recurrence: RecurrenceConfig | null): string {
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

export const RecurrencePickerModal: React.FC<RecurrencePickerModalProps> = ({ isOpen, onClose, value, onChange }) => {
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
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Frequência de repetição</p>
            <Combobox
              size="sm"
              value={customFreq}
              onChange={(v) => setCustomFreq(v as RecurrenceFrequency)}
              options={(Object.keys(FREQ_LABELS) as RecurrenceFrequency[]).map((f) => ({ value: f, label: FREQ_LABELS[f] }))}
            />
          </div>

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
  onCreate: (payload: Partial<AgendaEvent>, recurrence?: RecurrenceConfig, force?: boolean) => Promise<any>;
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function combineToIso(date: string, time: string) {
  return `${date}T${time}:00`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

const DEFAULT_VALUE = (initialDate?: Date | null, professionals?: SystemUser[]): AgendaEventFieldsValue => {
  // A click on an empty grid slot passes the exact clicked time (e.g. 10:00); the
  // generic "Novo Agendamento" button passes the day with no meaningful time
  // (midnight), so it falls back to a sensible default start of 08:00.
  const hasClickedTime = !!initialDate && (initialDate.getHours() !== 0 || initialDate.getMinutes() !== 0);
  const startTime = hasClickedTime ? toTimeInput(initialDate!) : '08:00';
  return {
    type: 'consulta',
    patientId: '',
    freeTitle: '',
    serviceId: '',
    modality: 'presencial',
    professionalId: professionals?.length === 1 ? professionals[0].id : '',
    status: 'pendente',
    date: toDateInput(initialDate || new Date()),
    startTime,
    endTime: addMinutesToTime(startTime, 50),
    tipo: 'Sessão',
    alertas: '',
  };
};

export const AgendaEventFormModal: React.FC<AgendaEventFormModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  patients,
  services,
  professionals,
  onCreate,
}) => {
  const [fields, setFields] = useState<AgendaEventFieldsValue>(() => DEFAULT_VALUE(initialDate, professionals));
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(null);
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ id: string; title: string; start_time: string; end_time: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFields(DEFAULT_VALUE(initialDate, professionals));
      setRecurrence(null);
      setConflict(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialDate]);

  const handleFieldsChange = (patch: Partial<AgendaEventFieldsValue>) => {
    setFields((prev) => ({ ...prev, ...patch }));
  };

  const isConsulta = fields.type === 'consulta';
  const canSubmit = isConsulta ? !!fields.patientId : !!fields.freeTitle.trim();

  const buildPayload = (): Partial<AgendaEvent> => {
    const patient = patients.find((p) => p.id === fields.patientId);
    return {
      title: isConsulta ? patient?.nome || 'Paciente' : fields.freeTitle,
      patientId: isConsulta ? fields.patientId : undefined,
      start: combineToIso(fields.date, fields.startTime),
      end: combineToIso(fields.date, fields.endTime),
      tipo: fields.tipo,
      status: fields.status,
      alertas: fields.alertas || undefined,
      type: fields.type,
      modality: fields.modality,
      professionalId: fields.professionalId || undefined,
      serviceId: isConsulta ? fields.serviceId || undefined : undefined,
    };
  };

  const submit = async (force?: boolean) => {
    setSaving(true);
    try {
      await onCreate(buildPayload(), recurrence || undefined, force);
      setConflict(null);
      onClose();
    } catch (err: any) {
      if (err.name === 'AgendaConflictError') {
        setConflict(err.conflict);
      } else {
        throw err;
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !fields.date || !fields.startTime || !fields.endTime) return;
    await submit(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo agendamento" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <AgendaEventFields
          value={fields}
          onChange={handleFieldsChange}
          patients={patients}
          services={services}
          professionals={professionals}
          recurrenceSlot={
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
          }
        />

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

      {conflict && (
        <Modal isOpen onClose={() => setConflict(null)} title="Conflito de horário" size="xs">
          <p className="text-sm text-slate-600 mb-4">
            Já existe um agendamento (<strong>{conflict.title}</strong>) para este profissional entre{' '}
            {new Date(conflict.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} e{' '}
            {new Date(conflict.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Deseja agendar mesmo assim?
          </p>
          <ModalFooter>
            <Button variant="outline" onClick={() => setConflict(null)}>Voltar</Button>
            <Button variant="primary" loading={saving} onClick={() => submit(true)}>Agendar mesmo assim</Button>
          </ModalFooter>
        </Modal>
      )}
    </Modal>
  );
};
