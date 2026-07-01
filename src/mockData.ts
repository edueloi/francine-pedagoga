import { Patient, PatientStatus, Anamnese, Session, Activity, Insurance, TimelineItem, AgendaEvent, AuditLog, Protocol, ProtocolType, UserRole } from "./types";

// Initial Patients List with diverse diagnoses, schools, and conditions
export const initialPatients: Patient[] = [
  {
    id: "pat-1",
    nome: "Lucas Silva de Oliveira",
    dataNascimento: "2021-04-12", // 5 years old (as of 2026)
    idade: 5,
    responsavel: "Mariana Silva de Oliveira",
    responsavelParentesco: "Mãe",
    responsavelCpf: "223.445.667-89",
    responsavelFinanceiroNome: "Mariana Silva de Oliveira",
    responsavelFinanceiroCpf: "223.445.667-89",
    responsavelFinanceiroTelefone: "(11) 98877-6655",
    tipoPagamento: "Convênio",
    convenioCarteirinha: "00129883748293-A",
    convenioValidade: "2028-12-31",
    telefone: "(11) 98877-6655",
    escola: "Colégio Integração Infantil",
    anoSerie: "Pré-II",
    professor: "Letícia Neves",
    coordenador: "Sandra Mara",
    medico: "Roberto Albuquerque (Neuropediatra)",
    diagnostico: "Transtorno do Espectro Autista (TEA)",
    cid: "F84.0",
    convenio: "Unimed Pleno",
    medicamentos: "Risperidona 0.5mg à noite",
    historicoClinico: "Gestação a termo sem intercorrências. Atraso na aquisição de fala observado aos 18 meses. Iniciou terapias aos 2 anos. Apresenta seletividade alimentar severa para texturas pastosas e hiperfoco em dinossauros.",
    documentos: [
      { id: "doc-1", nome: "Laudo_Neuropediatrico_Lucas.pdf", dataUpload: "2025-02-15" },
      { id: "doc-2", nome: "Relatorio_Escolar_2025.pdf", dataUpload: "2025-11-10" }
    ],
    documentosPais: [
      { id: "docp-1", nome: "RG_Mae_Mariana.pdf", dataUpload: "2025-01-20" },
      { id: "docp-2", nome: "Comprovante_Residencia.pdf", dataUpload: "2025-01-20" }
    ],
    dataInicio: "2025-01-20",
    status: PatientStatus.ACTIVE,
  },
  {
    id: "pat-2",
    nome: "Arthur Medeiros Guimarães",
    dataNascimento: "2019-08-25", // 6 years old (turning 7)
    idade: 6,
    responsavel: "Carlos Eduardo Guimarães",
    responsavelParentesco: "Pai",
    responsavelCpf: "112.334.556-78",
    responsavelFinanceiroNome: "Carlos Eduardo Guimarães",
    responsavelFinanceiroCpf: "112.334.556-78",
    responsavelFinanceiroTelefone: "(11) 97766-5544",
    tipoPagamento: "Convênio",
    convenioCarteirinha: "98273648210382-Y",
    convenioValidade: "2027-06-30",
    telefone: "(11) 97766-5544",
    escola: "Escola Estadual Castro Alves",
    anoSerie: "1º Ano Ensino Fundamental",
    professor: "Renata Abreu",
    coordenador: "Cristina Reis",
    medico: "Heloísa Spínola (Pediatra)",
    diagnostico: "Transtorno do Déficit de Atenção com Hiperatividade (TDAH)",
    cid: "F90.0",
    convenio: "Amil Blue 300",
    medicamentos: "Ritalina LA 10mg pela manhã",
    historicoClinico: "Parto cesárea com 38 semanas. Desenvolvimento motor típico. Queixa principal de agitação motora extrema em sala de aula, dificuldade de alfabetização e de sustentar atenção compartilhada.",
    documentos: [
      { id: "doc-3", nome: "Avaliacao_Neuropsicologica_Arthur.pdf", dataUpload: "2025-08-01" }
    ],
    documentosPais: [
      { id: "docp-3", nome: "CNH_Pai_Carlos.pdf", dataUpload: "2025-09-02" }
    ],
    dataInicio: "2025-09-02",
    status: PatientStatus.ACTIVE,
  },
  {
    id: "pat-3",
    nome: "Beatriz Costa Rezende",
    dataNascimento: "2022-01-30", // 4 years old
    idade: 4,
    responsavel: "Patrícia Costa",
    responsavelParentesco: "Mãe",
    responsavelCpf: "334.556.778-90",
    responsavelFinanceiroNome: "Julio de Rezende (Pai)",
    responsavelFinanceiroCpf: "445.667.889-01",
    responsavelFinanceiroTelefone: "(11) 96655-1122",
    tipoPagamento: "Convênio",
    convenioCarteirinha: "827364810293",
    convenioValidade: "2029-01-01",
    telefone: "(11) 96655-4433",
    escola: "Emeb Esperança do Amanhã",
    anoSerie: "Maternal II",
    professor: "Bruna Dias",
    coordenador: "Márcia Mendes",
    medico: "Júlio César (Psiquiatra Infantil)",
    diagnostico: "Atraso Global do Desenvolvimento",
    cid: "F82",
    convenio: "SulAmérica Especial",
    medicamentos: "Nenhum",
    historicoClinico: "Nascimento prematuro de 34 semanas, permaneceu 10 dias em UTI neonatal. Atraso no marco de marcha (andou com 1 ano e 10 meses). Apresenta ecolalia e crises frequentes de choro na transição de rotina.",
    documentos: [
      { id: "doc-4", nome: "Exame_Bera_Beatriz.pdf", dataUpload: "2024-12-05" }
    ],
    documentosPais: [
      { id: "docp-4", nome: "Termo_Guarda_Patricia.pdf", dataUpload: "2025-02-10" }
    ],
    dataInicio: "2025-02-10",
    status: PatientStatus.ACTIVE,
  },
  {
    id: "pat-4",
    nome: "Davi Oliveira Santos",
    dataNascimento: "2020-11-05", // 5 years old
    idade: 5,
    responsavel: "Gisele Oliveira",
    responsavelParentesco: "Mãe",
    responsavelCpf: "556.778.990-12",
    responsavelFinanceiroNome: "Gisele Oliveira",
    responsavelFinanceiroCpf: "556.778.990-12",
    responsavelFinanceiroTelefone: "(11) 95544-3322",
    tipoPagamento: "Convênio",
    convenioCarteirinha: "419283749281726",
    convenioValidade: "2029-05-15",
    telefone: "(11) 95544-3322",
    escola: "Colégio Objetivo Sul",
    anoSerie: "Pré-I",
    professor: "Cláudia Souza",
    coordenador: "Regina Toledo",
    medico: "Roberto Albuquerque (Neuropediatra)",
    diagnostico: "Transtorno do Espectro Autista (TEA) + Seletividade Alimentar",
    cid: "F84.0",
    convenio: "Bradesco Saúde Preferencial",
    medicamentos: "Nenhum",
    historicoClinico: "Nascimento sem intercorrências. Apresenta ecolalia tardia, movimentos estereotipados (flapping) e hipersensibilidade auditiva a ruídos como liquidificador e secador. Dificuldade severa em linguagem funcional e recusa alimentar sistemática de frutas e vegetais.",
    documentos: [],
    documentosPais: [],
    dataInicio: "2026-03-01",
    status: PatientStatus.ACTIVE,
  },
  {
    id: "pat-5",
    nome: "Sophia Reis Guaraná",
    dataNascimento: "2018-02-14", // 8 years old
    idade: 8,
    responsavel: "Vivian Reis Guaraná",
    responsavelParentesco: "Mãe",
    responsavelCpf: "778.990.112-34",
    responsavelFinanceiroNome: "Vivian Reis Guaraná",
    responsavelFinanceiroCpf: "778.990.112-34",
    responsavelFinanceiroTelefone: "(11) 94433-2211",
    tipoPagamento: "Particular",
    convenioCarteirinha: "",
    convenioValidade: "",
    telefone: "(11) 94433-2211",
    escola: "Colégio Ideal Metropolitano",
    anoSerie: "3º Ano Ensino Fundamental",
    professor: "Marcos Lima",
    coordenador: "Silvana Antunes",
    medico: "Carolina Castro (Fonoaudióloga/Neurologista)",
    diagnostico: "Dislexia do Desenvolvimento",
    cid: "F81.0",
    convenio: "Particular",
    medicamentos: "Nenhum",
    historicoClinico: "Desenvolvimento psicomotor típico. Iniciou com dificuldade extrema na escrita e leitura no final do 1º ano. Confunde fonemas surdos e sonoros (F/V, P/B). Excelente inteligência prática e raciocínio lógico-matemático.",
    documentos: [
      { id: "doc-5", nome: "Laudo_Fonoaudiologico_Sophia.pdf", dataUpload: "2025-10-22" }
    ],
    documentosPais: [
      { id: "docp-5", nome: "RG_Vivian_Responsavel.pdf", dataUpload: "2025-10-15" }
    ],
    dataInicio: "2025-10-15",
    status: PatientStatus.ACTIVE,
  },
  {
    id: "pat-6",
    nome: "Enzo Gabriel Ferreira",
    dataNascimento: "2020-03-18", // 6 years old
    idade: 6,
    responsavel: "Juliana Ferreira",
    responsavelParentesco: "Mãe",
    responsavelCpf: "889.001.223-45",
    responsavelFinanceiroNome: "Juliana Ferreira",
    responsavelFinanceiroCpf: "889.001.223-45",
    responsavelFinanceiroTelefone: "(11) 93322-1100",
    tipoPagamento: "Convênio",
    convenioCarteirinha: "1029384756",
    convenioValidade: "2028-10-10",
    telefone: "(11) 93322-1100",
    escola: "Escola Novo Espaço",
    anoSerie: "Pré-II",
    professor: "Aline Santos",
    coordenador: "Beatriz Mello",
    medico: "Luiz Gustavo (Neuropediatra)",
    diagnostico: "Transtorno do Espectro Autista (TEA)",
    cid: "F84.0",
    convenio: "Amil Blue 300",
    medicamentos: "Aripiprazol 2mg pela manhã",
    historicoClinico: "Encaminhado pela escola por comportamentos autoestimulatórios e isolamento social. Gosta de brincar girando as rodas dos brinquedos. Responde positivamente a rotina visual.",
    documentos: [],
    documentosPais: [],
    dataInicio: "2025-05-12",
    status: PatientStatus.PAUSED,
  }
];

