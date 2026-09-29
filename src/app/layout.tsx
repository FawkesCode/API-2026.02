import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Controle de Tickets Altave",
  description:
    "Aplicação desenvolvida para Altave pelo grupo Fawkes Code - Fatec SJC 2º DSM",
  icons: "/altave-ico.svg",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("h-full", "antialiased", "font-sans")}>
      <body className="min-h-full h-screen flex flex-col">
        <SidebarProvider>
          <AppSidebar />
          <main className="flex flex-col w-full overflow-auto">
            <SidebarTrigger className="cursor-pointer" />
            <div className="h-full xl:pl-15 xl:pr-15 flex flex-col md:pr-8 md:pl-8 pr-5 pl-5 ">
              <TooltipProvider>{children}</TooltipProvider>
            </div>
          </main>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
