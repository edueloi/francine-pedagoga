import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "insurance_providers",
  columns: ["nome", "contato", "observacoes"],
  orderBy: "nome ASC",
});