// Initial Anamnesis List
export const initialAnamneses: Anamnese[] = [
  {
    patientId: "pat-1",
    queixaPrincipal: "Atraso no desenvolvimento da fala, dificuldade extrema de socialização na escola e recusa alimentar de alimentos sólidos/pastosos.",
    historiaGestacional: "Gestação de risco moderado devido à pressão alta da mãe no terceiro trimestre. Parto cesárea com 39 semanas, peso de 3.200g, APGAR 9/10.",
    marcosDesenvolvimento: "Sustentou pescoço com 3 meses, sentou sem apoio com 6 meses, engatinhou com 10 meses. Marcha alcançada aos 13 meses.",
    linguagem: "Dificuldade na produção de frases. Comunica-se apontando e utilizando poucas palavras isoladas. Presença de ecolalia imediata.",
    sono: "Sono agitado. Costuma acordar 1 a 2 vezes por noite e demora a adormecer.",
    alimentacaoSeletividade: "Seletividade alimentar acentuada. Só consome alimentos secos e crocantes (biscoitos de polvilho, batata frita, nuggets de frango). Rejeita frutas e legumes.",
    controleEsfincteriano: "Desfralde diurno concluído aos 4 anos após muito esforço. Mantém fralda noturna.",
    historicoMedico: "Otites recorrentes no primeiro ano de vida tratadas com antibiótico. Nenhuma cirurgia realizada.",
    medicamentos: "Risperidona 0.5mg à noite.",
    terapiasAtuais: "Fonoaudiologia (1x/semana), Psicologia ABA (2x/semana).",
    comportamentoCasa: "Muito apegado à mãe. Apresenta crises de birra intensa quando contrariado ou quando a rotina muda bruscamente.",
    comportamentoEscola: "Isola-se no recreio. Não participa de brincadeiras de faz de conta com colegas. Prefere alinhar objetos.",
    interessesHiperfocos: "Foco intenso em dinossauros. Memoriza espécies e nomes complexos.",
    sensibilidadesSensoriais: "Hipersensibilidade auditiva (tapa os ouvidos com barulhos de liquidificador ou fogos de artifício). Hipersensibilidade tátil a sujeira ou texturas úmidas.",
    pontosFortes: "Excelente memória visual, habilidade para montagem de quebra-cabeças complexos, carinhoso na relação de um para um.",
    principaisDificuldades: "Comunicação verbal funcional, seletividade alimentar, flexibilidade mental e controle da frustração.",
    objetivosFamilia: "Que ele consiga pedir o que quer verbalmente, melhore a variedade alimentar e reduza as crises de birra."
  },
  {
    patientId: "pat-2",
    queixaPrincipal: "Não para quieto na cadeira, dispersa-se muito facilmente nas explicações e apresenta atraso na alfabetização.",
    historiaGestacional: "Gestação planejada, sem intercorrências físicas. Parto normal de 40 semanas, APGAR 10/10.",
    marcosDesenvolvimento: "Sentou com 6 meses, andou com 11 meses (sempre muito ativo).",
    linguagem: "Fala de forma rápida, emenda um assunto no outro, às vezes atropela as palavras.",
    sono: "Dificuldade extrema para desacelerar e dormir. Dorme em média 8 horas.",
    alimentacaoSeletividade: "Sem restrições alimentares relevantes. Alimenta-se rápido e com desatenção.",
    controleEsfincteriano: "Adquirido na época típica (2 anos e meio).",
    historicoMedico: "Fratura de braço esquerdo aos 5 anos decorrente de queda em parquinho.",
    medicamentos: "Ritalina LA 10mg pela manhã.",
    terapiasAtuais: "Psicopedagogia (1x/semana, atual).",
    comportamentoCasa: "Deixa brinquedos espalhados por todos os cômodos. Requer comando repetido para realizar tarefas simples.",
    comportamentoEscola: "Conversa excessivamente na aula. Levanta-se com frequência para apontar lápis ou beber água. Esquece materiais.",
    interessesHiperfocos: "Vídeo games, carros de corrida e blocos de montar (Lego).",
    sensibilidadesSensoriais: "Busca sensorial por movimento constante (balanço, corrida). Sem hipersensibilidades diagnosticadas.",
    pontosFortes: "Extremamente sociável, criativo, excelente argumentação verbal, ágil na resolução de problemas práticos.",
    principaisDificuldades: "Sustentação da atenção, organização temporal/material, controle inibitório (esperar sua vez) e escrita/leitura.",
    objetivosFamilia: "Desenvolver autonomia na realização de tarefas escolares, conseguir focar mais tempo e avançar na alfabetização."
  }
];

