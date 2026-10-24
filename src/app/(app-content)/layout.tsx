import "../globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrentUserProvider } from "@/components/current-user-provider";
import { getUsuarioAtual } from "@/lib/data/sessao";
import { redirect } from "next/navigation";

// O <Toaster /> já é montado no app/layout.tsx (raiz). Montar de novo aqui
// faria cada toast aparecer duas vezes nas telas deste grupo.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const usuarioAutenticado = await getUsuarioAtual();
  // O proxy só valida o cookie; aqui também caem usuários desativados.
  if (!usuarioAutenticado) redirect("/");

  const usuario = {
    ...usuarioAutenticado,
    equipeNome: usuarioAutenticado.equipe?.nome ?? null,
  };

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
      </SidebarProvider>
    </CurrentUserProvider>
  );
}
