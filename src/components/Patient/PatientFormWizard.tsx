import React, { useRef, useState } from 'react';
import { Patient, PatientStatus } from '../../types';
import {
  CheckCircle, ChevronRight, ChevronLeft, Save, User, GraduationCap, Users,
  CreditCard, FileText, X, Camera, FileHeart, Plus, Trash2,
} from 'lucide-react';
import { DatePicker } from '../UI/DatePicker';
import { Button, IconButton, Modal } from '../UI';

/* ─── Máscaras (Brasil) ────────────────────────────────────────────────── */
export const mkP = (v: string) =>
  v.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').substring(0, 15);

export const mkC = (v: string) => {
  v = v.replace(/\D/g, '');
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  }
  return v
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

export const maskCep = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.replace(/(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, '');
};

/* ─── Documento pendente de upload (metadados apenas, ver observação no rodapé) ── */
export interface DocFile {
  file: File;
  label: string;
}

export interface WizardFooterContext {
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  hasId: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSaveNow: () => void;
  onCancel: () => void;
}

interface PatientFormWizardProps {
  initialData?: Partial<Patient>;
  onSave: (data: Partial<Patient>, files: DocFile[], photoFile?: File | null) => void;
  onCancel: () => void;
  /** Se fornecido, o footer interno é omitido e o pai controla o footer */
  renderFooter?: (ctx: WizardFooterContext) => React.ReactNode;
  /** Oculta o header interno (quando embutido num Modal que já tem header) */
  hideHeader?: boolean;
  /** Chamado quando o step muda — permite pai atualizar footer externo */
  onStepChange?: (ctx: WizardFooterContext) => void;
}

const STEPS = [
  { id: 'paciente', title: 'Dados do Paciente', icon: <User size={18} /> },
  { id: 'responsavel', title: 'Responsável', icon: <Users size={18} /> },
  { id: 'escola', title: 'Escola', icon: <GraduationCap size={18} /> },
  { id: 'clinico', title: 'Clínico', icon: <FileHeart size={18} /> },
  { id: 'convenio', title: 'Convênio', icon: <CreditCard size={18} /> },
  { id: 'documentos', title: 'Documentos', icon: <FileText size={18} /> },
];

