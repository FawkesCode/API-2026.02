import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import PageHeader from "@/components/page-header";

export const metadata: Metadata = {
  title: "Controle de Tickets Altave",
  description:
    "Aplicação desenvolvida para Altave pelo grupo Fawkes Code - Fatec SJC 2º DSM",
  icons: "/altave-ico.svg",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "font-sans")}>
      <body className="min-h-full h-screen flex flex-col">
        <SidebarProvider>
          <AppSidebar />
          <main className="flex flex-col w-full overflow-auto">
            <SidebarTrigger className="cursor-pointer" />
            <div className="h-full pl-15 pr-15 flex flex-col">
              <TooltipProvider>{children}</TooltipProvider>
            </div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
