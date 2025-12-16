"use client"

import * as React from "react"

import { NavMain } from "@/components/layout/sidebar/nav-main"
import { NavSecondary } from "@/components/layout/sidebar/nav-secondary"
import { NavUser } from "@/components/layout/sidebar/nav-user"
import { SidebarSettingsDialog } from "@/components/layout/sidebar/SidebarSettingsDialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useUIStore } from "@/stores/ui.store"
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
  const { 
    hiddenMenus, 
    sidebarSettingsOpen, 
    setSidebarSettingsOpen 
  } = useUIStore();

  // Filter visible menus
  const visibleNavMain = React.useMemo(() => 
    data.navMain.filter(item => !hiddenMenus.includes(item.title)),
    [data.navMain, hiddenMenus]
  );

  // Get all available menus for settings dialog
  const availableMenus = React.useMemo(() => 
    data.navMain.map(item => ({ 
      title: item.title, 
      icon: item.icon 
    })),
    [data.navMain]
  );

  return (
    <>
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
          <NavMain items={visibleNavMain} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      <SidebarSettingsDialog
        open={sidebarSettingsOpen}
        onOpenChange={setSidebarSettingsOpen}
        availableMenus={availableMenus}
      />
    </>
  )
})