// Initial Session Logs (Evoluções)
export const initialSessions: Session[] = [
  {
    id: "sess-1",
    patientId: "pat-1",
    data: "2026-06-25",
    profissional: "Francine Maria Tersi",
    tempoSessao: 50,
    chegadaRegulacao: "Lucas chegou ansioso, com choro leve na despedida da mãe. Utilizou-se 8 minutos de regulação sensorial na sala de Snoezelen com luzes azuis e massagem compressiva profunda nos ombros para regulação inicial.",
    comunicacao: "Demonstrou intenção comunicativa por meio de gestos e emissão de fonemas isolados ('qué' para querer brinquedo de dinossauro). Foi estimulado o ecoico.",
    brincar: "Engajou no brincar funcional de dinossauros, realizando imitação de sons e ações propostas pela terapeuta.",
    atividadePapel: "Realizou pareamento visual de letras do próprio nome (L-U-C-A-S) com reforçamento de fichas baseadas em ABA. Completou a tarefa em 12 minutos.",
    flexibilidadeCognitiva: "Apresentou resistência moderada quando um dinossauro azul foi substituído por um dinossauro verde. Com mediação verbal e antecipação visual, aceitou a troca após 2 minutos.",
    transicaoAtividades: "Transição tranquila da sala Snoezelen para a mesa de trabalho utilizando cronômetro visual.",
    comportamentosObservados: "Presença de movimentos estereotipados de mãos (flapping) quando muito entusiasmado. Sem comportamentos disruptivos graves.",
    habilidadesTrabalhadas: ["Pareamento de Letras", "Imitação Motora", "Ecoico / Vocalização Funcional", "Autorregulação", "Contato Visual"],
    perfilSensorial: "Busca por pressão tátil profunda; hipersensibilidade auditiva a ruídos ambientais súbitos.",
    reforcadores: ["Dinossauro T-Rex de borracha", "Luzes de fibra óptica azul", "Elogio social entusiasmado"],
    nivelIndependencia: "Suporte Leve",
    observacoesClinicas: "Sessão altamente produtiva. A regulação tátil profunda de início de sessão mostrou-se crucial para manter a atenção compartilhada nas atividades de mesa subsequentes.",
    rawNotes: "Lucas chegou ansioso, precisou de 8 minutos para regular na sala Snoezelen com as luzes. Trabalhei pareamento das letras do nome e imitação com dinossauros. Reclamou de trocar o brinquedo mas aceitou bem depois do timer.",
    planoProximaSessao: "Introduzir pareamento silábico elementar e treinar a vocalização funcional de duas sílabas ('abre', 'quero')."
  },
  {
    id: "sess-2",
    patientId: "pat-2",
    data: "2026-06-24",
    profissional: "Francine Maria Tersi",
    tempoSessao: 50,
    chegadaRegulacao: "Arthur chegou entusiasmado e regulado, relatando novidades da escola de forma muito rápida. Regulou em 2 minutos na conversa inicial.",
    comunicacao: "Comunicação verbal fluida e adequada. Apresentou dificuldade apenas em respeitar o turno de fala, interrompendo a profissional.",
    brincar: "Realizou jogo de tabuleiro estruturado (tabuleiro das cores e letras). Respeitou a maioria das regras básicas de revezamento.",
    atividadePapel: "Tarefa de consciência fonológica (identificar sílaba inicial de figuras). Demonstrou cansaço e desatenção após 8 minutos de tarefa dirigida.",
    flexibilidadeCognitiva: "Lidou de forma adequada com a derrota no jogo de tabuleiro após mediação do comportamento de autoinstrução positiva.",
    transicaoAtividades: "Fácil transição entre atividades lúdicas e tarefas de mesa.",
    comportamentosObservados: "Inquietação física contínua (mexe os pés, balança a cadeira, manipula lápis). Necessita de redirecionamento atencional a cada 3 a 5 minutos.",
    habilidadesTrabalhadas: ["Consciência Fonológica", "Respeito de Turno", "Organização Temporal", "Controle Inibitório", "Tolerância à Frustração"],
    perfilSensorial: "Busca de propriocepção e vestibular (movimento contínuo).",
    reforcadores: ["Jogo de blocos de montar (Lego) ao final", "Tempo livre de desenho livre", "Ficha de estrelas acumulativa"],
    nivelIndependencia: "Suporte Moderado",
    observacoesClinicas: "O paciente responde muito bem a contratos de comportamento explícitos ('Primeiro fazemos 2 fichas de exercício de sílabas, depois montamos Lego'). A fadiga após 8-10 minutos de foco exige divisão da atividade em blocos menores com pausas motoras ativas.",
    rawNotes: "Arthur chegou elétrico falando da escola. Jogamos tabuleiro das cores, trabalhei sílabas mas ele desfocou rápido depois de 8 min de papel. Reclamou de perder mas acalmou rápido com combinados.",
    planoProximaSessao: "Segmentar tarefas de escrita em blocos de 5 minutos intercalados por 1 minuto de alongamento ou pausa motora."
  }
];

