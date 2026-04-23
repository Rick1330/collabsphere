import { useEffect } from "react";
import { AppSidebar } from "@/app/shell/app-sidebar";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { NotificationCenter } from "@/features/notifications/components/notification-center";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };

const Notifications = () => {
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();

  useEffect(() => {
    document.title = "Notifications — CollabSphere";
  }, []);

  return (
    <div className="app-light min-h-screen flex">
      <AppSidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />
        <main className="flex-1 p-6 sm:p-10">
          <div className="max-w-3xl mx-auto">
            <NotificationCenter />
          </div>
        </main>
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default Notifications;
