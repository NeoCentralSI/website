import { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import { Outlet } from "react-router-dom";

export type BreadcrumbItem = { label: string; href?: string };
export type LayoutContext = {
  setBreadcrumbs: (items?: BreadcrumbItem[]) => void;
  setTitle: (title?: string) => void;
};

export default function ProtectedLayout() {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[] | undefined>([
    { label: "Dashboard" },
  ]);
  const [title, setTitle] = useState<string | undefined>(undefined);

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} title={title}>
      <Outlet context={{ setBreadcrumbs, setTitle }} />
    </DashboardLayout>
  );
}
