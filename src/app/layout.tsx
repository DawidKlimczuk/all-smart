import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AllSmart Hub | IoT Dashboard",
  description: "Zarządzanie automatyką domową, pompą ciepła i energią PV",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="antialiased bg-[#0b0c10] text-gray-100">{children}</body>
    </html>
  );
}