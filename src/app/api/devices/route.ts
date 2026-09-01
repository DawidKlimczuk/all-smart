import { NextResponse } from "next/server";
import { MockDeviceAdapter } from "@/lib/adapters/mockAdapter";

const mockAdapter = new MockDeviceAdapter();

export async function GET() {
  const devices = await mockAdapter.fetchDevices();
  return NextResponse.json({ success: true, data: devices });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, action, value, currentState } = body;

    let success = false;
    if (action === "toggle") {
      success = await mockAdapter.toggleDevice(id, currentState);
    } else if (action === "setBrightness" && typeof value === "number") {
      success = (await mockAdapter.setBrightness?.(id, value)) ?? false;
    } else if (action === "setTemperature" && typeof value === "number") {
      success = (await mockAdapter.setTemperature?.(id, value)) ?? false;
    }

    return NextResponse.json({ success });
  } catch {
    return NextResponse.json({ success: false, error: "Błąd zapytania" }, { status: 400 });
  }
}