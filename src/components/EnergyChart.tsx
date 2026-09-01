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

interface EnergyPoint {
  time: string;
  production: number;
  consumption: number;
  balance: number;
}

export default function EnergyChart({ data }: { data: EnergyPoint[] }) {
  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Dobowy Profil Energetyczny</h2>
          <p className="text-xs text-gray-400">Porównanie generacji PV z poborem mocy (24h)</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/80" />
            <span className="text-gray-300">Generacja PV</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-purple-500/80" />
            <span className="text-gray-300">Zużycie</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="consumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}W`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                borderColor: "#374151",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#f3f4f6",
              }}
            />
            <Area
              type="monotone"
              dataKey="production"
              name="PV (W)"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#solarGrad)"
            />
            <Area
              type="monotone"
              dataKey="consumption"
              name="Zużycie (W)"
              stroke="#a855f7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#consumeGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}