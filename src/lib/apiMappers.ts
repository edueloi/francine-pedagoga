import {
  Patient,
  PatientStatus,
  Session,
  Insurance,
  SystemUser,
  AgendaEvent,
  AgendaItem,
  Protocol,
  PeiGoal,
  Activity,
  TimelineItem,
  AuditLog,
  Anamnese,
} from "../types";

function calculateAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function patientFromApi(row: any): Patient {
  return {
    id: String(row.id),
    nome: row.nome,
    dataNascimento: row.data_nascimento ?? "",
    idade: calculateAge(row.data_nascimento),
    foto: row.foto ?? undefined,
    responsavel: row.responsavel ?? "",
    responsavelParentesco: row.responsavel_parentesco ?? undefined,
    responsavelCpf: row.responsavel_cpf ?? undefined,
    responsavelFinanceiroNome: row.responsavel_financeiro_nome ?? undefined,
    responsavelFinanceiroCpf: row.responsavel_financeiro_cpf ?? undefined,
    responsavelFinanceiroTelefone: row.responsavel_financeiro_telefone ?? undefined,
    tipoPagamento: row.tipo_pagamento ?? undefined,
    convenioCarteirinha: row.convenio_carteirinha ?? undefined,
    convenioValidade: row.convenio_validade ?? undefined,
    telefone: row.telefone ?? "",
    escola: row.escola ?? "",
    anoSerie: row.ano_serie ?? "",
    professor: row.professor ?? "",
    coordenador: row.coordenador ?? "",
    medico: row.medico ?? "",
    diagnostico: row.diagnostico ?? "",
    cid: row.cid ?? "",
    convenio: row.convenio ?? "",
    medicamentos: row.medicamentos ?? "",
    historicoClinico: row.historico_clinico ?? "",
    documentos: (row.documentos ?? []).map((d: any) => ({
      id: String(d.id),
      nome: d.nome,
      dataUpload: d.data_upload,
    })),
    documentosPais: (row.documentos_pais ?? []).map((d: any) => ({
      id: String(d.id),
      nome: d.nome,
      dataUpload: d.data_upload,
    })),
    dataInicio: row.data_inicio ?? "",
    status: row.status as PatientStatus,
  };
}

export function sessionFromApi(row: any): Session {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    data: row.data,
    profissional: row.profissional ?? "",
    tempoSessao: row.tempo_sessao ?? 50,
    chegadaRegulacao: row.chegada_regulacao ?? "",
    comunicacao: row.comunicacao ?? "",
    brincar: row.brincar ?? "",
    atividadePapel: row.atividade_papel ?? "",
    flexibilidadeCognitiva: row.flexibilidade_cognitiva ?? "",
    transicaoAtividades: row.transicao_atividades ?? "",
    comportamentosObservados: row.comportamentos_observados ?? "",
    habilidadesTrabalhadas: row.habilidades_trabalhadas ?? [],
    perfilSensorial: row.perfil_sensorial ?? "",
    reforcadores: row.reforcadores ?? [],
    nivelIndependencia: row.nivel_independencia ?? "Suporte Leve",
    observacoesClinicas: row.observacoes_clinicas ?? "",
    rawNotes: row.raw_notes ?? undefined,
    planoProximaSessao: row.plano_proxima_sessao ?? "",
  };
}

export function sessionToApi(session: Partial<Session>): Record<string, any> {
  return {
    patient_id: session.patientId,
    data: session.data,
    profissional: session.profissional ?? null,
    tempo_sessao: session.tempoSessao ?? 50,
    chegada_regulacao: session.chegadaRegulacao ?? null,
    comunicacao: session.comunicacao ?? null,
    brincar: session.brincar ?? null,
    atividade_papel: session.atividadePapel ?? null,
    flexibilidade_cognitiva: session.flexibilidadeCognitiva ?? null,
    transicao_atividades: session.transicaoAtividades ?? null,
    comportamentos_observados: session.comportamentosObservados ?? null,
    habilidades_trabalhadas: JSON.stringify(session.habilidadesTrabalhadas ?? []),
    perfil_sensorial: session.perfilSensorial ?? null,
    reforcadores: JSON.stringify(session.reforcadores ?? []),
    nivel_independencia: session.nivelIndependencia ?? "Suporte Leve",
    observacoes_clinicas: session.observacoesClinicas ?? null,
    raw_notes: session.rawNotes ?? null,
    plano_proxima_sessao: session.planoProximaSessao ?? null,
  };
}

