import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
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
import { useSidebarMenu, useAuth, useRealtimeNotifications } from "@/hooks/shared";
import NotificationBell from "@/components/notifications/NotificationBell";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title?: string;
}

export default function DashboardLayout({ children, breadcrumbs, title }: DashboardLayoutProps) {
  const { user } = useAuth();
  const sidebarData = useSidebarMenu();
  // Mount global realtime listener once user is present
  useRealtimeNotifications();

  // ProtectedLayout already handles auth checking and loading states,
  // so we can safely render the dashboard content when user is available.
  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar data={sidebarData} />
      <SidebarInset>
        <header className="flex h-16 min-w-0 shrink-0 items-center gap-2 px-4 mx-4 mt-4 border-b border-gray-200">
          <div className="flex min-w-0 items-center gap-2">
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
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <ActiveAcademicYearBadge />
            <NotificationBell />
          </div>
        </header>
        <div className="mx-4 mb-4 flex min-w-0 flex-1 flex-col pt-5">
          <Suspense fallback={
            <div className="flex flex-1 items-center justify-center p-8">
              <Loading size="lg" text="Memuat halaman..." />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

