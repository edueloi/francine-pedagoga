import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "patient_documents",
  columns: ["patient_id", "nome", "tipo"],
  filterableBy: ["patient_id"],
});
