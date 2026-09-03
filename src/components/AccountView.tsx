"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";

interface AccountViewProps {
  user: any;
  onLogout: () => void;
}

export default function AccountView({ user, onLogout }: AccountViewProps) {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Aktualizacja profilu (Imię / E-mail)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const updates: any = {
        data: { full_name: fullName.trim() },
      };

      if (email.trim() !== user?.email) {
        updates.email = email.trim();
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setProfileMsg({
        type: "success",
        text: email.trim() !== user?.email 
          ? "Zaktualizowano profil. Sprawdź nową skrzynkę e-mail, aby potwierdzić zmianę adresu." 
          : "Pomyślnie zaktualizowano dane profilu!",
      });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Błąd podczas zapisu danych." });
    } finally {
      setSavingProfile(false);
    }
  };

  // Zmiana hasła
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Nowe hasło musi zawierać co najmniej 6 znaków." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Hasła w obu polach nie są identyczne." });
      return;
    }

    setSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMsg({ type: "success", text: "Hasło zostało pomyślnie zmienione!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Błąd podczas zmiany hasła." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      
      {/* 1. KARTA INFORMACJI GŁÓWNYCH */}
      <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-br from-amber-400/40 via-blue-500/30 to-amber-600/20 shadow-[0_0_35px_-10px_rgba(245,158,11,0.2)]">
        <div className="rounded-[22px] bg-[#071126]/95 p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Dane Użytkownika</h3>
              <p className="text-xs text-amber-200/70 font-mono">Zarządzaj nazwą i adresem powiązanym z kontem</p>
            </div>
          </div>

          {profileMsg && (
            <div className={`mb-5 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-mono ${
              profileMsg.type === "success" 
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/40 text-rose-300"
            }`}>
              {profileMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Imię / Nazwa wyświetlana</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Np. Klima"
                className="w-full bg-[#0a1633] border border-blue-900/60 focus:border-amber-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Adres E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a1633] border border-blue-900/60 focus:border-amber-400 rounded-xl text-white text-sm outline-none transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{savingProfile ? "Zapisywanie..." : "Zapisz dane profilu"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. KARTA ZMIANY HASŁA */}
      <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-br from-blue-500/30 via-slate-800/40 to-amber-500/20 shadow-xl">
        <div className="rounded-[22px] bg-[#071126]/95 p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bezpieczeństwo i Hasło</h3>
              <p className="text-xs text-blue-200/70 font-mono">Ustaw nowe silne hasło do logowania</p>
            </div>
          </div>

          {passwordMsg && (
            <div className={`mb-5 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-mono ${
              passwordMsg.type === "success" 
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/40 text-rose-300"
            }`}>
              {passwordMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Nowe Hasło</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 znaków"
                  className="w-full pl-10 pr-10 py-3 bg-[#0a1633] border border-blue-900/60 focus:border-amber-400 rounded-xl text-white text-sm outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Powtórz Nowe Hasło</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Powtórz hasło"
                  className="w-full pl-10 pr-4 py-3 bg-[#0a1633] border border-blue-900/60 focus:border-amber-400 rounded-xl text-white text-sm outline-none transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword || !newPassword}
                className="px-6 py-3 rounded-xl bg-[#0e1d3e] border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{savingPassword ? "Aktualizowanie hasła..." : "Zmień hasło"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}