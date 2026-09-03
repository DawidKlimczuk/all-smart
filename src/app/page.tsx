"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Sun, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Lightbulb, 
  ShieldCheck,
  Zap
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (data?.session) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.message?.includes("Invalid login credentials")) {
        setErrorMsg("Niepoprawny adres email lub hasło");
      } else if (err.message?.includes("Email not confirmed")) {
        setErrorMsg("Adres e-mail nie został jeszcze potwierdzony");
      } else {
        setErrorMsg(err.message || "Wystąpił błąd logowania");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#040814] via-[#071126] to-[#02050b] flex items-center justify-center p-4 selection:bg-amber-400 selection:text-black">
      
      {/* Ambientowe źródła światła (Glow w tle) */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Tło z motywem IoT / żarówek */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] overflow-hidden">
        <Lightbulb className="absolute top-12 left-12 w-72 h-72 text-amber-300 transform -rotate-12" />
        <Zap className="absolute bottom-16 left-1/4 w-80 h-80 text-blue-400 transform rotate-45" />
        <Lightbulb className="absolute -bottom-10 right-12 w-96 h-96 text-amber-400 transform rotate-12" />
      </div>

      {/* Karta logowania z wielowarstwowym ambient border */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Zewnętrzna dynamiczna obwódka gradientowa */}
        <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-b from-amber-400/60 via-blue-500/30 to-amber-500/20 shadow-[0_0_50px_-12px_rgba(245,158,11,0.25)]">
          <div className="rounded-[23px] bg-[#070f21]/95 backdrop-blur-2xl p-7 md:p-9 shadow-2xl relative overflow-hidden">
            
            {/* Wewnętrzny akcent świetlny na górze karty */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-amber-400/30 to-transparent blur-2xl pointer-events-none" />

            {/* Nagłówek z obracającym się słońcem */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.3)] mb-4">
                <Sun className="w-8 h-8 text-amber-400 animate-[spin_16s_linear_infinite]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-blue-400 uppercase font-sans">
                AllSmart Hub
              </h1>
              <p className="text-xs text-blue-200/60 font-mono tracking-wider mt-1.5">
                Inteligentne centrum zarządzania domem
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono text-center animate-in fade-in duration-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Pole Email / Login */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Adres Email / Login</span>
                  <span className="text-[10px] text-amber-400/80 font-mono">Wymagane</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-400 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="twoj@email.com lub login"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a152d]/90 border border-blue-900/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Pole Hasło */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Hasło</span>
                  <span className="text-[10px] text-blue-400/80 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> SSL Secured
                  </span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-[#0a152d]/90 border border-blue-900/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Zapamiętaj */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-blue-800 bg-[#0a152d] text-amber-400 focus:ring-amber-400/40 focus:ring-offset-0 accent-amber-400 cursor-pointer"
                  />
                  <span>Zapamiętaj to urządzenie</span>
                </label>
              </div>

              {/* Przycisk Logowania */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.35)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-all transform active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Zaloguj się</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-blue-900/40 text-center text-xs text-slate-400">
              Nie masz jeszcze konta?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 decoration-amber-500/50 hover:decoration-amber-300 transition cursor-pointer"
              >
                Zarejestruj się
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}