// Preset Activities Bank (Categorized)
export const initialActivities: Activity[] = [
  {
    id: "act-1",
    nome: "Sequência Rítmica com Blocos",
    objetivo: "Desenvolver memória de trabalho, atenção sustentada e controle inibitório.",
    faixaEtaria: "3 a 8 anos",
    diagnosticoIndicado: ["TDAH", "TEA", "Atraso do Desenvolvimento"],
    habilidadeDesenvolvida: "Memória de Trabalho / Sequenciamento",
    tempoEstimado: "15 minutos",
    materiaisNecessarios: ["Blocos de montar coloridos (Lego ou blocos de madeira)", "Cartões de sequência"],
    instrucoes: "A profissional monta uma sequência simples de blocos de cores (ex: Vermelho - Azul - Vermelho) e pede para a criança memorizar. Cobre os blocos com uma caixa por 5 segundos e solicita que a criança reproduza a mesma sequência de memória de trabalho. Aumente gradativamente o número de blocos.",
    observacoes: "Caso a criança tenha dificuldade em memória de trabalho, fornecer pistas de pareamento e comandos visuais.",
    nivelDificuldade: "Médio",
    categoria: "Memória"
  },
  {
    id: "act-2",
    nome: "Caça-Figuras de Consciência Fonológica",
    objetivo: "Treinar percepção de sílabas iniciais, correspondência grafema-fonema e escuta ativa.",
    faixaEtaria: "5 a 9 anos",
    diagnosticoIndicado: ["Dislexia", "TDAH", "Dificuldade de Leitura"],
    habilidadeDesenvolvida: "Consciência Fonológica e Alfabetização",
    tempoEstimado: "20 minutos",
    materiaisNecessarios: ["Fichas ilustradas de objetos diversos", "Quadro magnético ou velcro"],
    instrucoes: "Espalhe várias fichas de figuras sobre a mesa. Diga uma sílaba em voz alta (ex: 'BA') e peça que a criança 'caçe' todas as figuras que começam com essa sílaba (ex: Bala, Banana, Balão). Em seguida, monte a escrita das palavras no quadro.",
    observacoes: "Para crianças com dificuldades em leitura, utilize o som explícito de cada fonema e o apoio de gestos labiais.",
    nivelDificuldade: "Médio",
    categoria: "Leitura"
  },
  {
    id: "act-3",
    nome: "Mapa de Planejamento de Rotina Visual",
    objetivo: "Auxiliar na organização de etapas, planejamento de tarefas complexas e antecipação de ações.",
    faixaEtaria: "4 a 10 anos",
    diagnosticoIndicado: ["TDAH", "TEA", "Transtorno de Aprendizagem"],
    habilidadeDesenvolvida: "Funções Executivas / Planejamento",
    tempoEstimado: "15 minutos",
    materiaisNecessarios: ["Cartões visuais laminados com velcro", "Prancheta de cronograma"],
    instrucoes: "Apresente uma tarefa escolar ou diária desmembrada em etapas fora de ordem (ex: Fazer tarefa de matemática: 1. Pegar caderno, 2. Abrir estojo, 3. Resolver questões, 4. Fechar estojo e guardar na mochila). Peça para o paciente ordenar cronologicamente no painel de velcro.",
    observacoes: "Ideal para pacientes com dificuldade de planejamento e iniciação de tarefas.",
    nivelDificuldade: "Fácil",
    categoria: "Funções executivas"
  },
  {
    id: "act-4",
    nome: "Histórias Sociais de Transição de Atividade",
    objetivo: "Ampliar a flexibilidade cognitiva, tolerância a frustração e reduzir comportamentos inadequados em transição.",
    faixaEtaria: "3 a 7 anos",
    diagnosticoIndicado: ["TEA", "Atraso do Desenvolvimento"],
    habilidadeDesenvolvida: "Flexibilidade Cognitiva e Autorregulação",
    tempoEstimado: "10 minutos",
    materiaisNecessarios: ["Livro de histórias sociais personalizadas", "Tokens de recompensa"],
    instrucoes: "Leia com a criança uma história social simples e ilustrada sobre como mudar de uma brincadeira legal para uma tarefa de estudo sem ficar triste. Treine em sala de atendimento simulando as situações com cronômetros visuais e sistema de economia de fichas.",
    observacoes: "Útil para reprimir o comportamento de recusa ou agressividade em transições.",
    nivelDificuldade: "Fácil",
    categoria: "Autorregulação"
  },
  {
    id: "act-5",
    nome: "Pareamento Sensorial de Texturas (Snoezelen)",
    objetivo: "Auxiliar na regulação do perfil sensorial tátil e mitigar a seletividade alimentar tátil.",
    faixaEtaria: "1 a 6 anos",
    diagnosticoIndicado: ["TEA", "Transtorno de Processamento Sensorial", "Seletividade Alimentar"],
    habilidadeDesenvolvida: "Integração Sensorial / Tolerância Tátil",
    tempoEstimado: "15 minutos",
    materiaisNecessarios: ["Caixa sensorial com areia, arroz colorido, sagu hidratado, lixas e tecidos macios"],
    instrucoes: "Apresente caixas sensoriais de diferentes texturas. Incentive a criança a explorar com as pontas dos dedos e palmas das mãos, escondendo brinquedos preferidos dentro das caixas. Promova o toque em texturas secas, úmidas e ásperas sem imposição forçada, estimulando a autodescoberta.",
    observacoes: "Excelente estratégia preparatória para crianças com seletividade alimentar baseada em textura.",
    nivelDificuldade: "Fácil",
    categoria: "Autorregulação"
  }
];

