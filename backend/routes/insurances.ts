import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "insurances",
  columns: [
    "patient_id",
    "nome",
    "numero_guia",
    "sessoes_autorizadas",
    "sessoes_utilizadas",
    "validade",
    "relatorios_obrigatorios",
  ],
  filterableBy: ["patient_id"],
});
