import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/api/adapters/settings";
import { Loader2 } from "lucide-react";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Spec §3.2.4: ALL admin pages require globalRole === "ADMIN".
 * Non-admins are redirected to /dashboard.
 */
export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
  });

  if (isLoading) {
    return (
      <div className="app-light min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="flex items-center gap-2 text-stone-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking permissions...
        </div>
      </div>
    );
  }

  if (isError || !user || user.globalRole !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
