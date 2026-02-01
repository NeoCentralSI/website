import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

interface Requirement {
  label: string;
  met: boolean;
  description?: string;
}

interface RequirementsNotMetProps {
  title: string;
  description?: string;
  requirements?: Requirement[];
  homeUrl?: string;
}

export function RequirementsNotMet({
  title,
  description = "Anda belum memenuhi persyaratan untuk mengakses fitur ini.",
  requirements = [],
  homeUrl = "/dashboard",
}: RequirementsNotMetProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // Invalidate SIA cached data to re-fetch eligibility
    queryClient.invalidateQueries({ queryKey: ["sia-cached-students"] });
    // Reload the page to re-check requirements
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {requirements.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Persyaratan yang harus dipenuhi:
              </p>
              <ul className="space-y-2">
                {requirements.map((req, index) => (
                  <li
                    key={index}
                    className={`flex items-start gap-2 text-sm ${
                      req.met
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="mt-0.5">
                      {req.met ? "✓" : "○"}
                    </span>
                    <div>
                      <span className={req.met ? "line-through opacity-70" : ""}>
                        {req.label}
                      </span>
                      {req.description && !req.met && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {req.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(homeUrl)}
            >
              <Home className="h-4 w-4 mr-2" />
              Kembali ke Home
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Jika Anda merasa sudah memenuhi persyaratan, silakan klik tombol Refresh untuk memperbarui data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