export function insuranceFromApi(row: any): Insurance {
  return {
    id: String(row.id),
    patientId: row.patient_id != null ? String(row.patient_id) : undefined,
    nome: row.nome,
    numeroGuia: row.numero_guia ?? "",
    sessoesAutorizadas: row.sessoes_autorizadas ?? 0,
    sessoesUtilizadas: row.sessoes_utilizadas ?? 0,
    validade: row.validade ?? "",
    documentosAnexados: (row.documentos_anexados ?? []).map((d: any) => ({
      id: String(d.id),
      nome: d.nome,
    })),
    relatoriosObrigatorios: row.relatorios_obrigatorios ?? [],
  };
}

export function insuranceToApi(insurance: Partial<Insurance>): Record<string, any> {
  return {
    patient_id: insurance.patientId ?? null,
    nome: insurance.nome,
    numero_guia: insurance.numeroGuia ?? null,
    sessoes_autorizadas: insurance.sessoesAutorizadas ?? 0,
    sessoes_utilizadas: insurance.sessoesUtilizadas ?? 0,
    validade: insurance.validade || null,
    relatorios_obrigatorios: JSON.stringify(insurance.relatoriosObrigatorios ?? []),
  };
}

export function systemUserFromApi(row: any): SystemUser {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role as SystemUser["role"],
    status: row.active ? "Ativo" : "Inativo",
  };
}

function toIsoDateTime(value: any): string {
  if (!value) return "";
  // MySQL DATETIME comes back as "YYYY-MM-DD HH:MM:SS" or as a Date object depending on driver config.
  if (value instanceof Date) return value.toISOString();
  const str = String(value);
  return str.includes("T") ? str : str.replace(" ", "T");
}

export function agendaEventFromApi(row: any): AgendaEvent {
  return {
    id: String(row.id),
    title: row.title,
    patientId: row.patient_id != null ? String(row.patient_id) : undefined,
    start: toIsoDateTime(row.start_time),
    end: toIsoDateTime(row.end_time),
    tipo: row.tipo,
    status: row.status,
    alertas: row.alertas ?? undefined,
    insuranceId: row.insurance_id != null ? String(row.insurance_id) : undefined,
  };
}

export function agendaEventToApi(event: Partial<AgendaEvent>): Record<string, any> {
  return {
    title: event.title,
    patient_id: event.patientId ?? null,
    start_time: event.start ? event.start.replace("T", " ").slice(0, 19) : null,
    end_time: event.end ? event.end.replace("T", " ").slice(0, 19) : null,
    tipo: event.tipo ?? "Sessão",
    status: event.status ?? "pendente",
    alertas: event.alertas ?? null,
    insurance_id: event.insuranceId ?? null,
  };
}

// AgendaItem = weekly recurring slot (agenda_weekly_slots table).
// The table only stores patient_id — patientNome must be resolved client-side
// from the already-loaded usePatients() list.
export function agendaWeeklySlotFromApi(row: any, patientNome: string = ""): AgendaItem {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    patientNome,
    diaSemana: row.dia_semana,
    horario: row.horario,
    tipoAtendimento: row.tipo_atendimento,
    profissional: row.profissional ?? "",
  };
}

export function agendaWeeklySlotToApi(slot: Partial<AgendaItem>): Record<string, any> {
  return {
    patient_id: slot.patientId,
    dia_semana: slot.diaSemana,
    horario: slot.horario,
    tipo_atendimento: slot.tipoAtendimento,
    profissional: slot.profissional ?? null,
  };
}

