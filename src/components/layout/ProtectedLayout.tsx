import { useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import { Outlet, useLocation } from "react-router-dom";

export type BreadcrumbItem = { label: string; href?: string };
export type LayoutContext = {
  setBreadcrumbs: (items?: BreadcrumbItem[]) => void;
  setTitle: (title?: string) => void;
};

export default function ProtectedLayout() {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[] | undefined>([
    { label: "Dashboard" },
  ]);
  const [title, setTitle] = useState<string | undefined>(undefined);

  // Reset breadcrumbs and title on route change so pages must explicitly set them.
  useEffect(() => {
    // Keep dashboard default only at root dashboard; otherwise clear and let pages set.
    if (location.pathname === "/" || location.pathname === "/dashboard") {
      setBreadcrumbs([{ label: "Dashboard" }]);
      setTitle(undefined);
    } else {
      setBreadcrumbs(undefined);
      setTitle(undefined);
    }
  }, [location.pathname]);

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} title={title}>
      <Outlet context={{ setBreadcrumbs, setTitle }} />
    </DashboardLayout>
  );
}
