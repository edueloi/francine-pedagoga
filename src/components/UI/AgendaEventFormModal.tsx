import React, { useEffect, useState } from 'react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { Combobox } from './Combobox';
import { Select, Input, Textarea } from './Input';
import { DatePicker } from './DatePicker';
import { AgendaEvent, Patient } from '../../types';

const TIPO_OPTIONS: AgendaEvent['tipo'][] = ['Sessão', 'Avaliação', 'Reunião', 'Visita Escolar', 'Retorno'];

export interface AgendaEventFormValue {
  patientId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  tipo: AgendaEvent['tipo'];
  alertas: string;
}

export interface AgendaEventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  patients: Patient[];
  onCreate: (payload: Partial<AgendaEvent>) => Promise<void>;
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function combineToIso(date: string, time: string) {
  return `${date}T${time}:00`;
}

export const AgendaEventFormModal: React.FC<AgendaEventFormModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  patients,
  onCreate,
}) => {
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:50');
  const [tipo, setTipo] = useState<AgendaEvent['tipo']>('Sessão');
  const [alertas, setAlertas] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(toDateInput(initialDate || new Date()));
      setPatientId('');
      setStartTime('08:00');
      setEndTime('08:50');
      setTipo('Sessão');
      setAlertas('');
    }
  }, [isOpen, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !date || !startTime || !endTime) return;
    const patient = patients.find((p) => p.id === patientId);
    setSaving(true);
    try {
      await onCreate({
        title: patient?.nome || 'Paciente',
        patientId,
        start: combineToIso(date, startTime),
        end: combineToIso(date, endTime),
        tipo,
        status: 'pendente',
        alertas: alertas || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo agendamento" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Combobox
          size="sm"
          placeholder="Selecione o paciente"
          options={patients.map((p) => ({ value: p.id, label: p.nome }))}
          value={patientId}
          onChange={(v) => setPatientId(v as string)}
        />

        <DatePicker value={date} onChange={(v) => v && setDate(v)} label="Data" />

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="time"
            label="Início"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            type="time"
            label="Término"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <Select
          label="Tipo de atendimento"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as AgendaEvent['tipo'])}
          options={TIPO_OPTIONS.map((t) => ({ value: t, label: t }))}
        />

        <Textarea
          label="Observações (opcional)"
          value={alertas}
          onChange={(e) => setAlertas(e.target.value)}
          rows={3}
        />

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!patientId}>
            Criar agendamento
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
