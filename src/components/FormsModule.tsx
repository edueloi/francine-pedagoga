import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Eye,
  PlayCircle,
  FileText,
  Loader2,
  Send,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { Patient, UserPermissions, UserRole, Form, FormResponse, FormQuestion } from "../types";
import { useForms } from "../hooks/useForms";
import { FormBuilder } from "./Forms/FormBuilder";
import { FormFillFields } from "./Forms/FormFillFields";
import { PageHeader } from "./UI/PageHeader";
import { Button } from "./UI/Button";
import { AppCard } from "./UI/AppCard";
import { EmptyState } from "./UI/EmptyState";
import { GridTable, Column } from "./UI/GridTable";
import { Modal, ModalFooter, ConfirmModal } from "./UI/Modal";
import { Combobox } from "./UI/Combobox";
import { useToast } from "./UI/Toast";

interface FormsModuleProps {
  patients: Patient[];
  userRole: UserRole;
  userPermissions?: UserPermissions;
}

type ViewMode = "list" | "builder" | "responses";

export default function FormsModule({ patients, userRole, userPermissions }: FormsModuleProps) {
  const canCreate = userPermissions ? userPermissions.forms.criar : userRole !== UserRole.RESTRICTED;
  const canDelete = userPermissions ? userPermissions.forms.excluir : userRole === UserRole.ADMIN;

  const { forms, loading, reloadForms, getForm, createForm, updateForm, deleteForm, getResponses, submitResponse } =
    useForms();
  const toast = useToast();

  const [view, setView] = useState<ViewMode>("list");
  const [editingForm, setEditingForm] = useState<Form | undefined>(undefined);
  const [activeFormForResponses, setActiveFormForResponses] = useState<Form | undefined>(undefined);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  const [fillForm, setFillForm] = useState<Form | undefined>(undefined);
  const [fillAnswers, setFillAnswers] = useState<Record<string, any>>({});
  const [fillPatientId, setFillPatientId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Form | undefined>(undefined);
  const [shareForm, setShareForm] = useState<Form | undefined>(undefined);
  const [sharePatientId, setSharePatientId] = useState<string>("");

  const handleCreateNew = () => {
    setEditingForm(undefined);
    setView("builder");
  };

  const handleEdit = async (form: Form) => {
    const full = await getForm(form.id);
    setEditingForm(full);
    setView("builder");
  };

  const handleSaveForm = async (data: {
    title: string;
    description: string;
    category?: string;
    questions: FormQuestion[];
    interpretations?: any[];
    theme?: any;
  }) => {
    if (editingForm) {
      await updateForm(editingForm.id, data as Partial<Form>);
    } else {
      await createForm(data as Partial<Form>);
    }
    setView("list");
    setEditingForm(undefined);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteForm(deleteTarget.id);
    setDeleteTarget(undefined);
  };

  const handleOpenResponses = async (form: Form) => {
    setActiveFormForResponses(form);
    setResponsesLoading(true);
    setView("responses");
    try {
      const data = await getResponses(form.id);
      setResponses(data);
    } finally {
      setResponsesLoading(false);
    }
  };

  const handleOpenShare = (form: Form) => {
    setShareForm(form);
    setSharePatientId("");
  };

  const handleCopyShareLink = async () => {
    if (!shareForm?.shareToken) {
      toast.error("Este formulário ainda não possui um link público. Salve-o novamente para gerar um.");
      return;
    }
    const patientQuery = sharePatientId ? `?patientId=${encodeURIComponent(sharePatientId)}` : "";
    const url = `${window.location.origin}/f/${shareForm.shareToken}${patientQuery}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareForm(undefined);
      toast.success(
        sharePatientId
          ? "Link copiado e vinculado ao paciente. A resposta entrará no prontuário e nas evoluções."
          : "Link neutro copiado. Você poderá identificar a pessoa pelas respostas do formulário."
      );
    } catch {
      toast.error("Não foi possível copiar o link automaticamente. Copie manualmente: " + url);
    }
  };

  const handleOpenFill = async (form: Form) => {
    const full = await getForm(form.id);
    setFillForm(full);
    setFillAnswers({});
    setFillPatientId("");
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setFillAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleToggleCheckbox = (questionId: string, optionValue: number) => {
    setFillAnswers((prev) => {
      const current: number[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const exists = current.includes(optionValue);
      const next = exists ? current.filter((v) => v !== optionValue) : [...current, optionValue];
      return { ...prev, [questionId]: next };
    });
  };

  const handleSubmitResponse = async () => {
    if (!fillForm) return;
    setSubmitting(true);
    try {
      await submitResponse(fillForm.id, {
        patientId: fillPatientId || undefined,
        answers: fillAnswers,
      });
      setFillForm(undefined);
      if (view === "responses" && activeFormForResponses?.id === fillForm.id) {
        const data = await getResponses(fillForm.id);
        setResponses(data);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Form>[] = useMemo(
    () => [
      {
        header: "Título",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{row.title}</span>
          </div>
        ),
      },
      {
        header: "Questões",
        render: (row) => <span className="font-semibold">{row.questionCount ?? row.questions?.length ?? 0}</span>,
      },
      {
        header: "Criado em",
        render: (row) => (
          <span className="text-slate-500">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString("pt-BR") : "-"}
          </span>
        ),
      },
      {
        header: "Ações",
        render: (row) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="soft" leftIcon={<PlayCircle size={14} />} onClick={() => handleOpenFill(row)}>
              Responder
            </Button>
            <Button size="xs" variant="outline" leftIcon={<Eye size={14} />} onClick={() => handleOpenResponses(row)}>
              Respostas
            </Button>
            <Button size="xs" variant="soft" leftIcon={<Share2 size={14} />} title="Enviar link para a família ou escola responder sem login" onClick={() => handleOpenShare(row)}>
              Enviar link
            </Button>
            {canCreate && (
              <Button size="xs" variant="ghost" onClick={() => handleEdit(row)}>
                Editar
              </Button>
            )}
            {canDelete && (
              <Button size="xs" variant="softDanger" iconOnly onClick={() => setDeleteTarget(row)}>
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canCreate, canDelete]
  );

  if (view === "builder") {
    return (
      <FormBuilder
        initialData={
          editingForm
            ? {
                title: editingForm.title,
                description: editingForm.description,
                category: editingForm.category,
                questions: editingForm.questions ?? [],
                interpretations: editingForm.interpretations,
                theme: editingForm.theme,
              }
            : undefined
        }
        onSave={handleSaveForm}
        onCancel={() => {
          setView("list");
          setEditingForm(undefined);
        }}
      />
    );
  }

  if (view === "responses" && activeFormForResponses) {
    const responseColumns: Column<FormResponse>[] = [
      {
        header: "Paciente",
        render: (row) => row.patientNome || "Anônimo",
      },
      {
        header: "Pontuação",
        render: (row) => <span className="font-black text-indigo-600">{row.totalScore ?? "-"}</span>,
      },
      {
        header: "Interpretação",
        render: (row) =>
          row.matchedInterpretation ? (
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${row.matchedInterpretation.color}`}>
              {row.matchedInterpretation.resultTitle}
            </span>
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        header: "Enviado em",
        render: (row) => new Date(row.submittedAt).toLocaleString("pt-BR"),
      },
    ];

    return (
      <div className="space-y-6">
        <PageHeader
          icon={<FileText size={24} />}
          title={`Respostas — ${activeFormForResponses.title}`}
          subtitle="Histórico de preenchimentos deste formulário"
          showBackButton
          onBackClick={() => setView("list")}
        />
        <GridTable
          data={responses}
          columns={responseColumns}
          keyExtractor={(row) => row.id}
          isLoading={responsesLoading}
          emptyMessage="Nenhuma resposta registrada ainda."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ClipboardList size={24} />}
        title="Formulários"
        subtitle="Crie testes, questionários e escalas clínicas dinâmicas"
        actions={
          canCreate && (
            <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleCreateNew}>
              Novo Formulário
            </Button>
          )
        }
      />

      {!loading && forms.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum formulário criado ainda"
          description="Crie seu primeiro formulário dinâmico para aplicar testes e escalas clínicas."
          action={
            canCreate && (
              <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleCreateNew}>
                Criar Formulário
              </Button>
            )
          }
        />
      ) : (
        <GridTable
          data={forms}
          columns={columns}
          keyExtractor={(row) => row.id}
          isLoading={loading}
          emptyMessage="Nenhum formulário encontrado."
        />
      )}

      {/* Confirm delete */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        title="Excluir formulário"
        message={`Tem certeza que deseja excluir "${deleteTarget?.title}"? As respostas associadas também serão removidas.`}
        confirmLabel="Excluir"
      />

      {/* Share form link, optionally tied to a patient so public answers enter the right chart. */}
      <Modal
        isOpen={!!shareForm}
        onClose={() => setShareForm(undefined)}
        title="Enviar formulário"
        subtitle={shareForm?.title}
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="outline" onClick={() => setShareForm(undefined)}>
              Cancelar
            </Button>
            <Button variant="primary" leftIcon={<Share2 size={16} />} onClick={handleCopyShareLink}>
              Copiar link
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm leading-relaxed text-slate-600">
            Escolha um paciente para que a resposta recebida pelo link fique automaticamente anexada ao prontuário e às evoluções. Se deixar em branco, o link continua neutro e pode ser usado por qualquer pessoa.
          </div>
          <div>
            <label className="ds-label mb-1.5 block">Vincular a um paciente (opcional)</label>
            <Combobox
              label=""
              placeholder="Link neutro — selecionar paciente..."
              value={sharePatientId}
              onChange={(val) => setSharePatientId(val as string)}
              options={patients.map((p) => ({ id: p.id, label: p.nome }))}
            />
          </div>
          {sharePatientId && (
            <p className="text-xs font-semibold text-emerald-700">
              As respostas deste link serão registradas para {patients.find((p) => p.id === sharePatientId)?.nome || "o paciente selecionado"}.
            </p>
          )}
        </div>
      </Modal>

      {/* Fill-out modal */}
      <Modal
        isOpen={!!fillForm}
        onClose={() => setFillForm(undefined)}
        title={fillForm?.title || "Responder Formulário"}
        subtitle={fillForm?.description}
        size="lg"
        footer={
          <ModalFooter>
            <Button variant="outline" onClick={() => setFillForm(undefined)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              leftIcon={<Send size={16} />}
              loading={submitting}
              onClick={handleSubmitResponse}
            >
              Enviar Resposta
            </Button>
          </ModalFooter>
        }
      >
        {fillForm && (
          <div className="space-y-6">
            <div>
              <label className="ds-label mb-1.5 block">Paciente (opcional)</label>
              <Combobox
                label=""
                placeholder="Selecionar paciente ou deixar anônimo..."
                value={fillPatientId}
                onChange={(val) => setFillPatientId(val as string)}
                options={patients.map((p) => ({ id: p.id, label: p.nome }))}
              />
            </div>

            <FormFillFields
              questions={fillForm.questions ?? []}
              answers={fillAnswers}
              onAnswerChange={handleAnswerChange}
              onToggleCheckbox={handleToggleCheckbox}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
