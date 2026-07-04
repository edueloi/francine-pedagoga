import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "pei_goals",
  columns: [
    "patient_id",
    "dominio",
    "meta",
    "suporte_requerido",
    "criterio_aquisicao",
    "status",
    "data_revisao",
  ],
  filterableBy: ["patient_id"],
});
