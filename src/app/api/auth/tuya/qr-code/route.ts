import { NextResponse } from "next/server";
import { TuyaContext } from "@tuya/tuya-connector-nodejs";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const tuya = new TuyaContext({
      baseUrl: process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com",
      accessKey: process.env.TUYA_CLIENT_ID || "",
      secretKey: process.env.TUYA_CLIENT_SECRET || "",
    });

    const res: any = await tuya.request({
      method: "POST",
      path: "/v1.0/token-qrcode",
      body: {},
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.msg || "Nie udało się wygenerować kodu QR." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      qrcode: res.result.qrcode,
    });
  } catch (err: any) {
    console.error("Błąd generowania Tuya QR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}