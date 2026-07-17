import React from 'react';
import { AgendaPlannerEvent } from './AgendaPlanner';
import { AGENDA_STATUS_COLORS, AGENDA_TYPE_COLORS, hexToRgba } from './agendaColors';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthDays(currentDate: Date): Date[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - firstOfMonth.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export interface AgendaMonthGridProps {
  currentDate: Date;
  events: AgendaPlannerEvent[];
  onDayClick?: (day: Date) => void;
  onEventClick?: (event: AgendaPlannerEvent) => void;
  onOverflowClick?: (day: Date) => void;
}

export const AgendaMonthGrid: React.FC<AgendaMonthGridProps> = ({
  currentDate,
  events,
  onDayClick,
  onEventClick,
  onOverflowClick,
}) => {
  const monthDays = React.useMemo(() => buildMonthDays(currentDate), [currentDate]);
  const today = new Date();

  const eventsForDay = (day: Date) =>
    events
      .filter((ev) => isSameDay(new Date(ev.start), day))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-indigo-50/40 sticky top-0 z-20">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
          const fullDay = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][idx];
          const isWknd = idx === 0 || idx === 6;
          return (
            <div key={idx} className={`py-2.5 sm:py-4 text-center uppercase ${isWknd ? 'text-slate-400 bg-slate-50/80' : 'text-indigo-400'}`}>
              <span className="sm:hidden text-[10px] font-black tracking-wide">{day}</span>
              <span className="hidden sm:block text-[9px] font-black tracking-[0.2em]">{fullDay}</span>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {monthDays.map((day) => {
          const dayEvents = eventsForDay(day);
          const isToday = isSameDay(day, today);
          const inMonth = day.getMonth() === currentDate.getMonth();
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[72px] sm:min-h-[110px] p-1 sm:p-1.5 border-b border-r border-slate-100 transition-all group relative
                ${!inMonth ? 'bg-slate-50 opacity-40' : isWeekend ? 'bg-slate-50/60' : 'bg-white'}
                hover:bg-indigo-50/30 cursor-pointer`}
              onClick={() => inMonth && onDayClick?.(day)}
            >
              <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-start mb-1 sm:mb-1.5 sm:px-0.5">
                <span
                  className={`text-[10px] sm:text-[11px] font-black transition-all leading-none ${
                    isToday
                      ? 'h-5 w-5 sm:h-6 sm:w-6 bg-indigo-600 text-white rounded-lg sm:rounded-md flex items-center justify-center shadow-md shadow-indigo-400'
                      : inMonth
                      ? 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 bg-indigo-50 px-1 py-px rounded mt-0.5 sm:mt-0 sm:bg-slate-100 sm:text-slate-400">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5 relative">
                {dayEvents.slice(0, 3).map((ev) => {
                  const time = new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const typeColor = AGENDA_TYPE_COLORS[ev.type || 'consulta']?.base || AGENDA_TYPE_COLORS.consulta.base;
                  const statusColor = AGENDA_STATUS_COLORS[ev.status || 'scheduled']?.base || AGENDA_STATUS_COLORS.scheduled.base;
                  const accent = ev.type === 'bloqueio' || ev.type === 'pessoal' ? typeColor : statusColor;
                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(ev);
                      }}
                      className="w-full flex items-center gap-1 text-left px-1.5 py-0.5 rounded-lg border text-[8px] font-bold truncate transition-all hover:shadow-md active:scale-95"
                      style={{ backgroundColor: hexToRgba(accent, 0.12), borderColor: hexToRgba(accent, 0.3) }}
                    >
                      <span className="w-1 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                      <span className="text-[7px] font-black text-slate-400 tabular-nums shrink-0">{time}</span>
                      <span className="truncate flex-1">{ev.title}</span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOverflowClick?.(day);
                    }}
                    className="w-full py-0.5 text-[7px] font-black text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/50 rounded-md transition-colors border border-indigo-100/50 uppercase tracking-widest text-center"
                  >
                    + {dayEvents.length - 3} mais
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