// Initial Health Insurance (Convênios) Trackers
export const initialInsurances: Insurance[] = [
  {
    id: "ins-1",
    nome: "Unimed Pleno",
    numeroGuia: "UG-908822-2026",
    sessoesAutorizadas: 40,
    sessoesUtilizadas: 32,
    validade: "2026-07-15", // Expiring soon in the context of current time (June 26, 2026)
    documentosAnexados: [
      { id: "gd-1", nome: "Guia_Unimed_Autorizacao_Lucas.pdf" }
    ],
    relatoriosObrigatorios: ["Relatório de Evolução Trimestral", "Laudo Diagnóstico Médico Atualizado"]
  },
  {
    id: "ins-2",
    nome: "Amil Blue 300",
    numeroGuia: "UG-332111-2026",
    sessoesAutorizadas: 24,
    sessoesUtilizadas: 6,
    validade: "2026-12-30",
    documentosAnexados: [
      { id: "gd-2", nome: "Guia_Amil_Arthur.pdf" }
    ],
    relatoriosObrigatorios: ["Relatório Multidisciplinar Semestral"]
  },
  {
    id: "ins-3",
    nome: "SulAmérica Especial",
    numeroGuia: "UG-774411-2026",
    sessoesAutorizadas: 36,
    sessoesUtilizadas: 30,
    validade: "2026-07-08", // Expiring very soon!
    documentosAnexados: [],
    relatoriosObrigatorios: ["Laudo de Impacto Funcional", "Formulário de Renovação SulAmérica"]
  },
  {
    id: "ins-4",
    nome: "Bradesco Saúde Preferencial",
    numeroGuia: "UG-445522-2026",
    sessoesAutorizadas: 50,
    sessoesUtilizadas: 10,
    validade: "2026-11-20",
    documentosAnexados: [
      { id: "gd-3", nome: "Guia_Bradesco_Davi.pdf" }
    ],
    relatoriosObrigatorios: ["Relatório de Desempenho ABA"]
  }
];

