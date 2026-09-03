"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  AlertTriangle,
  QrCode
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdded: (device: any) => void;
}

export default function AddDeviceModal({ isOpen, onClose, onDeviceAdded }: Props) {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [status, setStatus] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // 1. Pobieranie tokenu QR przy otwarciu
  const fetchQrCode = async () => {
    try {
      setLoading(true);
      setMsg(null);
      setStatus(0);

      const res = await fetch("/api/auth/tuya/qr-code", { method: "POST" });
      const data = await res.json();

      if (data.success && data.qrcode) {
        setQrToken(data.qrcode);
      } else {
        setMsg({ text: data.error || "Nie udało się wygenerować kodu QR.", error: true });
      }
    } catch (err: any) {
      setMsg({ text: err.message || "Błąd połączenia z serwerem.", error: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQrCode();
    } else {
      setQrToken(null);
      setStatus(0);
      setMsg(null);
    }
  }, [isOpen]);

  // 2. Polling statusu skanowania co 2 sekundy
  useEffect(() => {
    if (!isOpen || !qrToken || status === 2) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/tuya/qr-status?token=${qrToken}`);
        const data = await res.json();

        if (data.success) {
          setStatus(data.status);

          if (data.status === 2) {
            clearInterval(interval);
            setMsg({ text: "Połączono pomyślnie! Pobieranie urządzeń...", error: false });
            
            setTimeout(() => {
              onDeviceAdded(data.user);
              onClose();
            }, 1800);
          }
        }
      } catch (err) {
        console.error("Błąd sprawdzania statusu:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, qrToken, status, onDeviceAdded, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Modalu */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Połącz Tuya / Smart Life</h3>
              <p className="text-xs text-gray-400">Autoryzacja i import urządzeń</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Powiadomienia statusu */}
        {msg && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
            msg.error ? "bg-rose-500/10 border border-rose-500/30 text-rose-300" : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
          }`}>
            {msg.error ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Kontener Kodu QR */}
        <div className="p-6 flex flex-col items-center justify-center">
          <div className="relative flex h-64 w-64 items-center justify-center rounded-2xl bg-white p-3 shadow-inner border border-gray-200">
            {loading ? (
              <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
            ) : status === 2 ? (
              <div className="flex flex-col items-center justify-center text-emerald-600 space-y-2">
                <CheckCircle2 size={56} className="animate-bounce" />
                <span className="font-semibold text-xs text-emerald-700">Autoryzacja udana!</span>
              </div>
            ) : qrToken ? (
              <QRCodeSVG value={qrToken} size={220} />
            ) : (
              <span className="text-xs text-gray-400">Brak aktywnego kodu</span>
            )}
          </div>

          {/* Podpowiedź stanu */}
          <div className="mt-4 text-center min-h-[20px]">
            {status === 1 && (
              <span className="text-xs font-semibold text-amber-400 animate-pulse">
                Kod zeskanowany! Potwierdź logowanie na telefonie...
              </span>
            )}
            {status === 0 && !loading && !msg?.error && (
              <span className="text-xs text-gray-400">
                Oczekiwanie na zeskanowanie kodu...
              </span>
            )}
          </div>

          {/* Krok po kroku */}
          <div className="mt-5 w-full rounded-2xl bg-gray-950/60 border border-gray-800 p-3.5 text-xs text-gray-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-400 font-medium">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instrukcja skanowania:</span>
            </div>
            <p>1. Otwórz aplikację <b>Tuya Smart</b> lub <b>Smart Life</b>.</p>
            <p>2. Przejdź do zakładki <b>Profil (Ja)</b> i dotknij ikony <b>[—] (skaner)</b> w prawym górnym rogu.</p>
            <p>3. Skieruj obiektyw na powyższy kod i wybierz <b>Potwierdź logowanie</b>.</p>
          </div>
        </div>

      </div>
    </div>
  );
}