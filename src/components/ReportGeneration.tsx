import React, { useState, useEffect } from "react";
import { FileText, Printer, Save, Download, RefreshCw, Send, CheckCircle, Check, Sparkles, BookOpen, User, Layers, ShieldAlert } from "lucide-react";
import { Patient, UserRole, UserPermissions } from "../types";

interface Report {
  id: string;
  patientId: string;
  patientNome: string;
  titulo: string;
  dataGeracao: string;
  conteudo: string;
}

interface ReportProps {
  patients: Patient[];
  userRole: UserRole;
  userPermissions?: UserPermissions;
}

export default function ReportGeneration({ patients, userRole, userPermissions }: ReportProps) {
  const canCreate = userPermissions ? userPermissions.reports.criar : (userRole !== UserRole.RESTRICTED);

  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || "");
  const [reportType, setReportType] = useState<string>("Parecer Clínico para Neuropediatra");
  
  // Interactive checklist parameters for instant auto-generation (no AI, 100% automated & mastigado)
  const [focosAtencao, setFocosAtencao] = useState<string[]>([
    "Dificuldade na manutenção de atenção sustentada em sala de aula.",
    "Atrasos no processamento fonológico e alfabetização silábica.",
    "Hipersensibilidade auditiva frente a ruídos acima do esperado."
  ]);

  const [adaptacoesRecomendadas, setAdaptacoesRecomendadas] = useState<string[]>([
    "Flexibilização do tempo para entrega de avaliações e testes em 50%.",
    "Uso de abafadores de ruído ou realização de testes em ambientes isolados.",
    "Uso sistemático de rotinas visuais e cronômetros visuais para transição de disciplinas."
  ]);

  const [condutasPropostas, setCondutasPropostas] = useState<string[]>([
    "Manutenção das sessões de Intervenção Comportamental Baseada em ABA.",
    "Estímulos de integração sensorial na Sala Snoezelen para autorregulação.",
    "Reuniões periódicas com a equipe escolar para adequação curricular do PEI."
  ]);

  const [additionalNotes, setAdditionalNotes] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [reportsArchive, setReportsArchive] = useState<Report[]>([
    {
      id: "rep-1",
      patientId: "pat-1",
      patientNome: "Lucas Silva",
      titulo: "Parecer Técnico de Adaptação Curricular",
      dataGeracao: "2026-06-15",
      conteudo: "Ao Colégio Integração\nA/C Coordenação Pedagógica\n\nIdentificamos necessidade de adaptações para Lucas Silva:\n1. Provas em ambiente isolado de estímulos;\n2. Flexibilização de tempo de entrega de avaliações em 50%;\n3. Uso de timer visual para transições de disciplinas;\n4. Intervalos curtos de 2 minutos para regulação psicomotora."
    }
  ]);

  const selectedPat = patients.find(p => p.id === selectedPatId);

  // Auto compile the document based on checkboxes selected
  const compileReport = () => {
    if (!selectedPat) return;

    let docTitle = reportType.toUpperCase();
    let intro = "";
    let body = "";

    if (reportType === "Parecer Clínico para Neuropediatra") {
      intro = `À atenção do Neuropediatra Assistente,\n\nEncaminhamos a este conceituado profissional o parecer clínico-comportamental evolutivo referente ao paciente ${selectedPat.nome.toUpperCase()}, de ${selectedPat.idade} anos, com diagnóstico prévio/hipótese de ${selectedPat.diagnostico.toUpperCase()}.`;
      body = `1. HISTÓRICO E ÁREAS DE ATENÇÃO CLÍNICA OBSERVADAS:\n${focosAtencao.map((f, i) => `   - ${f}`).join("\n")}\n\n2. RECOMENDAÇÕES E DIRETRIZES DE ADAPTAÇÃO TERAPÊUTICA:\n${adaptacoesRecomendadas.map((a, i) => `   - ${a}`).join("\n")}\n\n3. CONDUTAS CLÍNICAS E PLANEJAMENTO PROPOSTO:\n${condutasPropostas.map((c, i) => `   - ${c}`).join("\n")}`;
    } else if (reportType === "Diretrizes de Adaptação Curricular Escolar") {
      intro = `Ao Colégio ${selectedPat.escola.toUpperCase()},\nA/C Coordenação Pedagógica e Equipe de Docentes,\n\nVisando garantir a acessibilidade metodológica e o pleno desenvolvimento acadêmico do aluno(a) ${selectedPat.nome.toUpperCase()}, de ${selectedPat.idade} anos, apresentamos as diretrizes pedagógicas e de regulação para o ambiente escolar:`;
      body = `1. MARCOS DE ADAPTAÇÃO METODOLÓGICA REQUERIDOS EM SALA:\n${focosAtencao.map((f, i) => `   - ${f}`).join("\n")}\n\n2. ADAPTAÇÕES DE AVALIAÇÕES E PROVAS DE CONHECIMENTO:\n${adaptacoesRecomendadas.map((a, i) => `   - ${a}`).join("\n")}\n\n3. PLANO DE COOPERAÇÃO CLÍNICA-ESCOLA:\n${condutasPropostas.map((c, i) => `   - ${c}`).join("\n")}`;
    } else {
      intro = `RELATÓRIO CLÍNICO DE EVOLUÇÃO MULTIDISCIPLINAR\n\nPACIENTE: ${selectedPat.nome.toUpperCase()} | IDADE: ${selectedPat.idade} ANOS\nDIAGNÓSTICO: ${selectedPat.diagnostico.toUpperCase()}\nESCOLA: ${selectedPat.escola.toUpperCase()}`;
      body = `1. FOCOS ATENCIONAIS E COMPORTAMENTAIS INVESTIGADOS:\n${focosAtencao.map((f, i) => `   - ${f}`).join("\n")}\n\n2. ESTRATÉGIAS COMPORTAMENTAIS IMPLEMENTADAS EM SESSÃO:\n${adaptacoesRecomendadas.map((a, i) => `   - ${a}`).join("\n")}\n\n3. METAS E LINHA DE BASE PARA O SEGUINTE PERÍODO TERAPÊUTICO:\n${condutasPropostas.map((c, i) => `   - ${c}`).join("\n")}`;
    }

    if (additionalNotes.trim()) {
      body += `\n\n4. OBSERVAÇÕES ADICIONAIS DO CASO:\n   ${additionalNotes}`;
    }

    const signOff = `\n\nEste parecer foi compilado sob rigoroso padrão ético e técnico multidisciplinar.\n\nAtenciosamente,\n\nFrancine Maria Tersi\nPsicopedagoga, Neuropsicopedagoga e Terapeuta ABA\nEspaço Aprender a Ser - Clínica Integrada\nTatuí - SP`;

    setGeneratedContent(`${docTitle}\n\n${intro}\n\n${body}${signOff}`);
  };

  useEffect(() => {
    compileReport();
  }, [selectedPatId, reportType, focosAtencao, adaptacoesRecomendadas, condutasPropostas, additionalNotes]);

  const handleGenerateReportInstant = () => {
    setIsGenerating(true);
    setTimeout(() => {
      compileReport();
      setIsGenerating(false);
      alert("Documento Clínico Compilado e Formatado Instantaneamente!");
    }, 600);
  };

  const handleSaveToArchive = () => {
    if (!selectedPat || !generatedContent) return;

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      patientId: selectedPatId,
      patientNome: selectedPat.nome,
      titulo: reportType,
      dataGeracao: new Date().toISOString().split("T")[0],
      conteudo: generatedContent
    };

    setReportsArchive([newReport, ...reportsArchive]);
    alert("Documento clínico salvo com sucesso no arquivo do paciente.");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório Clínico - Espaço Aprender a Ser</title>
            <style>
              body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 45px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 25px; margin-bottom: 35px; }
              .header h1 { font-size: 26px; margin: 0; color: #1070ca; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
              .header p { font-size: 11px; margin: 6px 0 0; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
              .content { font-size: 14px; white-space: pre-wrap; font-weight: 500; color: #1e293b; }
              .footer { margin-top: 70px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 25px; }
              .footer p { font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; }
              .footer p.sub { font-size: 11px; color: #64748b; font-weight: normal; margin-top: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Espaço Aprender a Ser</h1>
              <p>Clínica Multidisciplinar Integrada • Psicopedagogia e Intervenção ABA</p>
              <p style="font-size: 9px; color: #94a3b8; font-weight: normal; margin-top: 4px;">Diretora: Francine Maria Tersi</p>
            </div>
            <div class="content">${generatedContent}</div>
            <div class="footer">
              <p>Francine Maria Tersi</p>
              <p class="sub">Psicopedagoga, Neuropsicopedagoga e Terapeuta ABA</p>
              <p style="font-size: 8px; color: #94a3b8; font-weight: normal; margin-top: 6px;">Emitido Eletronicamente • Conforme LGPD</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const toggleCheck = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const focosOptionList = [
    "Dificuldade na manutenção de atenção sustentada em sala de aula.",
    "Atrasos no processamento fonológico e alfabetização silábica.",
    "Hipersensibilidade auditiva frente a ruídos acima do esperado.",
    "Necessidade de reforço motor fino para coordenação da escrita cursiva.",
    "Comportamentos de recusa sob demandas acadêmicas repetitivas.",
    "Dificuldade de planejar e organizar passos para conclusão de tarefas escolares."
  ];

  const adaptacoesOptionList = [
    "Flexibilização do tempo para entrega de avaliações e testes em 50%.",
    "Uso de abafadores de ruído ou realização de testes em ambientes isolados.",
    "Uso sistemático de rotinas visuais e cronômetros visuais para transição de disciplinas.",
    "Segmentação de ordens complexas em enunciados simples e ilustrados.",
    "Intervalos planejados de 2 minutos para regulação tátil/proprioceptiva.",
    "Permissão para uso de apoios ergonômicos e materiais com texturas táteis amigáveis."
  ];

  const condutasOptionList = [
    "Manutenção das sessões de Intervenção Comportamental Baseada em ABA.",
    "Estímulos de integração sensorial na Sala Snoezelen para autorregulação.",
    "Reuniões periódicas com a equipe escolar para adequação curricular do PEI.",
    "Sessões de treinamento parental focado em manejo de contingências em ambiente doméstico.",
    "Monitoramento sistemático do tempo de engajamento ativo em tarefas individuais.",
    "Acompanhamento psicopedagógico focado na consciência silábica e cálculo lógico."
  ];

  return (
    <div id="reports-tab" className="space-y-6">
      {/* Title block */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
            <span className="p-1 rounded-xl bg-pink-50 text-[#d43f72] text-lg">📄</span> Compilador de Laudos & Relatórios
          </h2>
          <p className="text-xs text-slate-500 font-medium">Gere encaminhamentos médicos, relatórios de adaptação curricular e laudos técnicos prontos em segundos.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-3 py-1 rounded-full border border-slate-200/50">
            CONFORME LGPD & MEC
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Setup checklist controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="h-5 w-5 text-[#1070ca]" />
              <h3 className="font-display font-extrabold text-slate-950 text-sm uppercase tracking-wider">
                Parâmetros Clínicos Rápidos
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Paciente Selecionado</label>
                <select
                  value={selectedPatId}
                  onChange={(e) => setSelectedPatId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.diagnostico})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Tipo de Documento</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                >
                  <option value="Parecer Clínico para Neuropediatra">Parecer Clínico para Neuropediatra (Médico)</option>
                  <option value="Diretrizes de Adaptação Curricular Escolar">Diretrizes de Adaptação Curricular (Escola)</option>
                  <option value="Relatório de Evolução Psicopedagógica">Relatório Clínico de Evolução Terapêutica</option>
                </select>
              </div>

              {/* Focos de Atenção Multi-selector */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">1. Focos e Sinais de Atenção</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {focosOptionList.map((f, i) => (
                    <label key={i} className="flex gap-2 items-start bg-slate-50 hover:bg-slate-100/50 p-2 rounded-lg border border-slate-100 cursor-pointer text-[11px] font-medium text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={focosAtencao.includes(f)}
                        onChange={() => toggleCheck(focosAtencao, setFocosAtencao, f)}
                        className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3.5 w-3.5 mt-0.5 cursor-pointer"
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Adaptações Multi-selector */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">2. Adaptações Recomendadas</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {adaptacoesOptionList.map((a, i) => (
                    <label key={i} className="flex gap-2 items-start bg-slate-50 hover:bg-slate-100/50 p-2 rounded-lg border border-slate-100 cursor-pointer text-[11px] font-medium text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={adaptacoesRecomendadas.includes(a)}
                        onChange={() => toggleCheck(adaptacoesRecomendadas, setAdaptacoesRecomendadas, a)}
                        className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3.5 w-3.5 mt-0.5 cursor-pointer"
                      />
                      <span>{a}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Condutas Multi-selector */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">3. Condutas Clínicas Sugeridas</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {condutasOptionList.map((c, i) => (
                    <label key={i} className="flex gap-2 items-start bg-slate-50 hover:bg-slate-100/50 p-2 rounded-lg border border-slate-100 cursor-pointer text-[11px] font-medium text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={condutasPropostas.includes(c)}
                        onChange={() => toggleCheck(condutasPropostas, setCondutasPropostas, c)}
                        className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3.5 w-3.5 mt-0.5 cursor-pointer"
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Text override area */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">4. Observações Clínicas Adicionais (Opcional)</label>
                <textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all"
                  placeholder="Ex: Aluno apresentou ótimo ganho em contato visual na última quinzena..."
                />
              </div>

              <button
                onClick={handleGenerateReportInstant}
                disabled={isGenerating}
                className="w-full py-4 bg-[#1070ca] hover:bg-[#0b5194] text-white font-black uppercase text-xs tracking-wider rounded-full transition-all duration-300 shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300/10" />}
                Compilar Documento Instantâneo
              </button>
            </div>
          </div>

          {/* Historical Reports Archive List */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-display font-black text-xs text-slate-400 uppercase tracking-wider">Laudos Anteriores Salvos</h3>
            
            <div className="space-y-2">
              {reportsArchive.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => setGeneratedContent(rep.conteudo)}
                  className="p-3 bg-slate-50/70 hover:bg-blue-50/30 border border-slate-100 rounded-2xl transition text-left cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">{rep.titulo}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">Paciente: {rep.patientNome}</p>
                    <span className="text-[9px] font-mono font-bold text-slate-400 mt-1 block">Compilado: {rep.dataGeracao}</span>
                  </div>
                  <span className="text-lg">📄</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Immersive Clinical preview block */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-4xl border border-slate-100 shadow-xl p-6 sm:p-8 min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            {/* Visual seal of clinical approval */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#1070ca]" />

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="font-display font-black text-slate-900 text-sm">Espaço Aprender a Ser</h4>
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Papel Timbrado Oficial de Prontuário</p>
                </div>
                {generatedContent && (
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer border border-slate-200/50"
                    >
                      <Printer className="h-4 w-4 text-[#1070ca]" /> Imprimir / PDF
                    </button>
                    {canCreate && (
                      <button
                        onClick={handleSaveToArchive}
                        className="px-4 py-2 bg-slate-950 hover:bg-[#d43f72] text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-slate-950/10"
                      >
                        <Save className="h-4 w-4" /> Arquivar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isGenerating ? (
                <div className="py-24 text-center space-y-4">
                  <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#1070ca] border-r-transparent" />
                  <p className="text-sm font-bold text-slate-900">Compilando parâmetros e regras...</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Reestruturando diretrizes de acordo com a LGPD e parâmetros médicos do paciente.</p>
                </div>
              ) : generatedContent ? (
                <div className="space-y-6">
                  {/* Real paper simulation container */}
                  <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl max-h-[500px] overflow-y-auto font-sans text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap select-text">
                    {generatedContent}
                  </div>

                  {/* Sign-off Block */}
                  <div className="border-t border-slate-100 pt-6 text-center max-w-xs mx-auto space-y-1 select-none">
                    <div className="h-px bg-slate-200 w-full mb-1.5" />
                    <p className="text-xs font-black text-slate-900">Francine Maria Tersi</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Psicopedagoga, Neuropsicopedagoga e Terapeuta ABA</p>
                    <p className="text-[9px] text-[#ebb448] font-mono font-black uppercase">Clínica Multidisciplinar Integrada • Tatuí-SP</p>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-slate-400 space-y-3">
                  <p className="text-sm font-black">Nenhum laudo ou parecer gerado.</p>
                  <p className="text-xs max-w-xs mx-auto">Selecione o paciente, escolha o tipo de relatório e selecione as opções ao lado para compilar e formatar instantaneamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
