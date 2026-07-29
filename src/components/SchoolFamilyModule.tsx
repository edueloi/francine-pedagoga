import React, { useState, useEffect } from "react";
import { Sparkles, Save, BookOpen, UserCheck, CheckSquare, RefreshCw, Star, Heart, Check } from "lucide-react";
import { Patient, UserRole, UserPermissions } from "../types";
import { useTimeline } from "../hooks/useTimeline";
import { useClinicSettings } from "../hooks/useClinicSettings";
import { useToast } from "./UI";

interface SchoolFamilyModuleProps {
  patients: Patient[];
  userRole: UserRole;
  userPermissions?: UserPermissions;
}

export default function SchoolFamilyModule({ patients, userRole, userPermissions }: SchoolFamilyModuleProps) {
  const toast = useToast();
  const { settings: clinic } = useClinicSettings();
  const canCreate = userPermissions ? userPermissions.schoolFamily.criar : (userRole !== UserRole.RESTRICTED);
  const canEdit = userPermissions ? userPermissions.schoolFamily.editar : (userRole !== UserRole.RESTRICTED);

  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [homeGuideline, setHomeGuideline] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [visitResolution, setVisitResolution] = useState("");

  // School/family contact logs are stored as timeline_items with tipo
  // "Visita Escolar" / "Reunião de Família", scoped to the selected patient.
  const { timeline: visitLogs, loading, error, addTimelineItem } = useTimeline(selectedPatId);

  const selectedPatient = patients.find(p => p.id === selectedPatId);

  // Dynamic compiler for parenting guidelines (no AI, instant & robust)
  const compileGuideline = () => {
    if (!selectedPatient) return;

    const patName = selectedPatient.nome;
    const patAge = selectedPatient.idade;
    const patDiag = selectedPatient.diagnostico;

    setHomeGuideline(`GUIA CLÍNICO DE DIRETRIZES COMPORTAMENTAIS PARA ESTIMULAÇÃO NO LAR

PACIENTE: ${patName.toUpperCase()} | IDADE: ${patAge} ANOS
DIAGNÓSTICO/HIPÓTESE: ${patDiag.toUpperCase()}
TERAPEUTA RESPONSÁVEL: Francine Maria Tersi

Prezados pais/responsáveis por ${patName},

Visando dar continuidade às estratégias comportamentais (ABA) e de regulação que realizamos no ambiente clínico, descrevemos abaixo a rotina estruturada de estimulação recomendada para o recesso domiciliar:

1. ESTRUTURAÇÃO DE ROTINA VISUAL E TRANSIÇÃO
- Estabeleçam um painel de rotina visual em local visível (ex: porta da geladeira), contendo fichas ou ilustrações das tarefas diárias (Acordar -> Café da Manhã -> Higiene -> Atividade -> Brincar -> Dormir).
- Sinalizem verbalmente 5 minutos antes de qualquer transição difícil: "Daqui a cinco minutos nós vamos guardar os brinquedos e tomar banho". Se possível, usem um cronômetro visual no celular.

2. ADEQUAÇÕES DE AMBIENTE PARA FOCO E LIÇÃO
- Durante as tarefas que exijam foco, organizem uma mesa limpa, sem brinquedos ou telas ao redor.
- Garantam que o paciente se sente com as costas eretas e os pés apoiados de forma confortável.
- Ofereçam reforço positivo imediato (elogios entusiasmados, estrelas de papel ou tokens) no exato instante em que ele cooperar ou finalizar cada etapa.

3. BRINCAR E INTERVENÇÃO SENSORIAL EM CASA
- Promovam momentos de brincadeira compartilhada com troca de turnos ("Minha vez, agora sua vez") por pelo menos 15 minutos diários.
- Se o paciente demonstrar agitação psicomotora alta, façam uma pausa tátil: brinquem de amassar massinha de modelar, espremer bolinhas texturizadas ou bacia de arroz sensorial por 10 minutos para autorregulação proprioceptiva.

Clínica ${clinic?.name || "Espaço Aprender a Ser"}${clinic?.address ? ` • ${clinic.address}` : ""}
Diretora Técnica: Francine Maria Tersi`);
  };

  useEffect(() => {
    compileGuideline();
  }, [selectedPatId, clinic]);

  const handleGenerateHomeGuideline = () => {
    setIsGenerating(true);
    setTimeout(() => {
      compileGuideline();
      setIsGenerating(false);
      toast.success(`Diretrizes de apoio familiar geradas instantaneamente para ${selectedPatient?.nome}!`);
    }, 500);
  };

  const handleSaveVisitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;

    try {
      await addTimelineItem({
        patientId: selectedPatId,
        data: new Date().toISOString().split("T")[0],
        tipo: "Reunião de Família",
        titulo: teacherName,
        descricao: visitResolution || "Alinhamento de metas pedagógicas curriculares.",
        profissional: "Francine Maria Tersi",
      });
      setTeacherName("");
      setVisitResolution("");
      toast.success("Contato de alinhamento escolar arquivado com sucesso na pasta do paciente.");
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar contato escolar.");
    }
  };

  const patientLogs = visitLogs.filter(
    log => log.tipo === "Reunião de Família" || log.tipo === "Visita Escolar"
  );

  return (
    <div id="school-family-module" className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
          <span className="p-1 rounded-xl bg-blue-50 text-[#1070ca] text-lg">🏫</span> Escola & Família Integrada
        </h2>
        <p className="text-xs text-slate-500 font-medium">Crie diretrizes estruturadas para o lar e registre visitas escolares, reuniões pedagógicas e contatos com professores.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Configuration & Visitation logs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider">Selecione o Paciente</h3>
            <select
              value={selectedPatId}
              onChange={(e) => setSelectedPatId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
            >
              {patients.length === 0 && (
                <option value="" disabled>Nenhum paciente cadastrado</option>
              )}
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* School Contact Registration */}
          {canCreate && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <UserCheck className="h-4.5 w-4.5 text-[#1070ca]" /> Registrar Alinhamento Escolar
              </h3>
              
              <form onSubmit={handleSaveVisitLog} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Contato na Escola (Professores / Coordenadores)</label>
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Ex: Profa. Letícia Neves (Colégio Integração)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Resolutivas e Ajustes Acertados</label>
                  <textarea
                    rows={3}
                    required
                    value={visitResolution}
                    onChange={(e) => setVisitResolution(e.target.value)}
                    placeholder="Ex: Acertado o uso de abafador de ruídos no recesso e fixação de painel visual na carteira do aluno."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1070ca] hover:bg-[#0b5194] text-white font-black uppercase text-xs tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-md"
                >
                  Salvar Contato Escolar
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: Guideline viewer & Visit listings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Guideline Generation card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="h-4.5 w-4.5 text-[#1070ca]" /> Diretrizes de Estimulação para Casa
              </h3>
              {selectedPatient && canCreate && (
                <button
                  onClick={handleGenerateHomeGuideline}
                  disabled={isGenerating}
                  className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1070ca] text-xs font-black rounded-lg flex items-center gap-1.5 cursor-pointer border border-blue-100 transition-colors"
                >
                  {isGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Gerar Diretrizes
                </button>
              )}
            </div>

            {isGenerating ? (
              <div className="py-12 text-center space-y-3">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1070ca] border-r-transparent" />
                <p className="text-xs text-slate-400 font-bold">Compilando parâmetros de orientação familiar...</p>
              </div>
            ) : homeGuideline ? (
              <div className="p-5 bg-blue-50/20 border border-blue-100/50 rounded-2xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto select-text font-medium">
                {homeGuideline}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-12">Selecione o paciente e clique em "Gerar Diretrizes" para compilar um plano técnico estruturado de estimulação para os pais.</p>
            )}
          </div>

          {/* Historical Logs Listing */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              Histórico de Visitas & Acordos de Apoio
            </h3>
            
            <div className="space-y-3">
              {loading && (
                <p className="text-xs text-slate-400 text-center py-6">Carregando histórico...</p>
              )}
              {error && (
                <p className="text-xs text-red-600 font-bold text-center py-2">{error}</p>
              )}
              {!loading && patientLogs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800">{log.titulo}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{log.data}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.descricao}</p>
                  <p className="text-[9px] text-slate-400 font-mono font-semibold">Técnico Responsável: {log.profissional}</p>
                </div>
              ))}

              {!loading && patientLogs.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum registro de contato escolar para este paciente.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