export function protocolFromApi(row: any): Protocol {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    tipo: row.tipo,
    dataPreenchimento: row.data_preenchimento ?? "",
    profissional: row.profissional ?? "",
    conteudo: row.conteudo ?? {},
    observacoes: row.observacoes ?? "",
  };
}

export function protocolToApi(protocol: Partial<Protocol>): Record<string, any> {
  return {
    patient_id: protocol.patientId,
    tipo: protocol.tipo,
    data_preenchimento: protocol.dataPreenchimento || null,
    profissional: protocol.profissional ?? null,
    conteudo: JSON.stringify(protocol.conteudo ?? {}),
    observacoes: protocol.observacoes ?? null,
  };
}

export function peiGoalFromApi(row: any): PeiGoal {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    dominio: row.dominio,
    meta: row.meta ?? "",
    suporteRequerido: row.suporte_requerido ?? "",
    criterioAquisicao: row.criterio_aquisicao ?? "",
    status: row.status,
    dataRevisao: row.data_revisao ?? "",
  };
}

export function peiGoalToApi(goal: Partial<PeiGoal>): Record<string, any> {
  return {
    patient_id: goal.patientId,
    dominio: goal.dominio,
    meta: goal.meta,
    suporte_requerido: goal.suporteRequerido ?? null,
    criterio_aquisicao: goal.criterioAquisicao ?? null,
    status: goal.status ?? "Não Iniciado",
    data_revisao: goal.dataRevisao || null,
  };
}

export function activityFromApi(row: any): Activity {
  return {
    id: String(row.id),
    nome: row.nome,
    objetivo: row.objetivo ?? "",
    faixaEtaria: row.faixa_etaria ?? "",
    diagnosticoIndicado: row.diagnostico_indicado ?? [],
    habilidadeDesenvolvida: row.habilidade_desenvolvida ?? "",
    tempoEstimado: row.tempo_estimado ?? "",
    materiaisNecessarios: row.materiais_necessarios ?? [],
    instrucoes: row.instrucoes ?? "",
    observacoes: row.observacoes ?? "",
    nivelDificuldade: row.nivel_dificuldade ?? "Médio",
    categoria: row.categoria ?? "",
  };
}

export function activityToApi(activity: Partial<Activity>): Record<string, any> {
  return {
    nome: activity.nome,
    objetivo: activity.objetivo ?? null,
    faixa_etaria: activity.faixaEtaria ?? null,
    diagnostico_indicado: JSON.stringify(activity.diagnosticoIndicado ?? []),
    habilidade_desenvolvida: activity.habilidadeDesenvolvida ?? null,
    tempo_estimado: activity.tempoEstimado ?? null,
    materiais_necessarios: JSON.stringify(activity.materiaisNecessarios ?? []),
    instrucoes: activity.instrucoes ?? null,
    observacoes: activity.observacoes ?? null,
    nivel_dificuldade: activity.nivelDificuldade ?? "Médio",
    categoria: activity.categoria ?? null,
  };
}

export function timelineItemFromApi(row: any): TimelineItem {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    data: toIsoDateTime(row.data),
    tipo: row.tipo,
    titulo: row.titulo,
    descricao: row.descricao ?? "",
    profissional: row.profissional ?? "",
  };
}

export function timelineItemToApi(item: Partial<TimelineItem>): Record<string, any> {
  return {
    patient_id: item.patientId,
    data: item.data ? item.data.replace("T", " ").slice(0, 19) : null,
    tipo: item.tipo,
    titulo: item.titulo,
    descricao: item.descricao ?? null,
    profissional: item.profissional ?? null,
  };
}

export function auditLogFromApi(row: any): AuditLog {
  return {
    id: String(row.id),
    data: toIsoDateTime(row.created_at ?? row.data),
    usuario: row.usuario ?? "",
    perfil: row.perfil,
    acao: row.acao,
    detalhes: row.detalhes ?? "",
    ipSimulado: row.ip_simulado ?? "",
  };
}

export function auditLogToApi(log: Partial<AuditLog>): Record<string, any> {
  return {
    usuario: log.usuario ?? null,
    perfil: log.perfil ?? null,
    acao: log.acao,
    detalhes: log.detalhes ?? null,
    ip_simulado: log.ipSimulado ?? null,
  };
}

