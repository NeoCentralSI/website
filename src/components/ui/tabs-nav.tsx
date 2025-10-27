import { NavLink, useLocation } from "react-router-dom";

export type TabItem = {
  label: string;
  to: string;
  end?: boolean; // exact match
};

export function TabsNav({ tabs, preserveSearch }: { tabs: TabItem[]; preserveSearch?: boolean }) {
  const { search } = useLocation();
  return (
    <div className="border-b mb-4">
      <nav className="flex gap-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={preserveSearch ? `${t.to}${search || ""}` : t.to}
            end={t.end}
            className={({ isActive }) =>
              `px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px ${
                isActive
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
