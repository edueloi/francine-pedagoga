import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "protocols",
  columns: ["patient_id", "tipo", "data_preenchimento", "profissional", "conteudo", "observacoes"],
  filterableBy: ["patient_id"],
  orderBy: "data_preenchimento DESC",
});
