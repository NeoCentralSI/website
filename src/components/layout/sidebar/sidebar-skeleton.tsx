import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      {/* Header Skeleton */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" disabled>
              <Skeleton className="h-8 w-8 rounded-lg bg-gray-300" />
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-4 w-24 bg-gray-300" />
                <Skeleton className="h-3 w-32 bg-gray-300" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      {/* Content Skeleton */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            {/* Menu Item 1 - Dashboard (no submenu) */}
            <SidebarMenuItem>
              <SidebarMenuButton disabled className="gap-2">
                <Skeleton className="h-4 w-4 shrink-0 bg-gray-300" />
                <Skeleton className="h-4 w-20 bg-gray-300" />
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Menu Item 2 - With submenu */}
            <SidebarMenuItem>
              <SidebarMenuButton disabled className="gap-2">
                <Skeleton className="h-4 w-4 shrink-0 bg-gray-300" />
                <Skeleton className="h-4 w-28 bg-gray-300" />
                <Skeleton className="h-3 w-3 ml-auto bg-gray-300" />
              </SidebarMenuButton>
              <SidebarMenuSub>
                {Array.from({ length: 3 }).map((_, i) => (
                  <SidebarMenuSubItem key={i}>
                    <SidebarMenuSubButton asChild>
                      <div className="pointer-events-none">
                        <Skeleton className="h-3 w-24 bg-gray-300" />
                      </div>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>

            {/* Menu Item 3 - With submenu */}
            <SidebarMenuItem>
              <SidebarMenuButton disabled className="gap-2">
                <Skeleton className="h-4 w-4 shrink-0 bg-gray-300" />
                <Skeleton className="h-4 w-32 bg-gray-300" />
                <Skeleton className="h-3 w-3 ml-auto bg-gray-300" />
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Menu Item 4 - With submenu */}
            <SidebarMenuItem>
              <SidebarMenuButton disabled className="gap-2">
                <Skeleton className="h-4 w-4 shrink-0 bg-gray-300" />
                <Skeleton className="h-4 w-24 bg-gray-300" />
                <Skeleton className="h-3 w-3 ml-auto bg-gray-300" />
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Menu Item 5 - With submenu */}
            <SidebarMenuItem>
              <SidebarMenuButton disabled className="gap-2">
                <Skeleton className="h-4 w-4 shrink-0 bg-gray-300" />
                <Skeleton className="h-4 w-20 bg-gray-300" />
                <Skeleton className="h-3 w-3 ml-auto bg-gray-300" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Footer Skeleton - User menu */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" disabled className="gap-2">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0 bg-gray-300" />
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-4 w-20 bg-gray-300" />
                <Skeleton className="h-3 w-28 bg-gray-300" />
              </div>
              <Skeleton className="h-4 w-4 shrink-0 bg-gray-300" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

