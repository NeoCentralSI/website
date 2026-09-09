import { Link, useLocation } from "react-router-dom";

export type TabItem = {
  label: string;
  to: string;
  end?: boolean; // exact match
  badge?: number;
};

export function TabsNav({ tabs, preserveSearch }: { tabs: TabItem[]; preserveSearch?: boolean }) {
  const { pathname, search } = useLocation();

  return (
    <div className="border-b mb-4 whitespace-nowrap overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none' }}>
      <nav className="flex gap-2">
        {tabs.map((t) => {
          const toParts = t.to.split("?");
          const toPath = toParts[0];
          const toSearch = toParts[1] ? `?${toParts[1]}` : "";

          let isActive = false;
          if (toSearch) {
            // Jika tab memiliki query param, harus cocok dengan current search
            isActive = pathname === toPath && search === toSearch;
          } else if (t.end) {
            // Jika tidak ada query param tapi end: true (misal overview /metopel)
            // maka path harus persis sama, dan kalau current ada search (tab lain) maka false
            isActive = pathname === toPath && (search === "" || !!preserveSearch);
          } else {
            // match path startsWith (misal /metopel/cari-pembimbing)
            isActive = pathname.startsWith(toPath) && pathname !== "/";
          }

          const targetTo = preserveSearch && !toSearch ? `${t.to}${search || ""}` : t.to;

          return (
            <Link
              key={t.to}
              to={targetTo}
              className={`inline-flex items-center px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px transition-colors ${isActive
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
            >
              {t.label}
              {typeof t.badge === "number" && t.badge > 0 && (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums text-amber-700">
                  {t.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Local (state-based) variant – same look, no routing
// ────────────────────────────────────────────────────────────

export type LocalTabItem = {
  label: string;
  value: string;
};

export function LocalTabsNav({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: LocalTabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
}) {
  return (
    <div className="border-b mb-4 whitespace-nowrap overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none' }}>
      <nav className="flex min-w-max gap-2">
        {tabs.map((t) => {
          const isActive = activeTab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onTabChange(t.value)}
              className={`shrink-0 px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px ${
                isActive
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
