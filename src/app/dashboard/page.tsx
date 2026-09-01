"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RealtimeEnergyChart from "@/components/RealtimeEnergyChart";
import AddDeviceModal from "@/components/AddDeviceModal";
import { 
  Zap, 
  Power, 
  Plus, 
  LogOut, 
  Activity, 
  RotateCcw,
  Sparkles,
  Cloud,
  Wifi
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Dane telemetryczne dla wykresu
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/demo");
        return;
      }
      setUser(session.user);
      await fetchDevices(session.user.id);
      setLoading(false);
    }
    checkAuthAndLoad();
  }, [router]);

  // Generowanie punktów telemetrycznych
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const currentLoad = devices
        .filter((d) => d.state)
        .reduce((acc, curr) => acc + (curr.currentPower || 45), 0);

      setChartData((prev) => {
        const next = [...prev, { time: timeStr, power: currentLoad, solar: Math.max(0, 400 - currentLoad * 0.3) }];
        return next.slice(-12);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [devices]);

  const fetchDevices = async (userId: string) => {
    try {
      const res = await fetch(`/api/user/devices?userId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setDevices(json.data || []);
      }
    } catch (err) {
      console.error("Błąd pobierania urządzeń:", err);
    }
  };

  const handleToggleDevice = async (device: any) => {
    setActionLoadingId(device.id);
    const newState = !device.state;

    // Optimistic update
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, state: newState } : d))
    );

    try {
      const res = await fetch(`/api/user/devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, state: device.state } : d))
        );
      }
    } catch {
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, state: device.state } : d))
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestoreProfile = async (device: any) => {
    setActionLoadingId(device.id);
    try {
      const res = await fetch(`/api/user/devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: true,
          brightness: device.brightness || 100,
          colorTemp: device.colorTemp || 4000,
          isOnline: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, ...data.data, isOnline: true, state: true } : d))
        );
      }
    } catch (err) {
      console.error("Błąd przywracania profilu:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400 font-mono text-sm">
        Ładowanie ekosystemu AllSmart...
      </div>
    );
  }

  const onlineDevicesCount = devices.filter((d) => d.isOnline).length;
  const totalPowerConsumption = devices
    .filter((d) => d.state)
    .reduce((acc, curr) => acc + (curr.currentPower || 25), 0);

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 p-4 md:p-8">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></span>
            <h1 className="text-2xl font-black tracking-tight text-white">AllSmart Hub</h1>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-mono">
              Vercel Ready
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">{user?.email}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Dodaj Urządzenie
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-rose-400 transition"
            title="Wyloguj"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex justify-between items-center text-gray-400 text-xs">
              <span>Aktywne Urządzenia</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white font-mono">{onlineDevicesCount}</span>
              <span className="text-xs text-gray-500 font-mono">/ {devices.length} zarejestrowanych</span>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex justify-between items-center text-gray-400 text-xs">
              <span>Bieżące Obciążenie</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-300 font-mono">{totalPowerConsumption}</span>
              <span className="text-xs text-gray-400 font-mono">W</span>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex justify-between items-center text-gray-400 text-xs">
              <span>Ochrona Stanu Profilu</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-bold text-indigo-300">Auto-Restore Aktywne</span>
            </div>
          </div>
        </div>

        {/* Energy Telemetry Chart */}
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Telemetria Przepływu Mocy i Energii (Realtime)
          </h2>
          <RealtimeEnergyChart data={chartData} />
        </div>

        {/* Devices Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Podłączone Urządzenia</h2>
            <span className="text-xs text-gray-500 font-mono">Zarządzanie stanem i profilami</span>
          </div>

          {devices.length === 0 ? (
            <div className="bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl p-12 text-center">
              <p className="text-gray-400 text-sm mb-4">Brak dodanych urządzeń w Twoim Hubie.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-purple-600/20 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-600 hover:text-white transition"
              >
                Dodaj pierwsze urządzenie
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    dev.state 
                      ? "bg-gradient-to-b from-purple-950/30 to-gray-900/80 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.1)]" 
                      : "bg-gray-900/60 border-gray-800/80"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{dev.name}</span>
                        {dev.integrationType === "TUYA_CLOUD" && (
                          <span title="Tuya Cloud" className="flex items-center">
                            <Cloud className="w-3.5 h-3.5 text-purple-400" />
                          </span>
                        )}
                        {dev.integrationType === "LOCAL_LAN" && (
                          <span title="Local LAN" className="flex items-center">
                            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{dev.roomName || "Salon"}</p>
                    </div>

                    <button
                      onClick={() => handleToggleDevice(dev)}
                      disabled={actionLoadingId === dev.id}
                      className={`p-2.5 rounded-xl transition cursor-pointer ${
                        dev.state
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                          : "bg-gray-800 text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <Power className={`w-4 h-4 ${actionLoadingId === dev.id ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  {/* Parametry Profilu */}
                  <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
                    <span className="font-mono">{dev.type}</span>
                    
                    {dev.isRecoverable && (
                      <button
                        onClick={() => handleRestoreProfile(dev)}
                        disabled={actionLoadingId === dev.id}
                        className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition"
                        title="Zastosuj zapamiętane parametry po resecie zasilania"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Auto-Restore</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal */}
      {user && (
        <AddDeviceModal
          userId={user.id}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDeviceAdded={(newDev) => setDevices((prev) => [newDev, ...prev])}
        />
      )}
    </div>
  );
}