import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "timeline_items",
  columns: ["patient_id", "data", "tipo", "titulo", "descricao", "profissional"],
  filterableBy: ["patient_id"],
  orderBy: "data DESC",
});
