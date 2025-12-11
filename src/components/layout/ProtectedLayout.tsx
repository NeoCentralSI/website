import { useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/shared";

export type BreadcrumbItem = { label: string; href?: string };
export type LayoutContext = {
  setBreadcrumbs: (items?: BreadcrumbItem[]) => void;
  setTitle: (title?: string) => void;
};

export default function ProtectedLayout() {
  console.log('🛡️  [ProtectedLayout] Component rendering');
  
  const location = useLocation();
  const { isLoading, isLoggedIn } = useAuth();
  
  console.log('🔐 [ProtectedLayout] Auth state:', { isLoading, isLoggedIn, path: location.pathname });
  
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[] | undefined>([
    { label: "Dashboard" },
  ]);
  const [title, setTitle] = useState<string | undefined>(undefined);

  // Reset breadcrumbs and title on route change so pages must explicitly set them.
  useEffect(() => {
    console.log('🗺️  [ProtectedLayout] Route changed:', location.pathname);
    // Keep dashboard default only at root dashboard; otherwise clear and let pages set.
    if (location.pathname === "/" || location.pathname === "/dashboard") {
      setBreadcrumbs([{ label: "Dashboard" }]);
      setTitle(undefined);
    } else {
      setBreadcrumbs(undefined);
      setTitle(undefined);
    }
  }, [location.pathname]);

  // Redirect to login if not authenticated after loading completes
  if (!isLoading && !isLoggedIn) {
    console.log('🚫 [ProtectedLayout] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ [ProtectedLayout] Rendering dashboard layout');
  return (
    <DashboardLayout breadcrumbs={breadcrumbs} title={title}>
      <Outlet context={{ setBreadcrumbs, setTitle }} />
    </DashboardLayout>
  );
}
