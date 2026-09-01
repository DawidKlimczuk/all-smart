"use client";

import { useEffect, useState } from "react";
import { UnifiedDevice } from "@/lib/adapters/types";
import RealtimeEnergyChart, { RealtimeTelemetryPoint } from "@/components/RealtimeEnergyChart";
import { 
  Zap, 
  Sun, 
  Power, 
  Flame, 
  Lightbulb, 
  Activity, 
  Plus,
  Minus
} from "lucide-react";

const MIN_TEMP = 16.0;
const MAX_TEMP = 28.0;

export default function DashboardPage() {
  const [devices, setDevices] = useState<UnifiedDevice[]>([]);
  const [solarModifier, setSolarModifier] = useState<number>(80);
  const [realtimeHistory, setRealtimeHistory] = useState<RealtimeTelemetryPoint[]>([]);

  useEffect(() => {
    fetch("/api/devices")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setDevices(json.data);
      });
  }, []);

  const toggleDevice = async (id: string, currentState: boolean) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, state: !currentState } : d))
    );
    await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle", currentState }),
    });
  };

  const handleBrightnessChange = async (id: string, val: number) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, brightness: val } : d))
    );
    await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "setBrightness", value: val }),
    });
  };

  const handleTempChange = async (id: string, delta: number) => {
    const dev = devices.find((d) => d.id === id);
    if (!dev || dev.targetTemp === undefined) return;
    
    // Blokada zakresu 16 - 28 °C
    const rawTemp = dev.targetTemp + delta;
    const clampedTemp = Math.min(MAX_TEMP, Math.max(MIN_TEMP, rawTemp));
    const newTemp = Math.round(clampedTemp * 10) / 10;

    if (newTemp === dev.targetTemp) return;

    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, targetTemp: newTemp } : d))
    );
    await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "setTemperature", value: newTemp }),
    });
  };

  // Pętla symulacji Live Telemetry (1 Hz) + Bezwładność termiczna
  useEffect(() => {
    let tickCount = 0;

    const interval = setInterval(() => {
      tickCount++;
      const shouldUpdateTemp = tickCount % 3 === 0; // Aktualizacja temperatury co 3 sekundy

      setDevices((currentDevices) => {
        const noise = () => (Math.random() - 0.5) * 8;

        const updated = currentDevices.map((d) => {
          // Obsługa Pompy Ciepła i dynamiki temperatury
          if (d.type === "HEAT_PUMP") {
            let currentT = d.currentTemp ?? 21.5;
            const targetT = d.targetTemp ?? 22.5;

            if (shouldUpdateTemp) {
              if (d.state) {
                // Grzanie / chłodzenie w stronę celu
                if (Math.abs(currentT - targetT) > 0.05) {
                  const step = currentT < targetT ? 0.1 : -0.1;
                  currentT = Math.round((currentT + step) * 10) / 10;
                }
              } else {
                // Powolne wychładzanie do 20°C po wyłączeniu pompy
                if (currentT > 20.0) {
                  currentT = Math.round((currentT - 0.1) * 10) / 10;
                }
              }
            }

            if (!d.state) return { ...d, currentTemp: currentT, currentPowerW: 0 };

            const diff = Math.max(0, targetT - currentT);
            const base = diff > 0.1 ? 950 + diff * 450 : 250; // Pobór spada po dogrzaniu (podtrzymanie)
            return {
              ...d,
              currentTemp: currentT,
              currentPowerW: Math.round(base + noise() * 5),
            };
          }

          if (!d.state) return { ...d, currentPowerW: 0 };

          if (d.type === "LIGHT") {
            const base = ((d.brightness ?? 80) / 100) * 50 + 5;
            return { ...d, currentPowerW: Math.round(base + noise()) };
          }
          if (d.type === "SMART_PLUG") {
            return { ...d, currentPowerW: Math.round(2100 + noise() * 15) };
          }
          if (d.type === "PV_INVERTER") {
            const maxPower = 4800;
            const production = (maxPower * (solarModifier / 100)) + noise() * 10;
            return { ...d, currentPowerW: -Math.round(Math.max(0, production)) };
          }
          return d;
        });

        // Bilans
        const consumption = updated
          .filter((d) => d.currentPowerW > 0 && d.state)
          .reduce((acc, curr) => acc + curr.currentPowerW, 0);

        const production = Math.abs(
          updated
            .filter((d) => d.currentPowerW < 0 && d.state)
            .reduce((acc, curr) => acc + curr.currentPowerW, 0)
        );

        const now = new Date();
        const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

        setRealtimeHistory((prev) => {
          const next = [...prev, { time: timeLabel, consumption, production, balance: production - consumption }];
          return next.slice(-30);
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [solarModifier]);

  const totalConsumption = devices
    .filter((d) => d.currentPowerW > 0 && d.state)
    .reduce((acc, curr) => acc + curr.currentPowerW, 0);

  const totalProduction = Math.abs(
    devices
      .filter((d) => d.currentPowerW < 0 && d.state)
      .reduce((acc, curr) => acc + curr.currentPowerW, 0)
  );

  const netBalance = totalProduction - totalConsumption;

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              AllSmart Hub
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Zarządzanie automatyką domową, pompą ciepła i energią PV</p>
        </div>
      </header>

      {/* Energy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-400">Aktualne Zużycie</span>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3 font-mono">{totalConsumption} W</p>
          <p className="text-xs text-gray-500 mt-1">Suma pracujących odbiorników</p>
        </div>

        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-400">Generacja PV</span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Sun className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-3 font-mono">{totalProduction} W</p>
          <p className="text-xs text-gray-500 mt-1">Moc generowana przez falownik</p>
        </div>

        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-400">Bilans Sieci (Autokonsumpcja)</span>
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-3 font-mono ${netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {netBalance >= 0 ? `+${netBalance} W` : `${netBalance} W`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {netBalance >= 0 ? "Oddawanie nadwyżki do sieci" : "Pobór energii z sieci"}
          </p>
        </div>
      </div>

      {/* Ruchomy Wykres Telemetrii */}
      <RealtimeEnergyChart
        data={realtimeHistory}
        solarModifier={solarModifier}
        onSolarModifierChange={setSolarModifier}
        showSolarSlider={true}
      />

      {/* Grid Urządzeń z Blokadami i Kontrolkami */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-200">Podłączone Urządzenia</h2>
          <span className="text-xs text-gray-500">{devices.length} jednostek w systemie</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {devices.map((device) => {
            const isPV = device.type === "PV_INVERTER";
            const target = device.targetTemp ?? 22.0;

            return (
              <div
                key={device.id}
                className={`flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 ${
                  device.state
                    ? "bg-gray-900/70 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.08)]"
                    : "bg-gray-900/20 border-gray-800/60 opacity-60"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-xl border ${
                      device.state 
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                        : "bg-gray-800 border-gray-700 text-gray-400"
                    }`}>
                      {device.type === "LIGHT" && <Lightbulb className="w-5 h-5" />}
                      {device.type === "HEAT_PUMP" && <Flame className="w-5 h-5" />}
                      {device.type === "PV_INVERTER" && <Sun className="w-5 h-5" />}
                      {device.type === "SMART_PLUG" && <Power className="w-5 h-5" />}
                    </div>

                    <button
                      onClick={() => toggleDevice(device.id, device.state)}
                      className={`p-2 rounded-xl transition-all ${
                        device.state
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "bg-gray-800 text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-purple-400/90">{device.roomName}</span>
                    <h3 className="font-semibold text-white text-base mt-0.5">{device.name}</h3>
                  </div>

                  {/* Suwak jasności LED */}
                  {device.type === "LIGHT" && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Jasność</span>
                        <span className="font-mono text-purple-300">{device.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        disabled={!device.state}
                        value={device.brightness ?? 85}
                        onChange={(e) => handleBrightnessChange(device.id, Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer disabled:opacity-40"
                      />
                    </div>
                  )}

                  {/* Regulacja Pompy Ciepła z ograniczeniem 16-28°C */}
                  {device.type === "HEAT_PUMP" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>
                          Temp. aktualna:{" "}
                          <b className="text-gray-200 font-mono">{device.currentTemp?.toFixed(1)}°C</b>
                        </span>
                        <span>
                          Cel: <b className="text-indigo-400 font-mono">{target.toFixed(1)}°C</b>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={!device.state || target <= MIN_TEMP}
                          onClick={() => handleTempChange(device.id, -0.5)}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 py-1.5 rounded-lg flex justify-center items-center transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={!device.state || target >= MAX_TEMP}
                          onClick={() => handleTempChange(device.id, 0.5)}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 py-1.5 rounded-lg flex justify-center items-center transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
                  <span>Moc chwilowa</span>
                  <span className={`font-mono font-semibold ${
                    !device.state ? "text-gray-600" : isPV ? "text-emerald-400" : "text-gray-200"
                  }`}>
                    {device.state ? `${Math.abs(device.currentPowerW)} W` : "0 W"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}