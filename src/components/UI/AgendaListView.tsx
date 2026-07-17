import React from 'react';
import { CalendarX2, Clock, Link2, MapPin, Video } from 'lucide-react';
import { AgendaPlannerEvent } from './AgendaPlanner';
import { AGENDA_STATUS_COLORS, AGENDA_TYPE_COLORS, hexToRgba } from './agendaColors';

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayLabel(day: Date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(day, today)) return 'Hoje';
  if (isSameDay(day, tomorrow)) return 'Amanhã';
  return day.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export interface AgendaListViewProps {
  events: AgendaPlannerEvent[];
  onEventClick?: (event: AgendaPlannerEvent) => void;
  stickyTop?: number;
}

export const AgendaListView: React.FC<AgendaListViewProps> = ({ events, onEventClick, stickyTop = 0 }) => {
  const groups = React.useMemo(() => {
    const sorted = [...events].sort((a, b) => toDate(a.start).getTime() - toDate(b.start).getTime());
    const map = new Map<string, { day: Date; items: AgendaPlannerEvent[] }>();
    sorted.forEach((ev) => {
      const start = toDate(ev.start);
      const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`;
      if (!map.has(key)) map.set(key, { day: start, items: [] });
      map.get(key)!.items.push(ev);
    });
    return Array.from(map.values());
  }, [events]);

  if (!groups.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <CalendarX2 size={28} className="text-slate-300" />
        <p className="text-sm font-bold text-slate-500">Nenhum agendamento no período</p>
        <p className="text-xs text-slate-400">Use “Novo agendamento” para criar o primeiro.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {groups.map(({ day, items }) => (
        <div key={day.toISOString()} className="px-4 py-3 sm:px-6 sm:py-4">
          <div
            className="sticky z-10 -mx-4 mb-2 bg-white/95 px-4 py-1.5 backdrop-blur-sm sm:-mx-6 sm:px-6"
            style={{ top: stickyTop }}
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500">
              {dayLabel(day)}
              <span className="ml-2 text-slate-400">
                {day.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            {items.map((ev) => {
              const statusColor = AGENDA_STATUS_COLORS[ev.status || 'scheduled']?.base || AGENDA_STATUS_COLORS.scheduled.base;
              const statusLabel = AGENDA_STATUS_COLORS[ev.status || 'scheduled']?.label || AGENDA_STATUS_COLORS.scheduled.label;
              const typeColor = AGENDA_TYPE_COLORS[ev.type || 'consulta']?.base || AGENDA_TYPE_COLORS.consulta.base;
              const accent = ev.type === 'bloqueio' || ev.type === 'pessoal' ? typeColor : statusColor;
              const start = toDate(ev.start);
              const end = toDate(ev.end);
              return (
                <button
                  key={ev.id}
                  onClick={() => onEventClick?.(ev)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-l-4 border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderLeftColor: accent }}
                >
                  <div className="flex w-16 shrink-0 flex-col items-start tabular-nums">
                    <span className="text-sm font-black text-slate-800">
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="h-9 w-px shrink-0 bg-slate-100" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900">{ev.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      {ev.serviceName && (
                        <span className="text-[11px] font-semibold text-slate-500">{ev.serviceName}</span>
                      )}
                      {ev.modality && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                          {ev.modality === 'online' ? <Video size={10} /> : <MapPin size={10} />}
                          {ev.modality === 'online' ? 'Online' : 'Presencial'}
                        </span>
                      )}
                      {ev.comandaId && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold"
                          style={{ color: AGENDA_STATUS_COLORS.confirmed.base }}
                        >
                          <Link2 size={10} /> Guia vinculada
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5" style={{ backgroundColor: hexToRgba(statusColor, 0.12) }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                    <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: statusColor }}>
                      {statusLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
