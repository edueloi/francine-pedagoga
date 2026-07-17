import { AgendaPlannerEventStatus, AgendaPlannerEventType } from './AgendaPlanner';

/**
 * Paleta central de cores da Agenda.
 *
 * index.css remapeia as classes Tailwind emerald/blue/pink/rose/amber para a
 * paleta de marca (azul/rosa/amarelo) — por isso as cores aqui são hex puro,
 * aplicadas via `style`/`hexToRgba`, nunca via classes `bg-emerald-*` etc.
 */
export const AGENDA_TYPE_COLORS: Record<AgendaPlannerEventType, { base: string; label: string }> = {
  consulta: { base: '#4f46e5', label: 'Consulta' },
  pessoal: { base: '#d97706', label: 'Pessoal' },
  bloqueio: { base: '#64748b', label: 'Bloqueio' },
};

export const AGENDA_STATUS_COLORS: Record<AgendaPlannerEventStatus, { base: string; label: string }> = {
  scheduled: { base: '#64748b', label: 'Agendado' },
  confirmed: { base: '#059669', label: 'Confirmado' },
  completed: { base: '#4f46e5', label: 'Realizado' },
  cancelled: { base: '#e11d48', label: 'Cancelado' },
  'no-show': { base: '#ea580c', label: 'Faltou' },
  no_show: { base: '#ea580c', label: 'Faltou' },
  rescheduled: { base: '#7c3aed', label: 'Reagendado' },
  falta_justificada: { base: '#f59e0b', label: 'Falta Justificada' },
};

export const AGENDA_MODALITY_COLORS = {
  online: '#0891b2',
  presencial: '#475569',
} as const;

export function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const normalized =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean;

  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
