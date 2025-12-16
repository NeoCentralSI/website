import { Settings2, Eye, EyeOff, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUIStore } from "@/stores/ui.store";

interface MenuItem {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SidebarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableMenus: MenuItem[];
}

export function SidebarSettingsDialog({
  open,
  onOpenChange,
  availableMenus,
}: SidebarSettingsDialogProps) {
  const { hiddenMenus, toggleMenuVisibility, setHiddenMenus } = useUIStore();

  const handleReset = () => {
    setHiddenMenus([]);
  };

  const visibleCount = availableMenus.filter(
    (menu) => !hiddenMenus.includes(menu.title)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Pengaturan Sidebar
          </DialogTitle>
          <DialogDescription>
            Pilih menu yang ingin ditampilkan di sidebar. Minimal 1 menu harus
            aktif.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <span>
              {visibleCount} dari {availableMenus.length} menu ditampilkan
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-xs"
              disabled={hiddenMenus.length === 0}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>

          {/* Menu toggles */}
          <div className="space-y-3">
            {availableMenus.map((menu) => {
              const isVisible = !hiddenMenus.includes(menu.title);
              const isLastVisible = isVisible && visibleCount === 1;
              const Icon = menu.icon;

              return (
                <div
                  key={menu.title}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    isVisible
                      ? "bg-background"
                      : "bg-muted/30 border-dashed opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-md ${
                        isVisible
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {Icon ? (
                        <Icon className="h-4 w-4" />
                      ) : isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </div>
                    <Label
                      htmlFor={`menu-${menu.title}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {menu.title}
                    </Label>
                  </div>
                  <Switch
                    id={`menu-${menu.title}`}
                    checked={isVisible}
                    onCheckedChange={() => toggleMenuVisibility(menu.title)}
                    disabled={isLastVisible}
                    aria-label={`Toggle ${menu.title} visibility`}
                  />
                </div>
              );
            })}
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            Perubahan akan tersimpan otomatis
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
