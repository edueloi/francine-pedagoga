import React, { useMemo } from 'react';
import { Calendar, ClipboardList, FileText, History, Loader2, Stethoscope } from 'lucide-react';
import { Patient, Session, TimelineItem } from '../../types';
import { Badge, EmptyState } from '../UI';
import { ActionDrawer } from '../UI/ActionDrawer';
import { useTimeline } from '../../hooks/useTimeline';

interface Props {
  patient: Patient | null;
  onClose: () => void;
  sessions: Session[];
}

type FeedItem = {
  id: string;
  date: string;
  kind: 'sessao' | 'timeline';
  title: string;
  subtitle?: string;
  description?: string;
  tipo?: TimelineItem['tipo'];
};

const typeColor: Record<string, 'info' | 'primary' | 'purple' | 'warning' | 'success' | 'danger' | 'default'> = {
  Avaliação: 'info',
  Sessão: 'primary',
  Protocolo: 'purple',
  Relatório: 'warning',
  PEI: 'success',
  'Visita Escolar': 'info',
  'Reunião de Família': 'warning',
  Encaminhamento: 'danger',
  Documento: 'default',
};

const formatDate = (raw: string) => {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const groupByMonth = (items: FeedItem[]) => {
  const groups: Record<string, FeedItem[]> = {};
  for (const item of items) {
    const d = new Date(item.date);
    const key = isNaN(d.getTime()) ? 'Sem data' : d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
};

/**
 * Linha do tempo somente leitura do paciente: combina sessões (useSessions,
 * filtradas por patientId) com os eventos manuais da tabela timeline_items
 * (useTimeline). É uma versão simplificada — não tenta reconstituir os
 * conceitos de "versionamento de prontuário" do psi-painel-karen, que não
 * existem neste projeto.
 */
export const PatientHistoryDrawer: React.FC<Props> = ({ patient, onClose, sessions }) => {
  const { timeline, loading } = useTimeline(patient?.id);

  const feed: FeedItem[] = useMemo(() => {
    const sessionItems: FeedItem[] = sessions
      .filter((s) => s.patientId === patient?.id)
      .map((s) => ({
        id: `sessao-${s.id}`,
        date: s.data,
        kind: 'sessao',
        title: `Sessão com ${s.profissional || 'profissional não informado'}`,
        subtitle: `${s.tempoSessao} min · ${s.nivelIndependencia}`,
        description: s.observacoesClinicas || s.planoProximaSessao || undefined,
      }));

    const timelineItems: FeedItem[] = timeline.map((t) => ({
      id: `timeline-${t.id}`,
      date: t.data,
      kind: 'timeline',
      title: t.titulo,
      subtitle: t.profissional,
      description: t.descricao,
      tipo: t.tipo,
    }));

    return [...sessionItems, ...timelineItems].sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, timeline, patient?.id]);

  const grouped = groupByMonth(feed);
  const isOpen = !!patient;

  return (
    <ActionDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={patient?.nome || 'Histórico do paciente'}
      subtitle="Linha do tempo de sessões e eventos"
      size="lg"
      mobileBehavior="full-screen"
      bodyClassName="bg-slate-50 px-4 py-4 sm:px-6 sm:py-6"
    >
      <div className="space-y-4">
        {patient && (
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-200 bg-blue-100 text-lg font-bold text-[#1070ca]">
              {patient.foto && patient.foto.length <= 4 ? patient.foto : (patient.nome || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-800">{patient.nome}</p>
              <p className="text-[11px] text-slate-400 font-semibold">
                {patient.idade} anos · {patient.diagnostico || 'Diagnóstico não informado'}
              </p>
            </div>
          </div>
        )}

        {/* Estatísticas simples */}
        <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:grid-cols-3">
          {[
            { label: 'Sessões', value: sessions.filter((s) => s.patientId === patient?.id).length, icon: <Stethoscope size={14} /> },
            { label: 'Eventos', value: timeline.length, icon: <ClipboardList size={14} /> },
            { label: 'Documentos', value: patient?.documentos.length || 0, icon: <FileText size={14} /> },
          ].map((s, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center border-b border-r border-slate-100 px-3 py-4 text-center transition-colors last:border-r-0 hover:bg-slate-50 sm:border-b-0"
            >
              <div className="flex items-center justify-center gap-2 text-base font-black text-[#1070ca]">
                {s.icon} <span>{s.value}</span>
              </div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Linha do tempo */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-10">
              <Loader2 size={32} className="animate-spin text-[#1070ca]" />
              <p className="text-sm font-medium">Carregando histórico...</p>
            </div>
          ) : feed.length === 0 ? (
            <EmptyState icon={History} title="Sem registros" description="Não existem sessões ou eventos registrados para este paciente." />
          ) : (
            <div className="space-y-8 pb-6">
              {Object.entries(grouped).map(([month, items]) => (
                <div key={month} className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-full text-xs font-semibold shadow-sm">
                      {month}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="space-y-6 relative pl-4 sm:pl-8">
                    <div className="absolute left-[27px] sm:left-[43px] top-4 bottom-0 w-0.5 bg-slate-200 rounded-full" />

                    {items.map((item) => (
                      <div key={item.id} className="relative pl-10 sm:pl-12 group">
                        <div className="absolute left-0 top-3 w-8 h-8 rounded-xl bg-blue-100 text-[#1070ca] flex items-center justify-center border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-110">
                          {item.kind === 'sessao' ? <Stethoscope size={16} /> : <Calendar size={16} />}
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h5 className="text-sm font-extrabold text-slate-900">{item.title}</h5>
                                {item.tipo && <Badge color={typeColor[item.tipo] || 'default'} size="sm">{item.tipo}</Badge>}
                                {item.kind === 'sessao' && <Badge color="primary" size="sm">Sessão</Badge>}
                              </div>
                              {item.subtitle && <p className="text-[10px] font-extrabold text-[#1070ca] uppercase tracking-widest">{item.subtitle}</p>}
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(item.date)}</div>
                            </div>
                          </div>

                          {item.description && (
                            <div className="text-[13px] text-slate-600 bg-slate-50/50 p-3 mt-3 rounded-xl border border-slate-100/50 leading-relaxed font-medium">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ActionDrawer>
  );
};
