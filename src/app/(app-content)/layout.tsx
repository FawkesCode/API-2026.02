import "../globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { CurrentUserProvider } from "@/components/current-user-provider";
import { getUsuarioAtual } from "@/lib/data/sessao";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const usuario = await getUsuarioAtual();

  return (
    <CurrentUserProvider usuario={usuario}>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col w-full overflow-auto bg-background">
          <SidebarTrigger className="cursor-pointer" />
          <div className="h-full xl:pl-15 xl:pr-15 flex  flex-col md:pr-8 md:pl-8 pr-5 pl-5 ">
            <TooltipProvider>{children}</TooltipProvider>
          </div>
        </main>
        <Toaster />
      </SidebarProvider>
    </CurrentUserProvider>
  );
}
