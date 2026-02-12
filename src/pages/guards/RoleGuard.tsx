import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { useRole } from "@/hooks/shared/useRole";
import { Loading } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/shared";

interface RoleGuardProps {
    allowedRoles: string[];
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
    const context = useOutletContext();
    const { hasAnyRole } = useRole();
    const { isLoading, isLoggedIn } = useAuth();

    // Wait for auth to load before making decisions
    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loading size="lg" text="Memverifikasi izin..." />
            </div>
        );
    }

    // If logged in but doesn't have the required role
    if (isLoggedIn && !hasAnyRole(allowedRoles)) {
        return <Navigate to="/not-found" replace />;
    }

    // All good, or not logged in (ProtectedLayout will handle non-login)
    return <Outlet context={context} />;
}