// Initial Timelines List
export const initialTimeline: TimelineItem[] = [
  {
    id: "tl-1",
    patientId: "pat-1",
    data: "2025-01-20",
    tipo: "Avaliação",
    titulo: "Anamnese Inicial",
    descricao: "Realização da anamnese psicopedagógica inicial com a mãe Mariana Silva.",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "tl-2",
    patientId: "pat-1",
    data: "2025-02-10",
    tipo: "Sessão",
    titulo: "Primeira Sessão de Terapia",
    descricao: "Sessão de pareamento, habituação à sala de atendimento e seleção de reforçadores primários.",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "tl-3",
    patientId: "pat-1",
    data: "2025-02-15",
    tipo: "Documento",
    titulo: "Anexação de Laudo Médico",
    descricao: "Anexado laudo de Roberto Albuquerque confirmando diagnóstico de TEA.",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "tl-4",
    patientId: "pat-1",
    data: "2025-04-10",
    tipo: "Protocolo",
    titulo: "Preenchimento do Protocolo de Desenvolvimento",
    descricao: "Realizada a primeira rodada do Protocolo de Desenvolvimento Infantil (0 a 6 anos) de entrada.",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "tl-5",
    patientId: "pat-1",
    data: "2025-08-14",
    tipo: "Visita Escolar",
    titulo: "Visita Técnica e Alinhamento Pedagógico",
    descricao: "Visita ao Colégio Integração Infantil. Reunião com a coordenadora Sandra Mara e professora Letícia.",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "tl-6",
    patientId: "pat-1",
    data: "2025-08-20",
    tipo: "PEI",
    titulo: "Criação do PEI Escolar",
    descricao: "Geração e entrega do Plano Educacional Individualizado com orientações de adaptações.",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "tl-7",
    patientId: "pat-1",
    data: "2025-12-18",
    tipo: "Reunião de Família",
    titulo: "Devolutiva Semestral e Treino de Pais",
    descricao: "Apresentação de resultados acumulados, gráficos de evolução e orientações de rotina visual doméstica.",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "tl-8",
    patientId: "pat-1",
    data: "2026-06-25",
    tipo: "Sessão",
    titulo: "Sessão Registrada - Pareamento de Letras",
    descricao: "Sessão bem-sucedida focada no pareamento das letras do nome e imitação motora lúdica.",
    profissional: "Francine Maria Tersi"
  }
];

