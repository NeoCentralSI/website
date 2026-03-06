import { ChevronDown, type LucideIcon } from "lucide-react"
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
  isActive?: boolean
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
          const hasChildren = !!(item.items && item.items.length > 0)

          // Check if any child route is active
          const isAnyChildActive = hasChildren
            ? item.items!.some((s) => pathname === s.url || pathname.startsWith(s.url + "/"))
            : false

          // Leaf items (no children): active when current route matches
          const isLeafActive = !hasChildren && (pathname === item.url || pathname.startsWith(item.url + "/"))

          if (hasChildren) {
            // Parent with children: entire button is the toggle, no navigation
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isAnyChildActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isAnyChildActive}
                      className="cursor-pointer"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronDown className="ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items!.map((subItem) => {
                        // Only the most specific matching sub-item should be active.
                        // E.g. /metopel/tugas must not highlight Overview (/metopel).
                        const matches =
                          pathname === subItem.url || pathname.startsWith(subItem.url + "/")
                        const moreSpecificMatch = item.items!.some(
                          (other) =>
                            other !== subItem &&
                            (pathname === other.url || pathname.startsWith(other.url + "/")) &&
                            other.url.length > subItem.url.length
                        )
                        const isSubActive = matches && !moreSpecificMatch
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
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          // Leaf item: direct navigation link
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={isLeafActive}>
                <Link to={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
