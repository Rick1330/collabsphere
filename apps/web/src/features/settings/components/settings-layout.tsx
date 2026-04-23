import { useEffect, type ReactNode } from "react";
import { AppSidebar } from "@/app/shell/app-sidebar";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { SettingsNav } from "@/features/settings/components/settings-nav";
import {
  PageHeader,
  MetaStat,
  MetaDivider,
} from "@/components/shared/page-header";
import { Cog } from "lucide-react";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };

interface SettingsLayoutProps {
  children: ReactNode;
  /** Section title (Profile, Password, Notifications, Appearance). */
  title: string;
  /** Optional one-liner shown in the header description. */
  description?: string;
}

export const SettingsLayout = ({
  children,
  title,
  description,
}: SettingsLayoutProps) => {
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();

  useEffect(() => {
    document.title = `${title} — Settings — CollabSphere`;
  }, [title]);

  return (
    <div className="app-light min-h-screen flex bg-stone-50">
      <AppSidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col bg-stone-50">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />
        <main className="flex-1 px-4 sm:px-6 md:px-10 py-8 md:py-10 bg-stone-50">
          <h1 className="sr-only">Settings — {title}</h1>
          <div className="max-w-5xl mx-auto space-y-6">
            <PageHeader
              variant="contextual"
              eyebrow="Account settings"
              title={title}
              description={description}
              icon={<Cog className="h-5 w-5 text-stone-700" aria-hidden="true" />}
              meta={
                <>
                  <MetaStat label="signed in as" value={MOCK_USER.fullName} />
                  <MetaDivider />
                  <MetaStat label={MOCK_USER.email} />
                </>
              }
            />
            <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
              <SettingsNav />
              <div className="flex-1 min-w-0 max-w-2xl">{children}</div>
            </div>
          </div>
        </main>
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};
