import { Form, FormQuestion, FormResponse, PublicForm } from "../types";

export function formQuestionFromApi(row: any): FormQuestion {
  return {
    id: String(row.id),
    type: row.type,
    text: row.text,
    required: !!row.required,
    options: row.options ?? [],
    section: row.section ?? undefined,
  };
}

export function formFromApi(row: any): Form {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? undefined,
    theme: row.theme ?? undefined,
    interpretations: row.interpretations ?? [],
    questions: Array.isArray(row.questions) ? row.questions.map(formQuestionFromApi) : undefined,
    questionCount:
      row.question_count !== undefined && row.question_count !== null
        ? Number(row.question_count)
        : undefined,
    createdAt: row.created_at ?? undefined,
    shareToken: row.share_token ?? undefined,
  };
}

export function publicFormFromApi(row: any): PublicForm {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? "",
    theme: row.theme ?? undefined,
    questions: Array.isArray(row.questions) ? row.questions.map(formQuestionFromApi) : [],
  };
}

export function formToApi(form: Partial<Form>): Record<string, any> {
  return {
    title: form.title,
    description: form.description ?? null,
    category: form.category ?? null,
    theme: form.theme ?? null,
    interpretations: form.interpretations ?? [],
    questions: (form.questions ?? []).map((q) => ({
      type: q.type,
      text: q.text,
      required: q.required ?? false,
      options: q.options ?? [],
      section: q.section ?? null,
    })),
  };
}

export function formResponseFromApi(row: any): FormResponse {
  return {
    id: String(row.id),
    formId: String(row.form_id),
    patientId: row.patient_id != null ? String(row.patient_id) : undefined,
    patientNome: row.patient_nome ?? undefined,
    answers: row.answers ?? {},
    totalScore: row.total_score ?? null,
    matchedInterpretation: row.matched_interpretation ?? null,
    submittedAt: row.submitted_at,
  };
}
