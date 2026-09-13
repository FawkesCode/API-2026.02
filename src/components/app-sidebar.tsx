"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { LogOut, LucideIcon, Settings, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserSidebar from "./user-sidebar";
import LogoSidebar from "./logo-sidebar";
import { cn } from "cn";
import LogoFawkes from "./logo-fawkes";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      title: "Projetos",
      url: "/projetos",
      icon: Settings,
    },
    {
      title: "Tickets",
      url: "/tickets",
      icon: Ticket,
    },
    {
      title: "Minha Equipe",
      url: "/equipe",
      icon: Users,
    },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex flex-col gap-8 pt-4 pb-4">
        <LogoSidebar />
        <UserSidebar />
      </SidebarHeader>
      <div className="sidebar-divider"></div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.url} />}
                    >
                      <item.icon />
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
          >
            <LogOut className="ml-1" />
            <span>SAIR</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

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
