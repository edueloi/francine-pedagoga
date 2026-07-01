export enum UserRole {
  ADMIN = "Administrador",
  PROFESSIONAL = "Profissional",
  SECRETARY = "Secretária",
  RESTRICTED = "Visualização restrita",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum PatientStatus {
  ACTIVE = "Ativo",
  PAUSED = "Pausado",
  CLOSED = "Encerrado",
}

export interface Patient {
  id: string;
  nome: string;
  dataNascimento: string;
  idade: number; // calculated automatically
  foto?: string; // color or initials or image emoji
  responsavel: string;
  responsavelParentesco?: string;
  responsavelCpf?: string;
  responsavelFinanceiroNome?: string;
  responsavelFinanceiroCpf?: string;
  responsavelFinanceiroTelefone?: string;
  tipoPagamento?: "Particular" | "Convênio";
  convenioCarteirinha?: string;
  convenioValidade?: string;
  telefone: string;
  escola: string;
  anoSerie: string;
  professor: string;
  coordenador: string;
  medico: string;
  diagnostico: string;
  cid: string;
  convenio: string;
  medicamentos: string;
  historicoClinico: string;
  documentos: Array<{ id: string; nome: string; dataUpload: string }>;
  documentosPais?: Array<{ id: string; nome: string; dataUpload: string }>;
  dataInicio: string;
  status: PatientStatus;
}

export interface Anamnese {
  patientId: string;
  queixaPrincipal: string;
  historiaGestacional: string;
  marcosDesenvolvimento: string;
  linguagem: string;
  sono: string;
  alimentacaoSeletividade: string;
  controleEsfincteriano: string;
  historicoMedico: string;
  medicamentos: string;
  terapiasAtuais: string;
  comportamentoCasa: string;
  comportamentoEscola: string;
  interessesHiperfocos: string;
  sensibilidadesSensoriais: string;
  pontosFortes: string;
  principaisDificuldades: string;
  objetivosFamilia: string;
}

export enum ProtocolType {
  A = "Protocolo de Desenvolvimento Infantil (0-6 anos)",
  B = "Observação Psicopedagógica (ABA)",
  C = "Regulação Inicial (ISL/Snoezelen)",
  D = "Evolução Terapêutica",
  E = "Resumo Mensal",
}

export interface Protocol {
  id: string;
  patientId: string;
  tipo: ProtocolType;
  dataPreenchimento: string;
  profissional: string;
  conteudo: Record<string, any>; // stores specific form states
  observacoes: string;
}

export interface Session {
  id: string;
  patientId: string;
  data: string;
  profissional: string;
  tempoSessao: number; // in minutes
  chegadaRegulacao: string;
  comunicacao: string;
  brincar: string;
  atividadePapel: string;
  flexibilidadeCognitiva: string;
  transicaoAtividades: string;
  comportamentosObservados: string;
  habilidadesTrabalhadas: string[];
  perfilSensorial: string;
  reforcadores: string[];
  nivelIndependencia: "Totalmente Independente" | "Suporte Leve" | "Suporte Moderado" | "Suporte Intenso";
  observacoesClinicas: string;
  rawNotes?: string; // informal notes used for AI formatting
  planoProximaSessao: string;
}

export interface Activity {
  id: string;
  nome: string;
  objetivo: string;
  faixaEtaria: string;
  diagnosticoIndicado: string[];
  habilidadeDesenvolvida: string;
  tempoEstimado: string;
  materiaisNecessarios: string[];
  instrucoes: string;
  observacoes: string;
  nivelDificuldade: "Fácil" | "Médio" | "Difícil";
  categoria: string;
}

export interface Insurance {
  id: string;
  patientId?: string;
  patientNome?: string;
  nome: string;
  numeroGuia: string;
  sessoesAutorizadas: number;
  sessoesUtilizadas: number;
  validade: string;
  documentosAnexados?: Array<{ id: string; nome: string }>;
  relatoriosObrigatorios?: string[];
}

export interface TimelineItem {
  id: string;
  patientId: string;
  data: string;
  tipo: "Avaliação" | "Sessão" | "Protocolo" | "Relatório" | "PEI" | "Visita Escolar" | "Reunião de Família" | "Encaminhamento" | "Documento";
  titulo: string;
  descricao: string;
  profissional: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  patientId?: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  tipo: "Sessão" | "Avaliação" | "Reunião" | "Visita Escolar" | "Retorno";
  status: "confirmado" | "pendente" | "cancelado" | "realizado";
  alertas?: string;
}

export interface AuditLog {
  id: string;
  data: string;
  usuario: string;
  perfil: UserRole;
  acao: string;
  detalhes: string;
  ipSimulado: string;
}

// PEI Goal Tracking Models
export enum GoalDomain {
  COMMUNICATION = "Comunicação / Linguagem",
  ACADEMIC = "Habilidades Acadêmicas",
  AVD = "Autonomia / AVD",
  COGNITIVE = "Cognitivo / Motor"
}

export enum GoalStatus {
  NOT_STARTED = "Não Iniciado",
  IN_PROGRESS = "Em Progresso",
  ACQUIRED = "Adquirido",
  GENERALIZED = "Generalizado"
}

export interface PeiGoal {
  id: string;
  patientId: string;
  dominio: GoalDomain;
  meta: string;
  suporteRequerido: string;
  criterioAquisicao: string;
  status: GoalStatus;
  dataRevisao: string;
}

export interface AgendaItem {
  id: string;
  patientId: string;
  patientNome: string;
  diaSemana: string;
  horario: string;
  tipoAtendimento: "Plano de Tratamento ABA" | "Avaliação Psicopedagógica" | "Triagem Sensorial Snoezelen" | "Reunião Escolar Técnica";
  profissional: string;
}

export type ActivityCard = Activity;

export interface ModulePermission {
  ler: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}

export interface UserPermissions {
  patients: ModulePermission;
  sessions: ModulePermission;
  pei: ModulePermission;
  protocols: ModulePermission;
  schoolFamily: ModulePermission;
  agenda: ModulePermission;
  insurances: ModulePermission;
  reports: ModulePermission;
  logs: ModulePermission;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions?: UserPermissions;
  status: "Ativo" | "Inativo";
  desc?: string;
}


