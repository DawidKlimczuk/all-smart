"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    captcha: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (!isLogin) {
        // REJESTRACJA
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Hasła nie są identyczne.");
        }
        if (formData.captcha.trim() !== "8") {
          throw new Error("Nieprawidłowy wynik testu anty-bot (3 + 5 = 8).");
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            captchaAnswer: Number(formData.captcha),
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || `Błąd rejestracji (${res.status})`);
        }

        setIsLogin(true);
        setErrorMsg("Konto utworzone pomyślnie! Zaloguj się podając email i hasło.");
      } else {
        // LOGOWANIE BEZPOŚREDNIO PRZEZ KLIENTA SUPABASE
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });

        if (error) {
          throw new Error("Nieprawidłowy email lub hasło.");
        }

        if (data.session) {
          // Sesja została zapisana w pamięci podręcznej przeglądarki
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Neonowe tło */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Przycisk Live Demo */}
      <div className="absolute top-6 right-6">
        <Link
          href="/demo"
          className="group flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gray-900/80 border border-purple-500/30 hover:border-purple-500/70 backdrop-blur-md text-xs font-medium text-gray-300 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
          <span>Jak to działa? (Live Demo)</span>
          <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
        </Link>
      </div>

      {/* Formularz */}
      <div className="w-full max-w-md bg-gray-900/60 border border-gray-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AllSmart Hub
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isLogin ? "Zaloguj się do centrum sterowania" : "Utwórz konto i zarządzaj automatyką"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl text-xs bg-purple-950/40 border border-purple-500/30 text-purple-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nazwa użytkownika</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="np. klima"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-gray-950/70 border border-gray-800 focus:border-purple-500 rounded-xl px-10 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Adres Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                name="email"
                required
                placeholder="twoj@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-950/70 border border-gray-800 focus:border-purple-500 rounded-xl px-10 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Hasło</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-gray-950/70 border border-gray-800 focus:border-purple-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Potwierdź hasło</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-gray-950/70 border border-gray-800 focus:border-purple-500 rounded-xl px-10 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-950/40 border border-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Weryfikacja: Ile to 3 + 5?
                  </span>
                </div>
                <input
                  type="text"
                  name="captcha"
                  required
                  placeholder="Wpisz wynik cyfrą"
                  value={formData.captcha}
                  onChange={handleChange}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none"
                />
              </div>
            </>
          )}

          {isLogin && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-950 border-gray-800 accent-purple-600 focus:ring-0 cursor-pointer"
                />
                Zapamiętaj to urządzenie
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Przetwarzanie..." : isLogin ? "Zaloguj się" : "Zarejestruj konto"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-800/80 pt-4">
          <p className="text-xs text-gray-400">
            {isLogin ? "Nie masz jeszcze konta?" : "Posiadasz już konto?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg(null);
              }}
              className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 ml-1 cursor-pointer"
            >
              {isLogin ? "Zarejestruj się" : "Zaloguj się"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}