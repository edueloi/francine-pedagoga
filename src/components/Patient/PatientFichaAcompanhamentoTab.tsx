import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Send, Pencil, Plus, HeartPulse, Link as LinkIcon, CalendarDays } from "lucide-react";
import { Patient, Form, FormResponse } from "../../types";
import { useForms } from "../../hooks/useForms";
import { FormFillFields } from "../Forms/FormFillFields";
import { Modal, ModalFooter, Button, useToast } from "../UI";

const FICHA_TITLE = "Registro de Monitoramento Comportamental";

function getAnswerByQuestionText(form: Form | undefined, answers: Record<string, any>, text: string) {
  const question = form?.questions?.find((item) => item.text === text);
  return question ? answers[question.id] : undefined;
}

function optionLabel(form: Form | undefined, answers: Record<string, any>, text: string) {
  const question = form?.questions?.find((item) => item.text === text);
  const value = question ? answers[question.id] : undefined;
  return question?.options?.find((option) => option.value === value)?.label;
}

interface PatientFichaAcompanhamentoTabProps {
  patient: Patient;
  canEdit: boolean;
}

export const PatientFichaAcompanhamentoTab: React.FC<PatientFichaAcompanhamentoTabProps> = ({
  patient,
  canEdit,
}) => {
  const toast = useToast();
  const { forms, getForm, getResponses, submitResponse, updateResponse } = useForms();

  const fichaTemplate = useMemo(
    () => forms.find((f) => f.title.trim().toLowerCase() === FICHA_TITLE.toLowerCase()),
    [forms]
  );

  const [fichaForm, setFichaForm] = useState<Form | undefined>(undefined);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  const [editingResponse, setEditingResponse] = useState<FormResponse | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!fichaTemplate) return;
    getForm(fichaTemplate.id).then(setFichaForm);
  }, [fichaTemplate, getForm]);

  const reloadResponses = async () => {
    if (!fichaTemplate) return;
    setResponsesLoading(true);
    try {
      const data = await getResponses(fichaTemplate.id, patient.id);
      setResponses(data);
    } finally {
      setResponsesLoading(false);
    }
  };

  useEffect(() => {
    reloadResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fichaTemplate, patient.id]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleToggleCheckbox = (questionId: string, optionValue: number) => {
    setAnswers((prev) => {
      const current: number[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const exists = current.includes(optionValue);
      const next = exists ? current.filter((v) => v !== optionValue) : [...current, optionValue];
      return { ...prev, [questionId]: next };
    });
  };

  const handleOpenNew = () => {
    setEditingResponse(undefined);
    setAnswers({});
    setModalOpen(true);
  };

  const handleOpenEdit = (response: FormResponse) => {
    setEditingResponse(response);
    setAnswers(response.answers);
    setModalOpen(true);
  };

  const handleCopyPublicLink = async () => {
    if (!fichaTemplate?.shareToken) {
      toast.error("O link público ainda está sendo preparado. Tente novamente em instantes.");
      return;
    }

    const url = `${window.location.origin}/f/${fichaTemplate.shareToken}?patientId=${encodeURIComponent(patient.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link para o responsável copiado. As respostas serão vinculadas a este paciente.");
    } catch {
      toast.error(`Não foi possível copiar automaticamente. Copie este link: ${url}`);
    }
  };

  const handleSubmit = async () => {
    if (!fichaForm) return;
    setSaving(true);
    try {
      if (editingResponse) {
        await updateResponse(editingResponse.id, answers);
        toast.success("Ficha atualizada com sucesso.");
      } else {
        await submitResponse(fichaForm.id, { patientId: patient.id, answers });
        toast.success("Ficha registrada com sucesso.");
      }
      setModalOpen(false);
      await reloadResponses();
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar a ficha.");
    } finally {
      setSaving(false);
    }
  };

  if (!fichaTemplate) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="border-b border-slate-50 pb-2 flex items-center gap-1.5">
          <ClipboardList className="h-4.5 w-4.5 text-[#1070ca]" />
          <h4 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider">
            Registro de Monitoramento
          </h4>
        </div>
        <p className="text-xs text-slate-400 text-center py-6">
          Preparando o formulário de monitoramento. Atualize a página em alguns instantes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 sm:p-6">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-violet-200/30" />
        <div className="absolute right-14 bottom-0 h-16 w-16 rounded-t-full bg-amber-200/35" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm ring-1 ring-blue-100">
              <HeartPulse size={22} />
            </div>
            <div>
              <p className="font-display text-base font-black tracking-tight text-slate-800">Registro de Monitoramento</p>
              <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-500">
                Acompanhe frequência, duração, intensidade e contexto de cada situação observada.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <>
                <button
                  onClick={handleCopyPublicLink}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#2563eb] transition hover:bg-blue-50 cursor-pointer"
                  title="Copiar link para o responsável preencher"
                >
                  <LinkIcon className="h-3.5 w-3.5" /> Enviar ao responsável
                </button>
                <button
                  onClick={handleOpenNew}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-[#1d4ed8] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Novo registro
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {responsesLoading && <p className="text-xs text-slate-400 text-center py-6">Carregando...</p>}

        {!responsesLoading && responses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-8 text-center">
            <CalendarDays className="mx-auto mb-2 h-5 w-5 text-slate-300" />
            <p className="text-xs font-bold text-slate-500">Nenhuma observação registrada ainda.</p>
            <p className="mt-1 text-[11px] text-slate-400">Use “Novo registro” ou envie o link ao responsável.</p>
          </div>
        )}

        {responses.map((r) => {
          const date = getAnswerByQuestionText(fichaForm, r.answers, "Data da observação");
          const behavior = getAnswerByQuestionText(fichaForm, r.answers, "Comportamento observado");
          const frequency = getAnswerByQuestionText(fichaForm, r.answers, "Frequência registrada (quantas vezes ocorreu?)");
          const duration = getAnswerByQuestionText(fichaForm, r.answers, "Duração registrada (em minutos)");
          const intensity = optionLabel(fichaForm, r.answers, "Intensidade percebida");
          return (
            <div key={r.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#2563eb]">
                      {date || "Data não informada"}
                    </span>
                    {intensity && (
                      <span className="rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-violet-700">
                        Intensidade {intensity}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-800">{behavior || "Comportamento não informado"}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
                    {frequency !== undefined && frequency !== "" && <span>Frequência: <strong className="text-slate-700">{frequency}x</strong></span>}
                    {duration !== undefined && duration !== "" && <span>Duração: <strong className="text-slate-700">{duration} min</strong></span>}
                    <span>Enviado em {new Date(r.submittedAt).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleOpenEdit(r)}
                    className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563eb] cursor-pointer"
                    title="Editar registro"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingResponse ? "Editar registro de monitoramento" : "Novo registro de monitoramento"}
        subtitle={patient.nome}
        size="lg"
        footer={
          <ModalFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" leftIcon={<Send size={16} />} loading={saving} onClick={handleSubmit}>
              {editingResponse ? "Salvar Alterações" : "Enviar Ficha"}
            </Button>
          </ModalFooter>
        }
      >
        {fichaForm && (
          <FormFillFields
            questions={fichaForm.questions ?? []}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onToggleCheckbox={handleToggleCheckbox}
          />
        )}
      </Modal>
    </div>
  );
};
