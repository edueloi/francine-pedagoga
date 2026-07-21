import { useCallback, useEffect, useState } from "react";
import { Form, FormResponse } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formFromApi, formResponseFromApi, formToApi } from "../lib/formMappers";

export function useForms() {
  const { authFetch, user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/forms");
      if (!res.ok) throw new Error("Falha ao carregar formulários");
      const data = await res.json();
      setForms(data.map(formFromApi));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) reloadForms();
  }, [user, reloadForms]);

  const getForm = useCallback(
    async (id: string): Promise<Form> => {
      const res = await authFetch(`/api/forms/${id}`);
      if (!res.ok) throw new Error("Falha ao carregar formulário");
      const data = await res.json();
      return formFromApi(data);
    },
    [authFetch]
  );

  const createForm = useCallback(
    async (payload: Partial<Form>) => {
      const res = await authFetch("/api/forms", {
        method: "POST",
        body: JSON.stringify(formToApi(payload)),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao criar formulário");
      await reloadForms();
    },
    [authFetch, reloadForms]
  );

  const updateForm = useCallback(
    async (id: string, payload: Partial<Form>) => {
      const res = await authFetch(`/api/forms/${id}`, {
        method: "PUT",
        body: JSON.stringify(formToApi(payload)),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao atualizar formulário");
      await reloadForms();
    },
    [authFetch, reloadForms]
  );

  const deleteForm = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/forms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover formulário");
      await reloadForms();
    },
    [authFetch, reloadForms]
  );

  const getResponses = useCallback(
    async (formId: string, patientId?: string): Promise<FormResponse[]> => {
      const qs = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
      const res = await authFetch(`/api/forms/${formId}/responses${qs}`);
      if (!res.ok) throw new Error("Falha ao carregar respostas");
      const data = await res.json();
      return data.map(formResponseFromApi);
    },
    [authFetch]
  );

  const submitResponse = useCallback(
    async (formId: string, payload: { patientId?: string; answers: Record<string, any> }) => {
      const res = await authFetch(`/api/forms/${formId}/responses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao enviar resposta");
      const data = await res.json();
      return formResponseFromApi(data);
    },
    [authFetch]
  );

  const updateResponse = useCallback(
    async (responseId: string, answers: Record<string, any>) => {
      const res = await authFetch(`/api/forms/responses/${responseId}`, {
        method: "PUT",
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao atualizar resposta");
      const data = await res.json();
      return formResponseFromApi(data);
    },
    [authFetch]
  );

  return {
    forms,
    loading,
    error,
    reloadForms,
    getForm,
    createForm,
    updateForm,
    deleteForm,
    getResponses,
    submitResponse,
    updateResponse,
  };
}
