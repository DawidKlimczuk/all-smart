"use client";

import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  RefreshCw, 
  Zap, 
  Clock, 
  CalendarDays
} from "lucide-react";

interface TelemetryProps {
  userId: string;
}

export default function TelemetryView({ userId }: TelemetryProps) {
  const [range, setRange] = useState<"1h" | "24h" | "7d">("24h");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchTelemetry = async (selectedRange = range) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/telemetry?userId=${userId}&range=${selectedRange}&_t=${Date.now()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Błąd pobierania telemetrii:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry(range);

    // odświeżanie co 5 sekund
    const interval = setInterval(() => {
      fetchTelemetry(range);
    }, 5000);

    return () => clearInterval(interval);
  }, [range, userId]);

  const stats = data?.stats || { maxPower: 0, minPower: 0, avgPower: 0, monthlyKwh: 0 };
  const history: Array<{ time: string; power: number }> = data?.history || [];

  // Obliczenia fale SVG
  const maxVal = Math.max(80, stats.maxPower * 1.2);
  const svgWidth = 900;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingY = 30;

  const points = history.map((item, index) => {
    const x = paddingX + (index / (history.length - 1 || 1)) * (svgWidth - 2 * paddingX);
    const y = svgHeight - paddingY - (item.power / maxVal) * (svgHeight - 2 * paddingY);
    return { x, y, ...item };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i, arr) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = arr[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
      }, "")
    : "";

  const areaD = pathD
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : "";

  return (
    <div className="space-y-6">
      {/* 3 KAFELKI STATYSTYK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl p-[1.5px] bg-gradient-to-br from-rose-500/40 via-amber-500/20 to-blue-900/30">
          <div className="rounded-[22px] bg-[#071126]/90 p-5 backdrop-blur-xl flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                MAX POBÓR ({range.toUpperCase()})
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white font-mono">{stats.maxPower}</span>
                <span className="text-xs text-rose-400 font-mono font-bold">W</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Maksymalny odnotowany pik</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-[1.5px] bg-gradient-to-br from-blue-500/40 via-cyan-500/20 to-blue-950/30">
          <div className="rounded-[22px] bg-[#071126]/90 p-5 backdrop-blur-xl flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                MIN POBÓR ({range.toUpperCase()})
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white font-mono">{stats.minPower}</span>
                <span className="text-xs text-blue-400 font-mono font-bold">W</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Stan czuwania (Standby)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-[1.5px] bg-gradient-to-br from-amber-400/50 via-yellow-500/20 to-amber-900/30">
          <div className="rounded-[22px] bg-[#071126]/90 p-5 backdrop-blur-xl flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                ŚREDNIA MIESIĘCZNA
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-amber-300 font-mono">~{stats.monthlyKwh}</span>
                <span className="text-xs text-amber-400 font-mono font-bold">kWh / msc</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Śr. ciągła: {stats.avgPower} W</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* KARTA WYKRESU Z WYBOREM ZAKRESU */}
      <div className="rounded-3xl border border-blue-900/50 bg-[#061024]/85 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Przepływ mocy w czasie rzeczywistym
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Śledzenie poboru mocy oraz pracy podłączonych odbiorników
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Przełącznik zakresów: 1h, 24h, 7d */}
            <div className="flex items-center bg-[#08152e] p-1 rounded-2xl border border-blue-900/60">
              <button
                type="button"
                onClick={() => setRange("1h")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  range === "1h"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>1h</span>
              </button>

              <button
                type="button"
                onClick={() => setRange("24h")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  range === "24h"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>24h</span>
              </button>

              <button
                type="button"
                onClick={() => setRange("7d")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  range === "7d"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>7 dni</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => fetchTelemetry()}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-[#0e1d3e] border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden sm:inline">Odśwież</span>
            </button>
          </div>
        </div>

        {/* WYKRES SVG */}
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-64 overflow-visible">
            <defs>
              <linearGradient id="telemetryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#061024" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Poziome linie siatki */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = svgHeight - paddingY - ratio * (svgHeight - 2 * paddingY);
              const val = Math.round(ratio * maxVal);
              return (
                <g key={i}>
                  <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={paddingX - 10} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {val}W
                  </text>
                </g>
              );
            })}

            {/* Obszar gradientowy pod wykresem */}
            {areaD && <path d={areaD} fill="url(#telemetryGrad)" />}

            {/* Główna linia fali */}
            {pathD && <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />}

            {/* Punkty pomiarowe i interaktywny hover */}
            {points.map((p, i) => {
              const isHovered = hoveredIndex === i || (hoveredIndex === null && i === points.length - 1);
              
              // Czytelność osi X: dla 24h pokazujemy co drugą godzinę, dla 1h i 7d wszystkie
              const shouldShowLabel = 
                range === "24h" ? i % 2 === 0 || i === points.length - 1 : true;

              return (
                <g 
                  key={i} 
                  onMouseEnter={() => setHoveredIndex(i)} 
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : 3}
                    className="transition-all duration-200"
                    fill={isHovered ? "#ffffff" : "#f59e0b"}
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  {isHovered && (
                    <g>
                      <line 
                        x1={p.x} 
                        y1={paddingY} 
                        x2={p.x} 
                        y2={svgHeight - paddingY} 
                        stroke="#f59e0b" 
                        strokeWidth="1" 
                        strokeDasharray="2 2" 
                      />
                      <foreignObject 
                        x={Math.min(Math.max(10, p.x - 45), svgWidth - 100)} 
                        y={Math.max(5, p.y - 52)} 
                        width="90" 
                        height="45"
                      >
                        <div className="bg-[#0b1b3d]/95 border border-amber-400/70 backdrop-blur-md rounded-xl p-1.5 text-center shadow-xl">
                          <span className="text-[10px] text-slate-400 block font-mono leading-none">{p.time}</span>
                          <span className="text-xs font-black text-amber-300 font-mono leading-tight mt-0.5 block">
                            {p.power} W
                          </span>
                        </div>
                      </foreignObject>
                    </g>
                  )}
                  {/* Podpisy osi X */}
                  {shouldShowLabel && (
                    <text 
                      x={p.x} 
                      y={svgHeight - 8} 
                      fill="#64748b" 
                      fontSize="10" 
                      textAnchor="middle" 
                      fontFamily="monospace"
                    >
                      {p.time}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}