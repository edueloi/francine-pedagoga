import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "sessions",
  columns: [
    "patient_id",
    "data",
    "profissional",
    "tempo_sessao",
    "chegada_regulacao",
    "comunicacao",
    "brincar",
    "atividade_papel",
    "flexibilidade_cognitiva",
    "transicao_atividades",
    "comportamentos_observados",
    "habilidades_trabalhadas",
    "perfil_sensorial",
    "reforcadores",
    "nivel_independencia",
    "observacoes_clinicas",
    "raw_notes",
    "plano_proxima_sessao",
  ],
  filterableBy: ["patient_id"],
  orderBy: "data DESC",
});
