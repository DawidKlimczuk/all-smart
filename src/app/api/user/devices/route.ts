import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeviceType, IntegrationType } from "@prisma/client";

// Pobieranie listy urządzeń użytkownika
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Brak parametru userId" }, { status: 400 });
    }

    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: devices });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Ręczne tworzenie nowego urządzenia
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, type, roomName, integrationType } = body;

    if (!userId || !name || !type) {
      return NextResponse.json(
        { success: false, error: "Wymagane pola: userId, name, type" },
        { status: 400 }
      );
    }

    // Upewniamy się, że profil usera istnieje w tabeli User (zgodnie ze schematem z polem email)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@allsmart.local`,
      },
    });

    const newDevice = await prisma.device.create({
      data: {
        name,
        type: type as DeviceType,
        roomName: roomName || "Salon",
        integrationType: (integrationType as IntegrationType) || IntegrationType.MANUAL_MOCK,
        state: false,
        isOnline: true,
        brightness: 100,
        colorTemp: 4000,
        isRecoverable: true,
        userId,
      },
    });

    return NextResponse.json({ success: true, data: newDevice }, { status: 201 });
  } catch (err: any) {
    console.error("Błąd POST /api/user/devices:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd zapisu w bazie danych" }, { status: 500 });
  }
}