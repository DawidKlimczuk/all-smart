"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface RealtimeTelemetryPoint {
  time: string;
  consumption: number;
  production: number;
  balance: number;
}

interface Props {
  data: RealtimeTelemetryPoint[];
  solarModifier?: number;
  onSolarModifierChange?: (val: number) => void;
  showSolarSlider?: boolean;
}

export default function RealtimeEnergyChart({
  data,
  solarModifier = 80,
  onSolarModifierChange,
  showSolarSlider = false,
}: Props) {
  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-semibold text-gray-100">Telemetria na Żywo (1 Hz)</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Rzeczywisty bufor mocy w czasie realnym (ostatnie 30 sek.)
          </p>
        </div>

        {/* Suwak symulacji generacji PV - widoczny tylko gdy showSolarSlider === true */}
        {showSolarSlider && onSolarModifierChange && (
          <div className="flex items-center gap-3 bg-gray-950/60 border border-gray-800 px-4 py-2 rounded-xl">
            <span className="text-xs text-gray-400 whitespace-nowrap">Symulacja PV:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={solarModifier}
              onChange={(e) => onSolarModifierChange(Number(e.target.value))}
              className="w-28 accent-emerald-400 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-emerald-400 w-10 text-right">
              {solarModifier}%
            </span>
          </div>
        )}
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="liveSolarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="liveConsumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}W`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                borderColor: "#374151",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="production"
              name="Generacja PV (W)"
              stroke="#10b981"
              strokeWidth={2}
              isAnimationActive={false}
              fill="url(#liveSolarGrad)"
            />
            <Area
              type="monotone"
              dataKey="consumption"
              name="Pobór (W)"
              stroke="#a855f7"
              strokeWidth={2}
              isAnimationActive={false}
              fill="url(#liveConsumeGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}