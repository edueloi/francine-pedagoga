import { createCrudRouter } from "./crudFactory";

export default createCrudRouter({
  table: "anamneses",
  columns: [
    "patient_id",
    "queixa_principal",
    "historia_gestacional",
    "marcos_desenvolvimento",
    "linguagem",
    "sono",
    "alimentacao_seletividade",
    "controle_esfincteriano",
    "historico_medico",
    "medicamentos",
    "terapias_atuais",
    "comportamento_casa",
    "comportamento_escola",
    "interesses_hiperfocos",
    "sensibilidades_sensoriais",
    "pontos_fortes",
    "principais_dificuldades",
    "objetivos_familia",
  ],
  filterableBy: ["patient_id"],
});
