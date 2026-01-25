import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarSkeleton } from "@/components/layout/sidebar/sidebar-skeleton";
import { Loading } from "@/components/ui/spinner";
import { ActiveAcademicYearBadge } from "@/components/layout/ActiveAcademicYearBadge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSidebarMenu, useAuth } from "@/hooks/shared";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useGuidanceRealtime } from "@/hooks/guidance";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title?: string;
}

export default function DashboardLayout({ children, breadcrumbs, title }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const sidebarData = useSidebarMenu();
  // Mount global realtime listener once user is present
  useGuidanceRealtime();

  // Redirect ke login jika tidak ada user setelah loading selesai
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, navigate]);

  // Tampilkan skeleton saat loading atau belum ada user
  if (isLoading || !user) {
    return (
      <SidebarProvider>
        <SidebarSkeleton />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-6">
            <Loading text="Memuat dashboard..." />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar data={sidebarData} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 mx-4 mt-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-gray-500 hover:text-primary hover:bg-primary/5" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center">
                      {index > 0 && <BreadcrumbSeparator className="mx-2" />}
                      <BreadcrumbItem>
                        {crumb.href ? (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            ) : title ? (
              <h1 className="text-lg font-semibold">{title}</h1>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ActiveAcademicYearBadge />
            <NotificationBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col mx-4 mb-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

