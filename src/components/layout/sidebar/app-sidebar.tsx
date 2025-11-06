"use client"



import * as React from "react"

import { NavMain } from "@/components/layout/sidebar/nav-main"
import { NavSecondary } from "@/components/layout/sidebar/nav-secondary"
import { NavUser } from "@/components/layout/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import logoImage from "@/assets/images/logo.png"

interface SidebarData {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  navMain: Array<{
    title: string;
    url: string;
    icon: any;
    isActive?: boolean;
    items?: Array<{
      title: string;
      url: string;
    }>;
  }>;
  navSecondary: Array<{
    title: string;
    url: string;
    icon: any;
  }>;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data: SidebarData;
}

export const AppSidebar = React.memo(function AppSidebar({ data, ...props }: AppSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a>
                <div className="bg-transparent text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src={logoImage} alt="Neo Central Logo" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Neo Central</span>
                  <span className="truncate text-xs">Sistem Informasi</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
})
