import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarRange, UserCheck, CalendarClock, LayoutGrid, List, CalendarDays, CheckSquare, X, Zap, Download, Search } from "lucide-react";
import { Patient, UserRole, UserPermissions, AgendaEvent, RecurrenceConfig } from "../types";
import { useAgendaEvents, AgendaEventScope, BulkAgendaAction } from "../hooks/useAgendaEvents";
import { useInsurances } from "../hooks/useInsurances";
import { useServices } from "../hooks/useServices";
import { useUsers } from "../hooks/useUsers";
import { useClinicSettings } from "../hooks/useClinicSettings";
import {
  IconButton,
  Button,
  DatePicker,
  AgendaPlanner,
  AgendaPlannerEvent,
  AgendaMonthGrid,
  AgendaListView,
  AgendaEventModal,
  AgendaEventFormModal,
  AgendaBulkActionModal,
} from "./UI";
import { AGENDA_STATUS_COLORS, AGENDA_TYPE_COLORS, hexToRgba } from "./UI/agendaColors";

interface AgendaModuleProps {
  patients: Patient[];
  userRole: UserRole;
  userPermissions?: UserPermissions;
  onNavigateToPatient?: (patientId: string) => void;
}

type AgendaView = "week" | "month" | "list";

const VIEW_OPTIONS: { value: AgendaView; label: string; icon: React.ReactNode }[] = [
  { value: "week", label: "Semana", icon: <CalendarDays size={13} /> },
  { value: "month", label: "Mês", icon: <LayoutGrid size={13} /> },
  { value: "list", label: "Lista", icon: <List size={13} /> },
];

