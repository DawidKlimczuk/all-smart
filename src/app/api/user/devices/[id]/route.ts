import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TuyaContext } from "@tuya/tuya-connector-nodejs";
import { IntegrationType } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { state, brightness, colorTemp, colorRgb, name, roomName, isOnline } = body;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return NextResponse.json({ success: false, error: "Nie znaleziono urządzenia" }, { status: 404 });
    }

    // Jeśli urządzenie jest spięte z Tuya Cloud, wyślij komendy do sprzętu
    if (device.integrationType === IntegrationType.TUYA_CLOUD && device.externalId) {
      const accessKey = process.env.TUYA_CLIENT_ID;
      const secretKey = process.env.TUYA_CLIENT_SECRET;
      const baseUrl = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";

      if (accessKey && secretKey) {
        const tuya = new TuyaContext({ baseUrl, accessKey, secretKey });

        const commands: Array<{ code: string; value: any }> = [];

        if (typeof state === "boolean") {
          // Gniazdka SP301/inteligentne wtyczki korzystają z switch_1 lub switch, a oświetlenie z switch_led
          if (device.type === "SMART_PLUG") {
            commands.push({ code: "switch_1", value: state });
            commands.push({ code: "switch", value: state });
          } else {
            commands.push({ code: "switch_led", value: state });
            commands.push({ code: "switch_1", value: state });
          }
        }

        if (typeof brightness === "number") {
          commands.push({ code: "bright_value_v2", value: Math.round(brightness * 10) });
        }

        if (commands.length > 0) {
          // Wysyłamy komendy po kolei, aby dopasować działający kod DP urządzenia
          for (const cmd of commands) {
            try {
              const tuyaRes: any = await tuya.request({
                method: "POST",
                path: `/v1.0/devices/${device.externalId}/commands`,
                body: { commands: [cmd] },
              });
              console.log(`Tuya Command [${cmd.code}=${cmd.value}] Result:`, JSON.stringify(tuyaRes));
              if (tuyaRes?.success) break;
            } catch (err) {
              console.warn(`Nieudana próba wysłania komendy ${cmd.code}:`, err);
            }
          }
        }
      }
    }

    // Aktualizacja rekordu w bazie
    const updatedDevice = await prisma.device.update({
      where: { id },
      data: {
        ...(typeof state === "boolean" && { state }),
        ...(typeof brightness === "number" && { brightness }),
        ...(typeof colorTemp === "number" && { colorTemp }),
        ...(typeof isOnline === "boolean" && { isOnline }),
        ...(colorRgb && { colorRgb }),
        ...(name && { name }),
        ...(roomName && { roomName }),
      },
    });

    return NextResponse.json({ success: true, data: updatedDevice });
  } catch (err: any) {
    console.error("Device update error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.device.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}