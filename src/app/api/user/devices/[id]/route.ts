import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TuyaContext } from "@tuya/tuya-connector-nodejs";
import { IntegrationType } from "@prisma/client";

function hexToHsv(hex: string) {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 1000);
  const v = Math.round(max * 1000);

  const hHex = h.toString(16).padStart(4, "0");
  const sHex = s.toString(16).padStart(4, "0");
  const vHex = v.toString(16).padStart(4, "0");

  return {
    h,
    s,
    v,
    tuyaHex: `${hHex}${sHex}${vHex}`,
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      state,
      brightness,
      colorTemp,
      colorRgb,
      workMode,
      name,
      roomName,
      isOnline,
      isArchived,
      currentPower,
    } = body;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return NextResponse.json(
        { success: false, error: "Nie znaleziono urządzenia." },
        { status: 404 }
      );
    }

    let detectedOffline = false;

    if (device.integrationType === IntegrationType.TUYA_CLOUD && device.externalId) {
      const accessKey = process.env.TUYA_CLIENT_ID;
      const secretKey = process.env.TUYA_CLIENT_SECRET;
      const baseUrl = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";

      if (accessKey && secretKey) {
        const tuya = new TuyaContext({ baseUrl, accessKey, secretKey });
        const commands: Array<{ code: string; value: any }> = [];

        if (workMode === "white") {
          commands.push({ code: "work_mode", value: "white" });
        } else if (workMode === "colour") {
          commands.push({ code: "work_mode", value: "colour" });
        }

        if (typeof state === "boolean") {
          if (device.type === "SMART_PLUG") {
            commands.push({ code: "switch_1", value: state });
          } else {
            commands.push({ code: "switch_led", value: state });
          }
        }

        if (colorRgb && typeof colorRgb === "string") {
          const { h, s, v, tuyaHex } = hexToHsv(colorRgb);
          if (!workMode) {
            commands.push({ code: "work_mode", value: "colour" });
          }
          commands.push({ code: "colour_data_v2", value: { h, s, v } });
          commands.push({ code: "colour_data", value: tuyaHex });
        }

        if (typeof brightness === "number") {
          const bVal = Math.max(10, Math.min(1000, Math.round(brightness * 10)));
          commands.push({ code: "bright_value_v2", value: bVal });
        }

        if (typeof colorTemp === "number") {
          let tVal = colorTemp;
          if (colorTemp > 100) {
            tVal = Math.round(((colorTemp - 2700) / (6500 - 2700)) * 1000);
          } else {
            tVal = Math.round(colorTemp * 10);
          }
          tVal = Math.max(0, Math.min(1000, tVal));

          if (!workMode) {
            commands.push({ code: "work_mode", value: "white" });
          }
          commands.push({ code: "temp_value_v2", value: tVal });
        }

        if (commands.length > 0) {
          for (const cmd of commands) {
            try {
              const res: any = await tuya.request({
                method: "POST",
                path: `/v1.0/devices/${device.externalId}/commands`,
                body: { commands: [cmd] },
              });

              if (res && (res.code === 2001 || (res.success === false && res.code !== 2008))) {
                console.warn(`[TUYA OFFLINE] Urządzenie ${device.name} nie odpowiada:`, res);
                detectedOffline = true;
                break;
              }
            } catch (err) {
              console.warn(`[TUYA ERROR] Błąd połączenia z ${device.name}:`, err);
              detectedOffline = true;
              break;
            }
          }
        }
      }
    }

    // Jeśli wykryto brak zasilania, natychmiast oznaczamy cały powiązany obwód (pokój)
    if (detectedOffline) {
      if (device.roomName && device.roomName.toLowerCase() !== "mieszkanie") {
        await prisma.device.updateMany({
          where: {
            userId: device.userId,
            roomName: device.roomName,
          },
          data: { isOnline: false, state: false },
        });
      }

      const offlineDevice = await prisma.device.update({
        where: { id },
        data: { isOnline: false, state: false },
      });

      return NextResponse.json({
        success: true,
        data: offlineDevice,
        warning: "Brak zasilania (urządzenie offline)",
      });
    }

    const updatedDevice = await prisma.device.update({
      where: { id },
      data: {
        ...(typeof state === "boolean" && { state }),
        ...(typeof brightness === "number" && { brightness }),
        ...(typeof colorTemp === "number" && { colorTemp }),
        ...(typeof isOnline === "boolean" && { isOnline }),
        ...(typeof isArchived === "boolean" && { isArchived }),
        ...(typeof currentPower === "number" && { currentPower }),
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