"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import FaqView from "@/components/FaqView";
import AccountView from "@/components/AccountView";
import AddDeviceModal from "@/components/AddDeviceModal";
import LightControlModal from "@/components/LightControlModal";
import DeviceEditModal from "@/components/DeviceEditModal";
import ArchivedDevicesModal from "@/components/ArchivedDevicesModal";
import TelemetryView from "@/components/TelemetryView";
import { 
  Zap, 
  Power, 
  Plus, 
  LogOut, 
  Activity, 
  RotateCcw, 
  Cloud, 
  Sliders, 
  RefreshCw, 
  AlertTriangle, 
  MoreVertical, 
  Archive, 
  Sun, 
  Menu, 
  X, 
  LayoutDashboard, 
  LineChart, 
  HelpCircle, 
  User, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  FolderOpen 
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<"dashboard" | "telemetry" | "faq" | "account">("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLight, setSelectedLight] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [roomActionLoading, setRoomActionLoading] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [forceConfirmDevice, setForceConfirmDevice] = useState<any | null>(null);

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }
      setUser(session.user);
      await fetchDevices(session.user.id);
      setLoading(false);
    }
    checkAuthAndLoad();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchDevices(user.id, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const triggerQuickRefreshBurst = (userId: string) => {
    setTimeout(() => fetchDevices(userId, true), 1000);
    setTimeout(() => fetchDevices(userId, true), 2500);
    setTimeout(() => fetchDevices(userId, true), 4500);
  };

  const fetchDevices = async (userId: string, silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      // Dodajemy timestamp &_t=, żeby przeglądarka pod żadnym pozorem nie wzięła odpowiedzi z pamięci podręcznej
      const res = await fetch(`/api/user/devices?userId=${userId}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Pragma": "no-cache",
          "Cache-Control": "no-cache"
        }
      });
      const json = await res.json();
      if (json.success) {
        setDevices(json.data || []);
      }
    } catch (err) {
      console.error("Błąd pobierania urządzeń:", err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const executeToggle = async (device: any) => {
    setActionLoadingId(device.id);
    const newState = !device.state;

    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, state: newState, isOnline: true } : d))
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
          prev.map((d) => (d.id === device.id ? { ...d, state: device.state, isOnline: device.isOnline } : d))
        );
      } else {
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, ...data.data, isOnline: true } : d))
        );
      }
    } catch {
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, state: device.state } : d))
      );
    } finally {
      setActionLoadingId(null);
      if (user) triggerQuickRefreshBurst(user.id);
    }
  };

  const handleToggleRoom = async (roomName: string, targetState: boolean) => {
    setRoomActionLoading(roomName);
    const roomDevices = activeDevices.filter((d) => (d.roomName || "Nieprzypisane") === roomName);

    setDevices((prev) =>
      prev.map((d) =>
        (d.roomName || "Nieprzypisane") === roomName
          ? { ...d, state: targetState, isOnline: true }
          : d
      )
    );

    try {
      await Promise.all(
        roomDevices.map((d) =>
          fetch(`/api/user/devices/${d.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: targetState }),
          })
        )
      );
      if (user) triggerQuickRefreshBurst(user.id);
    } catch (err) {
      console.error("Błąd grupowego przełączania pokoju:", err);
    } finally {
      setRoomActionLoading(null);
    }
  };

  const toggleRoomCollapse = (roomName: string) => {
    setCollapsedRooms((prev) => ({ ...prev, [roomName]: !prev[roomName] }));
  };

  const handlePowerButtonClick = (device: any) => {
    if (!device.isOnline) {
      setForceConfirmDevice(device);
    } else {
      executeToggle(device);
    }
  };

  const handleLightUpdate = async (
    deviceId: string,
    updates: Partial<{ brightness: number; colorTemp: number; colorRgb: string; workMode: string }>
  ) => {
    setDevices((prev) =>
      prev.map((dev) => (dev.id === deviceId ? { ...dev, ...updates } : dev))
    );

    if (selectedLight && selectedLight.id === deviceId) {
      setSelectedLight((prev: any) => ({ ...prev, ...updates }));
    }

    try {
      await fetch(`/api/user/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Błąd aktualizacji światła:", err);
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
          colorRgb: device.colorRgb || "#f59e0b",
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

  const handleSaveDeviceMeta = async (
    deviceId: string,
    updates: { name: string; roomName: string; currentPower: number }
  ) => {
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, ...updates } : d)));
    try {
      await fetch(`/api/user/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Błąd zapisu:", err);
    }
  };

  const handleArchiveDevice = async (deviceId: string) => {
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, isArchived: true } : d)));
    try {
      await fetch(`/api/user/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
    } catch (err) {
      console.error("Błąd archiwizacji:", err);
    }
  };

  const handleRestoreDevice = async (deviceId: string) => {
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, isArchived: false } : d)));
    try {
      await fetch(`/api/user/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
    } catch (err) {
      console.error("Błąd przywracania:", err);
    }
  };

  const handlePermanentDeleteDevice = async (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    try {
      await fetch(`/api/user/devices/${deviceId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Błąd usuwania:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040814] flex items-center justify-center text-amber-300 font-mono text-sm">
        <div className="flex items-center gap-3">
          <Sun className="w-6 h-6 text-amber-400 animate-spin" />
          <span>Synchronizacja ekosystemu AllSmart...</span>
        </div>
      </div>
    );
  }

  const activeDevices = devices.filter((d) => !d.isArchived);
  const archivedDevices = devices.filter((d) => d.isArchived);
  const onlineDevicesCount = activeDevices.filter((d) => d.isOnline).length;

  const totalPowerConsumption = activeDevices
    .filter((d) => d.state && d.isOnline)
    .reduce((acc, curr) => acc + (curr.currentPower ?? 10), 0);

  const unassignedDevices = activeDevices.filter(
    (d) => !d.roomName || d.roomName.trim().toLowerCase() === "mieszkanie" || d.roomName.trim() === ""
  );

  const assignedDevices = activeDevices.filter(
    (d) => d.roomName && d.roomName.trim().toLowerCase() !== "mieszkanie" && d.roomName.trim() !== ""
  );

  const roomsMap = assignedDevices.reduce((acc: Record<string, any[]>, dev) => {
    const room = dev.roomName;
    if (!acc[room]) acc[room] = [];
    acc[room].push(dev);
    return acc;
  }, {});

  const roomNames = Object.keys(roomsMap).sort();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "telemetry", label: "Telemetria", icon: LineChart },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "account", label: "Konto", icon: User },
  ];

  const renderDeviceCard = (dev: any) => {
    const isTurnedOn = dev.state && dev.isOnline;

    return (
      <div
        key={dev.id}
        className={`relative rounded-3xl p-[1.5px] transition-all duration-300 ${
          isTurnedOn
            ? "bg-gradient-to-b from-amber-400/60 via-blue-500/40 to-amber-500/20 shadow-[0_0_35px_-8px_rgba(245,158,11,0.3)]"
            : "bg-gradient-to-b from-blue-900/30 to-slate-900/40 hover:from-amber-500/30"
        }`}
      >
        <div className="rounded-[22px] bg-[#071126]/95 backdrop-blur-xl p-5 h-full flex flex-col justify-between relative overflow-hidden">
          {isTurnedOn && (
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
          )}

          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">{dev.name}</span>
                <button
                  onClick={() => setEditingDevice(dev)}
                  className="text-slate-400 hover:text-amber-300 p-0.5 rounded transition cursor-pointer"
                  title="Edytuj nazwę / pokój / moc"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {dev.integrationType === "TUYA_CLOUD" && (
                  <span title="Tuya Cloud" className="flex items-center">
                    <Cloud className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-mono font-semibold text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  {dev.state && dev.isOnline ? (dev.currentPower ?? 10) : 0} W
                </span>

                {!dev.isOnline ? (
                  <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    Brak zasilania
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Online
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {dev.type === "LIGHT" && (
                <button
                  onClick={() => setSelectedLight(dev)}
                  disabled={!dev.state || !dev.isOnline}
                  className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                    dev.state && dev.isOnline
                      ? "bg-[#0f2142] border-amber-400/40 text-amber-300 hover:text-white hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                      : "bg-slate-900/60 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed"
                  }`}
                  title={
                    !dev.isOnline
                      ? "Urządzenie offline"
                      : !dev.state
                      ? "Włącz żarówkę, aby sterować"
                      : "Parametry światła"
                  }
                >
                  <Sliders className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handlePowerButtonClick(dev)}
                disabled={actionLoadingId === dev.id}
                className={`p-2.5 rounded-2xl transition cursor-pointer ${
                  !dev.isOnline
                    ? "bg-slate-900/80 text-slate-500 border border-dashed border-slate-800 hover:border-amber-500/50 hover:text-amber-300 opacity-60"
                    : dev.state
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110"
                    : "bg-[#0b1836] border border-blue-900/40 text-slate-400 hover:text-white hover:border-blue-700"
                }`}
                title={!dev.isOnline ? "Wymuś próbę włączenia" : "Włącz/Wyłącz"}
              >
                <Power className={`w-4 h-4 ${actionLoadingId === dev.id ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-500/15 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px] text-blue-300/70">{dev.type}</span>
            
            {dev.isRecoverable && (
              <button
                onClick={() => handleRestoreProfile(dev)}
                disabled={actionLoadingId === dev.id}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition cursor-pointer font-semibold"
                title="Zastosuj zapamiętane parametry"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Auto-Restore</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040813] via-[#071126] to-[#02050c] text-slate-100 relative overflow-x-hidden selection:bg-amber-400 selection:text-black">
      
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-40 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[170px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[180px] pointer-events-none z-0" />

      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden z-0">
        <Lightbulb className="absolute top-16 left-12 w-80 h-80 text-amber-300 transform -rotate-12" />
        <Lightbulb className="absolute bottom-16 right-12 w-96 h-96 text-yellow-400 transform rotate-45" />
      </div>

      <header className="relative z-20 border-b border-amber-500/20 bg-[#050b1a]/85 backdrop-blur-xl sticky top-0 px-4 md:px-8 py-3.5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-2xl bg-gradient-to-b from-[#0e1a38] to-[#081226] border border-amber-500/30 text-amber-300 hover:text-white transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex-1 text-center md:text-left flex items-center justify-center md:justify-start gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/40 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
              <Sun className="w-6 h-6 text-amber-400 animate-[spin_18s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 uppercase font-sans drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]">
                AllSmart Hub
              </h1>
              <p className="text-[11px] text-amber-200/80 font-mono tracking-wider hidden sm:block">
                Cześć, {user?.user_metadata?.username || user?.user_metadata?.login || user?.user_metadata?.full_name || user?.email?.split("@")[0]}! 👋
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5 bg-[#081226]/90 p-1.5 rounded-2xl border border-amber-500/25 shadow-inner">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                      : "text-slate-300 hover:text-amber-300 hover:bg-amber-500/10"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-slate-950 stroke-[2.5]" : "text-amber-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center ml-4">
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-2xl bg-[#081226] border border-blue-900/50 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition cursor-pointer shadow-sm"
              title="Wyloguj"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-amber-500/20 space-y-2 animate-in fade-in slide-in-from-top-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30"
                      : "bg-[#09152e] text-slate-300 hover:bg-[#0e214a]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-slate-950 stroke-[2.5]" : "text-amber-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-rose-950/30 text-rose-300 border border-rose-900/40 hover:bg-rose-900/40 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Wyloguj</span>
            </button>
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-br from-blue-500/40 via-amber-500/30 to-blue-900/20 shadow-[0_0_35px_-10px_rgba(59,130,246,0.2)]">
                <div className="rounded-[22px] bg-[#071126]/90 p-6 backdrop-blur-xl relative overflow-hidden">
                  <div className="flex justify-between items-center text-blue-300 text-xs font-bold uppercase tracking-wider">
                    <span>Aktywne Urządzenia</span>
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-4xl md:text-5xl font-black text-white font-mono">
                      {onlineDevicesCount}
                    </span>
                    <span className="text-xs text-blue-300/60 font-mono">/ {activeDevices.length} aktywnych</span>
                  </div>
                </div>
              </div>

              <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-br from-amber-400/60 via-yellow-500/30 to-amber-600/20 shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]">
                <div className="rounded-[22px] bg-[#071126]/90 p-6 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-center text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <span>Bieżące Obciążenie</span>
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-4xl md:text-5xl font-black text-amber-300 font-mono">
                      {totalPowerConsumption}
                    </span>
                    <span className="text-sm text-amber-400 font-mono font-black">W</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-[#08132b]/80 border border-amber-500/25 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => user && fetchDevices(user.id)}
                  disabled={isRefreshing}
                  className="px-4 py-2.5 rounded-2xl bg-[#0e1d3e] border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white transition cursor-pointer flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  title="Odśwież stan urządzeń"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
                  <span className="hidden sm:inline">Odśwież</span>
                </button>

                <button
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0e1d3e]/70 border border-blue-900/50 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-mono transition cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Archiwum ({archivedDevices.length})</span>
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 text-xs font-black tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.35)] transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Dodaj Urządzenie (Tuya)</span>
              </button>
            </div>

            {unassignedDevices.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold tracking-wide uppercase text-slate-300">
                    Urządzenia nieprzypisane do pokoju ({unassignedDevices.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {unassignedDevices.map((dev) => renderDeviceCard(dev))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {roomNames.map((room) => {
                const roomDevs = roomsMap[room];
                const anyOn = roomDevs.some((d) => d.state && d.isOnline);
                const isCollapsed = Boolean(collapsedRooms[room]);
                const roomPower = roomDevs
                  .filter((d) => d.state && d.isOnline)
                  .reduce((sum, d) => sum + (d.currentPower ?? 10), 0);

                return (
                  <div
                    key={room}
                    className="rounded-3xl border border-blue-900/40 bg-[#061024]/70 backdrop-blur-xl overflow-hidden shadow-xl"
                  >
                    <div className="p-4 md:p-5 flex items-center justify-between gap-4 border-b border-blue-900/30 bg-[#07132b]/80">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleRoomCollapse(room)}
                          className="p-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900 text-amber-300 transition cursor-pointer"
                          title={isCollapsed ? "Rozwiń pokój" : "Zwiń pokój"}
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base md:text-lg font-bold text-white tracking-wide">
                              {room}
                            </h3>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/40">
                              {roomDevs.length} {roomDevs.length === 1 ? "urządzenie" : "urządzenia"}
                            </span>
                          </div>
                          <span className="text-xs text-amber-300/80 font-mono">
                            Aktualny pobór w pokoju: <strong className="text-amber-400">{roomPower} W</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRoom(room, !anyOn)}
                        disabled={roomActionLoading === room}
                        className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
                          anyOn
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                            : "bg-[#0c1b3d] text-slate-300 border border-blue-900/60 hover:text-white"
                        }`}
                        title={anyOn ? "Wyłącz wszystkie światła w pokoju" : "Włącz wszystkie światła w pokoju"}
                      >
                        <Power className={`w-3.5 h-3.5 ${roomActionLoading === room ? "animate-spin" : ""}`} />
                        <span>{anyOn ? "Wyłącz pokój" : "Włącz pokój"}</span>
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
                        {roomDevs.map((dev) => renderDeviceCard(dev))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TELEMETRIA */}
        {activeTab === "telemetry" && user && (
          <TelemetryView userId={user.id} />
        )}

        {/* FAQ */}
        {activeTab === "faq" && <FaqView />}

        {/* KONTO */}
        {activeTab === "account" && user && (
          <AccountView user={user} onLogout={handleLogout} />
        )}
      </main>

      {/* Modal potwierdzenia zasilania */}
      {forceConfirmDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl p-[1.5px] bg-gradient-to-b from-amber-400 to-blue-600 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
            <div className="rounded-[23px] bg-[#071126] p-6">
              <div className="flex items-center gap-3 text-amber-400 mb-3">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="text-base font-bold text-white">Brak potwierdzenia zasilania</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Urządzenie <span className="font-semibold text-amber-300">{forceConfirmDevice.name}</span> raportuje brak łączności z siecią. Czy chcesz mimo to wymusić polecenie włączenia?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForceConfirmDevice(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0e1d3e] hover:bg-[#132752] text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => {
                    const target = forceConfirmDevice;
                    setForceConfirmDevice(null);
                    executeToggle(target);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer"
                >
                  Wymuś
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale pomocnicze */}
      {user && (
  <AddDeviceModal
    userId={user.id}
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onDeviceAdded={() => fetchDevices(user.id)}
  />
)}

      {selectedLight && (
        <LightControlModal
          isOpen={Boolean(selectedLight)}
          onClose={() => setSelectedLight(null)}
          device={selectedLight}
          onUpdate={handleLightUpdate}
        />
      )}

      {editingDevice && (
        <DeviceEditModal
          isOpen={Boolean(editingDevice)}
          onClose={() => setEditingDevice(null)}
          device={editingDevice}
          onSave={handleSaveDeviceMeta}
          onArchive={handleArchiveDevice}
        />
      )}

      <ArchivedDevicesModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        archivedDevices={archivedDevices}
        onRestore={handleRestoreDevice}
        onPermanentDelete={handlePermanentDeleteDevice}
      />
    </div>
  );
}