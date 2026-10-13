import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Altave - Autenticação",
  description:
    "Aplicação desenvolvida para Altave pelo grupo Fawkes Code - Fatec SJC 2º DSM",
  icons: "/altave-ico.svg",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("h-full", "antialiased", "font-sans")}>
      <body className="min-h-full h-screen flex flex-col">
        <main className="flex flex-col w-full overflow-hidden bg-[#05325A]  items-center">
          <div className="min-h-full h-screen w-full  flex justify-center gap-15 pt-8 pb-8 ">
            <TooltipProvider>{children}</TooltipProvider>
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