const inputClass =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1070ca]/20 focus:border-[#1070ca] outline-none transition-all';
const labelClass = 'text-xs font-semibold text-slate-600';

export const PatientFormWizard: React.FC<PatientFormWizardProps> = ({
  initialData = {} as Partial<Patient>,
  onSave,
  onCancel,
  renderFooter,
  hideHeader = false,
  onStepChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<DocFile[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData.foto || '');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const saveDataRef = useRef({ formData: {} as Partial<Patient>, selectedFiles: [] as DocFile[], photoFile: null as File | null });

  const [formData, setFormData] = useState<Partial<Patient>>(() => ({
    status: PatientStatus.ACTIVE,
    tipoPagamento: 'Particular',
    ...initialData,
    financeiroDiferente: !!(initialData.responsavelFinanceiroNome || initialData.responsavelFinanceiroCpf),
  } as Partial<Patient> & { financeiroDiferente?: boolean }));

  const financeiroDiferente = (formData as any).financeiroDiferente as boolean;

  const updateField = (field: keyof Patient, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setFinanceiroDiferente = (value: boolean) => {
    setFormData((prev) => {
      const next: any = { ...prev, financeiroDiferente: value };
      if (!value) {
        next.responsavelFinanceiroNome = '';
        next.responsavelFinanceiroCpf = '';
        next.responsavelFinanceiroTelefone = '';
      }
      return next;
    });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  React.useEffect(() => {
    if (!onStepChange) return;
    onStepChange({
      currentStep,
      totalSteps: STEPS.length,
      isLastStep: currentStep === STEPS.length - 1,
      hasId: !!formData.id,
      onNext: handleNext,
      onPrev: handlePrev,
      onSaveNow: () => {
        const { formData: d, selectedFiles: f, photoFile: p } = saveDataRef.current;
        onSave(d, f, p);
      },
      onCancel,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, !!formData.id]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Dados do Paciente
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fadeIn">
            <div className="md:col-span-2 flex justify-center mb-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoFile(file);
                  const reader = new FileReader();
                  reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="relative group w-20 h-20 rounded-full border-2 border-dashed border-slate-300 hover:border-[#1070ca] transition-colors overflow-hidden bg-slate-50"
              >
                {photoPreview ? (
                  photoPreview.length <= 4 ? (
                    <span className="flex items-center justify-center h-full w-full text-3xl">{photoPreview}</span>
                  ) : (
                    <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1 text-slate-400">
                    <User size={24} />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Foto</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={18} className="text-white" />
                </div>
              </button>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className={labelClass}>Nome completo *</label>
              <input
                type="text"
                required
                className={inputClass}
                value={formData.nome || ''}
                onChange={(e) => updateField('nome', e.target.value)}
                placeholder="Nome completo da criança/paciente"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Data de nascimento *</label>
              <DatePicker
                value={formData.dataNascimento || ''}
                onChange={(val) => updateField('dataNascimento', val || '')}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Telefone</label>
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                className={inputClass}
                value={formData.telefone || ''}
                onChange={(e) => updateField('telefone', mkP(e.target.value))}
                maxLength={15}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className={labelClass}>Status</label>
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1">
                {Object.values(PatientStatus).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateField('status', status)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      formData.status === status ? 'bg-[#1070ca] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // Responsável
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2 space-y-2">
                <label className={labelClass}>Nome do responsável *</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={formData.responsavel || ''}
                  onChange={(e) => updateField('responsavel', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Grau de parentesco</label>
                <select
                  className={`${inputClass} bg-white`}
                  value={formData.responsavelParentesco || ''}
                  onChange={(e) => updateField('responsavelParentesco', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Pai">Pai</option>
                  <option value="Avó">Avó</option>
                  <option value="Avô">Avô</option>
                  <option value="Tio/Tia">Tio/Tia</option>
                  <option value="Cuidador/Tutor">Cuidador / Tutor Legal</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>CPF do responsável</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  className={inputClass}
                  value={formData.responsavelCpf || ''}
                  onChange={(e) => updateField('responsavelCpf', mkC(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Telefone de contato</label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  className={inputClass}
                  value={formData.telefone || ''}
                  onChange={(e) => updateField('telefone', mkP(e.target.value))}
                  maxLength={15}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CreditCard size={16} className="text-[#1070ca]" /> Responsável Financeiro
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                    O responsável financeiro é diferente do responsável legal?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFinanceiroDiferente(!financeiroDiferente)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    financeiroDiferente ? 'bg-[#1070ca]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      financeiroDiferente ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {financeiroDiferente && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fadeIn">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className={labelClass}>Nome do responsável financeiro</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={formData.responsavelFinanceiroNome || ''}
                      onChange={(e) => updateField('responsavelFinanceiroNome', e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>CPF do responsável financeiro</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={formData.responsavelFinanceiroCpf || ''}
                      onChange={(e) => updateField('responsavelFinanceiroCpf', mkC(e.target.value))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Telefone do responsável financeiro</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={formData.responsavelFinanceiroTelefone || ''}
                      onChange={(e) => updateField('responsavelFinanceiroTelefone', mkP(e.target.value))}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2: // Escola
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fadeIn">
            <div className="md:col-span-2 space-y-2">
              <label className={labelClass}>Escola</label>
              <input
                type="text"
                className={inputClass}
                value={formData.escola || ''}
                onChange={(e) => updateField('escola', e.target.value)}
                placeholder="Nome da instituição de ensino"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Ano / série</label>
              <input
                type="text"
                className={inputClass}
                value={formData.anoSerie || ''}
                onChange={(e) => updateField('anoSerie', e.target.value)}
                placeholder="Ex: 2º ano do Ensino Fundamental"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Professor(a)</label>
              <input
                type="text"
                className={inputClass}
                value={formData.professor || ''}
                onChange={(e) => updateField('professor', e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className={labelClass}>Coordenador(a) pedagógico(a)</label>
              <input
                type="text"
                className={inputClass}
                value={formData.coordenador || ''}
                onChange={(e) => updateField('coordenador', e.target.value)}
              />
            </div>
          </div>
        );

      case 3: // Clínico
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fadeIn">
            <div className="space-y-2">
              <label className={labelClass}>Médico responsável</label>
              <input
                type="text"
                className={inputClass}
                value={formData.medico || ''}
                onChange={(e) => updateField('medico', e.target.value)}
                placeholder="Ex: Dr. Roberto Albuquerque"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Data de início</label>
              <DatePicker
                value={formData.dataInicio || ''}
                onChange={(val) => updateField('dataInicio', val || '')}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Diagnóstico</label>
              <input
                type="text"
                className={inputClass}
                value={formData.diagnostico || ''}
                onChange={(e) => updateField('diagnostico', e.target.value)}
                placeholder="Ex: TEA Nível 1, TDAH"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>CID</label>
              <input
                type="text"
                className={inputClass}
                value={formData.cid || ''}
                onChange={(e) => updateField('cid', e.target.value)}
                placeholder="Ex: F84.0"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className={labelClass}>Medicamentos de uso contínuo</label>
              <input
                type="text"
                className={inputClass}
                value={formData.medicamentos || ''}
                onChange={(e) => updateField('medicamentos', e.target.value)}
                placeholder="Ex: Risperidona 0.5mg à noite"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className={labelClass}>Histórico clínico</label>
              <textarea
                rows={4}
                className={`${inputClass} resize-none`}
                value={formData.historicoClinico || ''}
                onChange={(e) => updateField('historicoClinico', e.target.value)}
                placeholder="Relato sobre nascimento, intercorrências neurológicas, comportamentos iniciais..."
              />
            </div>
          </div>
        );

      case 4: // Convênio
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <label className={labelClass}>Tipo de pagamento</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer border p-4 rounded-xl flex-1 hover:bg-slate-50 transition-colors shadow-sm">
                  <input
                    type="radio"
                    name="tipoPagamento"
                    checked={formData.tipoPagamento === 'Particular'}
                    onChange={() => updateField('tipoPagamento', 'Particular')}
                    className="text-[#1070ca]"
                  />
                  <span className="font-bold">Particular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer border p-4 rounded-xl flex-1 hover:bg-slate-50 transition-colors shadow-sm">
                  <input
                    type="radio"
                    name="tipoPagamento"
                    checked={formData.tipoPagamento === 'Convênio'}
                    onChange={() => updateField('tipoPagamento', 'Convênio')}
                    className="text-[#1070ca]"
                  />
                  <span className="font-bold">Convênio</span>
                </label>
              </div>
            </div>

            {formData.tipoPagamento === 'Convênio' && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Operadora do convênio</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#1070ca]/20 focus:border-[#1070ca]"
                    value={formData.convenio || ''}
                    onChange={(e) => updateField('convenio', e.target.value)}
                    placeholder="Ex: Bradesco Saúde"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nº carteirinha</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#1070ca]/20 focus:border-[#1070ca]"
                      value={formData.convenioCarteirinha || ''}
                      onChange={(e) => updateField('convenioCarteirinha', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Validade</label>
                    <DatePicker
                      value={formData.convenioValidade || ''}
                      onChange={(val) => updateField('convenioValidade', val || '')}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5: // Documentos
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-semibold">
              Nesta etapa apenas o nome do documento é registrado no prontuário. O armazenamento do
              arquivo em si ainda não está disponível — envie/guarde o arquivo original por fora do sistema.
            </div>
            <input
              type="file"
              className="hidden"
              id="patient-docs-upload"
              multiple
              onChange={(e) => {
                const files: File[] = Array.from(e.target.files || []);
                if (!files.length) return;
                setSelectedFiles((prev) => [...prev, ...files.map((f) => ({ file: f, label: f.name }))]);
                e.target.value = '';
              }}
            />
            <label
              htmlFor="patient-docs-upload"
              className="border-2 border-dashed border-slate-300 rounded-[2rem] p-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50 hover:bg-blue-50/30 hover:border-[#1070ca]/40 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-8 w-8 text-[#1070ca]" />
              </div>
              <p className="font-bold text-slate-700">Anexar documentos / laudos</p>
              <p className="text-xs mt-1">Clique ou arraste arquivos para registrar seus nomes no prontuário</p>
            </label>

            {selectedFiles.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-600">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((doc, idx) => (
                    <div key={`${doc.file.name}-${doc.file.size}-${idx}`} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={doc.label}
                          onChange={(e) =>
                            setSelectedFiles((prev) => prev.map((d, i) => (i === idx ? { ...d, label: e.target.value } : d)))
                          }
                          placeholder="Nome do documento"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1070ca] text-slate-700"
                        />
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate px-0.5">{doc.file.name}</div>
                      </div>
                      <IconButton
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="shrink-0 hover:text-red-500 hover:bg-red-50"
                      >
                        <X size={14} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedFiles.length === 0 && (
              <button
                type="button"
                onClick={() => document.getElementById('patient-docs-upload')?.click()}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#1070ca] py-2"
              >
                <Plus size={14} /> Adicionar documento
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  saveDataRef.current = { formData, selectedFiles, photoFile };

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-5 pt-3 pb-4 shrink-0">
        {!hideHeader && (
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {formData.id ? 'Editar Paciente' : 'Novo Paciente'}
              </h2>
              <p className="text-[11px] text-[#1070ca] font-semibold mt-0.5">
                Passo {currentStep + 1} de {STEPS.length} — {STEPS[currentStep].title}
              </p>
            </div>
            <IconButton variant="ghost" size="sm" onClick={onCancel}>
              <X size={18} />
            </IconButton>
          </div>
        )}

        {/* Progress steps */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs shrink-0 ${
                  idx === currentStep
                    ? 'bg-[#1070ca] border-[#1070ca] text-white shadow-md shadow-[#1070ca]/30'
                    : idx < currentStep
                    ? 'bg-[#e6f0f8] border-[#1070ca]/40 text-[#1070ca]'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {idx < currentStep ? <CheckCircle size={14} /> : step.icon}
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-colors ${idx < currentStep ? 'bg-[#1070ca]/40' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Body scrollável */}
      <div className="flex-1 px-4 sm:px-5 py-4 overflow-y-auto overscroll-contain">{renderStepContent()}</div>

      {/* Footer — padrão interno (omitido quando pai gerencia via onStepChange/renderFooter) */}
      {!onStepChange && !renderFooter && (
        <div className="px-4 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-slate-100 bg-white flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
          <Button
            variant="ghost"
            size="md"
            onClick={currentStep === 0 ? onCancel : handlePrev}
            iconLeft={currentStep > 0 ? <ChevronLeft size={16} /> : undefined}
            fullWidth
            className="sm:w-auto"
          >
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {formData.id && currentStep < STEPS.length - 1 && (
              <Button
                variant="outline"
                size="md"
                onClick={() => onSave(formData, selectedFiles, photoFile)}
                iconLeft={<Save size={15} />}
                fullWidth
                className="sm:w-auto"
              >
                Salvar
              </Button>
            )}
            {currentStep === STEPS.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => onSave(formData, selectedFiles, photoFile)}
                iconLeft={<Save size={15} />}
                fullWidth
                className="sm:w-auto"
              >
                Concluir
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleNext} iconRight={<ChevronRight size={16} />} fullWidth className="sm:w-auto">
                Próximo
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── WizardModal ──────────────────────────────────────────────────────────
// Wrapper que combina Modal + PatientFormWizard com footer fixo, seguindo o
// mesmo padrão do restante do sistema (Modal com footer sticky).

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Patient>;
  onSave: (data: Partial<Patient>, files: DocFile[], photoFile?: File | null) => void;
}

export const WizardModal: React.FC<WizardModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
  const [footerMeta, setFooterMeta] = React.useState({ currentStep: 0, isLastStep: false, hasId: false });
  const wizardFnsRef = React.useRef<Pick<WizardFooterContext, 'onNext' | 'onPrev' | 'onSaveNow' | 'onCancel'>>({
    onNext: () => {},
    onPrev: () => {},
    onSaveNow: () => {},
    onCancel: onClose,
  });

  React.useEffect(() => {
    if (!isOpen) setFooterMeta({ currentStep: 0, isLastStep: false, hasId: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div>{initialData?.id ? 'Editar Paciente' : 'Novo Paciente'}</div>
          <div className="text-[11px] text-[#1070ca] font-semibold normal-case tracking-normal mt-0.5">
            Passo {footerMeta.currentStep + 1} de {STEPS.length} — {STEPS[footerMeta.currentStep].title}
          </div>
        </div>
      }
      size="2xl"
      mobileStyle="bottom-sheet"
      className="sm:max-w-[760px]"
      footer={
        <div className="flex flex-col-reverse sm:flex-row w-full sm:justify-between sm:items-center gap-2">
          {/* Mobile */}
          <div className="flex sm:hidden flex-col gap-2">
            {footerMeta.isLastStep ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => wizardFnsRef.current.onSaveNow()}
                iconLeft={<Save size={15} />}
                fullWidth
                className="h-12 rounded-2xl text-sm"
              >
                Concluir
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => wizardFnsRef.current.onNext()}
                iconRight={<ChevronRight size={16} />}
                fullWidth
                className="h-12 rounded-2xl text-sm"
              >
                Próximo
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (footerMeta.currentStep === 0 ? wizardFnsRef.current.onCancel() : wizardFnsRef.current.onPrev())}
                iconLeft={footerMeta.currentStep > 0 ? <ChevronLeft size={14} /> : undefined}
                fullWidth
                className="text-zinc-500"
              >
                {footerMeta.currentStep === 0 ? 'Cancelar' : 'Voltar'}
              </Button>
              {footerMeta.hasId && !footerMeta.isLastStep && (
                <Button variant="outline" size="sm" onClick={() => wizardFnsRef.current.onSaveNow()} iconLeft={<Save size={13} />} className="shrink-0">
                  Salvar
                </Button>
              )}
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden sm:flex w-full justify-between items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (footerMeta.currentStep === 0 ? wizardFnsRef.current.onCancel() : wizardFnsRef.current.onPrev())}
              iconLeft={footerMeta.currentStep > 0 ? <ChevronLeft size={14} /> : undefined}
            >
              {footerMeta.currentStep === 0 ? 'Cancelar' : 'Voltar'}
            </Button>
            <div className="flex gap-2">
              {footerMeta.hasId && !footerMeta.isLastStep && (
                <Button variant="outline" size="sm" onClick={() => wizardFnsRef.current.onSaveNow()} iconLeft={<Save size={13} />}>
                  Salvar
                </Button>
              )}
              {footerMeta.isLastStep ? (
                <Button variant="primary" size="sm" onClick={() => wizardFnsRef.current.onSaveNow()} iconLeft={<Save size={13} />}>
                  Concluir
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => wizardFnsRef.current.onNext()} iconRight={<ChevronRight size={14} />}>
                  Próximo
                </Button>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="-m-4 sm:-m-7 flex flex-col flex-1 min-h-0">
        <PatientFormWizard
          initialData={initialData || {}}
          onSave={onSave}
          onCancel={onClose}
          hideHeader
          onStepChange={(ctx) => {
            wizardFnsRef.current = { onNext: ctx.onNext, onPrev: ctx.onPrev, onSaveNow: ctx.onSaveNow, onCancel: ctx.onCancel };
            setFooterMeta({ currentStep: ctx.currentStep, isLastStep: ctx.isLastStep, hasId: ctx.hasId });
          }}
        />
      </div>
    </Modal>
  );
};
