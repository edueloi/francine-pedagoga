/**
 * Migração one-off: gera agenda_events (datas reais) a partir dos
 * agenda_weekly_slots (grade semanal recorrente) existentes.
 *
 * Gera as próximas 8 semanas a partir de hoje. Duração padrão de 50 minutos
 * quando o horário do slot for só um horário de início (ex: "14:00"); quando
 * vier no formato "HH:mm às HH:mm", usa o intervalo exato informado.
 *
 * Não duplica: pula qualquer ocorrência que já exista em agenda_events com o
 * mesmo patient_id + start_time, então pode ser executado mais de uma vez
 * (ex: para estender o horizonte de geração no futuro) sem criar duplicatas.
 *
 * Execute: node backend/scripts/migrateWeeklySlotsToEvents.js
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const WEEKS_AHEAD = 8;
const DEFAULT_DURATION_MINUTES = 50;

const WEEKDAY_INDEX = {
  "Domingo": 0,
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  "Sábado": 6,
};

const TIPO_MAP = {
  "Plano de Tratamento ABA": "Sessão",
  "Avaliação Psicopedagógica": "Avaliação",
  "Triagem Sensorial Snoezelen": "Avaliação",
  "Reunião Escolar Técnica": "Reunião",
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toMysqlDateTime(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`;
}

// Aceita "14:00" ou "08:30 às 09:45". Retorna { startH, startM, endH, endM } (end pode ser null).
function parseHorario(horario) {
  const rangeMatch = horario.match(/^(\d{1,2}):(\d{2})\s*(?:às|as|-)\s*(\d{1,2}):(\d{2})$/i);
  if (rangeMatch) {
    return {
      startH: Number(rangeMatch[1]),
      startM: Number(rangeMatch[2]),
      endH: Number(rangeMatch[3]),
      endM: Number(rangeMatch[4]),
    };
  }
  const singleMatch = horario.match(/^(\d{1,2}):(\d{2})/);
  if (singleMatch) {
    return {
      startH: Number(singleMatch[1]),
      startM: Number(singleMatch[2]),
      endH: null,
      endM: null,
    };
  }
  return null;
}

function nextOccurrencesOfWeekday(weekdayIndex, count) {
  const dates = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getDay() !== weekdayIndex) {
    cursor.setDate(cursor.getDate() + 1);
  }
  for (let i = 0; i < count; i++) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "francine_pedagoga",
  });

  try {
    const [slots] = await conn.query("SELECT * FROM agenda_weekly_slots");
    console.log(`📋 ${slots.length} horário(s) fixo(s) encontrado(s) na grade semanal.`);

    let created = 0;
    let skippedExisting = 0;
    let skippedUnparsable = 0;

    for (const slot of slots) {
      const weekdayIndex = WEEKDAY_INDEX[slot.dia_semana];
      if (weekdayIndex === undefined) {
        console.warn(`⚠️  Dia da semana desconhecido "${slot.dia_semana}" no slot #${slot.id}, pulando.`);
        skippedUnparsable++;
        continue;
      }

      const parsed = parseHorario(slot.horario || "");
      if (!parsed) {
        console.warn(`⚠️  Horário ilegível "${slot.horario}" no slot #${slot.id}, pulando.`);
        skippedUnparsable++;
        continue;
      }

      const tipo = TIPO_MAP[slot.tipo_atendimento] || "Sessão";
      const occurrences = nextOccurrencesOfWeekday(weekdayIndex, WEEKS_AHEAD);

      for (const day of occurrences) {
        const start = new Date(day);
        start.setHours(parsed.startH, parsed.startM, 0, 0);

        const end = new Date(day);
        if (parsed.endH !== null) {
          end.setHours(parsed.endH, parsed.endM, 0, 0);
        } else {
          end.setTime(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
        }

        const startSql = toMysqlDateTime(start);
        const endSql = toMysqlDateTime(end);

        const [existing] = await conn.query(
          "SELECT id FROM agenda_events WHERE patient_id = ? AND start_time = ? LIMIT 1",
          [slot.patient_id, startSql]
        );
        if (existing.length > 0) {
          skippedExisting++;
          continue;
        }

        const [patientRows] = await conn.query("SELECT nome FROM patients WHERE id = ? LIMIT 1", [slot.patient_id]);
        const title = patientRows[0]?.nome || "Paciente";

        await conn.query(
          `INSERT INTO agenda_events (title, patient_id, start_time, end_time, tipo, status)
           VALUES (?, ?, ?, ?, ?, 'pendente')`,
          [title, slot.patient_id, startSql, endSql, tipo]
        );
        created++;
      }
    }

    console.log(`✅ ${created} evento(s) de agenda criado(s).`);
    if (skippedExisting > 0) console.log(`↩️  ${skippedExisting} ocorrência(s) já existiam, ignoradas.`);
    if (skippedUnparsable > 0) console.log(`⚠️  ${skippedUnparsable} slot(s) ignorado(s) por dia/horário ilegível.`);
  } finally {
    await conn.end();
  }
}

migrate().catch((err) => {
  console.error("❌ Falha na migração:", err);
  process.exit(1);
});
