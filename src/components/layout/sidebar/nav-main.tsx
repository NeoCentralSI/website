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
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { pathname } = useLocation()
  const { state, setOpen } = useSidebar()

  // Handler untuk expand sidebar ketika klik menu dengan submenu saat collapsed
  const handleMenuClick = () => {
    if (state === "collapsed") {
      setOpen(true)
    }
  }

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
          <Collapsible key={item.title} asChild defaultOpen={isItemActive}>
            <SidebarMenuItem>
              {hasChildren ? (
                // Jika ada submenu, button menjadi trigger untuk expand/collapse
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title} 
                    className="group/trigger" 
                    isActive={isItemActive}
                    onClick={handleMenuClick}
                  >
                    <item.icon />
                    <span className="transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-translate-x-2 motion-reduce:transition-none transform-gpu">{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=open]/trigger:rotate-90 motion-reduce:transition-none transform-gpu will-change-transform origin-center" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              ) : (
                // Jika tidak ada submenu, button bisa diklik untuk navigasi
                <SidebarMenuButton asChild tooltip={item.title} isActive={isItemActive}>
                  <Link to={item.url}>
                    <item.icon />
                    <span className="transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-translate-x-2 motion-reduce:transition-none">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
              {hasChildren ? (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubActive = pathname === subItem.url || pathname.startsWith(subItem.url + "/")
                      return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={isSubActive}>
                          <Link to={subItem.url}>
                            <span className="transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-translate-x-2 motion-reduce:transition-none">{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        )})}
      </SidebarMenu>
    </SidebarGroup>
  )
}
