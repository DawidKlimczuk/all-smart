import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const range = searchParams.get("range") || "24h"; // '1h' | '24h' | '7d'

    if (!userId) {
      return NextResponse.json({ success: false, error: "Brak userId" }, { status: 400 });
    }

    const devices = await prisma.device.findMany({
      where: { userId, isArchived: false },
    });

    if (devices.length === 0) {
      return NextResponse.json({
        success: true,
        stats: { maxPower: 0, minPower: 0, avgPower: 0, monthlyKwh: 0 },
        history: [],
        hasDevices: false,
      });
    }

    // Bieżący realny pobór mocy
    const currentActivePower = devices
      .filter((d) => d.isOnline && d.state)
      .reduce((sum, d) => sum + (d.currentPower || 10), 0);

    const currentStandbyPower = devices
      .filter((d) => d.isOnline && !d.state)
      .length * 0.5;

    const totalRealNow = Math.round(currentActivePower + currentStandbyPower);

    // Zapis do EnergyLog
    await prisma.energyLog.create({
      data: {
        userId,
        deviceId: devices[0].id,
        power: totalRealNow,
        energy: (totalRealNow / 1000) * (1 / 60),
      },
    }).catch(() => null);

    const now = new Date();
    let historyData: Array<{ time: string; power: number }> = [];

    if (range === "1h") {
      // 12 punktów co 5 minut
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const logs = await prisma.energyLog.findMany({
        where: { userId, recordedAt: { gte: oneHourAgo } },
        orderBy: { recordedAt: "asc" },
      });

      for (let i = 11; i >= 0; i--) {
        const slotTime = new Date(now.getTime() - i * 5 * 60 * 1000);
        const timeLabel = slotTime.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

        const slotLogs = logs.filter((l) => {
          const diff = Math.abs(new Date(l.recordedAt).getTime() - slotTime.getTime());
          return diff <= 2.5 * 60 * 1000;
        });

        let p = slotLogs.length > 0 
          ? Math.round(slotLogs.reduce((a, b) => a + b.power, 0) / slotLogs.length) 
          : (i === 0 ? totalRealNow : Math.round(currentStandbyPower));

        historyData.push({ time: timeLabel, power: p });
      }
    } else if (range === "7d") {
      // 7 dni
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      const logs = await prisma.energyLog.findMany({
        where: { userId, recordedAt: { gte: sevenDaysAgo } },
        orderBy: { recordedAt: "asc" },
      });

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
        const dayLabel = d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric" });

        const slotLogs = logs.filter((l) => new Date(l.recordedAt).getDate() === d.getDate());
        let p = slotLogs.length > 0 
          ? Math.round(slotLogs.reduce((a, b) => a + b.power, 0) / slotLogs.length) 
          : (i === 0 ? totalRealNow : Math.round(currentStandbyPower));

        historyData.push({ time: dayLabel, power: p });
      }
    } else {
      // Domyślnie 24h
      const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
      const logs = await prisma.energyLog.findMany({
        where: { userId, recordedAt: { gte: oneDayAgo } },
        orderBy: { recordedAt: "asc" },
      });

      for (let i = 23; i >= 0; i--) {
        const slotTime = new Date(now.getTime() - i * 3600 * 1000);
        const hour = slotTime.getHours();
        const hourStr = `${hour.toString().padStart(2, "0")}:00`;

        const slotLogs = logs.filter((l) => {
          const d = new Date(l.recordedAt);
          return d.getHours() === hour && d.getDate() === slotTime.getDate();
        });

        let p = slotLogs.length > 0
          ? Math.round(slotLogs.reduce((a, b) => a + b.power, 0) / slotLogs.length)
          : (i === 0 ? totalRealNow : Math.round(currentStandbyPower));

        historyData.push({ time: hourStr, power: p });
      }
    }

    historyData[historyData.length - 1].power = totalRealNow;

    const powers = historyData.map((d) => d.power);
    const maxPower = Math.max(totalRealNow, ...powers);
    const minPower = Math.min(...powers);
    const avgPower = Math.round(powers.reduce((a, b) => a + b, 0) / powers.length);
    const monthlyKwh = Math.round(((avgPower * 24 * 30.5) / 1000) * 10) / 10;

    return NextResponse.json({
      success: true,
      stats: { maxPower, minPower, avgPower, monthlyKwh },
      history: historyData,
      hasDevices: true,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}