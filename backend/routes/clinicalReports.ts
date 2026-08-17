import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "clinical_reports",
  columns: ["patient_id", "tipo", "titulo", "conteudo", "data_geracao"],
  filterableBy: ["patient_id"],
});
