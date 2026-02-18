import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export interface NavSubItem {
  title: string
  url: string
}

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: NavSubItem[]
}

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const { pathname } = useLocation()



  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = !!item.items?.length
          const isAnyChildActive = hasChildren
            ? item.items!.some((s) => pathname === s.url || pathname.startsWith(s.url + "/"))
            : false
          const isItemActive = pathname === item.url || pathname.startsWith(item.url + "/") || isAnyChildActive

          return (
            <Collapsible key={item.title} asChild defaultOpen={isItemActive} className="group/collapsible">
              <SidebarMenuItem>
                {/* Main Button: Link if URL is valid, otherwise Trigger or Static */}
                {item.url && item.url !== "#" ? (
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isItemActive}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                ) : hasChildren ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={isItemActive} className="cursor-pointer">
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton tooltip={item.title} isActive={isItemActive} className="cursor-default">
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}

                {/* Submenu Trigger: Only if has children */}
                {hasChildren && (
                  <CollapsibleTrigger asChild>
                    {/* Using a custom styled trigger positioned similarly to SidebarMenuAction */}
                    <div
                      role="button"
                      className="absolute right-1 top-1.5 flex h-6 w-6 items-center justify-center rounded-md p-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:outline-hidden transition-all [&>svg]:size-4 [&>svg]:shrink-0 cursor-pointer"
                    >
                      <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      <span className="sr-only">Toggle {item.title}</span>
                    </div>
                  </CollapsibleTrigger>
                )}

                {hasChildren && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.url || pathname.startsWith(subItem.url + "/")
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isSubActive}>
                              <Link to={subItem.url}>
                                <span className="truncate">{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
