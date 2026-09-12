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
  useSidebar,
} from "@/components/ui/sidebar";
import { LucideIcon, Settings, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
      url: "/about",
      icon: Settings,
    },
    {
      title: "Tickets",
      url: "/tickets",
      icon: Ticket,
    },
    {
      title: "Minha Equipe",
      url: "/team",
      icon: Users,
    },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-900 text-white">
                A
              </div>
              <span className="text-xl text-blue-900 font-semibold">
                Altave
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
      <SidebarFooter className="pl-0 pr-0">
        <SidebarMenuItem>
          <SidebarMenuButton className=" justify-center ">
            <span>SAIR &gt;&gt;</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <div className="sidebar-divider"></div>
        <div className=" p-5 text-center flex flex-col gap-2">
          <small>
            {state == "collapsed"
              ? "FawkesCode"
              : "Desenvolvido por FawkesCode para Altave"}
          </small>
          <small>
            <i>{state == "collapsed" ? "2º DSM" : "2º Semestre DSM"}</i>
          </small>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
