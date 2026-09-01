import { NextResponse } from "next/server";
import { TuyaContext } from "@tuya/tuya-connector-nodejs";
import { prisma } from "@/lib/prisma";
import { DeviceType, IntegrationType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Brak identyfikatora użytkownika." },
        { status: 400 }
      );
    }

    const accessKey = process.env.TUYA_CLIENT_ID;
    const secretKey = process.env.TUYA_CLIENT_SECRET;
    const baseUrl = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";

    if (!accessKey || !secretKey) {
      return NextResponse.json(
        { success: false, error: "Brak skonfigurowanych kluczy TUYA w .env" },
        { status: 500 }
      );
    }

    const tuya = new TuyaContext({
      baseUrl,
      accessKey,
      secretKey,
    });

    let fetchedDevices: any[] = [];

    // 1. Próba pobrania ze schematem standardowej aplikacji Tuya Smart
    const schemas = ["tuyaSmart", "smartlife", "tuya"];
    for (const schema of schemas) {
      try {
        const res: any = await tuya.request({
          method: "GET",
          path: `/v1.0/devices?schema=${schema}&page_no=1&page_size=50`,
        });
        console.log(`Tuya schema=${schema} response:`, JSON.stringify(res));

        if (res?.success && Array.isArray(res.result?.devices || res.result?.list || res.result)) {
          const list = res.result?.devices || res.result?.list || res.result;
          if (list.length > 0) {
            fetchedDevices = list;
            break;
          }
        }
      } catch (e) {
        console.warn(`Błąd dla schematu ${schema}:`, e);
      }
    }

    // 2. Jeśli schematy nie zwróciły listy, pobieramy bezpośrednio znane ID z powiązanego konta
    if (fetchedDevices.length === 0) {
      const knownIds = [
        "bfc2d905482430a5b1ehr3", // kuchnia
        "bf01ef1084a03ea58dbapk", // Gniazdko światełka
        "130836838caab5e71791", // żarówka sypialnia
        "bfcc8a0d40f4d45baaokjl", // żarówka łazienka prawa
        "bf33e928bc9a6b7fdefkck", // żarówka łazienka lewa
        "bfddcddc0f3c446a02pgtr", // zarowka łazienka środek
        "130836838caab5e71c19",  // żarówka mały pokój
      ];

      for (const devId of knownIds) {
        try {
          const dRes: any = await tuya.request({
            method: "GET",
            path: `/v1.0/devices/${devId}`,
          });
          if (dRes?.success && dRes.result) {
            fetchedDevices.push(dRes.result);
          }
        } catch {}
      }
    }

    if (fetchedDevices.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nie udało się pobrać urządzeń. Sprawdź terminal." },
        { status: 404 }
      );
    }

    // Upewniamy się, że użytkownik istnieje w bazie
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@allsmart.local`,
      },
    });

    const addedDevices = [];

    for (const dev of fetchedDevices) {
      const devId = dev.id || dev.devId || dev.uuid;
      if (!devId) continue;

      let deviceType: DeviceType = DeviceType.SMART_PLUG;
      const cat = (dev.category || "").toLowerCase();
      const name = (dev.name || "").toLowerCase();

      if (cat.startsWith("dj") || cat === "dd" || name.includes("żarów") || name.includes("zarow") || name.includes("bulb") || name.includes("led")) {
        deviceType = DeviceType.LIGHT;
      } else if (cat === "wk" || cat === "kt" || name.includes("pompa") || name.includes("grzejnik")) {
        deviceType = DeviceType.HEAT_PUMP;
      } else if (cat === "cz" || name.includes("gniazdko") || name.includes("socket") || name.includes("kuchnia")) {
        deviceType = DeviceType.SMART_PLUG;
      }

      const isOnline = dev.online ?? (dev.status === "online" || dev.is_online === true);

      // Wykrywanie aktualnego stanu włącznika z właściwości Tuya
      let switchState = false;
      if (Array.isArray(dev.status)) {
        const switchCode = dev.status.find((s: any) => s.code === "switch_1" || s.code === "switch_led" || s.code === "switch");
        if (switchCode) switchState = Boolean(switchCode.value);
      }

      const saved = await prisma.device.upsert({
        where: { id: devId },
        update: {
          name: dev.name || "Urządzenie Tuya",
          isOnline: isOnline,
          state: switchState,
          type: deviceType,
          isRecoverable: true,
        },
        create: {
          id: devId,
          name: dev.name || "Urządzenie Tuya",
          type: deviceType,
          roomName: "Mieszkanie",
          isOnline: isOnline,
          state: switchState,
          brightness: 100,
          colorTemp: 4000,
          isRecoverable: true,
          integrationType: IntegrationType.TUYA_CLOUD,
          externalId: devId,
          userId: userId,
        },
      });
      addedDevices.push(saved);
    }

    return NextResponse.json({
      success: true,
      count: addedDevices.length,
      devices: addedDevices,
    });
  } catch (err: any) {
    console.error("Tuya Sync Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Błąd komunikacji z Tuya Cloud." },
      { status: 500 }
    );
  }
}