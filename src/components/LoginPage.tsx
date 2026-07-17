import React, { useState } from "react";
import { Shield, Key, Mail, Lock, Heart, ArrowLeft, CheckCircle2, Sparkles, Smile, LayoutGrid, Award, BookOpen, Loader2, Eye, EyeOff } from "lucide-react";
import { LogoSVG } from "./LandingPage";
import { useAuth } from "../contexts/AuthContext";

interface LoginPageProps {
  onLoginSuccess: () => void;
  onBackToLanding: () => void;
}

export default function LoginPage({ onLoginSuccess, onBackToLanding }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverSent, setRecoverSent] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdAccepted) {
      setError("Você precisa aceitar os termos de responsabilidade e LGPD para acessar.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoverEmail.trim()) {
      setRecoverSent(true);
      setTimeout(() => {
        setRecoverSent(false);
        setShowRecover(false);
        setRecoverEmail("");
      }, 4000);
    }
  };

  return (
    <div id="login-page" className="min-h-screen bg-slate-50/50 flex flex-col lg:flex-row selection:bg-[#1070ca] selection:text-white relative font-sans overflow-x-hidden">

      {/* LEFT COLUMN: Login and Form Interaction (~42% Width on Desktop) */}
      <div className="w-full lg:w-[42%] xl:w-[38%] min-h-screen bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-r border-slate-100 z-10 shadow-sm">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-end">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#1070ca] font-mono bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/50">
            Ambiente Seguro
          </span>
        </div>

        {/* Center Section: App Brand & Core Login Form */}
        <div className="my-auto py-8 space-y-7 max-w-sm mx-auto w-full">
          
          {/* Logo & Subtitle */}
          <div className="space-y-3 text-center lg:text-left">
            <div className="h-16 w-20 flex items-center justify-center mx-auto lg:mx-0">
              <LogoSVG className="h-full w-full" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-none text-slate-900">
                Aprender a Ser <span className="text-[#1070ca]">Pro</span>
              </h2>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2 font-mono">
                Painel Multidisciplinar Integrado
              </p>
            </div>
          </div>

          {/* Form Switcher */}
          {!showRecover ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Login Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-3 bg-slate-50/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1070ca]/20 focus:border-[#1070ca] focus:bg-white text-xs text-slate-700 font-semibold transition-all placeholder-slate-400"
                    placeholder=""
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="pass" className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecover(true);
                      setError("");
                    }}
                    className="font-bold text-[#1070ca] hover:text-[#0b5194] text-[10px] cursor-pointer hover:underline"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="pass"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-slate-50/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1070ca]/20 focus:border-[#1070ca] focus:bg-white text-xs text-slate-700 font-semibold transition-all placeholder-slate-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#1070ca] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded-xl font-medium leading-normal animate-fade-in">
                  ⚠️ {error}
                </div>
              )}

              {/* LGPD Safety Checkbox */}
              <div className="flex items-start gap-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                <input
                  id="lgpd-checkbox"
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => setLgpdAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-[#1070ca] focus:ring-[#1070ca] h-4 w-4 cursor-pointer"
                />
                <label htmlFor="lgpd-checkbox" className="text-[10px] text-slate-500 leading-normal select-none font-medium">
                  Estou ciente de que este sistema contém prontuários e dados de saúde de menores de idade, sob conformidade com as diretrizes da <strong>LGPD (Lei 13.709)</strong>.
                </label>
              </div>

              {/* Access Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-slate-900 hover:bg-[#1070ca] text-white rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md shadow-slate-900/10 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Autenticando...
                  </>
                ) : (
                  "Acessar Área Clínica"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecoverSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-display font-semibold border-b border-slate-100 pb-2.5">
                <Key className="h-4.5 w-4.5 text-[#1070ca]" />
                <span className="text-sm">Recuperação de Credenciais</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Insira o e-mail cadastrado. Enviaremos as instruções de redefinição de credenciais de forma segura.
              </p>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  E-mail de Cadastro
                </label>
                <input
                  type="email"
                  required
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1070ca] text-xs font-semibold"
                  placeholder="exemplo@aprenderaser.com"
                />
              </div>

              {recoverSent && (
                <div className="p-3 bg-blue-50 border border-blue-100 text-[#1070ca] text-[11px] rounded-xl font-medium animate-fade-in">
                  Link de redefinição de segurança enviado para o e-mail informado com sucesso!
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecover(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Voltar ao Login
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-full bg-slate-900 hover:bg-[#1070ca] text-white font-black text-xs cursor-pointer transition-colors"
                >
                  Enviar Instruções
                </button>
              </div>
            </form>
          )}

          {/* Security Footer Note */}
          <div className="border-t border-slate-100 pt-5 flex items-center gap-1.5 justify-center">
            <Shield className="h-3.5 w-3.5 text-[#ebb448]" />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center font-mono">
              Acesso restrito a profissionais autorizados
            </p>
          </div>

        </div>

        {/* Footer info at left bottom */}
        <p className="text-[9px] text-slate-400 font-semibold text-center uppercase tracking-widest font-mono">
          © 2026 Espaço Aprender a Ser
        </p>

      </div>

      {/* RIGHT COLUMN: Premium Clinic Showcase Info Panel (Hidden on Mobile/Tablet, desktop only) */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] bg-slate-900 relative overflow-hidden flex-col justify-between p-12 lg:p-16 text-white">
        
        {/* Artistic glowing backgrounds */}
        <div className="absolute top-0 right-0 h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-10 left-20 h-[350px] w-[350px] rounded-full bg-[#d43f72]/10 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/2" />

        {/* Showcase Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ebb448] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#ebb448] font-mono">
              Clínica Integrada de Desenvolvimento Infantil
            </span>
          </div>

          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
            Tatuí - SP
          </span>
        </div>

        {/* Center content block */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto">
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">
              <Sparkles className="h-3.5 w-3.5 text-[#ebb448]" /> Tecnologia Humanizada no Cuidado
            </div>

            <h1 className="text-3xl lg:text-4xl font-display font-black tracking-tight leading-none text-white">
              Ambiência estruturada para potencializar a evolução clínica.
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
              O Aprender a Ser une metodologias científicas consolidadas à sofisticação de espaços multissensoriais para acelerar marcos de neurodesenvolvimento em crianças atípicas.
            </p>
          </div>

          {/* Clinical Pillars Showcards */}
          <div className="grid grid-cols-1 gap-4">
            
            {/* Pillar 1 */}
            <div className="flex gap-4 p-4.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md hover:bg-white/10 transition duration-300">
              <div className="h-10 w-10 rounded-xl bg-[#1070ca]/15 text-[#1070ca] flex items-center justify-center text-sm shrink-0 font-bold border border-[#1070ca]/20">
                <Smile className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 font-mono">Metodologia ABA de Referência</h4>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  Registro sistêmico de comportamentos operantes, antecedentes e esvanecimento de ajudas com precisão científica.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex gap-4 p-4.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md hover:bg-white/10 transition duration-300">
              <div className="h-10 w-10 rounded-xl bg-[#ebb448]/15 text-[#ebb448] flex items-center justify-center text-sm shrink-0 font-bold border border-[#ebb448]/20">
                <Award className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 font-mono">Atelier Lúdico & Snoezelen</h4>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  Controle integrado de estímulos sensoriais adaptados para autorregulação tátil, visual e proprioceptiva de forma científica.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex gap-4 p-4.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md hover:bg-white/10 transition duration-300">
              <div className="h-10 w-10 rounded-xl bg-[#d43f72]/15 text-[#d43f72] flex items-center justify-center text-sm shrink-0 font-bold border border-[#d43f72]/20">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 font-mono">Metas PEI em Tempo Real</h4>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  Planejamento e monitoramento individual de objetivos de aprendizagem com critérios mensuráveis e relatórios estruturados.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Right side Bottom Badge */}
        <div className="relative z-10 flex justify-between items-center border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">
            <CheckCircle2 className="h-4.5 w-4.5 text-[#1070ca]" /> Total Conformidade HIPAA & LGPD
          </div>

          <span className="text-[10px] text-slate-400 font-mono">
            v2.6.0
          </span>
        </div>

      </div>

    </div>
  );
}
