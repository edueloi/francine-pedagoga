import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "activities",
  columns: [
    "nome",
    "objetivo",
    "faixa_etaria",
    "diagnostico_indicado",
    "habilidade_desenvolvida",
    "tempo_estimado",
    "materiais_necessarios",
    "instrucoes",
    "observacoes",
    "nivel_dificuldade",
    "categoria",
  ],
  orderBy: "nome ASC",
});
