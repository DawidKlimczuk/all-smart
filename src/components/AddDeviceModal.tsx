"use client";

import { useState } from "react";
import { 
  Cloud, 
  Wifi, 
  Settings, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Smartphone,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Plus
} from "lucide-react";

interface Props {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdded: (device: any) => void;
}

export default function AddDeviceModal({ userId, isOpen, onClose, onDeviceAdded }: Props) {
  const [activeTab, setActiveTab] = useState<"TUYA" | "LAN" | "MANUAL">("TUYA");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Stan: Tuya Cloud (E-mail + Hasło)
  const [tuyaEmail, setTuyaEmail] = useState("");
  const [tuyaPassword, setTuyaPassword] = useState("");
  const [showGuestGuide, setShowGuestGuide] = useState(false);

  // Stan: Manual Wizard
  const [manualName, setManualName] = useState("");
  const [manualType, setManualType] = useState("SMART_PLUG");
  const [manualRoom, setManualRoom] = useState("Salon");

  // Stan: Skaner LAN
  const [lanDevices, setLanDevices] = useState([
    { id: "lan-fronius", name: "Fronius Symo 6.0 (PV Inverter)", ip: "192.168.1.45", type: "PV_INVERTER" },
    { id: "lan-panasonic", name: "Panasonic Aquarea (Pompa Ciepła)", ip: "192.168.1.78", type: "HEAT_PUMP" },
    { id: "lan-shelly", name: "Shelly Plus 1PM (Licznik)", ip: "192.168.1.102", type: "ENERGY_METER" }
  ]);

  if (!isOpen) return null;

  const handleTuyaSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/integrations/tuya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          tuyaEmail,
          tuyaPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Nie udało się zsynchronizować urządzeń.");
      }

      setMsg({ text: `Zsynchronizowano pomyślnie ${data.count} urządzeń!` });
      data.devices.forEach((d: any) => onDeviceAdded(d));
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setMsg({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/user/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: manualName,
          type: manualType,
          roomName: manualRoom,
          integrationType: "MANUAL_MOCK",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Błąd dodawania urządzenia");

      onDeviceAdded(data.data);
      onClose();
    } catch (err: any) {
      setMsg({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLanDevice = async (lanDev: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: lanDev.name,
          type: lanDev.type,
          roomName: "Sieć Lokalna",
          integrationType: "LOCAL_LAN",
        }),
      });
      const data = await res.json();
      if (data.success) {
        onDeviceAdded(data.data);
        setLanDevices((prev) => prev.filter((d) => d.id !== lanDev.id));
      }
    } catch (err: any) {
      setMsg({ text: "Błąd dodawania urządzenia LAN", error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header Modalu */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900/90 backdrop-blur-md z-10">
          <div>
            <h3 className="text-xl font-bold text-white">Dodaj Urządzenie / Hub</h3>
            <p className="text-xs text-gray-400 mt-0.5">Wybierz sposób integracji z Twoją automatyką</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Zakładki */}
        <div className="grid grid-cols-3 bg-gray-950/60 p-2 gap-2 border-b border-gray-800">
          <button
            onClick={() => { setActiveTab("TUYA"); setMsg(null); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "TUYA" 
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/40" 
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Chmura Tuya</span>
          </button>

          <button
            onClick={() => { setActiveTab("LAN"); setMsg(null); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "LAN" 
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/40" 
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Skaner LAN</span>
          </button>

          <button
            onClick={() => { setActiveTab("MANUAL"); setMsg(null); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "MANUAL" 
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/40" 
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Kreator Ręczny</span>
          </button>
        </div>

        {/* Status */}
        {msg && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
            msg.error ? "bg-rose-500/10 border border-rose-500/30 text-rose-300" : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
          }`}>
            {msg.error ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Treść */}
        <div className="p-6 space-y-4">
          {activeTab === "TUYA" && (
            <div className="space-y-4">
              
              {/* Baner informacyjny */}
              <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Bezpieczna integracja z Tuya Cloud OpenAPI</span>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  Hub zsynchronizuje wszystkie sparowane żarówki, wtyczki i przekaźniki wraz z ich stanami. Dodatkowo profil ustawień zostanie zachowany w bazie — w przypadku przypadkowego resetu zasilania przywrócisz je jednym kliknięciem.
                </p>
              </div>

              {/* Akordeon: Poradnik dla konta Gość */}
              <div className="border border-gray-800 bg-gray-950/40 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowGuestGuide(!showGuestGuide)}
                  className="w-full p-3.5 flex items-center justify-between text-left text-xs text-gray-300 hover:text-white transition"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                    <span>Używasz aplikacji Tuya / Smart Life jako Gość? (Kliknij tutaj)</span>
                  </div>
                  {showGuestGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showGuestGuide && (
                  <div className="p-4 pt-1 border-t border-gray-800/60 text-xs text-gray-400 space-y-2">
                    <p className="text-gray-300 font-semibold">Jak połączyć urządzenia bez ponownego parowania:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400">
                      <li>Otwórz aplikację <strong>Tuya</strong> lub <strong>Smart Life</strong> na telefonie.</li>
                      <li>Wejdź w zakładkę <strong>Profil (Ja)</strong> kliknij swój profil u góry.</li>
                      <li>Wybierz <strong>Powiąż konto e-mail</strong> i ustaw hasło (zajmuje to chwilę).</li>
                      <li><strong>Wpisz poniżej adres E-mail oraz hasło z aplikacji</strong></li>
                      <li>Wszystkie Twoje żarówki i gniazdka zostaną natychmiast przypisane do konta bez konieczności ponownego parowania.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Formularz logowania Tuya */}
              <form onSubmit={handleTuyaSync} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Adres E-mail konta Tuya / Smart Life</label>
                  <input
                    type="email"
                    required
                    placeholder="twoj-email@domena.pl"
                    value={tuyaEmail}
                    onChange={(e) => setTuyaEmail(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Hasło do konta aplikacji</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••••••"
                    value={tuyaPassword}
                    onChange={(e) => setTuyaPassword(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {loading ? "Łączenie z Tuya..." : "Połącz i zaimportuj urządzenia"}
                </button>
              </form>
            </div>
          )}

          {/* Skaner LAN */}
          {activeTab === "LAN" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Wykryte urządzenia w sieci lokalnej:</span>
                <span className="text-xs font-mono text-purple-400">3 znalezione</span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {lanDevices.map((dev) => (
                  <div key={dev.id} className="flex items-center justify-between p-3.5 bg-gray-950/60 border border-gray-800 rounded-2xl">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{dev.name}</h4>
                      <p className="text-xs font-mono text-gray-500">IP: {dev.ip} • Modbus / REST</p>
                    </div>
                    <button
                      onClick={() => handleAddLanDevice(dev)}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white text-xs font-medium transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Dodaj
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kreator Ręczny */}
          {activeTab === "MANUAL" && (
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nazwa Urządzenia</label>
                <input
                  type="text"
                  required
                  placeholder="np. Grzejnik Łazienka"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Kategoria</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="SMART_PLUG">Smart Plug (Gniazdko)</option>
                  <option value="LIGHT">Oświetlenie LED</option>
                  <option value="HEAT_PUMP">Pompa Ciepła</option>
                  <option value="PV_INVERTER">Falownik Fotowoltaiczny</option>
                  <option value="GAS_BOILER">Piec Gazowy</option>
                  <option value="ENERGY_METER">Licznik Energii</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Pomieszczenie</label>
                <input
                  type="text"
                  placeholder="np. Salon, Kotłownia, Biuro"
                  value={manualRoom}
                  onChange={(e) => setManualRoom(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition cursor-pointer"
              >
                {loading ? "Dodawanie..." : "Zapisz Urządzenie"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}