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
import { LogOut, LucideIcon, Settings, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserSidebar from "./user-sidebar";
import LogoSidebar from "./logo-sidebar";

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
      <SidebarHeader className="flex flex-col gap-6 pt-4">
        <LogoSidebar />
        <SidebarMenu>
          <SidebarMenuItem className=" *:p-0 ">
            <UserSidebar />
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
          <SidebarMenuButton className="flex cursor-pointer justify-center ml-2 w-[93%]">
            <LogOut />
            <span>SAIR</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <div className="sidebar-divider"></div>
        <div className=" p-5 text-center flex flex-col gap-2">
          <p className="text-xs">
            {state == "collapsed"
              ? "FawkesCode"
              : "Desenvolvido por FawkesCode para Altave"}
          </p>
          <p className="text-xs">
            <i>{state == "collapsed" ? "2º DSM" : "2º Semestre DSM"}</i>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
