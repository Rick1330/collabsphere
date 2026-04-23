import { useEffect } from "react";
import { AppSidebar } from "@/app/shell/app-sidebar";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useCurrentAccount } from "@/lib/auth-session";

const Dashboard = () => {
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();
  const account = useCurrentAccount();

  const user = account
    ? { fullName: account.fullName, email: account.email }
    : { fullName: "Guest", email: "" };

  useEffect(() => {
    document.title = "Dashboard — CollabSphere";
  }, []);

  return (
    <div className="app-light min-h-screen flex">
      <AppSidebar collapsed={collapsed} onToggle={toggle} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav unreadCount={3} onOpenPalette={palette.toggle} />
        <DashboardContent user={user} />
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default Dashboard;
