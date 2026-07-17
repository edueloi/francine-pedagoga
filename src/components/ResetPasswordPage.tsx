import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, ShieldAlert } from "lucide-react";
import { LogoSVG } from "./LandingPage";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível redefinir a senha.");
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err: any) {
      setError(err.message || "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="font-display font-black text-slate-900 text-lg">Link inválido</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Este link de redefinição está incompleto ou já expirou. Solicite um novo link na tela de login.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-slate-900 hover:bg-[#1070ca] text-white rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="space-y-3 text-center">
          <div className="h-14 w-16 flex items-center justify-center mx-auto">
            <LogoSVG className="h-full w-full" />
          </div>
          <h2 className="font-display font-black text-slate-900 text-lg">Definir Nova Senha</h2>
        </div>

        {done ? (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-800">Senha redefinida com sucesso!</p>
            <p className="text-[11px] text-emerald-600">Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Nova senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1070ca]/20 focus:border-[#1070ca] focus:bg-white text-xs text-slate-700 font-semibold transition-all"
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

            <div className="space-y-1.5">
              <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Confirmar nova senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-3 bg-slate-50/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1070ca]/20 focus:border-[#1070ca] focus:bg-white text-xs text-slate-700 font-semibold transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded-xl font-medium leading-normal">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-[#1070ca] text-white rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md shadow-slate-900/10 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
