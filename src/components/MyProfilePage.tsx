import React, { useEffect, useRef, useState } from "react";
import { Camera, Save, RefreshCw, Eye, EyeOff, Lock, User, Briefcase, Calendar, Sparkles } from "lucide-react";
import { useMyProfile } from "../hooks/useMyProfile";
import { useFileUpload } from "../hooks/useFileUpload";
import { useToast } from "./UI";

export default function MyProfilePage() {
  const { profile, loading, updateProfile } = useMyProfile();
  const { uploadFile, uploading } = useFileUpload();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profissao, setProfissao] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [abordagens, setAbordagens] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setAvatarUrl(profile.avatarUrl || "");
    setProfissao(profile.profissao || "");
    setDataNascimento(profile.dataNascimento ? profile.dataNascimento.slice(0, 10) : "");
    setAbordagens(profile.abordagens || "");
  }, [profile]);

  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile("avatars", file);
      setAvatarUrl(url);
      toast.success("Foto atualizada. Clique em salvar para confirmar.");
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar a foto.");
    } finally {
      e.target.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name, avatarUrl, profissao, dataNascimento, abordagens });
      toast.success("Perfil atualizado com sucesso.");
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSavingPassword(true);
    try {
      await updateProfile({ name, avatarUrl, profissao, dataNascimento, abordagens, currentPassword, newPassword });
      toast.success("Senha atualizada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Falha ao atualizar a senha.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading && !profile) {
    return <p className="text-xs text-slate-400 text-center py-10">Carregando perfil...</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
          <span className="p-1 rounded-xl bg-blue-50 text-[#1070ca] text-lg">👤</span> Meu Perfil
        </h2>
        <p className="text-xs text-slate-500 font-medium">Gerencie seus dados pessoais, foto e senha de acesso.</p>
      </div>

      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#1070ca] to-[#d43f72] p-0.5">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-black text-[#1070ca] text-xl">{initials}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-slate-900 hover:bg-[#1070ca] text-white flex items-center justify-center shadow-md transition-colors cursor-pointer disabled:opacity-60"
              aria-label="Alterar foto de perfil"
            >
              {uploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">{name || "Usuário"}</p>
            <p className="text-xs text-slate-400 font-mono">{profile?.email}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{profile?.role}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <User className="h-3 w-3" /> Nome completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> Cargo / Profissão
            </label>
            <input
              type="text"
              value={profissao}
              onChange={(e) => setProfissao(e.target.value)}
              placeholder="Ex: Terapeuta Ocupacional"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data de aniversário
            </label>
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Abordagens / Especialidades
            </label>
            <input
              type="text"
              value={abordagens}
              onChange={(e) => setAbordagens(e.target.value)}
              placeholder="Ex: ABA, Neuropsicopedagogia, Integração Sensorial"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
            />
            <p className="text-[10px] text-slate-400">Separe múltiplas abordagens por vírgula.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="py-2.5 px-5 bg-[#1070ca] hover:bg-[#0b5194] disabled:opacity-40 text-white font-black rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
        >
          {savingProfile ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Perfil
        </button>
      </form>

      <form onSubmit={handleSavePassword} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
        <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-[#1070ca]" /> Alterar Senha
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Senha atual</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-9 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#1070ca] cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div />

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Nova senha</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-9 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#1070ca] cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Confirmar nova senha</label>
            <input
              type={showNewPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="py-2.5 px-5 bg-slate-900 hover:bg-[#1070ca] disabled:opacity-40 text-white font-black rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
        >
          {savingPassword ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Atualizar Senha
        </button>
      </form>
    </div>
  );
}
