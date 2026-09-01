import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Brak identyfikatora użytkownika" }, { status: 400 });
    }

    // Pobranie urządzeń przypisanych do usera
    let devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // Jeśli użytkownik nie ma jeszcze urządzeń, dodajemy zestaw startowy
    if (devices.length === 0) {
      await prisma.device.createMany({
        data: [
          {
            name: "Smart Plug (Pralka)",
            type: "SMART_PLUG",
            roomName: "Łazienka",
            userId,
            state: true,
            currentPowerW: 2150.0,
            integrationType: "TUYA_CLOUD",
          },
          {
            name: "Główne Oświetlenie LED",
            type: "LIGHT",
            roomName: "Salon",
            userId,
            state: true,
            brightness: 85,
            currentPowerW: 45.0,
            integrationType: "LOCAL_LAN",
          },
          {
            name: "Pompa Ciepła Split",
            type: "HEAT_PUMP",
            roomName: "Kotłownia",
            userId,
            state: true,
            currentTemp: 21.5,
            targetTemp: 22.5,
            currentPowerW: 1420.0,
            integrationType: "HOME_ASSISTANT",
          },
          {
            name: "Falownik PV 6kW",
            type: "PV_INVERTER",
            roomName: "Garaż",
            userId,
            state: true,
            currentPowerW: -3850.0,
            integrationType: "LOCAL_LAN",
          },
        ],
      });

      devices = await prisma.device.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({ success: true, data: devices });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}