// Initial Agenda Events
export const initialAgendaEvents: AgendaEvent[] = [
  {
    id: "ev-1",
    title: "Sessão Psicopedagógica - Lucas Silva",
    patientId: "pat-1",
    start: "2026-06-26T14:00:00",
    end: "2026-06-26T14:50:00",
    tipo: "Sessão",
    status: "realizado",
    alertas: "Necessita de material com dinossauros"
  },
  {
    id: "ev-2",
    title: "Sessão Neuropsicopedagógica - Arthur Medeiros",
    patientId: "pat-2",
    start: "2026-06-26T15:00:00",
    end: "2026-06-26T15:50:00",
    tipo: "Sessão",
    status: "confirmado",
    alertas: "Focar em cansaço/pausas motoras"
  },
  {
    id: "ev-3",
    title: "Sessão de Regulação - Beatriz Costa",
    patientId: "pat-3",
    start: "2026-06-26T16:00:00",
    end: "2026-06-26T16:50:00",
    tipo: "Sessão",
    status: "confirmado"
  },
  {
    id: "ev-4",
    title: "Reunião de Alinhamento - Escola Integração",
    start: "2026-06-26T17:30:00",
    end: "2026-06-26T18:30:00",
    tipo: "Reunião",
    status: "confirmado",
    alertas: "Conversar com Coordenadora Sandra"
  },
  {
    id: "ev-5",
    title: "Sessão Inicial - Davi Oliveira",
    patientId: "pat-4",
    start: "2026-06-27T09:00:00",
    end: "2026-06-27T09:50:00",
    tipo: "Avaliação",
    status: "confirmado"
  },
  {
    id: "ev-6",
    title: "Sessão Foco Escrita - Sophia Reis",
    patientId: "pat-5",
    start: "2026-06-27T10:00:00",
    end: "2026-06-27T10:50:00",
    tipo: "Sessão",
    status: "confirmado"
  },
  {
    id: "ev-7",
    title: "Visita Escolar - Colégio Objetivo",
    start: "2026-06-29T10:00:00",
    end: "2026-06-29T11:30:00",
    tipo: "Visita Escolar",
    status: "confirmado",
    alertas: "Observar Davi em recreio"
  }
];

// Initial Audit Logs (LGPD / Security Audit Trail)
export const initialAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    data: "2026-06-26T08:15:22-03:00",
    usuario: "francine.tersi@aprenderaser.com",
    perfil: UserRole.PROFESSIONAL,
    acao: "Login efetuado com sucesso",
    detalhes: "Autenticação via chave de sessão criptografada de dois fatores (simulada).",
    ipSimulado: "189.44.112.5"
  },
  {
    id: "log-2",
    data: "2026-06-26T09:12:05-03:00",
    usuario: "francine.tersi@aprenderaser.com",
    perfil: UserRole.PROFESSIONAL,
    acao: "Acesso a dados sensíveis",
    detalhes: "Prontuário completo e anamnese de Lucas Silva de Oliveira acessados.",
    ipSimulado: "189.44.112.5"
  },
  {
    id: "log-3",
    data: "2026-06-26T10:30:44-03:00",
    usuario: "secretaria.luciana@aprenderaser.com",
    perfil: UserRole.SECRETARY,
    acao: "Consulta de agenda e convênios",
    detalhes: "Acessou listagem de convênios para verificação de guias prestes a vencer.",
    ipSimulado: "189.44.112.18"
  },
  {
    id: "log-4",
    data: "2026-06-26T14:45:00-03:00",
    usuario: "francine.tersi@aprenderaser.com",
    perfil: UserRole.PROFESSIONAL,
    acao: "Registro de evolução clínica",
    detalhes: "Evolução clínica da sessão de Lucas Silva de Oliveira gravada com suporte de IA.",
    ipSimulado: "189.44.112.5"
  }
];

