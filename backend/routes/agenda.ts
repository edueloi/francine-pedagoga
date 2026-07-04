import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "agenda_events",
  columns: ["title", "patient_id", "start_time", "end_time", "tipo", "status", "alertas"],
  filterableBy: ["patient_id", "status"],
  orderBy: "start_time ASC",
});
