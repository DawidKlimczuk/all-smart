import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Nieprawidłowe dane żądania." }, { status: 400 });
    }

    const { username, email, password, captchaAnswer } = body;

    if (Number(captchaAnswer) !== 8) {
      return NextResponse.json({ success: false, error: "Niepoprawny wynik testu anty-bot (3 + 5 = 8)." }, { status: 400 });
    }

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, error: "Wszystkie pola są wymagane." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (data.user) {
      // Zapis do tabeli relacyjnej w Postgres przez Prisma
      await prisma.user.upsert({
        where: { email: email.trim() },
        update: {},
        create: {
          id: data.user.id,
          email: email.trim(),
        },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}