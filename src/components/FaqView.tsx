"use client";

import React, { useState } from "react";
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Smartphone, 
  Wifi, 
  Zap, 
  RotateCcw, 
  ShieldAlert,
  ExternalLink
} from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  category: "setup" | "devices" | "network" | "power";
  answer: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "app-download",
    category: "setup",
    question: "Skąd pobrać oficjalną aplikację Tuya i jak założyć konto?",
    answer: (
      <div className="space-y-2 text-slate-300">
        <p>
          Do pierwszej konfiguracji i sparowania żarówek z domowym Wi-Fi potrzebujesz oficjalnej aplikacji. Możesz wybrać jedną z dwóch (działają w tym samym ekosystemie Tuya Cloud):
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
          <li><strong className="text-white">Tuya Smart</strong> – dostępna w Google Play (Android) oraz App Store (iOS).</li>
          <li><strong className="text-white">Smart Life</strong> – lżejsza, popularniejsza wersja tego samego klienta chmurowego.</li>
        </ul>
        <p className="text-xs text-amber-300/80 font-mono pt-1">
          Wskazówka: Po zarejestrowaniu konta w aplikacji pamiętaj, aby zapisać adres e-mail i hasło — będą one potrzebne do powiązania chmury z Twoim AllSmart Hubem.
        </p>
      </div>
    ),
  },
  {
    id: "pairing-bulb",
    category: "devices",
    question: "Jak wprowadzić żarówkę lub taśmę LED w tryb parowania (migania)?",
    answer: (
      <div className="space-y-2 text-slate-300">
        <p>
          Większość inteligentnych źródeł światła Tuya (E27, GU10, paski LED) wprowadza się w tryb parowania za pomocą mechanicznego włącznika na ścianie:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
          <li>Włącz zasilanie, a następnie wykonaj sekwencję: <span className="text-amber-300 font-semibold font-mono">WYŁĄCZ → WŁĄCZ → WYŁĄCZ → WŁĄCZ → WYŁĄCZ → WŁĄCZ</span> (3 do 5 razy w równych odstępach ok. 1 sekundy).</li>
          <li>Odczekaj 2-3 sekundy. Żarówka powinna zacząć gwałtownie pulsować (błyskać na biało lub na przemian kolorami).</li>
          <li>Otwórz aplikację Tuya Smart na telefonie – urządzenie powinno zostać natychmiast wykryte przez Bluetooth/Wi-Fi w oknie powiadomienia (Auto-Discovery).</li>
        </ol>
      </div>
    ),
  },
  {
    id: "wifi-requirements",
    category: "network",
    question: "Dlaczego urządzenia Tuya wymagają sieci Wi-Fi 2.4 GHz?",
    answer: (
      <div className="space-y-2 text-slate-300">
        <p>
          Płytki mikroprocesorowe w inteligentnych żarówkach i gniazdkach posiadają anteny wyłącznie na pasmo <strong className="text-white">2.4 GHz</strong>, ponieważ zapewnia ono znacznie większy zasięg i przenikalność przez ściany niż pasmo 5 GHz.
        </p>
        <p className="text-xs text-amber-300/85 font-mono">
          Ważne: Jeśli Twój domowy router łączy pasma 2.4 GHz i 5 GHz pod jedną nazwą (Smart Connect / Band Steering), na czas pierwszego parowania wyłącz na chwilę pasmo 5 GHz lub nadaj im osobne nazwy SSID.
        </p>
      </div>
    ),
  },
  {
    id: "offline-state",
    category: "power",
    question: "Co dokładnie oznacza status „Brak zasilania” w naszym Hubie?",
    answer: (
      <div className="space-y-2 text-slate-300">
        <p>
          Ten status pojawia się, gdy ktoś odetnie fizyczny dopływ prądu do żarówki za pomocą tradycyjnego przełącznika ściennego. Wówczas żarówka fizycznie gaśnie, a jej układ radiowy nie przesyła pakietów keep-alive (heartbeat) do chmury.
        </p>
        <p>
          W AllSmart Hub zastosowaliśmy <strong className="text-amber-300">tryb optymistyczny (Safe-Override)</strong>: przycisk nie jest zablokowany, lecz lekko wyblakły. Jeśli klikniesz go z premedytacją, Hub spróbuje wymusić polecenie do chmury, w razie gdyby żarówka już odzyskała zasilanie.
        </p>
      </div>
    ),
  },
  {
    id: "auto-restore",
    category: "power",
    question: "Do czego służy funkcja Auto-Restore przy kafelku urządzenia?",
    answer: (
      <div className="space-y-2 text-slate-300">
        <p>
          Gdy po zaniku zasilania w mieszkaniu (lub po ponownym włączeniu klawisza) żarówka wraca do zasilania, niektóre modele startują z fabryczną jasnością 100% i zimną bielą.
        </p>
        <p>
          Przycisk <strong className="text-amber-400 font-mono">Auto-Restore</strong> wysyła do żarówki profil zapisany w Twojej bazie danych (ostatnio dobraną jasność, temperaturę barwową i odcień RGB), natychmiast przywracając preferowany nastrój w pokoju.
        </p>
      </div>
    ),
  },
];

export default function FaqView() {
  const [openIds, setOpenIds] = useState<string[]>(["app-download", "pairing-bulb"]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Baner wstępny */}
      <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-br from-amber-400/40 via-blue-500/30 to-amber-600/20 shadow-[0_0_35px_-10px_rgba(245,158,11,0.25)]">
        <div className="rounded-[22px] bg-[#071126]/95 p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                Baza Wiedzy & Pomoc
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">
                Centrum Wsparcia AllSmart Hub
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Wskazówki dotyczące parowania, konfiguracji ekosystemu Tuya i zarządzania energią
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://tuya.eu/pl/blog"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1d3e] border border-blue-900/60 hover:border-amber-400/50 text-amber-300 text-xs font-semibold transition"
              >
                <span>Tuya Platform</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Lista pytań i odpowiedzi */}
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openIds.includes(item.id);

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-[#07132c]/90 border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.1)]"
                  : "bg-[#060f22]/70 border-blue-950/80 hover:border-blue-900/60"
              }`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="text-sm md:text-base font-bold text-white tracking-wide">
                  {item.question}
                </span>
                <div className={`p-1.5 rounded-xl transition ${isOpen ? "bg-amber-500/20 text-amber-300" : "bg-blue-950/60 text-slate-400"}`}>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-5 md:px-5 md:pb-6 text-xs leading-relaxed border-t border-blue-900/30 pt-3 text-slate-300 animate-in fade-in duration-150">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}