export function patientToApi(patient: Partial<Patient>): Record<string, any> {
  return {
    nome: patient.nome,
    data_nascimento: patient.dataNascimento || null,
    foto: patient.foto ?? null,
    responsavel: patient.responsavel ?? null,
    responsavel_parentesco: patient.responsavelParentesco ?? null,
    responsavel_cpf: patient.responsavelCpf ?? null,
    responsavel_financeiro_nome: patient.responsavelFinanceiroNome ?? null,
    responsavel_financeiro_cpf: patient.responsavelFinanceiroCpf ?? null,
    responsavel_financeiro_telefone: patient.responsavelFinanceiroTelefone ?? null,
    tipo_pagamento: patient.tipoPagamento ?? null,
    convenio_carteirinha: patient.convenioCarteirinha ?? null,
    convenio_validade: patient.convenioValidade || null,
    telefone: patient.telefone ?? null,
    escola: patient.escola ?? null,
    ano_serie: patient.anoSerie ?? null,
    professor: patient.professor ?? null,
    coordenador: patient.coordenador ?? null,
    medico: patient.medico ?? null,
    diagnostico: patient.diagnostico ?? null,
    cid: patient.cid ?? null,
    convenio: patient.convenio ?? null,
    medicamentos: patient.medicamentos ?? null,
    historico_clinico: patient.historicoClinico ?? null,
    data_inicio: patient.dataInicio || null,
    status: patient.status ?? "Ativo",
  };
}

export function anamneseFromApi(row: any): Anamnese {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    queixaPrincipal: row.queixa_principal ?? "",
    historiaGestacional: row.historia_gestacional ?? "",
    marcosDesenvolvimento: row.marcos_desenvolvimento ?? "",
    linguagem: row.linguagem ?? "",
    sono: row.sono ?? "",
    alimentacaoSeletividade: row.alimentacao_seletividade ?? "",
    controleEsfincteriano: row.controle_esfincteriano ?? "",
    historicoMedico: row.historico_medico ?? "",
    medicamentos: row.medicamentos ?? "",
    terapiasAtuais: row.terapias_atuais ?? "",
    comportamentoCasa: row.comportamento_casa ?? "",
    comportamentoEscola: row.comportamento_escola ?? "",
    interessesHiperfocos: row.interesses_hiperfocos ?? "",
    sensibilidadesSensoriais: row.sensibilidades_sensoriais ?? "",
    pontosFortes: row.pontos_fortes ?? "",
    principaisDificuldades: row.principais_dificuldades ?? "",
    objetivosFamilia: row.objetivos_familia ?? "",
  };
}

export function anamneseToApi(anamnese: Partial<Anamnese>): Record<string, any> {
  return {
    patient_id: anamnese.patientId,
    queixa_principal: anamnese.queixaPrincipal ?? null,
    historia_gestacional: anamnese.historiaGestacional ?? null,
    marcos_desenvolvimento: anamnese.marcosDesenvolvimento ?? null,
    linguagem: anamnese.linguagem ?? null,
    sono: anamnese.sono ?? null,
    alimentacao_seletividade: anamnese.alimentacaoSeletividade ?? null,
    controle_esfincteriano: anamnese.controleEsfincteriano ?? null,
    historico_medico: anamnese.historicoMedico ?? null,
    medicamentos: anamnese.medicamentos ?? null,
    terapias_atuais: anamnese.terapiasAtuais ?? null,
    comportamento_casa: anamnese.comportamentoCasa ?? null,
    comportamento_escola: anamnese.comportamentoEscola ?? null,
    interesses_hiperfocos: anamnese.interessesHiperfocos ?? null,
    sensibilidades_sensoriais: anamnese.sensibilidadesSensoriais ?? null,
    pontos_fortes: anamnese.pontosFortes ?? null,
    principais_dificuldades: anamnese.principaisDificuldades ?? null,
    objetivos_familia: anamnese.objetivosFamilia ?? null,
  };
}
