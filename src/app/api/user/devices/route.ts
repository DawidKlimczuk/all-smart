import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TuyaContext } from "@tuya/tuya-connector-nodejs";
import { IntegrationType } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Brak parametru userId." }, { status: 400 });
    }

    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const accessKey = process.env.TUYA_CLIENT_ID;
    const secretKey = process.env.TUYA_CLIENT_SECRET;
    const baseUrl = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";

    if (accessKey && secretKey) {
      const tuya = new TuyaContext({ baseUrl, accessKey, secretKey });

      await Promise.all(
        devices.map(async (dev) => {
          if (dev.integrationType === IntegrationType.TUYA_CLOUD && dev.externalId) {
            try {
              const res: any = await tuya.request({
                method: "GET",
                path: `/v1.0/devices/${dev.externalId}`,
              });

              if (res?.success && res.result) {
                const cloudOnline = Boolean(res.result.online);
                let cloudState = dev.state;
                let dynamicPower = dev.currentPower;

                if (Array.isArray(res.result.status)) {
                  const switchDp = res.result.status.find(
                    (s: any) => s.code === "switch_led" || s.code === "switch_1" || s.code === "switch"
                  );
                  if (switchDp && typeof switchDp.value === "boolean") {
                    cloudState = switchDp.value;
                  }

                  const powerDp = res.result.status.find((s: any) => s.code === "cur_power");
                  if (powerDp && typeof powerDp.value === "number") {
                    const realWatts = cloudState ? Math.round(powerDp.value / 10) : 0;
                    dynamicPower = realWatts;
                  }
                }

                const isNowOnline = cloudOnline;
                const isNowState = cloudOnline ? cloudState : false;

                if (dev.isOnline !== isNowOnline || dev.state !== isNowState || dev.currentPower !== dynamicPower) {
                  dev.isOnline = isNowOnline;
                  dev.state = isNowState;
                  dev.currentPower = dynamicPower;

                  prisma.device.update({
                    where: { id: dev.id },
                    data: {
                      isOnline: isNowOnline,
                      state: isNowState,
                      currentPower: dynamicPower,
                    },
                  }).catch(() => null);
                }
              }
            } catch (err) {
              console.warn(`Błąd synchronizacji dla ${dev.name}:`, err);
            }
          }
        })
      );
    }

    // Ciągły zapis punktu pomiarowego do bazy w tle
    if (devices.length > 0) {
      const totalPower = devices
        .filter((d) => d.isOnline && d.state)
        .reduce((sum, d) => sum + (d.currentPower ?? 10), 0);

      prisma.energyLog.create({
        data: {
          userId,
          deviceId: devices[0].id,
          power: totalPower,
          energy: (totalPower / 1000) * (5 / 3600),
        },
      }).catch(() => null);
    }

    const response = NextResponse.json({ success: true, data: devices });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  } catch (err: any) {
    console.error("Błąd pobierania urządzeń:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}