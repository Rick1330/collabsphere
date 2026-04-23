import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { getGreeting } from "@/lib/format";
import { KeyboardHint } from "@/components/shared/keyboard-hint";
import { DashboardWorkspaces } from "./dashboard-workspaces";
import { DashboardTasks } from "./dashboard-tasks";
import { DashboardActivity } from "./dashboard-activity";
import { RolePanel } from "./role-panels";
import { useCurrentAccount } from "@/lib/auth-session";
import { getSessionRole } from "@/lib/session-role";

interface DashboardContentProps {
  user: { fullName: string };
}

export const DashboardContent = ({ user }: DashboardContentProps) => {
  const { greeting, subtitle } = getGreeting(user.fullName);
  const account = useCurrentAccount();
  const sessionRole = getSessionRole(account);

  // Viewers can't create workspaces.
  const showCreateWorkspace = !sessionRole.isReadOnly;

  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto w-full">
      {/* Greeting */}
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{greeting}</h1>
          <p className="text-sm text-stone-500 mt-1">
            {subtitle}
            {account && (
              <span className="ml-2 font-mono text-[10px] tracking-wider uppercase text-stone-400">
                · {sessionRole.label}
              </span>
            )}
          </p>
        </div>
        {showCreateWorkspace && (
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <Link to="/workspaces/new">
              <button
                className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium
                  transition-colors duration-150 flex items-center gap-2 shadow-sm
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
              >
                <Plus className="h-4 w-4" />
                New workspace
              </button>
            </Link>
          </div>
        )}
      </header>

      {/* Keyboard hints */}
      <div className="hidden lg:flex items-center gap-4 mt-4 pt-4 border-t border-stone-100">
        <span className="font-mono text-[10px] text-stone-400 tracking-wider">QUICK ACTIONS</span>
        <div className="flex items-center gap-3">
          <KeyboardHint keys={["⌘", "K"]} label="Command palette" />
          <KeyboardHint keys={["⌘", "B"]} label="Toggle sidebar" />
          <KeyboardHint keys={["⌘", "W"]} label="Switch workspace" />
        </div>
      </div>

      {/* Role-specific panel */}
      <div className="mt-6">
        <RolePanel sessionRole={sessionRole} />
      </div>

      {/* Asymmetric grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-2">
        <div>
          <DashboardWorkspaces />
        </div>
        <div className="lg:border-l lg:border-stone-100 lg:pl-8">
          <DashboardTasks />
          <DashboardActivity />
        </div>
      </div>
    </main>
  );
};
