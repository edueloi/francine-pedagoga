import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "agenda_weekly_slots",
  columns: ["patient_id", "dia_semana", "horario", "tipo_atendimento", "profissional"],
  filterableBy: ["patient_id"],
});
