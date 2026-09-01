import { NextResponse } from "next/server";

export async function GET() {
  // Generowanie realistycznego profilu dobowego (24h)
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = `${i.toString().padStart(2, "0")}:00`;
    
    // Krzywa fotowoltaiki (szczyt 11:00 - 15:00)
    let solarW = 0;
    if (i >= 6 && i <= 19) {
      solarW = Math.round(Math.sin(((i - 6) / 13) * Math.PI) * 4800 + Math.random() * 200);
    }

    // Bazowe zużycie domowe + szczyty rano i wieczorem
    let consumptionW = 350 + Math.round(Math.random() * 150);
    if (i >= 7 && i <= 9) consumptionW += 1600; // poranek
    if (i >= 17 && i <= 22) consumptionW += 2200; // wieczór (pralka, płyta, pompa)

    return {
      time: hour,
      production: solarW,
      consumption: consumptionW,
      balance: solarW - consumptionW,
    };
  });

  return NextResponse.json({ success: true, data: hours });
}