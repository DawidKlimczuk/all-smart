import { NextResponse } from "next/server";
import { TuyaContext } from "@tuya/tuya-connector-nodejs";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Brak tokenu QR." }, { status: 400 });
    }

    const tuya = new TuyaContext({
      baseUrl: process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com",
      accessKey: process.env.TUYA_CLIENT_ID || "",
      secretKey: process.env.TUYA_CLIENT_SECRET || "",
    });

    const res: any = await tuya.request({
      method: "GET",
      path: `/v1.0/token-qrcode/${token}`,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.msg }, { status: 400 });
    }

    const status = res.result.status;

    // Status 2 = Zeskanowano i zatwierdzono w aplikacji mobilnej
    if (status === 2) {
      const tuyaUid = res.result.uid;

      // Sprawdź lub utwórz użytkownika w bazie powiązanego z tym Tuya UID
      let user = await prisma.user.findFirst({
        where: { email: `${tuyaUid}@tuya.local` },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: randomUUID(),
            email: `${tuyaUid}@tuya.local`,
            fullName: `Tuya User (${tuyaUid.slice(-4)})`,
          },
        });
      }

      // Automatyczne pobranie urządzeń powiązanych z tym kontem Tuya
      try {
        const devRes: any = await tuya.request({
          method: "GET",
          path: `/v1.0/users/${tuyaUid}/devices`,
        });

        if (devRes?.success && Array.isArray(devRes.result)) {
          for (const dev of devRes.result) {
            const isPlug = dev.category === "cz" || dev.category === "pc";
            const deviceType: any = isPlug ? "SOCKET" : "LIGHT";

            const existingDevice = await prisma.device.findFirst({
              where: { externalId: dev.id },
            });

            if (existingDevice) {
              await prisma.device.update({
                where: { id: existingDevice.id },
                data: {
                  name: dev.name,
                  isOnline: Boolean(dev.online),
                  userId: user.id,
                },
              });
            } else {
              await prisma.device.create({
                data: {
                  userId: user.id,
                  name: dev.name,
                  type: deviceType,
                  externalId: dev.id,
                  integrationType: "TUYA_CLOUD",
                  isOnline: Boolean(dev.online),
                  state: false,
                  currentPower: 0,
                },
              });
            }
          }
        }
      } catch (devErr) {
        console.warn("Nie udało się zsynchronizować urządzeń podczas logowania:", devErr);
      }

      return NextResponse.json({
        success: true,
        status: 2,
        user: {
          id: user.id,
          tuyaUid,
          fullName: user.fullName,
        },
      });
    }

    return NextResponse.json({
      success: true,
      status, // 0 = oczekiwanie, 1 = zeskanowano
    });
  } catch (err: any) {
    console.error("Błąd sprawdzania statusu QR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}