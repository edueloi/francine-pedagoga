import React, { useState } from "react";
import { BarChart3, CalendarDays, CalendarClock, UserPlus, ClipboardList, Users2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useReports } from "../hooks/useReports";

const STATUS_LABELS: Record<string, string> = {
  confirmado: "Confirmados",
  pendente: "Pendentes",
  cancelado: "Cancelados",
  realizado: "Realizados",
};

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${accent}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

export default function ReportsModule() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const { summary, loading, error } = useReports(period);

  const dayData = (summary?.appointmentsByDay || []).map((d) => ({
    day: new Date(d.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    total: d.total,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
            <span className="p-1 rounded-xl bg-blue-50 text-[#1070ca] text-lg">📊</span> Relatórios Gerenciais
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Visão consolidada de agendamentos, pacientes e sessões — visível apenas para o perfil Administrador.
          </p>
        </div>

        <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200 shrink-0">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p ? "bg-white text-[#1070ca] shadow-sm" : "text-zinc-500"
              }`}
            >
              {p === "week" ? "Últimos 7 dias" : "Últimos 30 dias"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-xs text-slate-400 text-center py-10">Carregando relatórios...</p>}
      {error && <p className="text-xs text-red-600 font-bold text-center py-4">{error}</p>}

      {!loading && summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<CalendarDays className="h-5 w-5 text-[#1070ca]" />}
              label="Agendamentos"
              value={summary.totalAppointments}
              accent="bg-blue-50"
            />
            <StatCard
              icon={<Users2 className="h-5 w-5 text-emerald-600" />}
              label="Pacientes Atendidos"
              value={summary.activePatients}
              accent="bg-emerald-50"
            />
            <StatCard
              icon={<UserPlus className="h-5 w-5 text-[#d43f72]" />}
              label="Novos Pacientes"
              value={summary.newPatients}
              accent="bg-rose-50"
            />
            <StatCard
              icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
              label="Sessões Registradas"
              value={summary.sessionsLogged}
              accent="bg-amber-50"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <CalendarClock className="h-4.5 w-4.5 text-[#1070ca]" /> Agendamentos por Dia
              </h4>
              <div className="h-64">
                {dayData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(16, 112, 202, 0.05)" }}
                        contentStyle={{
                          background: "rgba(15, 23, 42, 0.95)",
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                        formatter={(value) => [`${value} agendamento(s)`, "Total"]}
                      />
                      <Bar dataKey="total" fill="#1070ca" radius={[8, 8, 0, 0]} maxBarSize={40}>
                        {dayData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#1070ca" : "#d43f72"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                    Nenhum agendamento no período selecionado.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-[#d43f72]" /> Agendamentos por Status
              </h4>
              <div className="space-y-3">
                {Object.entries(summary.appointmentsByStatus).length > 0 ? (
                  Object.entries(summary.appointmentsByStatus).map(([status, total]) => {
                    const pct = summary.totalAppointments > 0 ? Math.round((total / summary.totalAppointments) * 100) : 0;
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">{STATUS_LABELS[status] || status}</span>
                          <span className="font-black text-slate-900">{total}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1070ca] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium py-10">
                    Nenhum agendamento no período selecionado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
