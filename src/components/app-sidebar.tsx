"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ClipboardList,
  LogOut,
  LucideIcon,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import UserSidebar from "./user-sidebar";
import LogoSidebar from "./logo-sidebar";
import { cn } from "cn";
import LogoFawkes from "./logo-fawkes";
import { useCurrentUser } from "@/hooks/use-current-user";
import { podeVerUsuarios } from "@/lib/access-control";
import { useState } from "react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const loggedUser = useCurrentUser();
  const [erroLogout, setErroLogout] = useState<string | null>(null);
  const [saindo, setSaindo] = useState(false);

  const items: NavItem[] = [
    { title: "Projetos", url: "/projetos", icon: ClipboardList },
    { title: "Tickets", url: "/tickets", icon: Ticket },
    { title: "Minha Equipe", url: "/equipe", icon: Users },
    ...(podeVerUsuarios(loggedUser?.cargo)
      ? [{ title: "Usuários", url: "/usuarios", icon: UserCog }]
      : []),
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex flex-col gap-6 pt-4 pb-4">
        <LogoSidebar />
        {loggedUser ? (
          <UserSidebar user={loggedUser} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum usuário selecionado.
          </p>
        )}
      </SidebarHeader>
      <div className="sidebar-divider"></div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname.includes(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.url} />}
                    >
                      <item.icon aria-hidden={true} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Sair"
            className="flex cursor-pointer justify-center"
            disabled={saindo}
            onClick={async () => {
              setSaindo(true);
              setErroLogout(null);
              try {
                const response = await fetch("/api/auth/logout", { method: "POST" });
                if (!response.ok) {
                  throw new Error("Não foi possível encerrar a sessão. Tente novamente.");
                }
                router.replace("/");
                router.refresh();
              } catch {
                setErroLogout("Não foi possível encerrar a sessão. Tente novamente.");
              } finally {
                setSaindo(false);
              }
            }}
          >
            <LogOut aria-hidden={true} className="ml-1" />
            <span>SAIR</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {erroLogout && (
          <p role="alert" className="px-2 text-center text-xs text-destructive">
            {erroLogout}
          </p>
        )}

        <div
          className={cn(" p-5 text-center flex flex-col gap-2", {
            "p-0 pb-5": state === "collapsed",
          })}
        >
          <p className="text-xs">
            {state == "collapsed" ? (
              <LogoFawkes />
            ) : (
              "Desenvolvido por FawkesCode para Altave"
            )}
          </p>
          <p className="text-xs">
            <i>{state == "collapsed" ? "2º DSM" : "2º Semestre DSM"}</i>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
