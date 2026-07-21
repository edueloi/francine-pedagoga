import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Send, Pencil, Plus } from "lucide-react";
import { Patient, Form, FormResponse } from "../../types";
import { useForms } from "../../hooks/useForms";
import { FormFillFields } from "../Forms/FormFillFields";
import { Modal, ModalFooter, Button, useToast } from "../UI";

const FICHA_TITLE = "Ficha de Acompanhamento";

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
            Ficha de Acompanhamento
          </h4>
        </div>
        <p className="text-xs text-slate-400 text-center py-6">
          Nenhum formulário chamado "Ficha de Acompanhamento" foi encontrado. Crie-o em
          Formulários para poder preenchê-lo aqui vinculado a este paciente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
        <h4 className="font-display font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardList className="h-4.5 w-4.5 text-[#1070ca]" /> Ficha de Acompanhamento
        </h4>
        {canEdit && (
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Preencher nova
          </button>
        )}
      </div>

      <div className="space-y-3">
        {responsesLoading && <p className="text-xs text-slate-400 text-center py-6">Carregando...</p>}

        {!responsesLoading && responses.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">
            Nenhuma ficha de acompanhamento registrada para este paciente ainda.
          </p>
        )}

        {responses.map((r) => (
          <div
            key={r.id}
            className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold font-mono text-slate-400">
                {new Date(r.submittedAt).toLocaleString("pt-BR")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-black text-[#1070ca]">{r.totalScore ?? "-"} pts</span>
                {r.matchedInterpretation && (
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${r.matchedInterpretation.color}`}>
                    {r.matchedInterpretation.resultTitle}
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => handleOpenEdit(r)}
                className="p-1.5 bg-white border border-slate-100 hover:border-blue-200 rounded-lg text-slate-500 hover:text-[#1070ca] transition cursor-pointer shrink-0"
                title="Editar ficha"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingResponse ? "Editar Ficha de Acompanhamento" : "Nova Ficha de Acompanhamento"}
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