// Initial Preset Protocol Templates
export const initialProtocols: Protocol[] = [
  {
    id: "prot-1",
    patientId: "pat-1",
    tipo: ProtocolType.A,
    dataPreenchimento: "2025-04-10",
    profissional: "Francine Maria Tersi",
    conteudo: {
      "motor_grosso_correr": "Sim",
      "motor_grosso_pular": "Sim",
      "motor_fino_segurar_lapis": "Em desenvolvimento",
      "motor_fino_cortar_papel": "Não",
      "cognitivo_cores": "Sim",
      "cognitivo_tamanhos": "Sim",
      "linguagem_vocalizacao": "Sim",
      "linguagem_frases_completas": "Não",
      "social_contato_visual": "Em desenvolvimento",
      "social_brincar_compartilhado": "Não"
    },
    observacoes: "Paciente demonstra excelentes marcos de coordenação motora grossa, porém apresenta atraso crítico em motricidade fina e socialização interativa."
  },
  {
    id: "prot-2",
    patientId: "pat-1",
    tipo: ProtocolType.C,
    dataPreenchimento: "2026-06-25",
    profissional: "Francine Maria Tersi",
    conteudo: {
      "estado_inicial": "Agitado com choro leve",
      "tempo_snoezelen": "8 minutos",
      "cor_luzes": "Azul (Calma)",
      "som_ambiente": "Sons de natureza e chuva",
      "massagem_compressiva": "Sim (ombros e costas)",
      "fibra_optica": "Engajou tocando e olhando",
      "estado_final": "Regulado, atento e calmo",
      "efetividade_escala": "5 (Altamente Efetivo)"
    },
    observacoes: "A sala multissensorial Snoezelen foi crucial para diminuir a hiperatividade somatossensorial e preparar o Lucas para a escrita das letras."
  }
];

import { PeiGoal, GoalDomain, GoalStatus, AgendaItem, ActivityCard } from "./types";

// Initial PEI Goals
export const initialPeiGoals: PeiGoal[] = [
  {
    id: "g-1",
    patientId: "pat-1", // Lucas
    dominio: GoalDomain.ACADEMIC,
    meta: "Parear as 5 letras do próprio nome (L-U-C-A-S) de forma sequencial com suporte visual de fichas.",
    suporteRequerido: "Pistas visuais estruturadas",
    criterioAquisicao: "80% de independência em 3 sessões consecutivas",
    status: GoalStatus.IN_PROGRESS,
    dataRevisao: "2026-08-15"
  },
  {
    id: "g-2",
    patientId: "pat-1", // Lucas
    dominio: GoalDomain.COMMUNICATION,
    meta: "Vocalizar funcionalmente comandos de 2 sílabas ('abre', 'quero', 'água') para solicitar itens desejados.",
    suporteRequerido: "Auxílio ecoico imediato",
    criterioAquisicao: "60% das tentativas espontâneas na sessão",
    status: GoalStatus.IN_PROGRESS,
    dataRevisao: "2026-08-15"
  },
  {
    id: "g-3",
    patientId: "pat-2", // Arthur
    dominio: GoalDomain.COGNITIVE,
    meta: "Sustentar atenção compartilhada em tarefa de papel e lápis de consciência fonológica por 10 minutos contínuos.",
    suporteRequerido: "Timer visual de contagem regressiva",
    criterioAquisicao: "Menos de 2 redirecionamentos por bloco de atividade",
    status: GoalStatus.NOT_STARTED,
    dataRevisao: "2026-09-01"
  }
];

// Initial Agenda Items (Weekly Grid Slots)
export const initialAgenda: AgendaItem[] = [
  {
    id: "ag-1",
    patientId: "pat-1",
    patientNome: "Lucas Silva de Oliveira",
    diaSemana: "Segunda-feira",
    horario: "14:00",
    tipoAtendimento: "Plano de Tratamento ABA",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "ag-2",
    patientId: "pat-2",
    patientNome: "Arthur Medeiros Guimarães",
    diaSemana: "Segunda-feira",
    horario: "15:00",
    tipoAtendimento: "Plano de Tratamento ABA",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "ag-3",
    patientId: "pat-3",
    patientNome: "Beatriz Costa Rezende",
    diaSemana: "Quarta-feira",
    horario: "14:00",
    tipoAtendimento: "Triagem Sensorial Snoezelen",
    profissional: "Francine Maria Tersi"
  },
  {
    id: "ag-4",
    patientId: "pat-4",
    patientNome: "Davi Oliveira Santos",
    diaSemana: "Quinta-feira",
    horario: "09:00",
    tipoAtendimento: "Avaliação Psicopedagógica",
    profissional: "Francine Maria Tersi"
  }
];

// Map Activity Cards directly to initial activities
export const initialActivityCards: ActivityCard[] = initialActivities;

