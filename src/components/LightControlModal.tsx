"use client";

import React, { useState, useRef } from "react";
import { X, Sun, Thermometer, Palette, Check, Sparkles } from "lucide-react";

interface LightControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: {
    id: string;
    name: string;
    state: boolean;
    brightness?: number | null;
    colorTemp?: number | null;
    colorRgb?: string | null;
  };
  onUpdate: (deviceId: string, updates: Partial<{ brightness: number; colorTemp: number; colorRgb: string; workMode: string }>) => Promise<void>;
}

export default function LightControlModal({
  isOpen,
  onClose,
  device,
  onUpdate,
}: LightControlModalProps) {
  if (!isOpen) return null;

  const initialTemp = (() => {
    const val = device.colorTemp ?? 50;
    if (val > 100) {
      return Math.round(((val - 2700) / (6500 - 2700)) * 100);
    }
    return Math.max(0, Math.min(100, val));
  })();

  const [brightness, setBrightness] = useState(device.brightness ?? 100);
  const [colorTemp, setColorTemp] = useState(initialTemp);
  const [colorRgb, setColorRgb] = useState(device.colorRgb || "#a855f7");
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [tempColor, setTempColor] = useState(device.colorRgb || "#a855f7");

  const wheelRef = useRef<HTMLDivElement>(null);

  const handleBrightnessCommit = (val: number) => {
    onUpdate(device.id, { brightness: val });
  };

  const handleColorTempCommit = (val: number) => {
    onUpdate(device.id, { colorTemp: val, workMode: "white" });
  };

  // Szybki powrót do trybu białego światła
  const handleResetToWhite = async () => {
    await onUpdate(device.id, { colorTemp, workMode: "white" });
  };

  const handleWheelClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;

    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const hue = Math.round((angle + 360) % 360);

    const distance = Math.sqrt(x * x + y * y);
    const radius = rect.width / 2;
    const saturation = Math.min(100, Math.round((distance / radius) * 100));

    const l = 50;
    const s = saturation / 100;
    const c = (1 - Math.abs(2 * (l / 100) - 1)) * s;
    const hp = hue / 60;
    const xp = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0, g = 0, b = 0;
    if (hp >= 0 && hp < 1) [r, g, b] = [c, xp, 0];
    else if (hp >= 1 && hp < 2) [r, g, b] = [xp, c, 0];
    else if (hp >= 2 && hp < 3) [r, g, b] = [0, c, xp];
    else if (hp >= 3 && hp < 4) [r, g, b] = [0, xp, c];
    else if (hp >= 4 && hp < 5) [r, g, b] = [xp, 0, c];
    else if (hp >= 5 && hp < 6) [r, g, b] = [c, 0, xp];
    const m = l / 100 - c / 2;
    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, "0");
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, "0");
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, "0");

    setTempColor(`#${rHex}${gHex}${bHex}`);
  };

  const handleApplyColor = async () => {
    setColorRgb(tempColor);
    setIsColorPickerOpen(false);
    await onUpdate(device.id, { colorRgb: tempColor, workMode: "colour" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0f1117] border border-purple-500/20 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-1">{device.name}</h3>
        <p className="text-xs text-purple-400/80 mb-6 uppercase tracking-wider font-semibold">
          Sterowanie oświetleniem
        </p>

        {!isColorPickerOpen ? (
          <div className="space-y-6">
            {/* Suwak Jasności */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2 text-zinc-300">
                  <Sun className="w-4 h-4 text-amber-400" /> Jasność
                </span>
                <span className="font-semibold text-white font-mono">{brightness}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                onMouseUp={() => handleBrightnessCommit(brightness)}
                onTouchEnd={() => handleBrightnessCommit(brightness)}
                className="w-full accent-purple-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Suwak Ciepła Bieli */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2 text-zinc-300">
                  <Thermometer className="w-4 h-4 text-amber-300" /> Ciepło bieli
                </span>
                <span className="font-semibold text-white font-mono">{colorTemp}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={colorTemp}
                onChange={(e) => setColorTemp(Number(e.target.value))}
                onMouseUp={() => handleColorTempCommit(colorTemp)}
                onTouchEnd={() => handleColorTempCommit(colorTemp)}
                style={{
                  background: "linear-gradient(to right, #f8fafc 0%, #fef08a 50%, #f59e0b 100%)",
                }}
                className="w-full h-3 rounded-lg cursor-pointer appearance-none accent-zinc-900 border border-zinc-700"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 mt-1 font-mono">
                <span>Zimna biel (6500K)</span>
                <span>Ciepły bursztyn (2700K)</span>
              </div>
            </div>

            {/* Przyciski trybów barwy */}
            <div className="pt-2 grid grid-cols-2 gap-3">
              <button
                onClick={handleResetToWhite}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-amber-400/50 hover:bg-zinc-800 text-zinc-200 transition text-xs font-semibold cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Tryb bieli</span>
              </button>

              <button
                onClick={() => {
                  setTempColor(colorRgb);
                  setIsColorPickerOpen(true);
                }}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900/90 border border-purple-500/30 hover:border-purple-500/60 hover:bg-zinc-800 text-zinc-200 transition text-xs font-semibold cursor-pointer"
              >
                <Palette className="w-4 h-4 text-purple-400" />
                <span>Koło RGB</span>
              </button>
            </div>
          </div>
        ) : (
          /* Widok okrągłego pola RGB z przyciskiem OK */
          <div className="flex flex-col items-center">
            <div
              ref={wheelRef}
              onClick={handleWheelClick}
              onTouchMove={handleWheelClick}
              className="w-56 h-56 rounded-full relative cursor-crosshair shadow-[0_0_25px_rgba(0,0,0,0.8)] border-4 border-zinc-800"
              style={{
                background:
                  "conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red), radial-gradient(circle, white 0%, transparent 80%)",
                backgroundBlendMode: "screen",
              }}
            />

            <div className="flex items-center gap-3 mt-6 mb-5">
              <span className="text-xs text-zinc-400 font-medium">Wybrany kolor:</span>
              <div
                className="w-8 h-8 rounded-full border-2 border-white/50 shadow-lg"
                style={{ backgroundColor: tempColor }}
              />
              <span className="text-xs font-mono uppercase text-zinc-300 font-bold">{tempColor}</span>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setIsColorPickerOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition"
              >
                Wróć
              </button>
              <button
                onClick={handleApplyColor}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Zastosuj (OK)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}