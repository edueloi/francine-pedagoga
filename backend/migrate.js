/**
 * Migração do banco de dados — Espaço Aprender a Ser (francine-pedagoga)
 * Execute: node backend/migrate.js
 * Seguro para dados existentes: usa CREATE TABLE IF NOT EXISTS, não remove tabelas.
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Adiciona uma coluna de forma idempotente. Tenta "ADD COLUMN IF NOT EXISTS" (MySQL 8+);
// se a versão do MySQL não suportar essa sintaxe, cai no fallback via SHOW COLUMNS LIKE.
async function addColumnIfMissing(conn, table, column, definition) {
  try {
    await conn.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
  } catch (err) {
    const [cols] = await conn.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
    if (cols.length === 0) {
      await conn.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || "francine_pedagoga";

  console.log("🚀 Iniciando migração...");

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${dbName}\``);

  console.log("   Preservando tabelas existentes e aplicando schema incremental...");

  // ---- USERS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('Administrador','Profissional','Secretária','Visualização restrita') NOT NULL DEFAULT 'Profissional',
      permissions JSON NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- PATIENTS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      data_nascimento DATE NULL,
      foto VARCHAR(500) NULL,
      responsavel VARCHAR(255) NULL,
      responsavel_parentesco VARCHAR(100) NULL,
      responsavel_cpf VARCHAR(20) NULL,
      responsavel_financeiro_nome VARCHAR(255) NULL,
      responsavel_financeiro_cpf VARCHAR(20) NULL,
      responsavel_financeiro_telefone VARCHAR(50) NULL,
      tipo_pagamento ENUM('Particular','Convênio') NULL,
      convenio_carteirinha VARCHAR(100) NULL,
      convenio_validade DATE NULL,
      telefone VARCHAR(50) NULL,
      escola VARCHAR(255) NULL,
      ano_serie VARCHAR(100) NULL,
      professor VARCHAR(255) NULL,
      coordenador VARCHAR(255) NULL,
      medico VARCHAR(255) NULL,
      diagnostico TEXT NULL,
      cid VARCHAR(50) NULL,
      convenio VARCHAR(255) NULL,
      medicamentos TEXT NULL,
      historico_clinico TEXT NULL,
      data_inicio DATE NULL,
      status ENUM('Ativo','Pausado','Encerrado') NOT NULL DEFAULT 'Ativo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- PATIENT DOCUMENTS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS patient_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      nome VARCHAR(255) NOT NULL,
      tipo ENUM('medico','pais') NOT NULL DEFAULT 'medico',
      data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- ANAMNESES ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS anamneses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL UNIQUE,
      queixa_principal TEXT NULL,
      historia_gestacional TEXT NULL,
      marcos_desenvolvimento TEXT NULL,
      linguagem TEXT NULL,
      sono TEXT NULL,
      alimentacao_seletividade TEXT NULL,
      controle_esfincteriano TEXT NULL,
      historico_medico TEXT NULL,
      medicamentos TEXT NULL,
      terapias_atuais TEXT NULL,
      comportamento_casa TEXT NULL,
      comportamento_escola TEXT NULL,
      interesses_hiperfocos TEXT NULL,
      sensibilidades_sensoriais TEXT NULL,
      pontos_fortes TEXT NULL,
      principais_dificuldades TEXT NULL,
      objetivos_familia TEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- SESSIONS (Evolução de Sessão) ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      data DATETIME NOT NULL,
      profissional VARCHAR(255) NULL,
      tempo_sessao INT DEFAULT 50,
      chegada_regulacao TEXT NULL,
      comunicacao TEXT NULL,
      brincar TEXT NULL,
      atividade_papel TEXT NULL,
      flexibilidade_cognitiva TEXT NULL,
      transicao_atividades TEXT NULL,
      comportamentos_observados TEXT NULL,
      habilidades_trabalhadas JSON NULL,
      perfil_sensorial TEXT NULL,
      reforcadores JSON NULL,
      nivel_independencia ENUM('Totalmente Independente','Suporte Leve','Suporte Moderado','Suporte Intenso') DEFAULT 'Suporte Leve',
      observacoes_clinicas TEXT NULL,
      raw_notes TEXT NULL,
      plano_proxima_sessao TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- ACTIVITIES (Banco de Atividades) ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      objetivo TEXT NULL,
      faixa_etaria VARCHAR(100) NULL,
      diagnostico_indicado JSON NULL,
      habilidade_desenvolvida VARCHAR(255) NULL,
      tempo_estimado VARCHAR(50) NULL,
      materiais_necessarios JSON NULL,
      instrucoes TEXT NULL,
      observacoes TEXT NULL,
      nivel_dificuldade ENUM('Fácil','Médio','Difícil') DEFAULT 'Médio',
      categoria VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- INSURANCES (Convênios) ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS insurances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NULL,
      nome VARCHAR(255) NOT NULL,
      numero_guia VARCHAR(100) NULL,
      sessoes_autorizadas INT DEFAULT 0,
      sessoes_utilizadas INT DEFAULT 0,
      validade DATE NULL,
      relatorios_obrigatorios JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await addColumnIfMissing(conn, "insurances", "alert_sent", "BOOLEAN DEFAULT FALSE");

  // ---- INSURANCE DOCUMENTS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS insurance_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      insurance_id INT NOT NULL,
      nome VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insurance_id) REFERENCES insurances(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- TIMELINE ITEMS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS timeline_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      data DATETIME NOT NULL,
      tipo ENUM('Avaliação','Sessão','Protocolo','Relatório','PEI','Visita Escolar','Reunião de Família','Encaminhamento','Documento') NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT NULL,
      profissional VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- AGENDA EVENTS (calendário) ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS agenda_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      patient_id INT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      tipo ENUM('Sessão','Avaliação','Reunião','Visita Escolar','Retorno') NOT NULL DEFAULT 'Sessão',
      status ENUM('confirmado','pendente','cancelado','realizado') NOT NULL DEFAULT 'pendente',
      alertas TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- AGENDA WEEKLY SLOTS (grade semanal fixa) ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS agenda_weekly_slots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      dia_semana VARCHAR(20) NOT NULL,
      horario VARCHAR(10) NOT NULL,
      tipo_atendimento ENUM('Plano de Tratamento ABA','Avaliação Psicopedagógica','Triagem Sensorial Snoezelen','Reunião Escolar Técnica') NOT NULL,
      profissional VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- AUDIT LOGS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario VARCHAR(255) NULL,
      perfil VARCHAR(100) NULL,
      acao VARCHAR(255) NOT NULL,
      detalhes TEXT NULL,
      ip_simulado VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- PROTOCOLS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS protocols (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      tipo VARCHAR(255) NOT NULL,
      data_preenchimento DATE NOT NULL,
      profissional VARCHAR(255) NULL,
      conteudo JSON NULL,
      observacoes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- PEI GOALS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pei_goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      dominio ENUM('Comunicação / Linguagem','Habilidades Acadêmicas','Autonomia / AVD','Cognitivo / Motor') NOT NULL,
      meta TEXT NOT NULL,
      suporte_requerido TEXT NULL,
      criterio_aquisicao TEXT NULL,
      status ENUM('Não Iniciado','Em Progresso','Adquirido','Generalizado') NOT NULL DEFAULT 'Não Iniciado',
      data_revisao DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- FORMS (Formulários dinâmicos) ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS forms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      category VARCHAR(100) NULL,
      theme JSON NULL,
      interpretations JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- FORM QUESTIONS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS form_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      position INT NOT NULL DEFAULT 0,
      type VARCHAR(20) NOT NULL,
      text TEXT NOT NULL,
      required BOOLEAN DEFAULT false,
      options JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- FORM RESPONSES ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS form_responses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      patient_id INT NULL,
      answers JSON NULL,
      total_score INT NULL,
      matched_interpretation JSON NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- CLINIC SETTINGS (perfil único da clínica: nome, endereço, logo, etc.) ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS clinic_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL DEFAULT 'Espaço Aprender a Ser',
      document_number VARCHAR(30) NULL COMMENT 'CPF ou CNPJ',
      address VARCHAR(500) NULL,
      phone VARCHAR(50) NULL,
      email VARCHAR(255) NULL,
      description TEXT NULL,
      activities TEXT NULL COMMENT 'lista de especialidades/atividades oferecidas',
      logo_url VARCHAR(500) NULL,
      cover_image_url VARCHAR(500) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log("✅ Schema aplicado com sucesso.");

  // ---- FORMS: share_token column (link público sem login) ----
  try {
    await conn.query(
      `ALTER TABLE forms ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) NULL UNIQUE`
    );
  } catch (err) {
    // Fallback para versões do MySQL sem suporte a "ADD COLUMN IF NOT EXISTS"
    const [cols] = await conn.query(`SHOW COLUMNS FROM forms LIKE 'share_token'`);
    if (cols.length === 0) {
      await conn.query(`ALTER TABLE forms ADD COLUMN share_token VARCHAR(64) NULL UNIQUE`);
    }
  }

  // ---- FORMS: backfill de share_token para linhas antigas (idempotente) ----
  const [formsWithoutToken] = await conn.query(
    `SELECT id FROM forms WHERE share_token IS NULL`
  );
  if (formsWithoutToken.length > 0) {
    for (const row of formsWithoutToken) {
      const token = crypto.randomBytes(16).toString("hex");
      await conn.query(`UPDATE forms SET share_token = ? WHERE id = ?`, [token, row.id]);
    }
    console.log(`✅ share_token gerado para ${formsWithoutToken.length} formulário(s) existente(s).`);
  } else {
    console.log("   Todos os formulários já possuem share_token, backfill ignorado.");
  }

  // ---- WHATSAPP BOT: colunas de controle de lembretes (idempotente) ----
  await addColumnIfMissing(conn, "agenda_events", "reminder_24h_sent", "BOOLEAN DEFAULT FALSE");
  await addColumnIfMissing(conn, "agenda_events", "reminder_1h_sent", "BOOLEAN DEFAULT FALSE");
  await addColumnIfMissing(conn, "patients", "birthday_reminder_sent_year", "INT NULL");

  // ---- AGENDA EVENTS: vínculo com guia de convênio (idempotente) ----
  await addColumnIfMissing(conn, "agenda_events", "insurance_id", "INT NULL");

  // ---- ANAMNESE: link público de preenchimento pelos pais (idempotente) ----
  // Diferente do backfill de "forms.share_token" acima, aqui o token NÃO é gerado
  // proativamente para todos os pacientes existentes — apenas quando a equipe clica em
  // "Enviar para os pais preencherem" (ver backend/routes/patients.ts), mantendo a tabela
  // limpa e evitando gerar links que nunca serão usados.
  await addColumnIfMissing(conn, "patients", "anamnese_share_token", "VARCHAR(64) NULL UNIQUE");

  // ---- WHATSAPP BOT: configurações de templates de mensagem (editáveis pela UI) ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(50) NOT NULL UNIQUE,
      enabled BOOLEAN DEFAULT TRUE,
      message_template TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ---- WHATSAPP BOT: seed dos 3 templates padrão (idempotente, não sobrescreve edições) ----
  const DEFAULT_WHATSAPP_TEMPLATES = [
    {
      key: "reminder_24h",
      template:
        "🔔 *Lembrete de Atendimento — Espaço Aprender a Ser*\n\n" +
        "Olá! Passando para confirmar o atendimento de *{nome}* amanhã, dia {data}, às {hora}.\n\n" +
        "Contamos com a presença de vocês! Qualquer imprevisto, por favor nos avise. 💙",
    },
    {
      key: "reminder_1h",
      template:
        "🔔 *Lembrete de Atendimento — Espaço Aprender a Ser*\n\n" +
        "Olá! O atendimento de *{nome}* está agendado para hoje às {hora}, ou seja, em cerca de 1 hora.\n\n" +
        "Até já! 💙",
    },
    {
      key: "birthday",
      template:
        "🎉 Parabéns, {nome}! 🎂\n\n" +
        "A equipe do Espaço Aprender a Ser deseja um dia repleto de alegria, carinho e muitas conquistas! " +
        "Que este novo ano de vida seja cheio de aprendizados e momentos especiais ao lado de quem você ama. 💙\n\n" +
        "Com afeto,\nEquipe Espaço Aprender a Ser",
    },
    {
      key: "insurance_expiring",
      template:
        "📋 *Aviso de Guia — Espaço Aprender a Ser*\n\n" +
        "Olá! A guia do convênio *{convenio}* de *{nome}* está com {sessoes_restantes} sessão(ões) restante(s) " +
        "e vencimento em {validade}.\n\n" +
        "Para evitar interrupção no tratamento, entre em contato com o convênio para renovação. 💙",
    },
  ];
  for (const { key, template } of DEFAULT_WHATSAPP_TEMPLATES) {
    const [existing] = await conn.query(
      `SELECT id FROM whatsapp_settings WHERE setting_key = ?`,
      [key]
    );
    if (existing.length === 0) {
      await conn.query(
        `INSERT INTO whatsapp_settings (setting_key, enabled, message_template) VALUES (?, TRUE, ?)`,
        [key, template]
      );
    }
  }

  // ---- SEED: linha única de configurações da clínica (clinic_settings) ----
  const [existingClinicSettings] = await conn.query(`SELECT COUNT(*) AS count FROM clinic_settings`);

  if (existingClinicSettings[0].count === 0) {
    await conn.query(`INSERT INTO clinic_settings (name) VALUES (?)`, ["Espaço Aprender a Ser"]);
    console.log("✅ Linha padrão de clinic_settings criada.");
  } else {
    console.log("   clinic_settings já possui registro, seed ignorado.");
  }

  // ---- SEED: usuário admin ----
  const [existingAdmin] = await conn.query(`SELECT id FROM users WHERE name = ?`, ["admin"]);

  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    await conn.query(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ["admin", "admin@aprenderaser.com", hashedPassword, "Administrador"]
    );
    console.log("✅ Usuário admin criado (login: admin / senha: Admin@123)");
  } else {
    console.log("   Usuário admin já existe, seed ignorado.");
  }

  await conn.end();
  console.log("🎉 Migração concluída!");
}

migrate().catch((err) => {
  console.error("❌ Erro na migração:", err);
  process.exit(1);
});
