import type { ReactNode } from "react";
import { AdminNav } from "@/features/admin/components/admin-nav";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="app-light min-h-screen" style={{ backgroundColor: "var(--app-bg)" }}>
      <div className="flex">
        {/* Admin sidebar — fixed */}
        <aside
          className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r border-stone-200 bg-white z-30"
          aria-label="Admin sidebar"
        >
          <AdminNav />
        </aside>

        {/* Main content — offset by sidebar */}
        <main className="flex-1 md:pl-56 min-h-screen">
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
