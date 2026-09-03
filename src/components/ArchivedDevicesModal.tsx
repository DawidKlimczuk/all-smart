"use client";

import React from "react";
import { X, ArchiveRestore, Trash2, Box } from "lucide-react";

interface ArchivedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedDevices: any[];
  onRestore: (deviceId: string) => Promise<void>;
  onPermanentDelete: (deviceId: string) => Promise<void>;
}

export default function ArchivedDevicesModal({
  isOpen,
  onClose,
  archivedDevices,
  onRestore,
  onPermanentDelete,
}: ArchivedDevicesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0f1117] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Box className="w-5 h-5 text-purple-400" />
          Archiwum urządzeń
        </h3>
        <p className="text-xs text-zinc-400 font-mono mb-6">
          Urządzenia usunięte z ekranu głównego ({archivedDevices.length})
        </p>

        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {archivedDevices.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Brak zarchiwizowanych urządzeń.
            </div>
          ) : (
            archivedDevices.map((dev) => (
              <div
                key={dev.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white">{dev.name}</h4>
                  <p className="text-xs text-zinc-500 font-mono">{dev.roomName || "Brak pokoju"} • {dev.type}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRestore(dev.id)}
                    className="p-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white transition text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Przywróć na pulpit"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                    <span>Przywróć</span>
                  </button>

                  <button
                    onClick={() => onPermanentDelete(dev.id)}
                    className="p-2 rounded-lg bg-zinc-800/60 hover:bg-rose-950/60 border border-transparent hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                    title="Usuń trwale z bazy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}