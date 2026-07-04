import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "insurance_documents",
  columns: ["insurance_id", "nome"],
  filterableBy: ["insurance_id"],
});
