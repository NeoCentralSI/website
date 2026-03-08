import { ChevronDown, type LucideIcon } from "lucide-react"
import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
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
  const navigate = useNavigate()

  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({})

  // Keep menus with active children or matching parent URL open when route changes
  React.useEffect(() => {
    setOpenMenus((prev) => {
      const next = { ...prev }
      items.forEach((item) => {
        const parentMatch =
          item.url && item.url !== "#" && (pathname === item.url || pathname.startsWith(item.url + "/"))
        const childMatch = item.items?.some(
          (s) => pathname === s.url || pathname.startsWith(s.url + "/")
        )
        if (parentMatch || childMatch) {
          next[item.title] = true
        }
      })
      return next
    })
  }, [pathname, items])

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
            const isOpen = openMenus[item.title] ?? false
            const isParentActive =
              item.url !== "#" && (pathname === item.url || pathname.startsWith(item.url + "/"))

            return (
              <Collapsible
                key={item.title}
                asChild
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenMenus((prev) => ({ ...prev, [item.title]: open }))
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isAnyChildActive || isParentActive}
                    className="cursor-pointer"
                    onClick={() => {
                      // Open submenu + navigate to parent's own url
                      setOpenMenus((prev) => ({ ...prev, [item.title]: true }))
                      if (item.url && item.url !== "#") {
                        navigate(item.url)
                      }
                    }}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    <ChevronDown
                      className={`ml-auto shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenus((prev) => ({
                          ...prev,
                          [item.title]: !prev[item.title],
                        }))
                      }}
                    />
                  </SidebarMenuButton>

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
