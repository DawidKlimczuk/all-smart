"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Archive, Zap, Home, Tag, RefreshCw } from "lucide-react";

interface DeviceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: any;
  onSave: (deviceId: string, updates: { name: string; roomName: string; currentPower: number }) => void;
  onArchive: (deviceId: string) => void;
}

export default function DeviceEditModal({
  isOpen,
  onClose,
  device,
  onSave,
  onArchive,
}: DeviceEditModalProps) {
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [currentPower, setCurrentPower] = useState(10);
  const [isAutoPower, setIsAutoPower] = useState(false);

  useEffect(() => {
    if (device) {
      setName(device.name || "");
      setRoomName(device.roomName || "");
      setCurrentPower(device.currentPower || 10);
      setIsAutoPower(device.currentPower === 0 || device.type === "SMART_PLUG");
    }
  }, [device]);

  if (!isOpen || !device) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(device.id, {
      name: name.trim(),
      roomName: roomName.trim(),
      currentPower: isAutoPower ? 0 : Number(currentPower),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl p-[1.5px] bg-gradient-to-b from-amber-400/60 via-blue-500/40 to-amber-500/20 shadow-[0_0_50px_-10px_rgba(245,158,11,0.3)]">
        <div className="rounded-[23px] bg-[#071126] p-6 md:p-7 space-y-6">
          
          <div className="flex justify-between items-center pb-3 border-b border-blue-900/40">
            <h3 className="text-lg font-bold text-white tracking-wide">
              Edycja urządzenia
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nazwa */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Nazwa urządzenia</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a1630] border border-blue-900/50 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* Pokój */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-400" />
                <span>Pokój / Pomieszczenie</span>
              </label>
              <input
                type="text"
                placeholder="np. Salon, Łazienka, Biuro"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a1630] border border-blue-900/50 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* Pobór mocy */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Moc znamionowa / odczyt</span>
                </label>
                
                {device.type === "SMART_PLUG" && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoPower(!isAutoPower);
                      if (!isAutoPower) setCurrentPower(0);
                    }}
                    className={`text-[11px] font-mono flex items-center gap-1 px-2 py-0.5 rounded-md border transition cursor-pointer ${
                      isAutoPower
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isAutoPower ? "animate-spin text-amber-400" : ""}`} />
                    <span>{isAutoPower ? "Tryb: AUTO (Tuya)" : "Ustaw ręcznie"}</span>
                  </button>
                )}
              </div>

              {isAutoPower ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                  ⚡ Włączono tryb automatyczny. Pobór mocy będzie na bieżąco zczytywany z czujnika gniazdka (kod Tuya: cur_power).
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="4000"
                    value={currentPower}
                    onChange={(e) => setCurrentPower(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0a1630] border border-blue-900/50 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition font-mono pr-10"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400">
                    W
                  </span>
                </div>
              )}
            </div>

            {/* Przyciski */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Czy na pewno chcesz przenieść "${device.name}" do archiwum?`)) {
                    onArchive(device.id);
                    onClose();
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archiwizuj</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Zapisz zmiany</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}