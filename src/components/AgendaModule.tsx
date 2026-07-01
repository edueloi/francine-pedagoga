import React, { useState } from "react";
import { 
  Calendar, 
  Clock, 
  Plus, 
  AlertTriangle, 
  Check, 
  UserPlus, 
  FileText, 
  Grid, 
  List, 
  CalendarDays, 
  Settings, 
  Users, 
  Filter, 
  X, 
  Trash2, 
  Info, 
  Building,
  CheckCircle2,
  Sparkles,
  Heart
} from "lucide-react";
import { Patient, AgendaItem, UserRole, UserPermissions } from "../types";
import { initialAgenda } from "../mockData";

interface AgendaModuleProps {
  patients: Patient[];
  userRole: UserRole;
  userPermissions?: UserPermissions;
}

interface Professional {
  id: string;
  nome: string;
  especialidade: string;
  cor: string;
  diasAtivos: string[];
}

export default function AgendaModule({ patients, userRole, userPermissions }: AgendaModuleProps) {
  const canCreate = userPermissions ? userPermissions.agenda.criar : (userRole !== UserRole.RESTRICTED);
  const canDelete = userPermissions ? userPermissions.agenda.excluir : (userRole === UserRole.ADMIN);

  // Blocked slots representation
  interface BlockedSlot {
    id: string;
    diaSemana: string;
    horario: string;
    motivo: string;
  }

  // States
  const [appointments, setAppointments] = useState<AgendaItem[]>(initialAgenda);
  const [viewMode, setViewMode] = useState<"grid" | "diario" | "list">("grid");
  const [selectedDayTab, setSelectedDayTab] = useState<string>("Segunda-feira");
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState<string>("Todos");

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isProfessionalsModalOpen, setIsProfessionalsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Dynamic Clinic Settings (Days and Hours) - Expanded to Sunday by default
  const [clinicDays, setClinicDays] = useState<string[]>([
    "Segunda-feira", 
    "Terça-feira", 
    "Quarta-feira", 
    "Quinta-feira", 
    "Sexta-feira",
    "Sábado",
    "Domingo"
  ]);
  const [clinicHours, setClinicHours] = useState<string[]>([
    "08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"
  ]);

  // Schedule blocks
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([
    { id: "block-1", diaSemana: "Segunda-feira", horario: "13:00", motivo: "Intervalo de Almoço" },
    { id: "block-2", diaSemana: "Quarta-feira", horario: "13:00", motivo: "Supervisão Clínica de Equipe" },
    { id: "block-3", diaSemana: "Sábado", horario: "13:00", motivo: "Fechamento e Balanço Semanal" },
    { id: "block-4", diaSemana: "Domingo", horario: "12:00", motivo: "Sem Expediente Clínico" },
    { id: "block-5", diaSemana: "Domingo", horario: "13:00", motivo: "Sem Expediente Clínico" },
    { id: "block-6", diaSemana: "Domingo", horario: "14:00", motivo: "Sem Expediente Clínico" },
    { id: "block-7", diaSemana: "Domingo", horario: "15:00", motivo: "Sem Expediente Clínico" },
    { id: "block-8", diaSemana: "Domingo", horario: "16:00", motivo: "Sem Expediente Clínico" },
    { id: "block-9", diaSemana: "Domingo", horario: "17:00", motivo: "Sem Expediente Clínico" },
  ]);

  // Professionals State
  const [professionals, setProfessionals] = useState<Professional[]>([
    { id: "prof-1", nome: "Francine Maria Tersi", especialidade: "Psicopedagoga & Diretora Clínica", cor: "bg-blue-500", diasAtivos: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"] },
    { id: "prof-2", nome: "Paula Santini", especialidade: "Terapeuta Ocupacional / Snoezelen", cor: "bg-amber-500", diasAtivos: ["Terça-feira", "Quinta-feira", "Sexta-feira"] },
    { id: "prof-3", nome: "Thiago Alencar", especialidade: "Psicopedagogo Clínico", cor: "bg-pink-500", diasAtivos: ["Segunda-feira", "Quarta-feira", "Sexta-feira"] },
    { id: "prof-4", nome: "Marcus Pereira", especialidade: "Neuropediatra Convidado", cor: "bg-purple-500", diasAtivos: ["Quarta-feira"] }
  ]);

  // New Booking & Block Form States
  const [modalActionType, setModalActionType] = useState<"agendamento" | "bloqueio">("agendamento");
  const [timeSelectionMode, setTimeSelectionMode] = useState<"grade" | "livre">("grade");
  const [customStartTime, setCustomStartTime] = useState("08:30");
  const [customEndTime, setCustomEndTime] = useState("09:45");
  const [blockReason, setBlockReason] = useState("Intervalo de Almoço");

  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const [schedDay, setSchedDay] = useState("Segunda-feira");
  const [schedTime, setSchedTime] = useState("14:00");
  const [schedType, setSchedType] = useState<AgendaItem["tipoAtendimento"]>("Plano de Tratamento ABA");
  const [schedProfessional, setSchedProfessional] = useState("Francine Maria Tersi");
  const [overlapAlert, setOverlapAlert] = useState("");

  // New Professional Form States
  const [newProfName, setNewProfName] = useState("");
  const [newProfSpecialty, setNewProfSpecialty] = useState("Psicóloga ABA");
  const [newProfColor, setNewProfColor] = useState("bg-indigo-500");

  // New Hour State
  const [newHourInput, setNewHourInput] = useState("");

  // Styling helper based on treatment types for the calendar cells
  const getAppStyle = (tipo: AgendaItem["tipoAtendimento"]) => {
    switch (tipo) {
      case "Plano de Tratamento ABA":
        return { 
          bg: "bg-blue-50/90 text-blue-700 border-blue-200/60 hover:bg-blue-100/60", 
          dot: "bg-blue-500",
          pill: "bg-blue-100/80 text-blue-800"
        };
      case "Avaliação Psicopedagógica":
        return { 
          bg: "bg-pink-50/90 text-pink-700 border-pink-200/60 hover:bg-pink-100/60", 
          dot: "bg-pink-500",
          pill: "bg-pink-100/80 text-pink-800"
        };
      case "Triagem Sensorial Snoezelen":
        return { 
          bg: "bg-amber-50/90 text-amber-700 border-amber-200/60 hover:bg-amber-100/60", 
          dot: "bg-amber-500",
          pill: "bg-amber-100/80 text-amber-800"
        };
      case "Reunião Escolar Técnica":
        return { 
          bg: "bg-purple-50/90 text-purple-700 border-purple-200/60 hover:bg-purple-100/60", 
          dot: "bg-purple-500",
          pill: "bg-purple-100/80 text-purple-800"
        };
      default:
        return { 
          bg: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100", 
          dot: "bg-slate-500",
          pill: "bg-slate-100 text-slate-800"
        };
    }
  };

  // Pre-fill fields when clicking on an empty cell
  const handleEmptyCellClick = (day: string, time: string) => {
    setSchedDay(day);
    setSchedTime(time);
    setOverlapAlert("");
    setModalActionType("agendamento");
    setTimeSelectionMode("grade");
    // Extract hour and set reasonable end time for custom mode
    const [h, m] = time.split(":");
    setCustomStartTime(time);
    const endHour = String(Number(h) + 1).padStart(2, "0");
    setCustomEndTime(`${endHour}:${m}`);
    setIsBookingModalOpen(true);
  };

  const checkConflict = (day: string, time: string, prof: string): boolean => {
    // Check if professional already has an appointment at this day and time
    return appointments.some(app => 
      app.diaSemana === day && 
      app.horario === time && 
      (app.profissional === prof || !app.profissional)
    );
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final time representation based on mode chosen
    const finalTime = timeSelectionMode === "grade" ? schedTime : `${customStartTime} às ${customEndTime}`;

    if (modalActionType === "bloqueio") {
      const newBlock: BlockedSlot = {
        id: `block-${Date.now()}`,
        diaSemana: schedDay,
        horario: finalTime,
        motivo: blockReason || "Bloqueio Manual"
      };
      setBlockedSlots([...blockedSlots, newBlock]);
      setOverlapAlert("");
      setIsBookingModalOpen(false);
      return;
    }

    // Creating normal patient appointment
    const pat = patients.find(p => p.id === selectedPatId);
    if (!pat) return;

    // Check for overlap for the selected professional
    const isConflict = checkConflict(schedDay, finalTime, schedProfessional);
    if (isConflict) {
      setOverlapAlert(`⚠️ Conflito de horário: ${schedProfessional} já possui agendamento para ${schedDay} às ${finalTime}.`);
      return;
    }

    const newApp: AgendaItem = {
      id: `app-${Date.now()}`,
      patientId: selectedPatId,
      patientNome: pat.nome,
      diaSemana: schedDay,
      horario: finalTime,
      tipoAtendimento: schedType,
      profissional: schedProfessional
    };

    setAppointments([...appointments, newApp]);
    setOverlapAlert("");
    setIsBookingModalOpen(false);
  };

  const handleDeleteAppointment = (id: string) => {
    if (confirm("Deseja remover este horário agendado?")) {
      setAppointments(appointments.filter(app => app.id !== id));
    }
  };

  // Operating days configuration functions
  const toggleOperatingDay = (day: string) => {
    if (clinicDays.includes(day)) {
      if (clinicDays.length === 1) {
        alert("A clínica precisa ter pelo menos 1 dia de funcionamento configurado.");
        return;
      }
      setClinicDays(clinicDays.filter(d => d !== day));
    } else {
      // Keep proper sequence: Seg, Ter, Qua, Qui, Sex, Sáb, Dom
      const daysOrder = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
      const updated = [...clinicDays, day].sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
      setClinicDays(updated);
    }
  };

  // Add a new operational hour
  const handleAddHour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHourInput.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      alert("Formato inválido. Use o padrão de 24h (HH:MM), exemplo: 18:00");
      return;
    }
    if (clinicHours.includes(newHourInput)) {
      alert("Este horário já está configurado.");
      return;
    }
    const updatedHours = [...clinicHours, newHourInput].sort();
    setClinicHours(updatedHours);
    setNewHourInput("");
  };

  // Remove an operational hour
  const handleRemoveHour = (hour: string) => {
    if (clinicHours.length === 1) {
      alert("A clínica precisa ter pelo menos 1 faixa horária cadastrada.");
      return;
    }
    if (confirm(`Deseja remover a faixa horária de ${hour}?`)) {
      setClinicHours(clinicHours.filter(h => h !== hour));
    }
  };

  // Add new professional
  const handleCreateProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName.trim()) return;

    const newProf: Professional = {
      id: `prof-${Date.now()}`,
      nome: newProfName,
      especialidade: newProfSpecialty,
      cor: newProfColor,
      diasAtivos: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"]
    };

    setProfessionals([...professionals, newProf]);
    setNewProfName("");
    alert(`Profissional ${newProfName} adicionado à equipe com sucesso!`);
  };

  // Filter appointments according to selected professional
  const filteredAppointments = selectedProfessionalFilter === "Todos" 
    ? appointments 
    : appointments.filter(app => app.profissional === selectedProfessionalFilter);

  const daysOfWeekFull = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

  return (
    <div id="agenda-module" className="space-y-6 w-full max-w-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
            <span className="p-1 rounded-xl bg-blue-50 text-[#1070ca] text-lg">📅</span> Agenda Clínica Integrada
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans mt-0.5">Gestão unificada de atendimentos, configuração de horários e escala de terapeutas em tela cheia.</p>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <button
              onClick={() => {
                setOverlapAlert("");
                setIsBookingModalOpen(true);
              }}
              className="px-4 py-2 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Novo Agendamento
            </button>
          )}

          <button
            onClick={() => setIsProfessionalsModalOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
          >
            <Users className="h-4 w-4 text-slate-500" /> Ver Profissionais
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
          >
            <Settings className="h-4 w-4 text-slate-300" /> Configurar Grade
          </button>
        </div>
      </div>

      {/* Main Full-Width Content Board */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          
          {/* Professional Filter and Info */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-400 font-mono">
              <Filter className="h-3.5 w-3.5 text-slate-400" /> Filtrar Terapeuta:
            </div>
            <select
              value={selectedProfessionalFilter}
              onChange={(e) => setSelectedProfessionalFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="Todos">Todos os Profissionais ({professionals.length})</option>
              {professionals.map(p => (
                <option key={p.id} value={p.nome}>{p.nome} ({p.especialidade.split(" ")[0]})</option>
              ))}
            </select>
          </div>

          {/* View toggle tabs */}
          <div className="inline-flex p-1 bg-slate-100/80 rounded-xl gap-1 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-[#1070ca] shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Grid className="h-3.5 w-3.5" /> Grade Semanal
            </button>
            <button
              type="button"
              onClick={() => setViewMode("diario")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                viewMode === "diario"
                  ? "bg-white text-[#1070ca] shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Dia Individual
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-[#1070ca] shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="h-3.5 w-3.5" /> Todos os Compromissos
            </button>
          </div>
        </div>

        {/* Warning about filtered view */}
        {selectedProfessionalFilter !== "Todos" && (
          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs text-slate-600 flex items-center gap-2 font-medium">
            <Info className="h-4 w-4 text-[#1070ca] shrink-0" />
            <span>Exibindo apenas atendimentos atribuídos a <strong>{selectedProfessionalFilter}</strong>. Clique nos slots vazios para criar novos agendamentos diretamente para esta escala.</span>
          </div>
        )}

        {/* Weekly Grid Mode */}
        {viewMode === "grid" && (
          <div className="overflow-x-auto">
            <div className="min-w-[900px] pb-2">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="w-24 pb-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-wider">Horário</th>
                    {clinicDays.map(day => (
                      <th key={day} className="pb-3 text-center text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        {day.replace("-feira", "")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clinicHours.map(hour => (
                    <tr key={hour} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/10 transition-colors">
                      <td className="py-4 text-[11px] font-mono font-extrabold text-slate-400 flex items-center gap-1.5 align-middle">
                        <Clock className="h-3 w-3 text-slate-300" /> {hour}
                      </td>
                      {clinicDays.map(day => {
                        // Match apps that start at this hour or match the exact hour string
                        const dayApps = filteredAppointments.filter(a => {
                          if (a.diaSemana !== day) return false;
                          if (a.horario === hour) return true;
                          const startHour = a.horario.split(":")[0];
                          const rowHour = hour.split(":")[0];
                          return startHour === rowHour;
                        });

                        const dayBlocks = blockedSlots.filter(b => {
                          if (b.diaSemana !== day) return false;
                          if (b.horario === hour) return true;
                          const startHour = b.horario.split(":")[0];
                          const rowHour = hour.split(":")[0];
                          return startHour === rowHour;
                        });

                        const hasBlocks = dayBlocks.length > 0;
                        const hasApps = dayApps.length > 0;

                        if (hasBlocks) {
                          return (
                            <td key={day} className="p-1 align-middle">
                              <div className="space-y-1">
                                {dayBlocks.map(block => (
                                  <div 
                                    key={block.id} 
                                    className="p-2 rounded-xl border border-slate-200/60 text-left relative group bg-slate-50 text-slate-500 shadow-3xs overflow-hidden"
                                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 8px, #f1f5f9 8px, #f1f5f9 16px)' }}
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="text-[8px] font-black leading-none text-slate-500 uppercase tracking-widest block">
                                        🚫 BLOQUEADO
                                      </span>
                                      {canDelete && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (confirm("Deseja remover este bloqueio de horário?")) {
                                              setBlockedSlots(blockedSlots.filter(b => b.id !== block.id));
                                            }
                                          }}
                                          className="text-slate-400 hover:text-red-600 transition text-[11px] font-bold absolute top-1 right-2 cursor-pointer opacity-0 group-hover:opacity-100"
                                          title="Desbloquear"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-700 leading-tight mt-1" title={block.motivo}>
                                      {block.motivo}
                                    </p>
                                    <div className="text-[8px] font-mono font-bold text-slate-400 mt-1">
                                      ⏱️ {block.horario}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        } else if (hasApps) {
                          return (
                            <td key={day} className="p-1 align-middle">
                              <div className="space-y-1">
                                {dayApps.map(app => {
                                  const style = getAppStyle(app.tipoAtendimento);
                                  return (
                                    <div key={app.id} className={`p-2 rounded-xl border text-left relative group ${style.bg} transition-all duration-150 shadow-2xs`}>
                                      <div className="flex items-start justify-between gap-1">
                                        <span className="text-[10px] font-black leading-tight truncate block pr-2 text-slate-800" title={app.patientNome}>
                                          {app.patientNome}
                                        </span>
                                        {canDelete && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteAppointment(app.id)}
                                            className="text-slate-400 hover:text-red-600 transition text-[11px] font-bold absolute top-1 right-2 cursor-pointer opacity-0 group-hover:opacity-100"
                                            title="Excluir"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                      
                                      <div className="mt-1 flex items-center gap-1">
                                        <span className={`h-1 w-1 rounded-full ${style.dot}`} />
                                        <span className="text-[8px] font-black leading-none truncate block opacity-75 uppercase tracking-wide">
                                          {app.tipoAtendimento.replace("Plano de Tratamento ", "").substring(0, 15)}...
                                        </span>
                                      </div>

                                      <div className="text-[8px] font-mono font-bold text-slate-500 mt-0.5">
                                        ⏱️ {app.horario}
                                      </div>

                                      {app.profissional && (
                                        <div className="text-[7.5px] font-mono font-extrabold uppercase mt-1 opacity-80 border-t border-slate-200/40 pt-1">
                                          👤 {app.profissional.split(" ")[0]}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        } else {
                          return (
                            <td key={day} className="p-1 text-center align-middle">
                              {canCreate ? (
                                <button
                                  type="button"
                                  onClick={() => handleEmptyCellClick(day, hour)}
                                  className="w-full py-4 border border-dashed border-slate-200 hover:border-[#1070ca] hover:bg-blue-50/10 rounded-xl text-slate-300 hover:text-[#1070ca] transition-all flex items-center justify-center cursor-pointer group text-[10px]"
                                  title={`Agendar ou Bloquear para ${day} às ${hour}`}
                                >
                                  <Plus className="h-3 w-3 opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                                </button>
                              ) : (
                                <div className="w-full py-4 rounded-xl bg-slate-50/20 border border-transparent" />
                              )}
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-4 flex flex-wrap gap-4 text-[9px] font-bold font-mono uppercase text-slate-400 border-t border-slate-50 pt-3">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-md bg-blue-500" /> Plano ABA</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-md bg-pink-500" /> Psicopedagogia</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-md bg-amber-500" /> Snoezelen</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-md bg-purple-500" /> Reunião Escolar</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-md bg-slate-400" /> 🚫 Horário Bloqueado</span>
              </div>
            </div>
          </div>
        )}

        {/* View mode 2: Dia Individual (Detailed daily block & scheduler workspace) */}
        {viewMode === "diario" && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Horizontal selector row Monday to Sunday */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
              {clinicDays.map((day) => {
                const dayAppsCount = appointments.filter(a => a.diaSemana === day).length;
                const dayBlocksCount = blockedSlots.filter(b => b.diaSemana === day).length;
                const totalItems = dayAppsCount + dayBlocksCount;
                const isActive = selectedDayTab === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedDayTab(day);
                      setSchedDay(day);
                      setOverlapAlert("");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                      isActive 
                        ? "bg-[#1070ca] border-[#1070ca] text-white shadow-md shadow-blue-500/10 font-black" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{day.replace("-feira", "")}</span>
                    {totalItems > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? "bg-white text-[#1070ca]" : "bg-slate-200 text-slate-700"
                      }`}>
                        {totalItems}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Main Daily Workspace Grid */}
            <div className="grid md:grid-cols-12 gap-6 items-start">
              {/* Left column: Combined timeline of current day's events (7 columns) */}
              <div className="md:col-span-7 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#1070ca] tracking-wider flex items-center gap-1">
                      🕒 Agenda de {selectedDayTab}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5">Visão cronológica de atendimentos fixos, livres e bloqueios de horário.</p>
                  </div>
                  {/* Quick action to clear all blocks of this day */}
                  {(blockedSlots.filter(b => b.diaSemana === selectedDayTab).length > 0) && canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja remover todos os bloqueios de ${selectedDayTab}?`)) {
                          setBlockedSlots(blockedSlots.filter(b => b.diaSemana !== selectedDayTab));
                        }
                      }}
                      className="text-[10px] font-black text-red-600 hover:text-red-700 uppercase bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition"
                    >
                      Desbloquear Dia
                    </button>
                  )}
                </div>

                {/* Vertical planner feed */}
                <div className="space-y-3 pt-2">
                  {/* Collect and sort all elements of this day chronologically */}
                  {(() => {
                    const dayAppointments = filteredAppointments.filter(app => app.diaSemana === selectedDayTab);
                    const dayBlocks = blockedSlots.filter(block => block.diaSemana === selectedDayTab);

                    // Combine all into items
                    const timelineItems = [
                      ...dayAppointments.map(app => ({
                        type: "appointment" as const,
                        id: app.id,
                        time: app.horario,
                        title: app.patientNome,
                        subtitle: app.tipoAtendimento,
                        professional: app.profissional,
                        style: getAppStyle(app.tipoAtendimento)
                      })),
                      ...dayBlocks.map(block => ({
                        type: "block" as const,
                        id: block.id,
                        time: block.horario,
                        title: block.motivo,
                        subtitle: "🚫 Intervalo de Agenda Bloqueado",
                        professional: null,
                        style: {
                          bg: "bg-slate-100 text-slate-600 border-slate-200",
                          dot: "bg-slate-400",
                          pill: "bg-slate-200 text-slate-700"
                        }
                      }))
                    ].sort((a, b) => a.time.localeCompare(b.time));

                    if (timelineItems.length === 0) {
                      return (
                        <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl">
                          <p className="text-xs text-slate-400 font-bold">Nenhum agendamento ou bloqueio para este dia.</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">Utilize o painel lateral para programar atendimentos ou bloquear horários.</p>
                        </div>
                      );
                    }

                    return timelineItems.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-xl border text-left flex items-start justify-between gap-4 transition bg-white shadow-3xs hover:border-slate-300 relative group`}
                        style={item.type === "block" ? { backgroundImage: 'repeating-linear-gradient(45deg, #ffffff, #ffffff 8px, #f8fafc 8px, #f8fafc 16px)' } : undefined}
                      >
                        <div className="flex items-start gap-3">
                          {/* Left Time Indicator Block */}
                          <div className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-center min-w-[70px]">
                            <span className="text-[10px] font-bold font-mono text-slate-500 block leading-tight">HORÁRIO</span>
                            <span className="text-xs font-black font-mono text-[#1070ca] block mt-0.5 leading-none">{item.time}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${item.style.dot}`} />
                              <h5 className="text-xs font-black text-slate-800 leading-tight pr-6">{item.title}</h5>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.subtitle}</p>
                            {item.professional && (
                              <p className="text-[9px] text-slate-400 font-semibold mt-1">👤 Terapeuta: {item.professional}</p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons (Delete) on hover/fixed */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              if (item.type === "block") {
                                if (confirm("Deseja remover este bloqueio de horário?")) {
                                  setBlockedSlots(blockedSlots.filter(b => b.id !== item.id));
                                }
                              } else {
                                handleDeleteAppointment(item.id);
                              }
                            }}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition opacity-50 group-hover:opacity-100 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                {/* Show unassigned standard grid hours for quick booking */}
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <h5 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 font-mono">Disponibilidade Livre na Grade de Horários:</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {clinicHours.map(hour => {
                      const isHourOccupied = appointments.some(a => a.diaSemana === selectedDayTab && a.horario === hour) ||
                                              blockedSlots.some(b => b.diaSemana === selectedDayTab && b.horario === hour);
                      if (isHourOccupied) return null;

                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => {
                            setSchedTime(hour);
                            setTimeSelectionMode("grade");
                            setModalActionType("agendamento");
                            setOverlapAlert("");
                            // Scroll or notify that it is active
                          }}
                          className="px-2.5 py-1.5 bg-white border border-dashed border-slate-200 text-slate-600 hover:border-[#1070ca] hover:text-[#1070ca] rounded-lg text-[10px] font-bold font-mono transition flex items-center gap-1 cursor-pointer"
                          title="Clique para preencher este horário no formulário de reserva"
                        >
                          <Clock className="h-3 w-3 text-slate-300" /> {hour}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right column: Interactive Quick Block & Free-Form Scheduler Card (5 columns) */}
              <div className="md:col-span-5 bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
                <div className="border-b border-slate-50 pb-2">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1">
                    ⚡ Agendador Livre e Bloqueios
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5">Cadastre agendamentos livres "de tal a tal" ou bloqueie faixas da agenda rapidamente.</p>
                </div>

                {/* Action switcher: Booking vs Block */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setModalActionType("agendamento");
                      setOverlapAlert("");
                    }}
                    className={`py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      modalActionType === "agendamento" 
                        ? "bg-white text-[#1070ca] shadow-xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    📅 Agendar Paciente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalActionType("bloqueio");
                      setOverlapAlert("");
                    }}
                    className={`py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      modalActionType === "bloqueio" 
                        ? "bg-white text-red-600 shadow-xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🚫 Bloquear Horário
                  </button>
                </div>

                <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
                  {modalActionType === "agendamento" ? (
                    <>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Paciente</label>
                        <select
                          value={selectedPatId}
                          onChange={(e) => setSelectedPatId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-[#1070ca] focus:bg-white focus:outline-none"
                        >
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Terapeuta Responsável</label>
                        <select
                          value={schedProfessional}
                          onChange={(e) => {
                            setSchedProfessional(e.target.value);
                            setOverlapAlert("");
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-[#1070ca] focus:bg-white focus:outline-none"
                        >
                          {professionals.map(p => (
                            <option key={p.id} value={p.nome}>{p.nome} ({p.especialidade.split(" ")[0]})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Categoria</label>
                        <select
                          value={schedType}
                          onChange={(e) => setSchedType(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-[#1070ca] focus:bg-white focus:outline-none"
                        >
                          <option value="Plano de Tratamento ABA">Plano de Tratamento ABA</option>
                          <option value="Avaliação Psicopedagógica">Avaliação Psicopedagógica</option>
                          <option value="Triagem Sensorial Snoezelen">Triagem Sensorial Snoezelen</option>
                          <option value="Reunião Escolar Técnica">Reunião Escolar Técnica</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Motivo do Bloqueio</label>
                      <input
                        type="text"
                        required
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Ex: Almoço, Supervisão, Manutenção"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-[#1070ca] focus:bg-white focus:outline-none mb-1.5"
                      />
                      <div className="flex flex-wrap gap-1">
                        {["Almoço", "Supervisão", "Reunião Geral", "Particular"].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setBlockReason(preset)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-bold text-slate-500 rounded"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hour selection type */}
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-2.5">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider font-mono">Tipo de Horário</label>
                      <select
                        value={timeSelectionMode}
                        onChange={(e) => setTimeSelectionMode(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-[#1070ca] focus:bg-white focus:outline-none"
                      >
                        <option value="grade">⏱️ Na Grade</option>
                        <option value="custom">🔓 Personalizado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider font-mono">Dia da Semana</label>
                      <select
                        value={schedDay}
                        onChange={(e) => {
                          setSchedDay(e.target.value);
                          setSelectedDayTab(e.target.value);
                          setOverlapAlert("");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-[#1070ca] focus:bg-white focus:outline-none"
                      >
                        {clinicDays.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {timeSelectionMode === "grade" ? (
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider font-mono">Horário de Início Fixo</label>
                      <select
                        value={schedTime}
                        onChange={(e) => {
                          setSchedTime(e.target.value);
                          setOverlapAlert("");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-[#1070ca] focus:bg-white focus:outline-none"
                      >
                        {clinicHours.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1">Selecionar Faixa Livre (De tal a tal):</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[8.5px] font-black text-slate-400">DE:</span>
                          <input
                            type="text"
                            required
                            value={customStartTime}
                            onChange={(e) => setCustomStartTime(e.target.value)}
                            placeholder="08:30"
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-center font-mono text-xs font-bold focus:ring-1 focus:ring-[#1070ca] focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8.5px] font-black text-slate-400">ATÉ:</span>
                          <input
                            type="text"
                            required
                            value={customEndTime}
                            onChange={(e) => setCustomEndTime(e.target.value)}
                            placeholder="09:45"
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-center font-mono text-xs font-bold focus:ring-1 focus:ring-[#1070ca] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {overlapAlert && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[10px] rounded-xl font-bold flex items-start gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{overlapAlert}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> {modalActionType === "agendamento" ? "Salvar Agendamento" : "Efetuar Bloqueio"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 3: Chronological list of all events grouped by operating days */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {clinicDays.map((day) => {
              const dayApps = filteredAppointments.filter(app => app.diaSemana === day).sort((a,b) => a.horario.localeCompare(b.horario));
              const dayBlocks = blockedSlots.filter(b => b.diaSemana === day).sort((a,b) => a.horario.localeCompare(b.horario));
              
              return (
                <div key={day} className="space-y-3 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0 text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1070ca] bg-blue-100/40 px-3 py-1 rounded-full inline-block font-mono border border-blue-100/30">{day}</h4>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                    {/* Blocked slots in list mode */}
                    {dayBlocks.map((block) => (
                      <div key={block.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between transition duration-200 group" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 8px, #f1f5f9 8px, #f1f5f9 16px)' }}>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-black">
                            🚫
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{block.motivo}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3 text-slate-400" /> {block.horario}
                              </span>
                              <span className="text-[8px] font-extrabold font-mono uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                Bloqueado
                              </span>
                            </div>
                          </div>
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Deseja remover este bloqueio de horário?")) {
                                setBlockedSlots(blockedSlots.filter(b => b.id !== block.id));
                              }
                            }}
                            className="text-slate-300 hover:text-red-500 transition px-2 py-1 text-base cursor-pointer"
                            title="Remover bloqueio"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    {dayApps.map((app) => {
                      const style = getAppStyle(app.tipoAtendimento);
                      return (
                        <div key={app.id} className="p-4 bg-slate-50/50 hover:bg-blue-50/10 border border-slate-100 rounded-2xl flex items-center justify-between transition duration-200 group">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-100 text-[#1070ca] flex items-center justify-center text-xs font-black">
                              {app.patientNome.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-tight">{app.patientNome}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 font-mono">
                                  <Clock className="h-3 w-3 text-[#1070ca]" /> {app.horario}
                                </span>
                                <span className={`text-[8px] font-extrabold font-mono uppercase px-1.5 py-0.5 rounded ${style.pill}`}>
                                  {app.tipoAtendimento.replace("Plano de Tratamento ", "")}
                                </span>
                              </div>
                              {app.profissional && (
                                <p className="text-[8.5px] text-slate-400 font-semibold mt-1 font-sans">👤 {app.profissional}</p>
                              )}
                            </div>
                          </div>
                          
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAppointment(app.id)}
                              className="text-slate-300 hover:text-red-500 transition px-2 py-1 text-base cursor-pointer"
                              title="Remover agendamento"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {dayApps.length === 0 && dayBlocks.length === 0 && (
                      <p className="text-xs text-slate-400 font-medium py-2 pl-3 col-span-full">Nenhum atendimento ou bloqueio agendado para este dia.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4">
            <button 
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-slate-50 pb-3">
              <h3 className="font-display font-black text-slate-900 text-base uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-5 w-5 text-[#1070ca]" /> {modalActionType === "agendamento" ? "Novo Agendamento" : "Bloqueio de Horário"}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase mt-1">Configure o dia, horário livre e evite conflitos de agenda</p>
            </div>

            {/* Action Selection Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setModalActionType("agendamento")}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  modalActionType === "agendamento" 
                    ? "bg-white text-[#1070ca] shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📅 Agendar Paciente
              </button>
              <button
                type="button"
                onClick={() => setModalActionType("bloqueio")}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  modalActionType === "bloqueio" 
                    ? "bg-white text-red-600 shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🚫 Bloquear Agenda
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              
              {/* Conditional Render based on Action Type */}
              {modalActionType === "agendamento" ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Paciente</label>
                    <select
                      value={selectedPatId}
                      onChange={(e) => setSelectedPatId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Terapeuta Responsável</label>
                    <select
                      value={schedProfessional}
                      onChange={(e) => {
                        setSchedProfessional(e.target.value);
                        setOverlapAlert("");
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                    >
                      {professionals.map(p => (
                        <option key={p.id} value={p.nome}>{p.nome} ({p.especialidade.split(" ")[0]})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Categoria de Atendimento</label>
                    <select
                      value={schedType}
                      onChange={(e) => setSchedType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                    >
                      <option value="Plano de Tratamento ABA">Plano de Tratamento ABA (Sessão Recorrente)</option>
                      <option value="Avaliação Psicopedagógica">Avaliação Psicopedagógica</option>
                      <option value="Triagem Sensorial Snoezelen">Triagem Sensorial Snoezelen</option>
                      <option value="Reunião Escolar Técnica">Reunião Escolar Técnica</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Motivo do Bloqueio</label>
                  <input
                    type="text"
                    required
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Ex: Intervalo de Almoço, Supervisão de Equipe, Folga"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all mb-2"
                  />
                  {/* Preset Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["Almoço", "Supervisão", "Reunião Geral", "Manutenção"].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBlockReason(preset)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 rounded-lg transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day & Time Selection Panel */}
              <div className="border-t border-slate-50 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Dia da Semana</label>
                    <select
                      value={schedDay}
                      onChange={(e) => {
                        setSchedDay(e.target.value);
                        setOverlapAlert("");
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                    >
                      {clinicDays.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Modo do Horário</label>
                    <select
                      value={timeSelectionMode}
                      onChange={(e) => setTimeSelectionMode(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                    >
                      <option value="grade">⏱️ Horário da Grade</option>
                      <option value="custom">🔓 Personalizado (Livre)</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Time Range Inputs */}
                {timeSelectionMode === "grade" ? (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Horário de Início (Fixo na Grade)</label>
                    <select
                      value={schedTime}
                      onChange={(e) => {
                        setSchedTime(e.target.value);
                        setOverlapAlert("");
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                    >
                      {clinicHours.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Janela de Horário Livre (Início / Fim)</label>
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-black">DE:</span>
                        <input
                          type="text"
                          required
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          placeholder="08:30"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold font-mono text-center focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-black">ATÉ:</span>
                        <input
                          type="text"
                          required
                          value={customEndTime}
                          onChange={(e) => setCustomEndTime(e.target.value)}
                          placeholder="09:45"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold font-mono text-center focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {overlapAlert && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-start gap-1.5 animate-pulse font-sans">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{overlapAlert}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-blue-500/5 cursor-pointer flex items-center justify-center gap-1"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Professionals Panel */}
      {isProfessionalsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsProfessionalsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-slate-50 pb-3">
              <h3 className="font-display font-black text-slate-900 text-base uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-5 w-5 text-[#1070ca]" /> Equipe de Profissionais Clínicos
              </h3>
              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase mt-1">Especialistas e Escalas de Atendimento na APRENDER A SER</p>
            </div>

            {/* List of current staff */}
            <div className="grid sm:grid-cols-2 gap-4">
              {professionals.map(p => (
                <div key={p.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl ${p.cor} text-white flex items-center justify-center text-sm font-black`}>
                    {p.nome.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800">{p.nome}</h4>
                    <span className="inline-block text-[9px] font-extrabold text-[#1070ca] bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                      {p.especialidade}
                    </span>
                    <p className="text-[8px] font-mono font-bold text-slate-400 uppercase mt-2">
                      Dias: {p.diasAtivos.map(d => d.replace("-feira", "")).join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form to add professional */}
            {canCreate && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-[#d43f72]" /> Adicionar Terapeuta à Equipe
                </h4>
                
                <form onSubmit={handleCreateProfessional} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      placeholder="Ex: Viviane Albuquerque"
                      value={newProfName}
                      onChange={(e) => setNewProfName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Especialidade / Cargo</label>
                    <select
                      value={newProfSpecialty}
                      onChange={(e) => setNewProfSpecialty(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="Psicóloga ABA">Psicóloga ABA</option>
                      <option value="Terapeuta Ocupacional">Terapeuta Ocupacional</option>
                      <option value="Psicopedagoga">Psicopedagoga</option>
                      <option value="Fonoaudióloga Clínico">Fonoaudióloga Clínico</option>
                      <option value="Fisioterapeuta Motora">Fisioterapeuta Motora</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-slate-400">Identificação Visual:</span>
                      <div className="flex gap-1.5">
                        {["bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-cyan-500", "bg-orange-500"].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewProfColor(c)}
                            className={`h-5 w-5 rounded-full ${c} border-2 ${newProfColor === c ? "border-slate-800 scale-110" : "border-transparent"} transition-all cursor-pointer`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Configure Grid (Hours and Days) */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-slate-50 pb-3">
              <h3 className="font-display font-black text-slate-900 text-base uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="h-5 w-5 text-[#1070ca]" /> Configurar Abertura de Funcionamento
              </h3>
              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase mt-1">Gerencie os dias letivos e as faixas horárias operacionais da clínica</p>
            </div>

            {/* 1. Days of Week Selector */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider font-mono">1. Dias de Funcionamento Clínico</h4>
              <div className="flex flex-wrap gap-2">
                {daysOfWeekFull.map(day => {
                  const isActive = clinicDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleOperatingDay(day)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isActive 
                          ? "bg-blue-50 border-blue-200 text-[#1070ca] font-black" 
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="h-3.5 w-3.5 text-[#1070ca]" /> : <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Hour Slots List Management */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider font-mono">2. Grade de Horários Ativos</h4>
              
              {/* Add Hour input */}
              <form onSubmit={handleAddHour} className="flex gap-2 text-xs">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Clock className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Adicionar novo horário (Ex: 12:00, 18:30)"
                    value={newHourInput}
                    onChange={(e) => setNewHourInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Adicionar
                </button>
              </form>

              {/* Badges of current hours */}
              <div className="flex flex-wrap gap-2 pt-2">
                {clinicHours.map(hour => (
                  <span 
                    key={hour} 
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border border-slate-200"
                  >
                    {hour}
                    <button
                      type="button"
                      onClick={() => handleRemoveHour(hour)}
                      className="text-slate-400 hover:text-red-500 font-black ml-1.5 cursor-pointer text-xs transition"
                      title="Excluir Horário"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Concluir Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
