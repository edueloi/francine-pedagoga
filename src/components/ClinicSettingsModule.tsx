import React, { useEffect, useRef, useState } from "react";
import { Building2, ImagePlus, RefreshCw, Save, Image as ImageIcon } from "lucide-react";
import { UserRole, UserPermissions } from "../types";
import { useClinicSettings, ClinicSettingsPayload } from "../hooks/useClinicSettings";
import { useFileUpload } from "../hooks/useFileUpload";
import { Textarea, useToast } from "./UI";

interface ClinicSettingsModuleProps {
  userRole: UserRole;
  userPermissions?: UserPermissions;
}

interface FormState {
  name: string;
  documentNumber: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  activities: string;
  logoUrl: string;
  coverImageUrl: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  documentNumber: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  activities: "",
  logoUrl: "",
  coverImageUrl: "",
};

const fieldClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-2 focus:ring-[#1070ca] focus:bg-white focus:outline-none transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed";
const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider";

export default function ClinicSettingsModule({ userRole, userPermissions }: ClinicSettingsModuleProps) {
  const toast = useToast();
  const { settings, loading, updateSettings } = useClinicSettings();
  const { uploadFile, uploading } = useFileUpload();

  const canEdit = userPermissions ? userPermissions.clinicSettings.editar : userRole === UserRole.ADMIN;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!settings) return;
    setForm({
      name: settings.name ?? "",
      documentNumber: settings.documentNumber ?? "",
      address: settings.address ?? "",
      phone: settings.phone ?? "",
      email: settings.email ?? "",
      description: settings.description ?? "",
      activities: settings.activities ?? "",
      logoUrl: settings.logoUrl ?? "",
      coverImageUrl: settings.coverImageUrl ?? "",
    });
  }, [settings]);

  const handleField = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleUpload = async (
    file: File,
    key: "logoUrl" | "coverImageUrl",
    setUploadingFlag: (v: boolean) => void
  ) => {
    setUploadingFlag(true);
    try {
      const url = await uploadFile("clinic", file);
      setForm((prev) => ({ ...prev, [key]: url }));
      toast.success(
        key === "logoUrl"
          ? "Logo enviada com sucesso. Clique em Salvar Alterações para confirmar."
          : "Imagem de capa enviada com sucesso. Clique em Salvar Alterações para confirmar."
      );
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar imagem.");
    } finally {
      setUploadingFlag(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("O nome da clínica é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const payload: ClinicSettingsPayload = {
        name: form.name.trim(),
        documentNumber: form.documentNumber.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        description: form.description.trim() || null,
        activities: form.activities.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        coverImageUrl: form.coverImageUrl.trim() || null,
      };
      await updateSettings(payload);
      toast.success("Dados da clínica atualizados com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar dados da clínica.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="clinic-settings-module" className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
          <span className="p-1 rounded-xl bg-blue-50 text-[#1070ca]">
            <Building2 className="h-5 w-5" />
          </span>
          Minha Clínica
        </h2>
        <p className="text-xs text-slate-500 font-medium font-sans">
          Estes dados representam a identidade da clínica e aparecem em formulários e páginas públicas
          compartilhadas com as famílias.
        </p>
      </div>

      {loading && <p className="text-xs text-slate-400 text-center py-6">Carregando dados da clínica...</p>}

      {!loading && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Logo & Cover uploads */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Logo da Clínica</label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo da clínica" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-slate-300" />
                  )}
                </div>
                {canEdit && (
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file, "logoUrl", setUploadingLogo);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {uploadingLogo ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" />
                      )}
                      {uploadingLogo ? "Enviando..." : "Enviar Logo"}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1.5">JPG, PNG ou WebP até 5MB.</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>Imagem de Capa (opcional)</label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-32 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {form.coverImageUrl ? (
                    <img src={form.coverImageUrl} alt="Imagem de capa" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-slate-300" />
                  )}
                </div>
                {canEdit && (
                  <div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file, "coverImageUrl", setUploadingCover);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {uploadingCover ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" />
                      )}
                      {uploadingCover ? "Enviando..." : "Enviar Capa"}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1.5">Usada como banner em formulários públicos.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nome da Clínica *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={handleField("name")}
                disabled={!canEdit}
                placeholder="Ex: Espaço Aprender a Ser"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>CPF/CNPJ</label>
              <input
                type="text"
                value={form.documentNumber}
                onChange={handleField("documentNumber")}
                disabled={!canEdit}
                placeholder="00.000.000/0000-00"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={handleField("phone")}
                disabled={!canEdit}
                placeholder="(11) 90000-0000"
                className={fieldClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Endereço</label>
              <input
                type="text"
                value={form.address}
                onChange={handleField("address")}
                disabled={!canEdit}
                placeholder="Rua, número, bairro, cidade - UF"
                className={fieldClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={handleField("email")}
                disabled={!canEdit}
                placeholder="contato@clinica.com.br"
                className={fieldClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Descrição</label>
              <Textarea
                value={form.description}
                onChange={handleField("description")}
                disabled={!canEdit}
                rows={4}
                placeholder="Texto de apresentação exibido em formulários públicos (quem somos)."
                className="text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Atividades / Especialidades</label>
              <Textarea
                value={form.activities}
                onChange={handleField("activities")}
                disabled={!canEdit}
                rows={4}
                placeholder="Ex: Psicopedagogia, Terapia ABA, Integração Sensorial..."
                className="text-xs"
              />
            </div>
          </div>

          {canEdit && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploading}
                className="w-full sm:w-auto px-6 py-3 bg-[#1070ca] hover:bg-[#0b5194] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-md shadow-blue-500/5 flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
