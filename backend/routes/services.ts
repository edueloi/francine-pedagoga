import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "services",
  columns: ["name", "default_duration_minutes", "color", "active"],
  orderBy: "name ASC",
});
