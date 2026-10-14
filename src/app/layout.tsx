import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Altave - Controle de Tickets",
  description:
    "Aplicação desenvolvida para Altave pelo grupo Fawkes Code - Fatec SJC 2º DSM",
  icons: "/altave-ico.svg",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("h-full", "antialiased", "font-sans")}>
      <body className="min-h-full h-screen flex flex-col bg-[#05325A]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
