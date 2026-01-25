import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";
import { Loading } from "@/components/ui/spinner";

export function SidebarSkeleton() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarContent>
        <Loading text="Memuat menu..." />
      </SidebarContent>
    </Sidebar>
  );
}