const STATUS_TO_PLANNER: Record<AgendaEvent["status"], AgendaPlannerEvent["status"]> = {
  pendente: "scheduled",
  confirmado: "confirmed",
  realizado: "completed",
  cancelado: "cancelled",
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTH_WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function AgendaModule({ patients, userRole, userPermissions, onNavigateToPatient }: AgendaModuleProps) {
  const canCreate = userPermissions ? userPermissions.agenda.criar : userRole !== UserRole.RESTRICTED;
  const canEdit = userPermissions ? userPermissions.agenda.editar : userRole !== UserRole.RESTRICTED;
  const canDelete = userPermissions ? userPermissions.agenda.excluir : userRole === UserRole.ADMIN;

  const { events, updateEvent, deleteEvent, createEvent, bulkAction } = useAgendaEvents();
  const { insurances } = useInsurances();
  const { services } = useServices();
  const { users } = useUsers();
  const { settings: clinic } = useClinicSettings();
  const professionals = useMemo(
    () => users.filter((u) => u.role === UserRole.PROFESSIONAL || u.role === UserRole.ADMIN),
    [users]
  );

  const [view, setView] = useState<AgendaView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialDate, setFormInitialDate] = useState<Date | null>(null);

  // Multi-select mode: lets staff pick arbitrary, unrelated events (different
  // patients/days — not necessarily one recurrence series) and apply one bulk
  // action (status/time shift/professional/delete) to all of them at once.
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const toggleSelecting = () => {
    setIsSelecting((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleEventSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApply = async (action: Omit<BulkAgendaAction, "ids">) => {
    await bulkAction({ ...action, ids: Array.from(selectedIds) } as BulkAgendaAction);
    setSelectedIds(new Set());
    setIsSelecting(false);
  };

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  useLayoutEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const update = () => setToolbarHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // "Sessão N/M" badge: derived from all non-cancelled siblings sharing the same
  // recurrence_group_id, sorted by start time — there's no stored index/count.
  const recurrenceIndexByEventId = useMemo(() => {
    const map = new Map<string, { index: number; count: number }>();
    const groups = new Map<string, AgendaEvent[]>();
    events
      .filter((ev) => ev.recurrenceGroupId && ev.status !== "cancelado")
      .forEach((ev) => {
        const key = ev.recurrenceGroupId!;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(ev);
      });
    groups.forEach((group) => {
      const sorted = [...group].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      sorted.forEach((ev, idx) => map.set(ev.id, { index: idx + 1, count: sorted.length }));
    });
    return map;
  }, [events]);

  const plannerEvents: AgendaPlannerEvent[] = useMemo(
    () =>
      events.map((ev) => {
        const patient = patients.find((p) => p.id === ev.patientId);
        const service = services.find((s) => s.id === ev.serviceId);
        const recurrence = recurrenceIndexByEventId.get(ev.id);
        return {
          id: ev.id,
          title: ev.type === "consulta" ? patient?.nome || ev.title : ev.title,
          start: ev.start,
          end: ev.end,
          type: ev.type,
          status: STATUS_TO_PLANNER[ev.status],
          modality: ev.modality,
          serviceName: service?.name || ev.tipo,
          comandaId: ev.insuranceId,
          recurrenceIndex: recurrence?.index,
          recurrenceCount: recurrence?.count,
        };
      }),
    [events, patients, services, recurrenceIndexByEventId]
  );

  const [listSearchQuery, setListSearchQuery] = useState("");

  const listEvents = useMemo(() => {
    if (view !== "list") return [];

    // A search query looks across every agendamento (not just the visible week) so
    // typing a patient's name jumps straight to their next/last session regardless
    // of which week it falls in — the whole point of searching instead of scrolling.
    const query = listSearchQuery.trim().toLowerCase();
    if (query) {
      return plannerEvents
        .filter((ev) =>
          ev.title.toLowerCase().includes(query) ||
          (ev.serviceName || "").toLowerCase().includes(query)
        )
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }

    const start = startOfWeek(currentDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return plannerEvents.filter((ev) => {
      const d = new Date(ev.start);
      return d >= start && d < end;
    });
  }, [plannerEvents, currentDate, view, listSearchQuery]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayEvents = events.filter((ev) => isSameDay(new Date(ev.start), today));
    return {
      todayCount: todayEvents.length,
      confirmedCount: todayEvents.filter((ev) => ev.status === "confirmado").length,
      weekCount: events.filter((ev) => {
        const d = new Date(ev.start);
        const diffDays = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays < 7;
      }).length,
    };
  }, [events]);

  const handleNavigate = (direction: number) => {
    const d = new Date(currentDate);
    if (view === "week" || view === "list") d.setDate(d.getDate() + direction * 7);
    if (view === "month") d.setMonth(d.getMonth() + direction);
    setCurrentDate(d);
  };

  const handleEventClick = (plannerEvent: AgendaPlannerEvent) => {
    if (isSelecting) {
      toggleEventSelected(String(plannerEvent.id));
      return;
    }
    const original = events.find((ev) => ev.id === plannerEvent.id);
    if (original) setSelectedEvent(original);
  };

  const handleSlotClick = (date: Date) => {
    if (!canCreate) return;
    setFormInitialDate(date);
    setIsFormOpen(true);
  };

  const handleSaveEvent = async (
    id: string,
    payload: Partial<AgendaEvent>,
    scope?: AgendaEventScope,
    force?: boolean,
    recurrence?: RecurrenceConfig
  ) => {
    await updateEvent(id, payload, scope, force, recurrence);
    setSelectedEvent((prev) => (prev && prev.id === id ? { ...prev, ...payload } : prev));
  };

  // Prints a standalone HTML document (browser "Salvar como PDF") for the
  // currently visible range — week export covers all 7 days (Sun-Sat), same as
  // the on-screen grid and the month export.
  const handleExportPdf = () => {
    if (view !== "week" && view !== "month") return;

    const clinicName = clinic?.name || "Espaço Aprender a Ser";
    const clinicContactLine = [clinic?.address, clinic?.phone, clinic?.email].filter(Boolean).join(" • ");

    const eventLabel = (ev: AgendaEvent) => {
      const patient = patients.find((p) => p.id === ev.patientId);
      const time = new Date(ev.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const title = ev.type === "consulta" ? patient?.nome || ev.title : ev.title;
      return `${time} — ${escapeHtml(title || "")}`;
    };

    let rangeLabel = "";
    let columnsHtml = "";

    if (view === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = addDays(weekStart, 6);
      rangeLabel = `${weekStart.toLocaleDateString("pt-BR")} a ${weekEnd.toLocaleDateString("pt-BR")}`;

      const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      columnsHtml = days
        .map((day, i) => {
          const dayEvents = events
            .filter((ev) => isSameDay(new Date(ev.start), day))
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
          const itemsHtml = dayEvents.length
            ? dayEvents.map((ev) => `<div class="event">${eventLabel(ev)}</div>`).join("")
            : `<div class="empty">Sem agendamentos</div>`;
          return `
            <div class="day-col">
              <div class="day-head">${WEEKDAY_LABELS[i]}<span>${day.toLocaleDateString("pt-BR")}</span></div>
              ${itemsHtml}
            </div>`;
        })
        .join("");
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);
      rangeLabel = firstOfMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

      const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
      const totalCells = Math.ceil((lastOfMonth.getDate() + firstOfMonth.getDay()) / 7) * 7;
      const cellsHtml = Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i))
        .map((day) => {
          const inMonth = day.getMonth() === month;
          const dayEvents = events
            .filter((ev) => isSameDay(new Date(ev.start), day))
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
          const itemsHtml = dayEvents.map((ev) => `<div class="event">${eventLabel(ev)}</div>`).join("");
          return `
            <div class="month-cell${inMonth ? "" : " outside"}">
              <div class="month-day-num">${day.getDate()}</div>
              ${itemsHtml}
            </div>`;
        })
        .join("");
      columnsHtml = `
        <div class="month-grid">
          ${MONTH_WEEKDAY_LABELS.map((l) => `<div class="month-weekday">${l}</div>`).join("")}
          ${cellsHtml}
        </div>`;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Agenda - ${escapeHtml(clinicName)}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 32px; }
            .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
            .header h1 { font-size: 22px; margin: 0; color: #1070ca; font-weight: 800; }
            .header p { font-size: 11px; margin: 4px 0 0; color: #64748b; }
            .range { text-align: center; font-size: 13px; font-weight: 700; text-transform: capitalize; margin-bottom: 18px; }
            .week-grid { display: flex; gap: 8px; }
            .day-col { flex: 1; min-width: 0; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; }
            .day-head { font-size: 11px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 6px; }
            .day-head span { display: block; font-weight: 500; color: #94a3b8; text-transform: none; }
            .event { font-size: 10px; padding: 4px 6px; border-radius: 6px; background: #eef2ff; color: #312e81; margin-bottom: 4px; word-break: break-word; }
            .empty { font-size: 10px; color: #cbd5e1; font-style: italic; }
            .month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
            .month-weekday { font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: center; color: #94a3b8; padding-bottom: 4px; }
            .month-cell { border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px; min-height: 70px; }
            .month-cell.outside { opacity: 0.35; }
            .month-day-num { font-size: 10px; font-weight: 800; margin-bottom: 3px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${escapeHtml(clinicName)}</h1>
            ${clinicContactLine ? `<p>${escapeHtml(clinicContactLine)}</p>` : ""}
          </div>
          <div class="range">${escapeHtml(rangeLabel)}</div>
          <div class="${view === "week" ? "week-grid" : ""}">${columnsHtml}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-2">
      <div
        ref={toolbarRef}
        className="sticky top-0 z-40 bg-[#fcfbfa] pb-2 pt-1 sm:pt-2 lg:pt-2"
        style={{ isolation: 'isolate' }}
      >
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-black text-slate-900">Agenda</h1>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ backgroundColor: hexToRgba(AGENDA_TYPE_COLORS.consulta.base, 0.12), color: AGENDA_TYPE_COLORS.consulta.base }}
              >
                <CalendarRange size={13} />
                Hoje <span className="font-black">{stats.todayCount}</span>
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ backgroundColor: hexToRgba(AGENDA_STATUS_COLORS.confirmed.base, 0.12), color: AGENDA_STATUS_COLORS.confirmed.base }}
              >
                <UserCheck size={13} />
                Confirmados <span className="font-black">{stats.confirmedCount}</span>
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ backgroundColor: hexToRgba(AGENDA_STATUS_COLORS.rescheduled.base, 0.12), color: AGENDA_STATUS_COLORS.rescheduled.base }}
              >
                <CalendarClock size={13} />
                Semana <span className="font-black">{stats.weekCount}</span>
              </span>
            </div>
            {canCreate && (
              <button
                onClick={() => {
                  setFormInitialDate(currentDate);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wide px-3.5 py-2.5 rounded-xl shadow-sm transition-colors"
              >
                <Plus size={14} /> Novo agendamento
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200 shrink-0">
                <IconButton variant="ghost" size="sm" onClick={() => handleNavigate(-1)}><ChevronLeft size={16} /></IconButton>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 text-[10px] font-black text-zinc-700 uppercase tracking-widest underline decoration-indigo-300 underline-offset-4"
                >
                  Hoje
                </button>
                <IconButton variant="ghost" size="sm" onClick={() => handleNavigate(1)}><ChevronRight size={16} /></IconButton>
              </div>
              <DatePicker value={toDateInput(currentDate)} onChange={(val) => val && setCurrentDate(new Date(`${val}T00:00:00`))} />
            </div>

            <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200 shrink-0">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setView(opt.value)}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all ${
                    view === opt.value ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500"
                  }`}
                >
                  {opt.icon} <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>

            {(view === "week" || view === "month") && (
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-white border-zinc-200 text-zinc-500 hover:border-indigo-300"
                title={view === "week" ? "Exportar PDF da semana (domingo a sábado)" : "Exportar PDF do mês"}
              >
                <Download size={13} />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}

            {(canEdit || canDelete) && (
              <button
                onClick={toggleSelecting}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  isSelecting
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-zinc-200 text-zinc-500 hover:border-indigo-300"
                }`}
              >
                {isSelecting ? <X size={13} /> : <CheckSquare size={13} />}
                {isSelecting ? "Cancelar seleção" : "Selecionar"}
              </button>
            )}
          </div>

          {view === "list" && (
            <div className="px-4 pb-3 sm:px-5 sm:pb-3.5 -mt-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  placeholder="Buscar paciente ou serviço em toda a agenda..."
                  className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-xs font-semibold text-zinc-700 transition-all"
                />
                {listSearchQuery && (
                  <button
                    onClick={() => setListSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"
                    aria-label="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {listSearchQuery && (
                <p className="mt-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  {listEvents.length} resultado{listEvents.length === 1 ? "" : "s"} em toda a agenda — não só na semana atual
                </p>
              )}
            </div>
          )}

          {isSelecting && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-5 border-t border-slate-100 bg-indigo-50/40">
              <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wide">
                {selectedIds.size} selecionado{selectedIds.size === 1 ? "" : "s"}
              </span>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Zap size={14} />}
                disabled={selectedIds.size === 0}
                onClick={() => setBulkModalOpen(true)}
              >
                Aplicar ação em lote
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-0 bg-white rounded-2xl sm:rounded-[2.5rem] border border-indigo-100/60 shadow-xl shadow-indigo-500/5">
        {view === "month" && (
          <AgendaMonthGrid
            currentDate={currentDate}
            events={plannerEvents}
            onDayClick={handleSlotClick}
            onEventClick={handleEventClick}
            onOverflowClick={(day) => {
              setCurrentDate(day);
              setView("week");
            }}
          />
        )}

        {view === "week" && (
          <AgendaPlanner
            view="week"
            onViewChange={() => {}}
            currentDate={currentDate}
            onCurrentDateChange={setCurrentDate}
            events={plannerEvents}
            showTasksPanel={false}
            hideHeader
            hideStats
            stickyHeaderTop={toolbarHeight}
            onSlotClick={handleSlotClick}
            onEventClick={handleEventClick}
            isSelecting={isSelecting}
            selectedIds={selectedIds}
          />
        )}

        {view === "list" && (
          <AgendaListView
            events={listEvents}
            onEventClick={handleEventClick}
            stickyTop={toolbarHeight}
            isSelecting={isSelecting}
            selectedIds={selectedIds}
          />
        )}
      </div>

      <AgendaEventModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        patients={patients}
        insurances={insurances}
        services={services}
        professionals={professionals}
        allEvents={events}
        canEdit={canEdit}
        canDelete={canDelete}
        onSave={handleSaveEvent}
        onDelete={deleteEvent}
        onNavigateToPatient={onNavigateToPatient}
      />

      <AgendaEventFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialDate={formInitialDate}
        patients={patients}
        services={services}
        professionals={professionals}
        onCreate={createEvent}
      />

      <AgendaBulkActionModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        selectedCount={selectedIds.size}
        professionals={professionals}
        canDelete={canDelete}
        onApply={handleBulkApply}
      />
    </div>
  );
}
